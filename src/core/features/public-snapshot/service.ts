import { themeAssetArtifacts } from "./theme-rendering";
import type { RetainedSnapshotCache } from "../../platform/blobs/retained";
import { encodeRetainedBundle, readRetainedArtifact } from "../../platform/blobs/retained-bundle";
import { createUlid, nowIso } from "../../shared/ids";
import type { BlobObject, BlobStore } from "../../platform/blobs/store";
import type { LampServerSlots } from "../../api/extensions";
import type { AppBindings } from "../../app/types";

import { readGenerationArtifact } from "./generation-cache";
import { renderPublicSnapshot } from "./renderer";
import type { SnapshotRepository } from "./repository";
import { PRELAUNCH_ROBOTS_KEY } from "../prelaunch/policy";
import { readPrelaunch } from "../prelaunch/store";
import { defaultPublicSnapshotPolicies, type PublicSnapshotPolicies } from "./policies";
import { defaultPublicSnapshotEvents, type PublicSnapshotEvents } from "./events";

const CURRENT_POINTER_KEY = "snapshots/current.json";
const STALE_MARKER_KEY = "snapshots/stale.json";
const STALE_BUILD_MS = 5 * 60_000;
const RETRY_LEASE_MS = 2 * 60_000;
// The minute scheduler periodically rereads source data even without a mutation.
const SNAPSHOT_REFRESH_MS = 5 * 60_000;
const LOGO_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const PUBLIC_SNAPSHOT_RENDERER_VERSION = "lamp-public-snapshot-v21";

interface SnapshotPointer {
  version: string;
  generatedAt: string;
  generation: number;
  sourceRevision: number;
  rendererVersion: string | null;
  /** The running release (RER_RELEASE_DIGEST, else the Worker version id) that built this generation; null before it was recorded or where the host names none. */
  releaseIdentity: string | null;
  /** This generation was built with pre-launch on. Pointers written before the setting read false. */
  prelaunch: boolean;
}

interface SnapshotStaleMarker {
  revision: number;
  failedAt: string;
}

