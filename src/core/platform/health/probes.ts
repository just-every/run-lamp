import type { LampJob } from "../jobs";

export interface DependencyProber {
  /** The storage or queue binding this Worker was deployed without, or null. Makes no provider call. */
  missing(): "storage" | "queue" | null;
  /** Writes, reads back and deletes one R2 object. */
  checkStorage(): Promise<void>;
  /** Puts one health-probe message on the queue; the consumer acknowledges it. */
  checkQueue(): Promise<void>;
}

export function createDependencyProber(storage: R2Bucket | undefined, queue: Queue<LampJob> | undefined): DependencyProber {
  return {
    missing() {
      if (typeof storage?.put !== "function" || typeof storage.get !== "function") return "storage";
      if (typeof queue?.send !== "function") return "queue";
      return null;
    },
    async checkStorage() {
      if (!storage) throw new Error("Lamp has no storage binding.");
      const key = `_health/${crypto.randomUUID()}`;
      await storage.put(key, new Uint8Array([1]), { httpMetadata: { contentType: "application/octet-stream" } });
      try {
        const stored = await storage.get(key);
        if (!stored) throw new Error("R2 did not return its health probe object.");
      } finally {
        await storage.delete(key);
      }
    },
    async checkQueue() {
      if (!queue) throw new Error("Lamp has no queue binding.");
      await queue.send({ type: "health-probe", requestedAt: new Date().toISOString() });
    },
  };
}
