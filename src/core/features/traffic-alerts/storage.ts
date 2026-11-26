import type { TrafficSurface } from './surfaces';
/** HIST-006 uses the already-declared R2 bucket, never D1 or visitor data.
 * Each Worker isolate owns an aggregate shard. Coalescing and pacing keep each
 * object below R2's one-write/second limit without delaying public responses.
 * A waitUntil increment resolves only once its cumulative count is persisted. */
export interface Counter { surface: TrafficSurface; minute: number; count: number }
export interface TrafficSettings { multiple: number }
export interface TrafficSignal { surface: TrafficSurface; minute: number; count: number; baseline: number | null }
export interface TrafficState { minute: number; active: boolean; pending: TrafficSignal | null }
export const MINUTE = 60_000;
const WRITE_INTERVAL = 1_100;
let shard: string | undefined; // Runtime identity, independent of every visitor/request.
const prefix = (surface: TrafficSurface, hour: number) => `traffic/counts/${surface}/${hour}/`;
type Writer = { rows: Counter[] | null; delta: Map<number, number>; version: number; persisted: number; running: boolean; lastWrite: number; hour: number };
const writers = new Map<string, Writer>();
const controls = new Map<string, { last: number; running: boolean }>();
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Waits for this isolate's write to `key`, so a read right after a paced write sees it. */
async function settled(key: string) {
  const deadline = performance.now() + 25_000;
  while (controls.get(key)?.running) {
    if (performance.now() >= deadline) throw new Error('Traffic configuration persistence timed out.');
    await pause(25);
  }
}

async function controlWrite<T>(key: string, write: () => Promise<T>): Promise<T> {
  const control = controls.get(key) ?? { last: -Infinity, running: false };
  controls.set(key, control);
  // Each timer/promise belongs to its own request. Sharing a promise across
  // Worker request contexts can cancel its continuations when its owner exits.
  // The check and the claim stay in one turn, so two writers never interleave.
  const deadline = performance.now() + 25_000;
  while (control.running) {
    if (performance.now() >= deadline) throw new Error('Traffic configuration persistence timed out.');
    await pause(25);
  }
  control.running = true;
  try {
    for (let attempt = 0; ; attempt++) {
      await pause(Math.max(0, WRITE_INTERVAL - (performance.now() - control.last)));
      control.last = performance.now();
      try { return await write(); } catch (cause) { if (attempt >= 4) throw cause; }
    }
  } finally { control.running = false; }
}

async function persist(bucket: R2Bucket, key: string, writer: Writer, surface: TrafficSurface, target: number) {
  let failures = 0;
  const deadline = performance.now() + 25_000;
  while (writer.persisted < target) {
    if (performance.now() >= deadline) throw new Error('Traffic aggregate persistence timed out.');
    if (writer.running) { await pause(25); continue; }
    writer.running = true;
    let delta: Map<number, number> | undefined;
    try {
      if (!writer.rows) {
        const object = await bucket.get(key);
        writer.rows = object ? await object.json<Counter[]>() : [];
      }
      await pause(Math.max(0, WRITE_INTERVAL - (performance.now() - writer.lastWrite)));
      const version = writer.version;
      // Later arrivals remain in a separate delta. A successful cumulative PUT
      // acknowledges only the captured version. The owner performs one flush,
      // rather than owning an indefinitely growing stream of other requests.
      delta = writer.delta;
      writer.delta = new Map();
      const rows: Counter[] = writer.rows.map(row => ({ ...row }));
      for (const [minute, count] of delta) {
        const row = rows.find(row => row.minute === minute);
        if (row) row.count += count; else rows.push({ surface, minute, count });
      }
      writer.lastWrite = performance.now();
      await bucket.put(key, JSON.stringify(rows), { httpMetadata: { contentType: 'application/json' } });
      writer.rows = rows;
      writer.persisted = version;
    } catch (cause) {
      if (delta) for (const [minute, count] of delta) writer.delta.set(minute, (writer.delta.get(minute) ?? 0) + count);
      // No success fallback: rejected waitUntil work is reported by the runtime.
      // Retain aggregate deltas for a later request's explicit retry.
      if (++failures >= 5) throw cause;
    } finally { writer.running = false; }
  }
}

