import queueOutage, { queueBindings } from "../queue-outage.worker";
import { runQueue, runScheduled } from "../../../src/core/app/worker-lifecycle";
export { SnapshotCache } from "../../../src/core/platform/blobs/snapshot-cache";

// Keep the existing Queue-edge proxy. All business requests run the real app;
// the consumer below is the actual Worker Queue entry point.
export default {
  fetch: queueOutage.fetch,
  async queue(batch: Parameters<typeof runQueue>[0], env: Parameters<typeof runQueue>[1]) {
    const edge = (env as unknown as Record<string, string>).LAMP_TEST_IMPORT_WORK;
    const rebuilds = batch.messages.filter(message => (message.body as { type?: string })?.type === 'public-snapshot-rebuild');
    if (!edge || !rebuilds.length) return runQueue(batch, env);
    // Hold the real consumer intake. A rejected delivery leaves the durable
    // snapshot request for the journey's next scheduled run.
    const deliver = (await fetch(`${edge}/rebuild`)).ok;
    if (!deliver) rebuilds.forEach(message => message.ack());
    try {
      await runQueue(deliver ? batch : { ...batch, messages: batch.messages.filter(message => !rebuilds.includes(message)) }, env);
    } finally {
      await fetch(`${edge}/finished`);
    }
  },
  scheduled(controller:ScheduledController,env:Parameters<typeof runScheduled>[0],context:ExecutionContext) {return runScheduled(queueBindings(env),context,controller.scheduledTime);},
};
