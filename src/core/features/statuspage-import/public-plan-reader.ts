import { loadPlans } from "../../../../modules/import-kit/src/d1/plans";

export function readPublicPlans(db: D1Database, rows: Array<{ id: string; plan_json: string }>) {
  return loadPlans(rows, db as never);
}

/** Keep a journal read local to one snapshot build, shared by its archive,
 * public addresses and incident wording projections. */
export function createPublicPlanReader(): typeof readPublicPlans {
  const pending = new Map<string, { body: string; result: ReturnType<typeof readPublicPlans> }>();
  return async (db, rows) => {
    const plans: Awaited<ReturnType<typeof readPublicPlans>> = new Map();
    for (const row of rows) {
      let plan = pending.get(row.id);
      if (plan?.body !== row.plan_json) {
        plan = { body: row.plan_json, result: readPublicPlans(db, [row]) };
        pending.set(row.id, plan);
      }
      const result = (await plan.result).get(row.id);
      if (result) plans.set(row.id, result);
    }
    return plans;
  };
}