function logoDataUrl(logo: { bytes: ArrayBuffer; contentType: string }) {
  if (!LOGO_CONTENT_TYPES.has(logo.contentType)) throw new Error("Configured logo content type is invalid.");
  const bytes = new Uint8Array(logo.bytes);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${logo.contentType};base64,${btoa(binary)}`;
}

export interface PublicSnapshotService {
  rebuild(force?: boolean): Promise<void>;
  hasCurrentSnapshot(): Promise<boolean>;
  readArtifact(key: string): Promise<{ bytes: ArrayBuffer; contentType: string; version: string; generatedAt: string; stale: boolean; retainedReady?: boolean; prelaunch: boolean } | null>;
  /** Whether the page customers see now is a pre-launch page. Reads only the snapshot store, never D1. */
  prelaunch(): Promise<boolean>;
  latestBuild(): ReturnType<SnapshotRepository["latestBuild"]>;
  /** When the page customers see now was published; null before the first snapshot. */
  publishedAt(): Promise<string | null>;
  retryPendingBuild(): Promise<boolean>;
  /** Whether the stored page was built by other code than the running release, by another renderer version, or has work still pending. Reads the pointer and the work row only. */
  needsRebuild(): Promise<boolean>;
}

/** The release this Worker is running: the delivery digest, else the uploaded Worker version. Null where the host names neither (local development). */
export function runningReleaseIdentity(bindings: Pick<AppBindings, "RER_RELEASE_DIGEST" | "RER_VERSION_METADATA" | "RER_VERSION">): string | null {
  return bindings.RER_RELEASE_DIGEST || bindings.RER_VERSION_METADATA?.id || bindings.RER_VERSION?.id || null;
}

function parsePointer(object: BlobObject): SnapshotPointer {
  const parsed = JSON.parse(object.text) as Partial<SnapshotPointer>;
  if (typeof parsed.version !== "string" || typeof parsed.generatedAt !== "string" || !Number.isFinite(Date.parse(parsed.generatedAt)) || typeof parsed.generation !== "number" || !Number.isInteger(parsed.generation) || parsed.generation < 0 || typeof parsed.sourceRevision !== "number" || !Number.isInteger(parsed.sourceRevision) || parsed.sourceRevision < 0) throw new Error("Public snapshot pointer is invalid.");
  return {
    version: parsed.version,
    generatedAt: new Date(parsed.generatedAt).toISOString(),
    generation: parsed.generation,
    sourceRevision: parsed.sourceRevision,
    // Older deployments did not persist a renderer identity. Unknown values
    // are treated as stale so the scheduler can publish a known version.
    rendererVersion: typeof parsed.rendererVersion === "string" && parsed.rendererVersion.length > 0 ? parsed.rendererVersion : null,
    releaseIdentity: typeof parsed.releaseIdentity === "string" && parsed.releaseIdentity.length > 0 ? parsed.releaseIdentity : null,
    prelaunch: parsed.prelaunch === true,
  };
}

function rendererNeedsRebuild(pointer: SnapshotPointer | null) {
  return pointer !== null && pointer.rendererVersion !== PUBLIC_SNAPSHOT_RENDERER_VERSION;
}

export function createPublicSnapshotService(
  repository: SnapshotRepository,
  blobs: BlobStore,
  policies: PublicSnapshotPolicies = defaultPublicSnapshotPolicies,
  events: PublicSnapshotEvents = defaultPublicSnapshotEvents,
  slots: LampServerSlots = {},
  retained?: RetainedSnapshotCache,
  releaseIdentity: string | null = null,
): PublicSnapshotService {
  let rebuildTail: Promise<void> = Promise.resolve();

  /** A stored page built by another release is rebuilt: the hand-bumped renderer version cannot name every code change. */
  function releaseNeedsRebuild(pointer: SnapshotPointer | null) {
    return pointer !== null && releaseIdentity !== null && pointer.releaseIdentity !== releaseIdentity;
  }

  /** An artifact from a retained bundle; the bundle holds a robots.txt only when it was built pre-launch. */
  function retainedArtifact(bundle: string, key: string) {
    const artifact = readRetainedArtifact(bundle, key);
    return artifact ? { ...artifact, prelaunch: Boolean(readRetainedArtifact(bundle, PRELAUNCH_ROBOTS_KEY)) } : null;
  }

  async function readPointer(): Promise<SnapshotPointer | null> {
    const object = await blobs.getText(CURRENT_POINTER_KEY);
    return object ? parsePointer(object) : null;
  }

  async function advancePointer(pointer: SnapshotPointer) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const currentObject = await blobs.getText(CURRENT_POINTER_KEY);
      const current = currentObject ? parsePointer(currentObject) : null;
      if (current && current.generation >= pointer.generation) return false;
      if (await blobs.putTextConditionally(CURRENT_POINTER_KEY, JSON.stringify(pointer), "application/json; charset=utf-8", { eTag: currentObject?.eTag ?? null })) return true;
    }
    throw new Error("Public snapshot pointer changed too often to advance safely.");
  }

  async function staleMarker() {
    const object = await blobs.getText(STALE_MARKER_KEY);
    if (!object) return null;
    const parsed = JSON.parse(object.text) as Partial<SnapshotStaleMarker>;
    if (typeof parsed.revision !== "number" || !Number.isInteger(parsed.revision) || typeof parsed.failedAt !== "string") throw new Error("Public snapshot stale marker is invalid.");
    return { marker: { revision: parsed.revision, failedAt: parsed.failedAt }, eTag: object.eTag };
  }

  async function markStale(revision: number, failedAt: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await staleMarker();
      if (existing && existing.marker.revision >= revision) return;
      if (await blobs.putTextConditionally(STALE_MARKER_KEY, JSON.stringify({ revision, failedAt } satisfies SnapshotStaleMarker), "application/json; charset=utf-8", { eTag: existing?.eTag ?? null })) return;
    }
    throw new Error("Public snapshot stale marker changed too often to record a failed build safely.");
  }

  // Public reads can continue from R2 when D1 has failed. Keep that fact in
  // R2 too: snapshot bookkeeping is useful observability, never a dependency
  // for telling a reader that the artifact predates the current source.
  async function markReachableSnapshotStale(revision?: number) {
    try {
      const pointer = await readPointer();
      if (!pointer) return;
      await markStale(Math.max(revision ?? 0, pointer.sourceRevision + 1), nowIso());
    } catch {
      // If R2 itself is unavailable the route's cached-object path provides
      // the only possible stale response. Do not conceal the original error.
    }
  }

  async function staleRevisionNeedsRebuild(pointer: SnapshotPointer | null) {
    if (!pointer) return false;
    const marker = await staleMarker();
    return Boolean(marker && marker.marker.revision > pointer.sourceRevision);
  }

  async function rebuildOne(revision: number) {
    const timestamp = nowIso();
    const buildId = createUlid();
    let started = false;
    let attempts = 0;
    let lastError: unknown;
    try {
      // The bucket pointer and the retained replica outlive the database (a reset or a
      // previous preview's database restarts the counter): both refuse a generation that
      // is not above their own, so the new one is reserved above whichever is higher.
      const stored = Math.max((await readPointer())?.generation ?? 0, (await retained?.generation()) ?? 0);
      const generation = await repository.reserveGeneration(timestamp, stored);
      await repository.startBuild({
        id: buildId,
        status: "building",
        version: null,
        error: null,
        attempts: 0,
        startedAt: timestamp,
        finishedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      started = true;
      async function prepare() {
        const source = await repository.load();
        if (!source) throw new Error("Cannot build a public snapshot before page settings exist.");
        const logo = source.settings.logoKey ? await blobs.getBytes(source.settings.logoKey) : null;
        if (source.settings.logoKey && !logo) throw new Error("Configured logo object is missing from object storage.");
        const logoContentType = logo?.contentType ?? source.settings.logoContentType;
        if (logo && !logoContentType) throw new Error("Configured logo content type is missing.");
        const version = createUlid();
        source.prelaunch = await readPrelaunch(blobs);
        const rendered = renderPublicSnapshot(source, new Date().toISOString(), policies, { logoDataUrl: logo && logoContentType ? logoDataUrl({ ...logo, contentType: logoContentType }) : null }, slots);
        rendered.artifacts.push(...await themeAssetArtifacts(source.settings.themeAssets, blobs));
        const uploadedFont = rendered.artifacts.find(artifact => artifact.key === "assets/theme-font");
        if (uploadedFont) for (const artifact of rendered.artifacts.filter(artifact => artifact.contentType.startsWith("text/css"))) {
          artifact.body = artifact.body.replaceAll('url("/assets/theme-font")', `url("data:font/woff2;base64,${uploadedFont.body}")`);
        }
        const bundle = encodeRetainedBundle({ version, generatedAt: rendered.generatedAt, generation, artifacts: rendered.artifacts });
        return { version, rendered, bundle, logo, logoContentType };
      }
      let prepared: Awaited<ReturnType<typeof prepare>> | null = null;
      while (attempts < 3) {
        attempts += 1;
        try {
        // Retry storage/replica/pointer delivery with identical generation bytes.
        prepared ??= await prepare();
        const { version, rendered, bundle, logo, logoContentType } = prepared;
        await Promise.all(rendered.artifacts.map(artifact => artifact.encoding === "base64"
          ? blobs.putBytes(`snapshots/${version}/${artifact.key}`, Uint8Array.from(atob(artifact.body), character => character.charCodeAt(0)).buffer, artifact.contentType)
          : blobs.putText(`snapshots/${version}/${artifact.key}`, artifact.body, artifact.contentType)));
        if (logo) {
          await blobs.putBytes(`snapshots/${version}/assets/logo`, logo.bytes, logoContentType ?? "application/octet-stream");
        }
        // Artifacts are complete before the conditional pointer change. A
        // superseded build deliberately leaves its revision pending: a later
        // cron pass rereads D1 rather than assuming the winner saw this write.
        if (retained) await blobs.putText(`snapshots/${version}/retained.json`, bundle, "application/json");
        // Retention must be acknowledged before the R2 selector can expose
        // this generation. A failed replica write leaves the prior pointer.
        if (retained) await retained.write(bundle);
        const replicaGeneration = retained ? await retained.generation() : generation;
        const advanced = replicaGeneration === generation
          ? await advancePointer({ version, generatedAt: rendered.generatedAt, generation, sourceRevision: revision, rendererVersion: PUBLIC_SNAPSHOT_RENDERER_VERSION, releaseIdentity, prelaunch: rendered.artifacts.some(artifact => artifact.key === PRELAUNCH_ROBOTS_KEY) })
          : false;
        const finishedAt = nowIso();
        await repository.finishBuild({ id: buildId, status: "published", version, error: advanced ? null : "Superseded by a newer public snapshot generation.", attempts, finishedAt, updatedAt: finishedAt });
        const selected = await readPointer();
        if (selected?.version === version) await repository.completeWork(revision, finishedAt);
        if (!advanced) return;
        await events.snapshotPublished({ version, generatedAt: rendered.generatedAt });
        return;
        } catch (cause) {
          lastError = cause;
        }
      }
      const message = lastError instanceof Error ? lastError.message : "Unknown snapshot build failure.";
      throw new Error(`Public snapshot build failed after ${attempts} attempts: ${message}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown snapshot build failure.";
      if (started) {
        try {
          await repository.finishBuild({ id: buildId, status: "failed", version: null, error: message, attempts, finishedAt: nowIso(), updatedAt: nowIso() });
        } catch {
          // R2 remains reachable even when build bookkeeping is not.
        }
      }
      await markReachableSnapshotStale(revision);
      throw cause;
    }
  }

  async function enqueueRebuild(force = false) {
    let work: { requestedRevision: number; completedRevision: number };
    try {
      work = await repository.currentWork();
    } catch (cause) {
      await markReachableSnapshotStale();
      throw cause;
    }
    // Database triggers record every public-source mutation. A first snapshot
    // without prior work still creates a durable request here.
    const pointer = await readPointer();
    const revision = force ? await repository.requestWork(nowIso()) : work.requestedRevision > work.completedRevision
      ? work.requestedRevision
      : !pointer || await staleRevisionNeedsRebuild(pointer) || rendererNeedsRebuild(pointer)
        ? await repository.requestWork(nowIso())
        : null;
    if (revision === null) return;
    const next = rebuildTail.then(() => rebuildOne(revision), () => rebuildOne(revision));
    rebuildTail = next.catch(() => undefined);
    return next;
  }

  return {
    rebuild: enqueueRebuild,
    async hasCurrentSnapshot() {
      try {
        if (await readPointer()) return true;
      } catch (cause) {
        if (!retained) throw cause;
      }
      return Boolean(await retained?.read());
    },
    async needsRebuild() {
      const work = await repository.currentWork();
      if (work.completedRevision < work.requestedRevision) return true;
      const pointer = await readPointer();
      return rendererNeedsRebuild(pointer) || releaseNeedsRebuild(pointer);
    },
    async readArtifact(key) {
      try {
        const pointer = await readPointer();
        if (!pointer) {
          const bundle = await retained?.read();
          return bundle ? retainedArtifact(bundle, key) : null;
        }
        const object = await readGenerationArtifact(blobs, pointer.version, key);
        if (!object && ["page.html", "feed.atom", "widget.js", "status.json"].includes(key)) throw new Error("Published snapshot artifact is missing.");
        const marker = await staleMarker();
        let retainedReady = false;
        if (retained) {
          try {
            let generation = await retained.generation();
            if (generation === null || generation < pointer.generation) {
              const archived = await blobs.getText(`snapshots/${pointer.version}/retained.json`);
              if (archived) { await retained.write(archived.text); generation = await retained.generation(); }
            }
            retainedReady = generation !== null && generation >= pointer.generation;
          } catch { /* The readable R2 snapshot remains authoritative. */ }
        }
        return object ? {
          bytes: object.bytes,
          contentType: object.contentType ?? "application/octet-stream",
          version: pointer.version,
          retainedReady,
          generatedAt: pointer.generatedAt,
          stale: Boolean(marker && marker.marker.revision > pointer.sourceRevision),
          prelaunch: pointer.prelaunch,
        } : null;
      } catch (cause) {
        const bundle = await retained?.read();
        if (!bundle) throw cause;
        return retainedArtifact(bundle, key);
      }
    },
    async prelaunch() {
      try {
        const pointer = await readPointer();
        if (pointer) return pointer.prelaunch;
        const bundle = await retained?.read();
        return Boolean(bundle && readRetainedArtifact(bundle, PRELAUNCH_ROBOTS_KEY));
      } catch { return false; }
    },
    latestBuild: () => repository.latestBuild(),
    async publishedAt() {
      try { return (await readPointer())?.generatedAt ?? null; }
      catch { return null; /* An unreadable pointer reads as not yet published. */ }
    },
    async retryPendingBuild() {
      try {
        const now = new Date();
        const nowText = now.toISOString();
        const staleBefore = new Date(now.getTime() - STALE_BUILD_MS).toISOString();
        await repository.markInterruptedBuilds(nowText, staleBefore);
        let work = await repository.currentWork();
        if (work.completedRevision >= work.requestedRevision) {
          const pointer = await readPointer();
          const missingReplica = retained && pointer && (await retained.generation()) === null;
          if (missingReplica) {
            const archived = await blobs.getText(`snapshots/${pointer.version}/retained.json`);
            if (archived) { await retained!.write(archived.text); return true; }
          }
          const refreshDue = pointer && now.getTime() - Date.parse(pointer.generatedAt) >= SNAPSHOT_REFRESH_MS;
          if (!missingReplica && !refreshDue && !(await staleRevisionNeedsRebuild(pointer)) && !rendererNeedsRebuild(pointer) && !releaseNeedsRebuild(pointer)) return false;
          await repository.requestWork(nowText);
          work = await repository.currentWork();
        }
        const leaseId = createUlid();
        if (!(await repository.claimPendingWork({ leaseId, now: nowText, leaseUntil: new Date(now.getTime() + RETRY_LEASE_MS).toISOString(), staleBefore }))) return false;
        work = await repository.currentWork();
        if (work.completedRevision >= work.requestedRevision) return false;
        try {
          await rebuildOne(work.requestedRevision);
          return true;
        } finally {
          await repository.releaseWorkLease(leaseId, nowIso());
        }
      } catch (cause) {
        await markReachableSnapshotStale();
        throw cause;
      }
    },
  };
}
