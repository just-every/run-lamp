import worker from "./automation-clock-worker";
export { SnapshotCache } from "./automation-clock-worker";

// Sums the rows_read D1 reports for every statement a scheduled run executes.
// Only the measurement is added: the run itself is the real Worker entry point.
type Statement = { sql: string; rows: number; written: number };
let statements: Statement[] = [];
const rowsRead = (result: any) => Number(result?.meta?.rows_read ?? 0);
const rowsWritten = (result: any) => Number(result?.meta?.rows_written ?? 0);
const inner = new WeakMap<object, D1PreparedStatement>();
const texts = new WeakMap<object, string>();

function metered(statement: D1PreparedStatement, sql: string): D1PreparedStatement {
  const proxy: any = new Proxy(statement, { get(target, key) {
    if (key === "bind") return (...values: unknown[]) => metered(target.bind(...values), sql);
    if (key === "all" || key === "run") return async () => {
      const result: any = await (target as any)[key]();
      statements.push({ sql, rows: rowsRead(result), written: rowsWritten(result) });
      return result;
    };
    if (key === "first") return async (column?: string) => {
      const result: any = await target.all();
      statements.push({ sql, rows: rowsRead(result), written: rowsWritten(result) });
      const row = result.results[0] ?? null;
      return column ? (row ? row[column] : null) : row;
    };
    // raw() returns no metadata; meter a read by running it once through all().
    if (key === "raw") return async (options?: any) => {
      if (/^\s*(select|with)\b/i.test(sql)) statements.push({ sql, rows: rowsRead(await target.all()), written: 0 });
      return target.raw(options);
    };
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  inner.set(proxy, statement);
  texts.set(proxy, sql);
  return proxy;
}

function meter(database: D1Database): D1Database {
  return new Proxy(database, { get(target, key) {
    if (key === "prepare") return (sql: string) => metered(target.prepare(sql), sql);
    if (key === "batch") return async (list: D1PreparedStatement[]) => {
      const results: any[] = await target.batch(list.map(statement => inner.get(statement) ?? statement));
      results.forEach((result, index) => statements.push({ sql: texts.get(list[index]) ?? "batch", rows: rowsRead(result), written: rowsWritten(result) }));
      return results;
    };
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  } });
}

export default {
  ...worker,
  async scheduled(controller: ScheduledController, env: any, context: ExecutionContext) {
    statements = [];
    const pending: Promise<unknown>[] = [];
    await worker.scheduled(controller, { ...env, DB: meter(env.DB) }, { waitUntil: (promise: Promise<unknown>) => { pending.push(promise); }, passThroughOnException() {} } as unknown as ExecutionContext);
    await Promise.all(pending);
  },
  async fetch(request: Request, env: any, context: ExecutionContext) {
    if (new URL(request.url).pathname === "/test/d1-meter") {
      const top = new Map<string, number>();
      for (const { sql, rows } of statements) top.set(sql.replace(/\s+/g, " ").slice(0, 160), (top.get(sql.replace(/\s+/g, " ").slice(0, 160)) ?? 0) + rows);
      return Response.json({
        rows: statements.reduce((sum, statement) => sum + statement.rows, 0),
        written: statements.reduce((sum, statement) => sum + statement.written, 0),
        top: [...top].sort((left, right) => right[1] - left[1]).slice(0, 8),
      });
    }
    return worker.fetch(request, env, context);
  },
};
