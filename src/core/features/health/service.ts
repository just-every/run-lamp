import type { HealthRepository } from "./repository";
import type { DependencyProber } from "../../platform/health";

export type HealthStatus =
  | { status: "ok"; checkedAt: string }
  | { status: "unavailable"; dependency: "database" | "storage" | "queue" };

export interface HealthService {
  /**
   * /health: the database answers and the storage and queue bindings are present.
   * It writes nothing to storage and puts nothing on the queue, so uptime monitors and
   * the platform's 2-second check get a fast answer.
   */
  check(): Promise<HealthStatus>;
  /**
   * /health/deep and the heartbeat: the database, an R2 write, read and delete, and a
   * queue message, checked now. A good answer younger than maxAgeMs is reused.
   */
  deep(maxAgeMs?: number): Promise<HealthStatus>;
  /**
   * Once per isolate, after /health has answered: hands a configured page's first snapshot, or a
   * page this release has not built yet, to background work. A health answer never waits on a build.
   */
  publish(): Promise<void>;
}

/** Hands due publication to background work; true once nothing more is due from this isolate. */
export type InitialPublication = () => Promise<boolean>;

// A database answer serves /health from this isolate for this long, so repeated probes make no D1 call.
export const DATABASE_ANSWER_MS = 30_000;
// /health/deep is public: a good round trip answers it for this long, so requests cannot multiply R2 writes.
export const DEEP_ANSWER_MS = 30_000;

// Per isolate and database. Failures are never remembered.
const databaseAnswered = new WeakMap<object, number>();
const deepPassed = new WeakMap<object, number>();
const deepRunning = new WeakMap<object, Promise<HealthStatus>>();
const publication = new WeakMap<object, Promise<void>>();

export function createHealthService(repository: HealthRepository, prober: DependencyProber, publishInitialSnapshot: InitialPublication = async () => true): HealthService {
  async function databaseAnswers(): Promise<number | undefined> {
    const known = databaseAnswered.get(repository.key);
    if (known !== undefined && Date.now() - known < DATABASE_ANSWER_MS) return known;
    try {
      await repository.checkDatabase();
    } catch {
      databaseAnswered.delete(repository.key);
      return undefined;
    }
    const now = Date.now();
    databaseAnswered.set(repository.key, now);
    return now;
  }

  async function roundTrip(): Promise<HealthStatus> {
    try {
      await repository.checkDatabase();
    } catch {
      return { status: "unavailable", dependency: "database" };
    }
    try {
      await prober.checkStorage();
    } catch {
      return { status: "unavailable", dependency: "storage" };
    }
    try {
      await prober.checkQueue();
    } catch {
      return { status: "unavailable", dependency: "queue" };
    }
    const checkedAt = Date.now();
    deepPassed.set(repository.key, checkedAt);
    return { status: "ok", checkedAt: new Date(checkedAt).toISOString() };
  }

  return {
    async check() {
      const answeredAt = await databaseAnswers();
      if (answeredAt === undefined) return { status: "unavailable", dependency: "database" };
      const missing = prober.missing();
      if (missing) return { status: "unavailable", dependency: missing };
      return { status: "ok", checkedAt: new Date(answeredAt).toISOString() };
    },
    // Every hosted deployment publishes its initial state before traffic arrives, even
    // before Cloudflare starts Cron. A failed or not-yet-due hand-off is tried again by
    // the isolate's next health request; Cron retries the build itself.
    publish() {
      const known = publication.get(repository.key);
      if (known) return known;
      const next = publishInitialSnapshot().then(
        (done) => { if (!done) publication.delete(repository.key); },
        (cause) => { publication.delete(repository.key); console.error("Lamp could not hand its public page to background publication; Cron retries it.", cause); },
      );
      publication.set(repository.key, next);
      return next;
    },
    // Concurrent requests share one running round trip.
    deep(maxAgeMs = 0) {
      const passed = deepPassed.get(repository.key);
      if (passed !== undefined && Date.now() - passed < maxAgeMs) return Promise.resolve({ status: "ok", checkedAt: new Date(passed).toISOString() });
      const running = deepRunning.get(repository.key);
      if (running) return running;
      deepPassed.delete(repository.key);
      const next = roundTrip().finally(() => deepRunning.delete(repository.key));
      deepRunning.set(repository.key, next);
      return next;
    },
  };
}
