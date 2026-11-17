import type { BlobStore } from "../../platform/blobs/store";

/** One page per old version, at most four versions and one second of new work.
 * A provider call already in flight may finish after the deadline. Restarting
 * at the oldest prefix drains even a partly deleted version without a cursor.
 * Sequence fences, unlike ULID/wall-clock order, also protect a newer build
 * that reserved its generation before an older build finished rendering. */
export async function pruneSnapshotVersions(blobs: BlobStore, current: string, previous: { version: string; generation: number }) {
  const deadline = Date.now() + 1_000;
  const versions = await blobs.list({ prefix: "snapshots/", delimiter: "/", limit: 16 });
  let pages = 0;
  for (const prefix of versions.prefixes) {
    if (pages >= 4 || Date.now() >= deadline) return;
    const version = prefix.slice("snapshots/".length, -1);
    if (version === current || version === previous.version) continue;
    const sequenceKey = `${prefix}generation.json`;
    // Published snapshots predating retention already carry their sequence in
    // the retained bundle. Unknown/invalid generations are never guessed old.
    const sequence = await blobs.getText(sequenceKey) ?? await blobs.getText(`${prefix}retained.json`);
    if (!sequence) continue;
    const fence = JSON.parse(sequence.text) as { version?: string; generation?: number };
    if (fence.version !== version || !Number.isSafeInteger(fence.generation) || fence.generation! < 0 || fence.generation! >= previous.generation) continue;
    if (Date.now() >= deadline) return;
    const objects = await blobs.list({ prefix, limit: 256 });
    pages++;
    // Preserve the fence until the final page, so interrupted purges resume.
    const keys = objects.keys.filter(key => key.startsWith(prefix) && (!objects.truncated || (key !== sequenceKey && key !== `${prefix}retained.json`)));
    if (keys.length && Date.now() < deadline) await blobs.delete(keys);
  }
}
