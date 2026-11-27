import type { ThemeAssets } from "../page-settings/theme-assets";
import { themeAssetArtifacts } from "./theme-rendering";
import type { RetainedSnapshotCache } from "../../platform/blobs/retained";
import { encodeRetainedBundle } from "../../platform/blobs/retained-bundle";
import { createUlid, nowIso } from "../../shared/ids";
import type { BlobStore } from "../../platform/blobs/store";
import type { LampServerSlots } from "../../api/extensions";

import { readGenerationArtifact } from "./generation-cache";
import { renderArchiveArtifact, renderPublicSnapshot } from "./renderer";
import type { SnapshotRepository } from "./repository";
import { PRELAUNCH_ROBOTS_KEY } from "../prelaunch/policy";
import { readPrelaunch } from "../prelaunch/store";
import { defaultPublicSnapshotPolicies, type PublicSnapshotPolicies } from "./policies";
import { defaultPublicSnapshotEvents, type PublicSnapshotEvents } from "./events";
import { pruneSnapshotVersions } from "./retention";
import { buildSources, loadBuildSource, readBuildSource, writeBuildSource } from "./build-source";

import { createSnapshotReader, CURRENT_POINTER_KEY, parsePointer, STALE_MARKER_KEY, PUBLIC_SNAPSHOT_RENDERER_VERSION, type PreparedHome, type SnapshotPointer, type SnapshotStaleMarker } from "./reader";
export { PUBLIC_SNAPSHOT_RENDERER_VERSION, runningReleaseIdentity } from "./reader";
const STALE_BUILD_MS = 5 * 60_000;
const RETRY_LEASE_MS = 2 * 60_000;
// A save waits for the Queue to publish only when the page usually builds quickly.
const REQUEST_BUILD_MS = 10_000;
// A healthy minute scheduler publishes a fresh timestamp and rolling windows.
const SNAPSHOT_REFRESH_MS = 5 * 60_000;
const PUBLICATION_SURFACES = ["page.html", "feed.atom", "feed.rss", "widget.js", "embed/script.js"];
const LOGO_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function logoDataUrl(logo: { bytes: ArrayBuffer; contentType: string }) {
  if (!LOGO_CONTENT_TYPES.has(logo.contentType)) throw new Error("Configured logo content type is invalid.");
  const bytes = new Uint8Array(logo.bytes);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return `data:${logo.contentType};base64,${btoa(binary)}`;
}

interface PublicationObservation {
  updateId: string;
  afterGeneration: number | null;
  wait: boolean;
  signal: AbortSignal;
}

export interface PublicSnapshotService {
  rebuild(force?: boolean): Promise<void>;
  /** Publish pending source changes and confirm the public selector covers them. */
  confirmPublication(): Promise<void>;
  requestedRevision(): Promise<number>;
  /** Whether the retained replica and public selector have advanced to this source revision. */
  hasCompletedRevision(revision: number): Promise<boolean>;
  includesRevision(revision: number): Promise<boolean>;
  selectedGeneration(): Promise<number>;
  observeIncidentPublication(key: string, observation: PublicationObservation): Promise<{ bytes: ArrayBuffer; version: string } | null>;
  hasPublishedReport(reference: string, publishedAt: string): Promise<boolean>;
  hasCurrentSnapshot(): Promise<boolean>;
  readArtifact(key: string): Promise<{ bytes: ArrayBuffer; contentType: string; version: string; generatedAt: string; stale: boolean; retainedReady?: boolean; prelaunch: boolean; home?: PreparedHome } | null>;
  /** Whether the page customers see now is a pre-launch page. Reads only the snapshot store, never D1. */
  prelaunch(): Promise<boolean>;
  latestBuild(): ReturnType<SnapshotRepository["latestBuild"]>;
  /** When the page customers see now was published; null before the first snapshot. */
  publishedAt(): Promise<string | null>;
  retryPendingBuild(): Promise<boolean>;
  /** Whether the last published build took longer than a save should wait. Reads one build row. */
  outlastsRequest(): Promise<boolean>;
  /** Records that the page must be rebuilt although no source row changed, for whichever run builds it next. */
  requestRebuild(): Promise<void>;
  /** Whether the stored page was built by other code than the running release, by another renderer version, or has work still pending. Reads the pointer and the work row only. */
  needsRebuild(): Promise<boolean>;
}

