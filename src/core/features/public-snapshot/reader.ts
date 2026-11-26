import type { AppBindings } from "../../app/types";
import type { BlobBytes, BlobObject, BlobStore } from "../../platform/blobs/store";
import type { RetainedSnapshotCache } from "../../platform/blobs/retained";
import { readRetainedArtifact } from "../../platform/blobs/retained-bundle";
import { PRELAUNCH_ROBOTS_KEY } from "../prelaunch/policy";
import { readGenerationArtifact } from "./generation-cache";

export const PUBLIC_SNAPSHOT_RENDERER_VERSION = "lamp-public-snapshot-v30";
export const CURRENT_POINTER_KEY = "snapshots/current.json";
export const STALE_MARKER_KEY = "snapshots/stale.json";
export interface PreparedHome { signIn: string; maintenance: boolean }

export interface SnapshotPointer {
  version: string;
  buildId?: string;
  generatedAt: string;
  generation: number;
  sourceRevision: number;
  rendererVersion: string | null;
  /** The running release (RER_RELEASE_DIGEST, else the Worker version id) that built this generation; null before it was recorded or where the host names none. */
  releaseIdentity: string | null;
  /** This generation was built with pre-launch on. Pointers written before the setting read false. */
  prelaunch: boolean;
  home?: PreparedHome;
}

export interface SnapshotStaleMarker {
  revision: number;
  failedAt: string;
}

export function runningReleaseIdentity(bindings: Pick<AppBindings, "RER_RELEASE_DIGEST" | "RER_DEPLOY_FINGERPRINT" | "RER_VERSION_METADATA" | "RER_VERSION">): string | null {
  return bindings.RER_RELEASE_DIGEST || bindings.RER_DEPLOY_FINGERPRINT || bindings.RER_VERSION_METADATA?.id || bindings.RER_VERSION?.id || null;
}

export function parsePointer(object: BlobObject): SnapshotPointer {
  const parsed = JSON.parse(object.text) as Partial<SnapshotPointer>;
  if (typeof parsed.version !== "string" || typeof parsed.generatedAt !== "string" || !Number.isFinite(Date.parse(parsed.generatedAt)) || typeof parsed.generation !== "number" || !Number.isInteger(parsed.generation) || parsed.generation < 0 || typeof parsed.sourceRevision !== "number" || !Number.isInteger(parsed.sourceRevision) || parsed.sourceRevision < 0) throw new Error("Public snapshot pointer is invalid.");
  return {
    version: parsed.version,
    buildId: typeof parsed.buildId === "string" ? parsed.buildId : undefined,
    generatedAt: new Date(parsed.generatedAt).toISOString(),
    generation: parsed.generation,
    sourceRevision: parsed.sourceRevision,
    // Older deployments did not persist a renderer identity. Unknown values
    // are treated as stale so the scheduler can publish a known version.
    rendererVersion: typeof parsed.rendererVersion === "string" && parsed.rendererVersion.length > 0 ? parsed.rendererVersion : null,
    releaseIdentity: typeof parsed.releaseIdentity === "string" && parsed.releaseIdentity.length > 0 ? parsed.releaseIdentity : null,
    prelaunch: parsed.prelaunch === true,
    home: parsed.home && typeof parsed.home.signIn === "string" && typeof parsed.home.maintenance === "boolean" ? parsed.home : undefined,
  };
}

export type HomeStream = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  version: string;
  generatedAt: string;
  retainedReady: true;
  stale: boolean;
  prelaunch: boolean;
  home: PreparedHome;
};

export function createSnapshotReader(
  blobs: BlobStore,
  retained?: RetainedSnapshotCache,
  selectedArtifact: (pointer: SnapshotPointer, key: string) => Promise<BlobBytes | null> = async (pointer, key) => {
    const object = await readGenerationArtifact(blobs, pointer.version, key);
    if (!object && ["page.html", "status.json"].includes(key)) throw new Error("Published snapshot artifact is missing.");
    return object;
  },
) {
  /** An artifact from a retained bundle; the bundle holds a robots.txt only when it was built pre-launch. */
  function retainedArtifact(bundle: string, key: string) {
    const artifact = readRetainedArtifact(bundle, key);
    return artifact ? { ...artifact, prelaunch: Boolean(readRetainedArtifact(bundle, PRELAUNCH_ROBOTS_KEY)), home: undefined } : null;
  }

  async function readPointer(): Promise<SnapshotPointer | null> {
    const object = await blobs.getText(CURRENT_POINTER_KEY);
    return object ? parsePointer(object) : null;
  }

  async function staleMarker() {
    const object = await blobs.getText(STALE_MARKER_KEY);
    if (!object) return null;
    const parsed = JSON.parse(object.text) as Partial<SnapshotStaleMarker>;
    if (typeof parsed.revision !== "number" || !Number.isInteger(parsed.revision) || typeof parsed.failedAt !== "string") throw new Error("Public snapshot stale marker is invalid.");
    return { marker: { revision: parsed.revision, failedAt: parsed.failedAt }, eTag: object.eTag };
  }

  return {
    readPointer,
    staleMarker,
    async openPreparedHome(bucket: R2Bucket, requestUrl: URL, appHost: string, releaseIdentity: string | null): Promise<HomeStream | null> {
      const [pointer, marker] = await Promise.all([readPointer(), staleMarker()]);
      const target = new URL("/signin", requestUrl);
      target.hostname = appHost.trim().toLowerCase();
      const home = pointer?.home;
      if (!pointer || !home || home.signIn !== target.href || home.maintenance
        || pointer.rendererVersion !== PUBLIC_SNAPSHOT_RENDERER_VERSION
        || !releaseIdentity || pointer.releaseIdentity !== releaseIdentity) return null;
      const object = await bucket.get(`snapshots/${pointer.version}/page.html`);
      if (!object) return null;
      // Publication permits this generation to advance the pointer only after
      // the durable replica acknowledges it. A restored/older generation uses
      // the general reader, which can repair the replica from R2.
      return {
        stream: object.body, contentType: "text/html; charset=utf-8", version: pointer.version,
        generatedAt: pointer.generatedAt, retainedReady: true, prelaunch: pointer.prelaunch, home,
        stale: Boolean(marker && marker.marker.revision > pointer.sourceRevision),
      };
    },
    async hasCurrentSnapshot() {
      try {
        if (await readPointer()) return true;
      } catch (cause) {
        if (!retained) throw cause;
      }
      return Boolean(await retained?.read());
    },
    async readArtifact(key: string) {
      try {
        const pointer = await readPointer();
        if (!pointer) {
          const bundle = await retained?.read();
          return bundle ? retainedArtifact(bundle, key) : null;
        }
        const [object, marker] = await Promise.all([selectedArtifact(pointer, key), staleMarker()]);
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
          home: key === "page.html" ? pointer.home : undefined,
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
  };
}
