import type { BlobStore } from "../../platform/blobs/store";
import { DAY } from "./format";
import type { PublicSnapshotSource, SnapshotRepository } from "./repository";

const firstPages = ["feed.atom", "api/public/v1/incidents.json", "api/public/v1/maintenance.json"] as const;

function archiveRecords(source: PublicSnapshotSource) {
  const { archive, incidents, maintenance, incidentComponents, maintenanceComponents, updates, maintenanceNotices, reports, importedMaintenanceUpdates, incidentImpacts } = source;
  return { archive, incidents, maintenance, incidentComponents, maintenanceComponents, updates, maintenanceNotices, reports, importedMaintenanceUpdates, incidentImpacts };
}

interface BuildSource {
  configuration?: string;
  loadedAt: string;
  source: PublicSnapshotSource;
  archives: Array<ReturnType<typeof archiveRecords> | null>;
}

export async function loadBuildSource(repository: SnapshotRepository, generatedAt: string): Promise<BuildSource> {
  const readPlans = repository.createPlanReader?.();
  const source = await repository.load(readPlans);
  if (!source) throw new Error("Cannot build a public snapshot before page settings exist.");
  const archives = await Promise.all(firstPages.map(async (key) => {
    const page = await repository.loadArchive?.(source, key, generatedAt, readPlans);
    return page ? archiveRecords(page) : null;
  }));
  return { configuration: repository.sourceConfiguration, loadedAt: generatedAt, source, archives };
}

export async function readBuildSource(blobs: BlobStore, version: string, generatedAt: string, configuration?: string): Promise<BuildSource | null> {
  const object = await blobs.getText(`snapshots/${version}/build-source.json`);
  if (!object) return null;
  let source: BuildSource | null;
  try {
    source = JSON.parse(object.text) as BuildSource;
  } catch {
    return null;
  }
  if (!source || source.configuration !== configuration || typeof source.loadedAt !== "string" ||
    !Number.isFinite(Date.parse(source.loadedAt)) || source.loadedAt > generatedAt ||
    !Array.isArray(source.source?.corrections) || !Array.isArray(source.archives)) return null;
  return source;
}

export async function writeBuildSource(blobs: BlobStore, version: string, input: BuildSource) {
  await blobs.putText(`snapshots/${version}/build-source.json`, JSON.stringify(input), "application/json");
}

export function buildSources(input: BuildSource, generatedAt: string, prelaunch: boolean) {
  // The stored source is bounded at load time. A later render can advance its
  // lower time bounds without reading older records that can no longer enter.
  const dayLimit = Date.parse(generatedAt) - 90 * DAY;
  const source = { ...input.source, prelaunch, corrections: input.source.corrections.filter(row => Date.parse(row.endsAt) >= dayLimit) };
  const [feed, incidents, maintenance] = input.archives.map(records => records ? { ...source, ...records } : null);
  if (feed?.archive?.nextAt && Date.parse(feed.archive.nextAt) < Date.parse(generatedAt) - 365 * DAY) {
    feed.archive = { ...feed.archive, nextCursor: null };
  }
  return { source, feed, incidents, maintenance };
}