/**
 * The release this Worker is running: the delivery digest, else the deployed build's fingerprint, else the
 * uploaded Worker version. A workers.dev install runs one build as two Workers (app and page) with two version
 * ids; the fingerprint is the same on both, so neither takes the page the other built for another release.
 * Null where the host names none (local development).
 */
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
  protectedSnapshot = false,
  appOrigin?: string,
): PublicSnapshotService {
  let rebuildTail: Promise<void> = Promise.resolve();
  const { readPointer, staleMarker, ...reader } = createSnapshotReader(blobs, retained, selectedArtifact);

  /** A stored page built by another release is rebuilt: the hand-bumped renderer version cannot name every code change. */
  function releaseNeedsRebuild(pointer: SnapshotPointer | null) {
    return pointer !== null && releaseIdentity !== null && pointer.releaseIdentity !== releaseIdentity;
  }

  async function includesRevision(revision: number) {
    const pointer = await readPointer();
    return pointer !== null && pointer.sourceRevision >= revision;
  }

  async function advancePointer(pointer: SnapshotPointer) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const currentObject = await blobs.getText(CURRENT_POINTER_KEY);
      const current = currentObject ? parsePointer(currentObject) : null;
      if (current && current.generation >= pointer.generation) return { advanced: false, previous: null };
      if (await blobs.putTextConditionally(CURRENT_POINTER_KEY, JSON.stringify(pointer), "application/json; charset=utf-8", { eTag: currentObject?.eTag ?? null })) return { advanced: true, previous: current };
    }
    throw new Error("Public snapshot pointer changed too often to advance safely.");
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

  async function rebuildOne(revision: number, clockSource?: SnapshotPointer) {
    const startedAt = performance.now();
    const timestamp = nowIso();
    const buildId = createUlid();
    let started = false;
    let attempts = 0;
    let lastError: unknown;
    let step = "reserve generation";
    let stepStartedAt = startedAt;
    const stepMs: Record<string, number> = {};
    function nextStep(next: string) {
      const now = performance.now();
      stepMs[step] = (stepMs[step] ?? 0) + Math.round(now - stepStartedAt);
      step = next;
      stepStartedAt = now;
    }
    try {
      // The bucket pointer and the retained replica outlive the database (a reset or a
      // previous preview's database restarts the counter): both refuse a generation that
      // is not above their own, so the new one is reserved above whichever is higher.
      const [pointer, replica] = await Promise.all([readPointer(), retained?.generation()]);
      const stored = Math.max(pointer?.generation ?? 0, replica ?? 0);
      const generation = await repository.reserveGeneration(timestamp, stored);
      if (clockSource) {
        // Check after reserving the generation. A concurrent source edit
        // either appears here or publishes with a higher generation.
        const work = await repository.currentWork();
        if (work.requestedRevision !== revision || work.completedRevision !== revision) return;
      }
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
      console.info("Lamp public snapshot build started.", { buildId, revision, generation, timedRefresh: Boolean(clockSource) });
      async function prepare() {
        const generatedAt = nowIso();
        nextStep("load build source");
        // A backup/restore can reuse revision numbers under a retained bucket.
        // Reuse inputs only when their publication also exists in this D1.
        const saved = clockSource?.buildId && await repository.hasPublishedBuild?.(clockSource.buildId, clockSource.version)
          ? await readBuildSource(blobs, clockSource.version, generatedAt, repository.sourceConfiguration)
          : null;
        const previous = saved?.source.reliabilityHistory ? saved : null;
        // Metric points change every minute without a source revision. A timed
        // refresh carries the saved inputs forward with the current series.
        if (previous && repository.loadMetrics) previous.source = { ...previous.source, metrics: await repository.loadMetrics() };
        const input = previous ?? await loadBuildSource(repository, generatedAt);
        nextStep("render snapshot");
        const { source, feed, incidents, maintenance } = buildSources(input, generatedAt, protectedSnapshot || await readPrelaunch(blobs));
        const iconAsset = (JSON.parse(source.settings.themeAssets ?? "{}") as ThemeAssets).icon;
        const [logo, icon] = await Promise.all([
          source.settings.logoKey ? blobs.getBytes(source.settings.logoKey) : null,
          iconAsset ? blobs.getBytes(iconAsset.key) : null,
        ]);
        if (iconAsset && !icon) throw new Error("Configured icon object is missing from object storage.");
        if (iconAsset && iconAsset.contentType !== "image/png") throw new Error("Configured icon content type is invalid.");
        if (source.settings.logoKey && !logo) throw new Error("Configured logo object is missing from object storage.");
        const logoContentType = logo?.contentType ?? source.settings.logoContentType;
        if (logo && !logoContentType) throw new Error("Configured logo content type is missing.");
        const version = createUlid();
        const logoUrl = logo && logoContentType ? logoDataUrl({ ...logo, contentType: logoContentType }) : null;
        const iconUrl = icon && iconAsset ? logoDataUrl({ ...icon, contentType: iconAsset.contentType }) : null;
        const signIn = appOrigin ? new URL("/signin", appOrigin).href : undefined;
        const rendered = renderPublicSnapshot(source, generatedAt, policies, { logoDataUrl: logoUrl, iconDataUrl: iconUrl }, slots, signIn);
        // The masthead reads the original logo, including from a retained snapshot.
        if (logoUrl && logoContentType) rendered.artifacts.push({ key: "assets/logo", body: logoUrl.slice(logoUrl.indexOf(",") + 1), contentType: logoContentType, encoding: "base64" });
        // Feed event order is independent of incident resolution order. Read
        // its first bounded page directly so later updates to older incidents
        // cannot disappear behind the recent incident window.
        if (feed) for (const format of ["atom", "rss"]) {
          const artifact = renderArchiveArtifact(feed, `feed.${format}`, rendered.generatedAt, policies, slots);
          if (artifact) for (const key of [`feed.${format}`, `history.${format}`]) {
            const index = rendered.artifacts.findIndex(item => item.key === key);
            if (index >= 0) rendered.artifacts[index] = { ...artifact, key };
          }
        }
        for (const [name, initial] of [["incidents", incidents], ["maintenance", maintenance]] as const) {
          const key = `api/public/v1/${name}.json`;
          const artifact = initial ? renderArchiveArtifact(initial, key, rendered.generatedAt, policies, slots) : null;
          if (artifact) rendered.artifacts.push(artifact);
        }
        rendered.artifacts.push(...await themeAssetArtifacts(source.settings.themeAssets, blobs));
        const uploadedFont = rendered.artifacts.find(artifact => artifact.key === "assets/theme-font");
        if (uploadedFont) for (const artifact of rendered.artifacts.filter(artifact => artifact.contentType.startsWith("text/css"))) {
          artifact.body = artifact.body.replaceAll('url("/assets/theme-font")', `url("data:font/woff2;base64,${uploadedFont.body}")`);
        }
        const page = rendered.artifacts.find(artifact => artifact.key === "page.html");
        const home: PreparedHome | undefined = signIn && page
          ? { signIn, maintenance: page.body.includes('<p class="maintenance-window"') }
          : undefined;
        const bundle = encodeRetainedBundle({ version, generatedAt: rendered.generatedAt, generation, artifacts: rendered.artifacts });
        return { version, rendered, bundle, source, input, home };
      }
      // Source/renderer failures need a later revision or repair. Retrying
      // them immediately reloads the same history three times. Only delivery
      // to storage/replica/pointer is retried with the prepared bytes below.
      const prepared = await prepare();
      while (attempts < 3) {
        attempts += 1;
        try {
          // Keep the sequence fence ahead of the independent generation writes.
          const { version, rendered, bundle, source, input, home } = prepared;
          nextStep("upload generation");
          await blobs.putText(`snapshots/${version}/generation.json`, JSON.stringify({ version, generation }), "application/json");
          const { reliabilityHistory: _history, ...presentation } = source;
          const uploads = await Promise.allSettled([
            writeBuildSource(blobs, version, input),
            blobs.putText(`snapshots/${version}/archive-context.json`, JSON.stringify({ ...presentation, history: [], corrections: [], metrics: [] }), "application/json"),
            ...(retained ? [blobs.putText(`snapshots/${version}/retained.json`, bundle, "application/json")] : []),
            ...rendered.artifacts.map(artifact => artifact.encoding === "base64"
              ? blobs.putBytes(`snapshots/${version}/${artifact.key}`, Uint8Array.from(atob(artifact.body), character => character.charCodeAt(0)).buffer, artifact.contentType)
              : blobs.putText(`snapshots/${version}/${artifact.key}`, artifact.body, artifact.contentType)),
          ]);
          const failedUpload = uploads.find(result => result.status === "rejected");
          if (failedUpload) throw failedUpload.reason;
          // Retention must be acknowledged before the R2 selector can expose
          // this generation. A failed replica write leaves the prior pointer.
          nextStep("replicate generation");
          if (retained) await retained.write(bundle);
          const replicaGeneration = retained ? await retained.generation() : generation;
          nextStep("advance pointer");
          const { advanced, previous } = replicaGeneration === generation
            ? await advancePointer({ version, buildId, generatedAt: rendered.generatedAt, generation, sourceRevision: revision, rendererVersion: PUBLIC_SNAPSHOT_RENDERER_VERSION, releaseIdentity, home, prelaunch: rendered.artifacts.some(artifact => artifact.key === PRELAUNCH_ROBOTS_KEY) })
            : { advanced: false, previous: null };
          const finishedAt = nowIso();
          nextStep("finish build");
          await repository.finishBuild({ id: buildId, status: "published", version, error: advanced ? null : "Superseded by a newer public snapshot generation.", attempts, finishedAt, updatedAt: finishedAt });
          const selected = await readPointer();
          if (selected?.version === version && !clockSource) await repository.completeWork(revision, finishedAt);
          nextStep("after publication");
          const elapsedMs = Math.round(performance.now() - startedAt);
          if (elapsedMs >= 10_000) console.warn("Lamp public snapshot build was slow.", { buildId, revision, elapsedMs, stepMs });
          if (!advanced) return;
          await events.snapshotPublished({ version, generatedAt: rendered.generatedAt });
          if (selected?.version === version && previous) {
            try { await pruneSnapshotVersions(blobs, version, previous); }
            catch { console.warn("Public snapshot retention deferred until the next successful publication."); }
          }
          return;
        } catch (cause) {
          lastError = cause;
        }
      }
      const message = lastError instanceof Error ? lastError.message : "Unknown snapshot build failure.";
      throw new Error(`Public snapshot build failed after ${attempts} attempts: ${message}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown snapshot build failure.";
      console.error("Lamp public snapshot build failed.", {
        buildId, revision, step, attempts, elapsedMs: Math.round(performance.now() - startedAt), stepMs, message,
      });
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

  async function selectedArtifact(pointer: SnapshotPointer, key: string) {
    let object = protectedSnapshot ? await blobs.getBytes(`snapshots/${pointer.version}/${key}`) : await readGenerationArtifact(blobs, pointer.version, key);
    if (!object && repository.loadArchive) {
      const context = await blobs.getText(`snapshots/${pointer.version}/archive-context.json`);
      const source = context ? await repository.loadArchive(JSON.parse(context.text), key, pointer.generatedAt) : null;
      const artifact = source ? renderArchiveArtifact(source, key, pointer.generatedAt, policies, slots) : null;
      if (artifact) {
        await blobs.putText(`snapshots/${pointer.version}/${key}`, artifact.body, artifact.contentType);
        object = { bytes: new TextEncoder().encode(artifact.body).buffer, contentType: artifact.contentType };
      }
    }
    if (!object && ["page.html", "feed.atom", "widget.js", "status.json"].includes(key)) throw new Error("Published snapshot artifact is missing.");
    return object;
  }

  async function observeIncidentPublication(key: string, { updateId, afterGeneration, wait, signal }: PublicationObservation) {
    // One authenticated reader request can wait for the switch without
    // repeating protected-page D1 session and page lookups on each R2 check.
    const delays = wait ? [0, 250, 500, 1_000, 2_000, 4_000, 4_000] : [0];
    for (const delay of delays) {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (signal.aborted) return null;
      const pointer = await readPointer();
      if (!pointer || (afterGeneration !== null && pointer.generation <= afterGeneration) || await staleRevisionNeedsRebuild(pointer)) continue;
      if (afterGeneration === null) {
        // If the prior selector was unreadable at commit time, only immutable
        // build input can distinguish the update from a cold archive read.
        const input = await readBuildSource(blobs, pointer.version, pointer.generatedAt, repository.sourceConfiguration);
        if (!input?.source.updates.some(update => update.id === updateId)) continue;
      }
      // Reader routes revalidate this selector. A missing artifact cannot
      // confirm, even if the detail can be hydrated from D1.
      const available = await Promise.all(PUBLICATION_SURFACES.map(key => blobs.has(`snapshots/${pointer.version}/${key}`)));
      if (!available.every(Boolean)) continue;
      const object = await selectedArtifact(pointer, key);
      return object ? { bytes: object.bytes, version: pointer.version } : null;
    }
    return null;
  }

  return {
    ...reader,
    rebuild: enqueueRebuild,
    async requestedRevision() { return (await repository.currentWork()).requestedRevision; },
    async hasCompletedRevision(revision: number) {
      const { completedRevision } = await repository.currentWork();
      return completedRevision >= revision && await includesRevision(revision);
    },
    includesRevision,
    async selectedGeneration() { return (await readPointer())?.generation ?? 0; },
    observeIncidentPublication,
    async hasPublishedReport(reference, publishedAt) {
      const pointer = await readPointer();
      // An older selector can hydrate a cold archive permalink from D1. The
      // report must also be present under a generation built after publication.
      if (!pointer || Date.parse(pointer.generatedAt) < Date.parse(publishedAt)) return false;
      const object = await selectedArtifact(pointer, `incidents/${encodeURIComponent(reference)}.html`);
      if (!object) return false;
      let visible = false;
      await new HTMLRewriter().on("section.report", {
        element() { visible = true; },
      }).transform(new Response(object.bytes)).arrayBuffer();
      return visible;
    },
    async confirmPublication() {
      const { requestedRevision } = await repository.currentWork();
      await enqueueRebuild();
      if (!await includesRevision(requestedRevision)) {
        throw new Error("Your public page is still publishing. Try again to finish setup.");
      }
    },
    async needsRebuild() {
      const work = await repository.currentWork();
      if (work.completedRevision < work.requestedRevision) return true;
      const pointer = await readPointer();
      return rendererNeedsRebuild(pointer) || releaseNeedsRebuild(pointer);
    },
    latestBuild: () => repository.latestBuild(),
    async outlastsRequest() { return (await repository.lastPublishedBuildMs?.() ?? 0) > REQUEST_BUILD_MS; },
    async requestRebuild() { await repository.requestWork(nowIso()); },
    async publishedAt() {
      try { return (await readPointer())?.generatedAt ?? null; }
      catch { return null; /* An unreadable pointer reads as not yet published. */ }
    },
    async retryPendingBuild() {
      try {
        const now = new Date();
        const nowText = now.toISOString();
        const staleBefore = new Date(now.getTime() - STALE_BUILD_MS).toISOString();
        const interrupted = await repository.markInterruptedBuilds(nowText, staleBefore);
        for (const build of interrupted) {
          console.error("Lamp public snapshot build never finished: the request or run that started it ended first. Its claim on the page is released.", {
            buildId: build.id, startedAt: build.startedAt, elapsedMs: now.getTime() - Date.parse(build.startedAt),
          });
        }
        let work = await repository.currentWork();
        let clockSource: SnapshotPointer | undefined;
        if (work.completedRevision >= work.requestedRevision) {
          const pointer = await readPointer();
          const missingReplica = retained && pointer && (await retained.generation()) === null;
          if (missingReplica) {
            const archived = await blobs.getText(`snapshots/${pointer.version}/retained.json`);
            if (archived) { await retained!.write(archived.text); return true; }
          }
          const refreshDue = pointer && now.getTime() - Date.parse(pointer.generatedAt) >= SNAPSHOT_REFRESH_MS;
          const needsSource = missingReplica || await staleRevisionNeedsRebuild(pointer) || rendererNeedsRebuild(pointer) || releaseNeedsRebuild(pointer);
          if (!refreshDue && !needsSource && (pointer || work.requestedRevision === 0)) return false;
          if (pointer && !needsSource && pointer.sourceRevision === work.requestedRevision && work.requestedRevision === work.completedRevision) {
            clockSource = pointer;
          } else await repository.requestWork(nowText);
        }
        const leaseId = createUlid();
        if (!(await repository.claimPendingWork({ leaseId, now: nowText, leaseUntil: new Date(now.getTime() + RETRY_LEASE_MS).toISOString(), staleBefore, refreshRevision: clockSource?.sourceRevision }))) {
          // Publication is due and cannot start. Name the build that holds the page, so a claim nothing runs can be traced to the request that took it.
          const holder = await repository.buildInFlight?.(staleBefore);
          if (holder) console.warn("Lamp public page publication is waiting: another build holds the page and has not finished.", {
            buildId: holder.id, startedAt: holder.startedAt, heldMs: now.getTime() - Date.parse(holder.startedAt),
            releasedAt: new Date(Date.parse(holder.startedAt) + STALE_BUILD_MS).toISOString(),
          });
          return false;
        }
        try {
          work = await repository.currentWork();
          if (work.completedRevision < work.requestedRevision) await rebuildOne(work.requestedRevision);
          else if (clockSource?.sourceRevision === work.requestedRevision && work.requestedRevision === work.completedRevision && (await readPointer())?.version === clockSource.version) {
            await rebuildOne(work.requestedRevision, clockSource);
          } else return false;
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
