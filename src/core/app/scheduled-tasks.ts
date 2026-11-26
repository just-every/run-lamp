import { createApp } from "./server";
import { notificationOrigin, prepareAppMailBindings } from "./mail";
import { expireHeldSorrySubscribers } from "../features/statuspage-import/sorry-release.repository";
import { pingExternalHeartbeat } from "./external-heartbeat";
import type { ScheduledWork } from "./scheduled-work.repository";
import type { AppBindings } from "./types";

export async function runScheduledTasks(bindings: AppBindings, scheduledAt: number, work: ScheduledWork, runtime?: ReturnType<typeof createApp>) {
  runtime ??= createApp(await prepareAppMailBindings(bindings, "background"), "background");
  const { services } = runtime;
  const now = new Date(scheduledAt).toISOString();
  const dueThrough = new Date(Math.max(scheduledAt, Date.now())).toISOString();
  const changes = Promise.allSettled([
    work.dependencies && services.dependencies.runDue(scheduledAt),
    work.automation && services.alertRules.processPending(scheduledAt),
    work.metrics && services.metrics.runDue(scheduledAt),
    work.subscriberExpiry && services.subscribers.expirePending(scheduledAt),
    work.heldExpiry && expireHeldSorrySubscribers(bindings.DB, scheduledAt),
    work.restoreExpiry && services.pageExport.expireHeld(scheduledAt),
    work.incidents && services.incidents.publishDue(dueThrough),
    work.maintenance && services.maintenance.runDue(dueThrough),
    work.updateReminders && services.updateReminders.remindDue(now),
    (work.reports || work.updateReminders) && services.reports.remindDue(now),
  ]);
  const traffic = services.trafficAlerts.run(scheduledAt);
  const changesMayNotify = work.automation || work.dependencies || work.incidents || work.maintenance
    || work.updateReminders || work.reports || work.subscriberExpiry;
  const deliveries = async () => {
    await changes;
    // A transition or a newly queued operator alert can commit mail after the
    // minute's discovery. Retain the outbox's existing claim and retry rules.
    if (work.deliveries || changesMayNotify) {
      await services.deliveries.dispatchDue(await notificationOrigin(bindings));
    }
  };
  const settled = await Promise.allSettled([
    deliveries(),
    traffic.then(async queued => {
      if (queued) await Promise.all([services.deliveries.dispatchDue(await notificationOrigin(bindings)), services.channels.dispatchPending()]);
    }),
    work.snapshot && services.publicSnapshots.retryPendingBuild(),
    (work.channels || changesMayNotify) && changes.then(() => services.channels.dispatchPending()),
    (work.social || work.incidents || work.maintenance) && changes.then(() => services.social.dispatchPending()),
    (work.sms || work.incidents || work.maintenance) && changes.then(() => services.sms.dispatchPending()),
    work.pageCheck && services.overview.live.runChecks(),
    work.sender && services.overview.live.checkSenderIfDue(),
  ]);
  const failures = [...await changes, ...settled].filter((result): result is PromiseRejectedResult => result.status === "rejected").map(result => result.reason);
  if (failures.length === 1) throw failures[0];
  if (failures.length) throw new AggregateError(failures, `Lamp's scheduled run had ${failures.length} failed steps.`);
  await pingExternalHeartbeat(bindings, runtime, scheduledAt);
}
