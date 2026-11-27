import type { PublicSnapshotModel, SnapshotArtifact } from "./renderer";

type CollectionPage = { cursor?: string; nextCursor: string | null };

/** Pagination is rendered before the generation advances. A cursor addresses
 * one immutable page, so public reads never query application data. */
export function nativeCollectionArtifacts(name: string, records: Array<{ id: string }>, generatedAt: string, page?: CollectionPage): SnapshotArtifact[] {
  if (page) return [{
    key: `api/public/v1/${name}${page.cursor ? `/${encodeURIComponent(page.cursor)}` : ""}.json`,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ generatedAt, data: records.slice(0, 50), nextCursor: page.nextCursor }),
  }];
  const artifacts: SnapshotArtifact[] = [];
  const size = 50;
  for (let offset = 0; offset < Math.max(records.length, 1); offset += size) {
    const cursor = offset === 0 ? "" : records[offset - 1].id;
    const nextCursor = offset + size < records.length ? records[offset + size - 1].id : null;
    artifacts.push({
      key: `api/public/v1/${name}${cursor ? `/${encodeURIComponent(cursor)}` : ""}.json`,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ generatedAt, data: records.slice(offset, offset + size), nextCursor }),
    });
  }
  return artifacts;
}

export function nativeIncidentArtifacts(model: PublicSnapshotModel, page?: CollectionPage) {
  const records = model.incidents.map(incident => ({
    id: incident.id,
    reference: incident.reference,
    title: incident.title,
    lifecycle: incident.lifecycle,
    impact: incident.effectiveImpact,
    derivedImpact: incident.derivedImpact,
    impactOverride: incident.impactOverride,
    effectiveImpact: incident.effectiveImpact,
    openedAt: incident.openedAt,
    resolvedAt: incident.resolvedAt,
    components: incident.components,
    updates: incident.updates.map(update => ({
      id: update.id,
      lifecycle: update.lifecycle,
      affectedAudience: update.affectedAudience,
      customerImpact: update.customerImpact,
      whatStillWorks: update.whatStillWorks,
      details: update.details,
      nextUpdateAt: update.lifecycle === "Resolved" ? null : update.nextUpdateAt,
      publishedAt: update.publishedAt,
      componentChanges: (update.componentChanges ?? []).map(({ componentId, name, previousState, newState }) => ({ componentId, name, previousState, newState })),
    })),
    report: incident.report,
  }));
  return nativeCollectionArtifacts("incidents", records, model.generatedAt, page);
}

export function nativeMaintenanceArtifacts(model: PublicSnapshotModel, page?: CollectionPage) {
  const records = model.maintenance.map(item => ({
    id: item.id,
    reference: item.reference,
    title: item.title,
    state: item.state,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    completedAt: item.completedAt,
    components: item.components,
    notices: item.notices,
    importedUpdates: item.importedUpdates,
  }));
  return nativeCollectionArtifacts("maintenance", records, model.generatedAt, page);
}

export function nativeApiArtifact(path: string, cursor: string | undefined) {
  const collection = /^\/api\/public\/v1\/(components|incidents|maintenance)(?:\.json)?\/?$/.exec(path)?.[1];
  if (!collection || (cursor && !/^[A-Za-z0-9_-]{1,100}$/.test(cursor))) return "api/public/v1/not-found.json";
  return `api/public/v1/${collection}${cursor ? `/${cursor}` : ""}.json`;
}