export function createTrafficStorage(bucket: R2Bucket) {
  async function read<T>(key: string): Promise<{ value: T | null; etag: string | null }> {
    const object = await bucket.get(key);
    return { value: object ? await object.json<T>() : null, etag: object?.etag ?? null };
  }
  async function replace(key: string, value: unknown, etag: string | null) {
    return Boolean(await controlWrite(key, () => bucket.put(key, JSON.stringify(value), {
      onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' },
      httpMetadata: { contentType: 'application/json' },
    })));
  }
  async function counters(surface: TrafficSurface, hour: number) {
    const rows: Counter[] = [];
    let cursor: string | undefined;
    do {
      const page = await bucket.list({ prefix: prefix(surface, hour), cursor });
      for (const object of page.objects) {
        const stored = await bucket.get(object.key);
        if (stored) rows.push(...await stored.json<Counter[]>());
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
    return rows;
  }
  function signals(surface: TrafficSurface) {
    const hours = new Map<number, Promise<Counter[]>>();
    const baselines = new Map<number, Promise<number | null>>();
    let earliest: Promise<R2Objects> | undefined;
    const countsFor = (hour: number) => {
      let pending = hours.get(hour);
      if (!pending) {
        pending = counters(surface, hour);
        hours.set(hour, pending);
      }
      return pending;
    };
    async function baselineFor(hour: number) {
      // A younger surface has no seven-day baseline. Find that out before
      // asking R2 for its seven historical buckets.
      earliest ??= bucket.list({ prefix: `traffic/counts/${surface}/`, limit: 1 });
      const firstKey = (await earliest).objects[0]?.key;
      const firstHour = firstKey ? Number(firstKey.split('/')[3]) : Infinity;
      const coverageHour = hour - 7 * 24;
      if (firstHour > coverageHour) return null;
      const firstRows = await countsFor(firstHour);
      if (!firstRows.some(row => row.minute <= coverageHour * 60)) return null;
      const history = await Promise.all(Array.from({ length: 7 }, (_, day) => countsFor(hour - (day + 1) * 24)));
      const count = history.reduce((total, rows) => rows.reduce((sum, row) => sum + row.count, total), 0);
      return count > 0 ? count / (7 * 60) : null;
    }
    return async (minute: number, includeEmptyBaseline = true): Promise<TrafficSignal> => {
      const hour = Math.floor(minute / 60);
      const current = await countsFor(hour);
      const count = current.reduce((sum, row) => row.minute === minute ? sum + row.count : sum, 0);
      if (!count && !includeEmptyBaseline) return { surface, minute, count, baseline: null };
      let baseline = baselines.get(hour);
      if (!baseline) {
        baseline = baselineFor(hour);
        baselines.set(hour, baseline);
      }
      return { surface, minute, count, baseline: await baseline };
    };
  }
  return {
    increment(surface: TrafficSurface, at: number): Promise<void> {
      shard ??= crypto.randomUUID();
      const minute = Math.floor(at / MINUTE), hour = Math.floor(minute / 60), key = `${prefix(surface, hour)}${shard}.json`;
      // Normal wall time only advances; old completed hour writers can be read
      // back if needed, without retaining an isolate's entire history in memory.
      for (const [oldKey, old] of writers) if (!old.running && old.hour < hour - 1 && performance.now() - old.lastWrite > WRITE_INTERVAL && !old.delta.size) writers.delete(oldKey);
      let writer = writers.get(key);
      if (!writer) {
        writer = { rows: null, delta: new Map(), version: 0, persisted: 0, running: false, lastWrite: -Infinity, hour };
        writers.set(key, writer);
      }
      writer.delta.set(minute, (writer.delta.get(minute) ?? 0) + 1);
      return persist(bucket, key, writer, surface, ++writer.version);
    },
    async settings(): Promise<TrafficSettings> {
      // A reload right after Settings sent its last edit on the way out reads that edit, not the value before it.
      await settled('traffic/settings.json');
      return (await read<TrafficSettings>('traffic/settings.json')).value ?? { multiple: 3 };
    },
    async configure(settings: TrafficSettings) {
      await controlWrite('traffic/settings.json', () => bucket.put('traffic/settings.json', JSON.stringify(settings), { httpMetadata: { contentType: 'application/json' } }));
      return settings;
    },
    signals,
    signal: (surface: TrafficSurface, minute: number) => signals(surface)(minute),
    state: (surface: TrafficSurface) => read<TrafficState>(`traffic/state/${surface}.json`),
    saveState: (surface: TrafficSurface, state: TrafficState, etag: string | null) => replace(`traffic/state/${surface}.json`, state, etag),
  };
}
export type TrafficStorage = ReturnType<typeof createTrafficStorage>;
