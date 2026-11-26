import type { createApp } from "./server";

let localSnapshotBootstrapFinished = false;

export async function ensureDevelopmentSnapshot(runtime: ReturnType<typeof createApp>) {
  if (!import.meta.env.DEV || localSnapshotBootstrapFinished) return;
  if (!(await runtime.services.publicSnapshots.hasCurrentSnapshot())) {
    if (!(await runtime.services.operators.listOperators()).length || !(await runtime.services.pageSettings.get())) return;
    await runtime.services.publicSnapshots.rebuild();
  }
  localSnapshotBootstrapFinished = true;
}
