import type { PublicSnapshotSource } from "./repository";

export type SourceMetadata = Record<string, unknown>;
export interface PublicComponentGroup {
  id: string; parentId: string | null; name: string; description: string; displayOrder: number;
  sourceMetadata: SourceMetadata | null;
}
const bounded = (text: string, limit: number) => Array.from(text).length > limit ? Array.from(text).slice(0, limit - 1).join("") + "…" : text;
/** A source label can exceed native authoring limits. Use it only while the
 * native value still equals its imported summary, so owner edits win. */
export function sourceText(native: string, metadata: SourceMetadata | null | undefined, key: string, limit: number): string {
  const original = metadata?.[key];
  return typeof original === "string" && native === bounded(original, limit) ? original : native;
}

async function records<T extends { id: string }>(db: D1Database, table: "components" | "incidents" | "maintenance" | "incident_updates" | "import_maintenance_updates", rows: T[]) {
  if (!rows.length) return rows;
  const result = (await db.prepare(`SELECT id,source_metadata_json AS metadata FROM ${table} WHERE id IN (SELECT value FROM json_each(?))`)
    .bind(JSON.stringify(rows.map(row => row.id))).all<{ id: string; metadata: string | null }>()).results;
  const metadata = new Map(result.map(row => {
    const value = row.metadata ? JSON.parse(row.metadata) as SourceMetadata : null;
    if (value) { delete value.body; delete value.nativeWording; }
    return [row.id, value] as const;
  }));
  return rows.map(row => ({ ...row, sourceMetadata: metadata.get(row.id) ?? null }));
}

/** Hydrate only already-public rows. Source facts are columns of their native
 * records, so portability and erasure use the same owning-row boundaries. */
export async function projectSnapshotMetadata(db: D1Database, source: PublicSnapshotSource): Promise<PublicSnapshotSource> {
  const [components, incidents, maintenance, updates, importedUpdates, groupRows] = await Promise.all([
    records(db, "components", source.components), records(db, "incidents", source.incidents), records(db, "maintenance", source.maintenance),
    records(db, "incident_updates", source.updates), records(db, "import_maintenance_updates", source.importedMaintenanceUpdates ?? []),
    db.prepare("SELECT id,parent_id AS parentId,name,description,display_order AS displayOrder,source_metadata_json AS metadata FROM component_groups ORDER BY display_order,id")
      .all<PublicComponentGroup & { metadata: string | null }>().then(rows => rows.results),
  ]);
  const groups = groupRows.map(({ metadata, ...row }) => {
    const sourceMetadata = metadata ? JSON.parse(metadata) as SourceMetadata : null;
    return { ...row, name: sourceText(row.name, sourceMetadata, "name", 120), description: sourceText(row.description, sourceMetadata, "description", 500), sourceMetadata };
  });
  const byId = new Map(groups.map(group => [group.id, group]));
  const visible = new Set<string>();
  for (const component of components) {
    let id = component.groupId;
    while (id && !visible.has(id)) { visible.add(id); id = byId.get(id)?.parentId ?? null; }
  }
  return { ...source, componentGroups: groups.filter(group => visible.has(group.id)),
    components: components.map(row => ({ ...row, name: sourceText(row.name, row.sourceMetadata, "name", 120), description: sourceText(row.description, row.sourceMetadata, "description", 500), groupName: row.groupId ? byId.get(row.groupId)?.name ?? row.groupName : row.groupName })),
    incidents: incidents.map(row => ({ ...row, title: sourceText(row.title, row.sourceMetadata, "label", 250) })),
    maintenance: maintenance.map(row => ({ ...row, title: sourceText(row.title, row.sourceMetadata, "label", 250) })),
    updates, importedMaintenanceUpdates: importedUpdates,
  };
}
