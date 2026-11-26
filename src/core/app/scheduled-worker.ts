import { scheduledWork } from "./scheduled-work.repository";
import type { AppBindings } from "./types";

export async function runScheduled(bindings: AppBindings, execution: ExecutionContext, scheduledAt = Date.now()) {
  execution.waitUntil((async () => {
    const work = await scheduledWork(bindings.DB, scheduledAt, Math.max(scheduledAt, Date.now()));
    // Hosted Workers hand off the due work before opening any providers or
    // reading snapshot bodies. Local and container schedulers run that same
    // work directly, on runtimes without the hosted Queue consumer.
    if (bindings.LAMP_QUEUE_SCHEDULED === "1") {
      await bindings.JOBS.send({ type: "scheduled-work", at: scheduledAt, work });
    } else {
      const { runScheduledTasks } = await import("./scheduled-tasks");
      await runScheduledTasks(bindings, scheduledAt, work);
    }
  })());
}
