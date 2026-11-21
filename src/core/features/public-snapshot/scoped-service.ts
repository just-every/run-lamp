import type { AppBindings } from "../../app/types";
import { authOrigin } from "../../platform/auth/config";
import { createRetainedSnapshotCache } from "../../platform/blobs/retained";
import type { BlobStore } from "../../platform/blobs/store";
import { statusPagePrefix } from "../page-settings/page-selection";
import type { createStatusPageRepository } from "../page-settings/status-page.repository";
import type { PublicSnapshotPolicies } from "./policies";
import { createSnapshotRepository } from "./repository";
import { createPublicSnapshotService, runningReleaseIdentity } from "./service";

function withinPage(blobs: BlobStore, path: string): BlobStore {
  const prefix = "status-pages/" + path + "/";
  return {
    getText: key => blobs.getText(prefix + key),
    putText: (key, text, contentType) => blobs.putText(prefix + key, text, contentType),
    putTextConditionally: (key, text, contentType, condition) => blobs.putTextConditionally(prefix + key, text, contentType, condition),
    getBytes: key => blobs.getBytes(prefix + key),
    putBytes: (key, bytes, contentType) => blobs.putBytes(prefix + key, bytes, contentType),
    async list(options) {
      const found = await blobs.list({ ...options, prefix: prefix + options.prefix });
      return { keys: found.keys.map(key => key.slice(prefix.length)), prefixes: found.prefixes.map(key => key.slice(prefix.length)), truncated: found.truncated };
    },
    delete: keys => blobs.delete(Array.isArray(keys) ? keys.map(key => prefix + key) : prefix + keys),
  };
}

export function createScopedSnapshots(
  bindings: AppBindings,
  blobs: BlobStore,
  pages: ReturnType<typeof createStatusPageRepository>,
  policies: PublicSnapshotPolicies,
) {
  function forPage(path: string) {
    const origin = new URL(statusPagePrefix(path), authOrigin(bindings)).href;
    const repository = createSnapshotRepository(bindings.DB, origin, false, undefined, false, { path, pages });
    return createPublicSnapshotService(repository, withinPage(blobs, path), policies, undefined, {},
      createRetainedSnapshotCache(bindings, "status-page:" + path), runningReleaseIdentity(bindings), true);
  }

  async function forEach(build: (snapshot: ReturnType<typeof forPage>) => Promise<unknown>) {
    const catalogue = await pages.list();
    // Bound simultaneous D1 queries and snapshot uploads across the catalogue.
    let changed = false;
    let failure: unknown;
    for (const { path } of catalogue) {
      try { changed = Boolean(await build(forPage(path))) || changed; }
      catch (cause) { failure ??= cause; }
    }
    if (failure) throw failure;
    return changed;
  }

  return { forPage, forEach };
}
