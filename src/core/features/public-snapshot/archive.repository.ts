import { and, asc, desc, eq, getTableColumns, inArray, isNull, or, sql } from "drizzle-orm";
import { createDatabase } from "../../platform/db/client";
import { components, incidentComponents, incidents, incidentUpdates, maintenance, maintenanceComponents } from "../../shared/schema";
import type { PublicSnapshotSource } from "./repository";
import { ARCHIVE_PAGE_SIZE, decodeArchiveCursor, encodeArchiveCursor, parseArchiveKey, type ArchiveCursor, type ArchivePage } from "./archive";
import { mostSevereState } from "../../shared/domain";
import { isPublicComponentShown } from "./component-visibility";
import { DAY, localMidnight } from "./format";

type RecordKey = { id: string; at: string; kind: "incident" | "maintenance" };
type EventKey = { id: string; at: string; recordId: string; kind: "incident-update" | "maintenance-notice" };
// Only records with a published public attachment can enter the archive. Keep
// detached public names while excluding deleted, private and draft-only rows.
export const publicIncident = `i.deleted_at IS NULL AND EXISTS(SELECT 1 FROM incident_updates u WHERE u.incident_id=i.id) AND EXISTS(SELECT 1 FROM incident_components a LEFT JOIN components c ON c.id=a.component_id WHERE a.incident_id=i.id AND a.published_at IS NOT NULL AND ((a.component_id IS NULL AND a.detached_internal=0) OR c.internal=0))`;
export const publicMaintenance = `EXISTS(SELECT 1 FROM maintenance_components a LEFT JOIN components c ON c.id=a.component_id WHERE a.maintenance_id=m.id AND ((a.component_id IS NULL AND a.detached_internal=0) OR c.internal=0))`;
const compare = (a: { at: string; id: string; kind: string }, b: { at: string; id: string; kind: string }) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id) || b.kind.localeCompare(a.kind);
function seek(column: string, id: string, kind: string, cursor: ArchiveCursor | null, values: unknown[]) {
  if (!cursor) return "";
  values.push(cursor.at, cursor.id);
  return ` AND (${column},${id}) ${kind < cursor.kind ? "<=" : "<"} (?,?)`;
}
function monthBounds(month: string, zone: string) {
  const next = month.endsWith("-12") ? `${Number(month.slice(0, 4)) + 1}-01-01` : `${month.slice(0, 5)}${String(Number(month.slice(5)) + 1).padStart(2, "0")}-01`;
  return [new Date(localMidnight(`${month}-01`, zone)).toISOString(), new Date(localMidnight(next, zone)).toISOString()];
}

/** Cold archive requests do two bounded seeks and hydrate only the selected
 * records. Published generations cache their rendered result outside the
 * retained current-status bundle; accumulated history never enters that bundle. */
export async function loadArchiveSource(binding: D1Database, context: PublicSnapshotSource, key: string, generatedAt: string): Promise<PublicSnapshotSource | null> {
  const request = parseArchiveKey(key);
  if (!request) return null;
  const database = createDatabase(binding);
  let incidentIds: string[] = [], maintenanceIds: string[] = [];
  let updateIds: string[] | undefined, noticeIds: string[] | undefined;
  let nextCursor: string | null = null;
  let previousMonth: string | undefined, nextMonth: string | undefined;
  const cursor = request.cursor && !request.kind.startsWith("api-") ? decodeArchiveCursor(request.cursor) : null;
  if (request.cursor && !request.kind.startsWith("api-") && !cursor) return null;
  if (request.kind === "incident") {
    const row = await binding.prepare(`SELECT i.id FROM incidents i WHERE i.reference=? AND ${publicIncident} LIMIT 1`).bind(request.reference).first<{ id: string }>();
    if (!row) return null;
    incidentIds = [row.id];
  } else if (request.kind === "maintenance") {
    const row = await binding.prepare(`SELECT m.id FROM maintenance m WHERE m.reference=? AND ${publicMaintenance} LIMIT 1`).bind(request.reference).first<{ id: string }>();
    if (!row) return null;
    maintenanceIds = [row.id];
  } else if (request.kind === "api-incidents" || request.kind === "api-maintenance") {
    const incident = request.kind === "api-incidents";
    const anchor = request.cursor ? await binding.prepare(incident ? `SELECT i.id,i.opened_at AS at FROM incidents i WHERE i.id=? AND ${publicIncident}` : `SELECT m.id,m.starts_at AS at FROM maintenance m WHERE m.id=? AND ${publicMaintenance}`).bind(request.cursor).first<{ id: string; at: string }>() : null;
    if (request.cursor && !anchor) return null;
    const query = incident ? `SELECT i.id FROM incidents i INDEXED BY incidents_public_archive_seek WHERE ${publicIncident}${anchor ? " AND (i.opened_at,i.id)<(?,?)" : ""} ORDER BY i.opened_at DESC,i.id DESC LIMIT ?` : `SELECT m.id FROM maintenance m INDEXED BY maintenance_public_archive_seek WHERE ${publicMaintenance}${anchor ? " AND (m.starts_at,m.id)>(?,?)" : ""} ORDER BY m.starts_at,m.id LIMIT ?`;
    const values = anchor ? [anchor.at, anchor.id, ARCHIVE_PAGE_SIZE + 1] : [ARCHIVE_PAGE_SIZE + 1];
    const rows = (await binding.prepare(query).bind(...values).all<{ id: string }>()).results;
    const page = rows.slice(0, ARCHIVE_PAGE_SIZE);
    nextCursor = rows.length > ARCHIVE_PAGE_SIZE ? page.at(-1)!.id : null;
    if (incident) incidentIds = page.map(row => row.id); else maintenanceIds = page.map(row => row.id);
  } else if (request.kind === "feed") {
    if (cursor && !["incident-update", "maintenance-notice"].includes(cursor.kind)) return null;
    const component = request.componentSlug ? context.components.find(row => row.id.toLowerCase() === request.componentSlug) : undefined;
    if (request.componentSlug && (!component || !isPublicComponentShown({ ...component, state: mostSevereState(context.claims.filter(claim => claim.componentId === component.id).map(claim => claim.state)) }))) return null;
    const since = new Date(Date.parse(generatedAt) - 365 * DAY).toISOString();
    const left: unknown[] = [since];
    const right: unknown[] = [since];
    const componentIncident = component ? " AND EXISTS(SELECT 1 FROM incident_components ca WHERE ca.incident_id=i.id AND ca.component_id=? AND ca.published_at IS NOT NULL)" : "";
    const componentMaintenance = component ? " AND EXISTS(SELECT 1 FROM maintenance_components ca WHERE ca.maintenance_id=m.id AND ca.component_id=?)" : "";
    if (component) { left.push(component.id); right.push(component.id); }
    const incidentSeek = seek("u.published_at", "u.id", "incident-update", cursor, left);
    const maintenanceSeek = seek("n.published_at", "n.id", "maintenance-notice", cursor, right);
    left.push(ARCHIVE_PAGE_SIZE + 1); right.push(ARCHIVE_PAGE_SIZE + 1);
    const [updates, notices] = await Promise.all([
      binding.prepare(`SELECT u.id,u.published_at AS at,u.incident_id AS recordId,'incident-update' AS kind FROM incident_updates u INDEXED BY incident_updates_public_feed_seek JOIN incidents i ON i.id=u.incident_id WHERE u.published_at>=? AND ${publicIncident}${componentIncident}${incidentSeek} ORDER BY u.published_at DESC,u.id DESC LIMIT ?`).bind(...left).all<EventKey>(),
      binding.prepare(`SELECT n.id,n.published_at AS at,n.maintenance_id AS recordId,'maintenance-notice' AS kind FROM maintenance_notices n INDEXED BY maintenance_notices_public_feed_seek JOIN maintenance m ON m.id=n.maintenance_id WHERE n.published_at>=? AND ${publicMaintenance}${componentMaintenance}${maintenanceSeek} ORDER BY n.published_at DESC,n.id DESC LIMIT ?`).bind(...right).all<EventKey>(),
    ]);
    const rows = [...updates.results, ...notices.results].sort(compare);
    const page = rows.slice(0, ARCHIVE_PAGE_SIZE);
    nextCursor = rows.length > ARCHIVE_PAGE_SIZE ? encodeArchiveCursor(page.at(-1)!) : null;
    updateIds = page.filter(row => row.kind === "incident-update").map(row => row.id);
    noticeIds = page.filter(row => row.kind === "maintenance-notice").map(row => row.id);
    incidentIds = [...new Set(page.filter(row => row.kind === "incident-update").map(row => row.recordId))];
    maintenanceIds = [...new Set(page.filter(row => row.kind === "maintenance-notice").map(row => row.recordId))];
  } else {
    if (cursor && !["incident", "maintenance"].includes(cursor.kind)) return null;
    const left: unknown[] = [], right: unknown[] = [];
    const incidentSeek = seek("i.resolved_at", "i.id", "incident", cursor, left);
    const maintenanceSeek = seek("COALESCE(m.completed_at,m.ends_at)", "m.id", "maintenance", cursor, right);
    let incidentMonth = "", maintenanceMonth = "";
    if (request.month) {
      const [from, until] = monthBounds(request.month, context.settings.timezone);
      incidentMonth = " AND i.resolved_at>=? AND i.resolved_at<?";
      maintenanceMonth = " AND COALESCE(m.completed_at,m.ends_at)>=? AND COALESCE(m.completed_at,m.ends_at)<?";
      left.push(from, until); right.push(from, until);
      // Adjacent populated months are separate indexed seeks. A page holding
      // only one month's records must still navigate through the full archive.
      const [incidentBefore, incidentAfter, maintenanceBefore, maintenanceAfter] = await Promise.all([
        binding.prepare(`SELECT i.resolved_at AS at FROM incidents i INDEXED BY incidents_resolved_public_window WHERE i.lifecycle='Resolved' AND i.resolved_at<? AND ${publicIncident} ORDER BY i.resolved_at DESC,i.id DESC LIMIT 1`).bind(from).first<{at: string}>(),
        binding.prepare(`SELECT i.resolved_at AS at FROM incidents i INDEXED BY incidents_resolved_public_window WHERE i.lifecycle='Resolved' AND i.resolved_at>=? AND ${publicIncident} ORDER BY i.resolved_at,i.id LIMIT 1`).bind(until).first<{at: string}>(),
        binding.prepare(`SELECT COALESCE(m.completed_at,m.ends_at) AS at FROM maintenance m INDEXED BY maintenance_completed_public_window WHERE m.state IN ('Completed','Cancelled') AND COALESCE(m.completed_at,m.ends_at)<? AND ${publicMaintenance} ORDER BY COALESCE(m.completed_at,m.ends_at) DESC,m.id DESC LIMIT 1`).bind(from).first<{at: string}>(),
        binding.prepare(`SELECT COALESCE(m.completed_at,m.ends_at) AS at FROM maintenance m INDEXED BY maintenance_completed_public_window WHERE m.state IN ('Completed','Cancelled') AND COALESCE(m.completed_at,m.ends_at)>=? AND ${publicMaintenance} ORDER BY COALESCE(m.completed_at,m.ends_at),m.id LIMIT 1`).bind(until).first<{at: string}>(),
      ]);
      const monthOf = (at: string | undefined) => {
        if (!at) return undefined;
        const parts = new Intl.DateTimeFormat('en-US', {timeZone: context.settings.timezone, year: 'numeric', month: '2-digit'}).formatToParts(new Date(at));
        return `${parts.find(part => part.type === 'year')!.value}-${parts.find(part => part.type === 'month')!.value}`;
      };
      previousMonth = monthOf([incidentBefore?.at, maintenanceBefore?.at].filter((at): at is string => !!at).sort().at(-1));
      nextMonth = monthOf([incidentAfter?.at, maintenanceAfter?.at].filter((at): at is string => !!at).sort()[0]);
    }
    left.push(ARCHIVE_PAGE_SIZE + 1); right.push(ARCHIVE_PAGE_SIZE + 1);
    const [resolved, completed] = await Promise.all([
      binding.prepare(`SELECT i.id,i.resolved_at AS at,'incident' AS kind FROM incidents i INDEXED BY incidents_resolved_public_window WHERE i.lifecycle='Resolved' AND i.resolved_at IS NOT NULL AND ${publicIncident}${incidentSeek}${incidentMonth} ORDER BY i.resolved_at DESC,i.id DESC LIMIT ?`).bind(...left).all<RecordKey>(),
      binding.prepare(`SELECT m.id,COALESCE(m.completed_at,m.ends_at) AS at,'maintenance' AS kind FROM maintenance m INDEXED BY maintenance_completed_public_window WHERE m.state IN ('Completed','Cancelled') AND ${publicMaintenance}${maintenanceSeek}${maintenanceMonth} ORDER BY COALESCE(m.completed_at,m.ends_at) DESC,m.id DESC LIMIT ?`).bind(...right).all<RecordKey>(),
    ]);
    const rows = [...resolved.results, ...completed.results].sort(compare);
    const page = rows.slice(0, ARCHIVE_PAGE_SIZE);
    nextCursor = rows.length > ARCHIVE_PAGE_SIZE ? encodeArchiveCursor(page.at(-1)!) : null;
    incidentIds = page.filter(row => row.kind === "incident").map(row => row.id);
    maintenanceIds = page.filter(row => row.kind === "maintenance").map(row => row.id);
  }
  const [incidentRows, maintenanceRows, attachments, maintenanceAttachments, updates, notices, reports, importedUpdates, impacts] = await Promise.all([
    incidentIds.length ? database.select().from(incidents).where(and(inArray(incidents.id, incidentIds), isNull(incidents.deletedAt))).orderBy(desc(incidents.openedAt), desc(incidents.id)).all() : [],
    maintenanceIds.length ? database.select().from(maintenance).where(inArray(maintenance.id, maintenanceIds)).orderBy(asc(maintenance.startsAt), asc(maintenance.id)).all() : [],
    incidentIds.length ? database.select(getTableColumns(incidentComponents)).from(incidentComponents).leftJoin(components, eq(incidentComponents.componentId, components.id)).where(and(inArray(incidentComponents.incidentId, incidentIds), sql`incident_components.published_at IS NOT NULL`, or(and(isNull(incidentComponents.componentId), sql`incident_components.detached_internal=0`), eq(components.internal, false)))).all() : [],
    maintenanceIds.length ? database.select(getTableColumns(maintenanceComponents)).from(maintenanceComponents).leftJoin(components, eq(maintenanceComponents.componentId, components.id)).where(and(inArray(maintenanceComponents.maintenanceId, maintenanceIds), or(and(isNull(maintenanceComponents.componentId), sql`maintenance_components.detached_internal=0`), eq(components.internal, false)))).all() : [],
    incidentIds.length && (!updateIds || updateIds.length) ? database.select().from(incidentUpdates).where(and(inArray(incidentUpdates.incidentId, incidentIds), updateIds ? inArray(incidentUpdates.id, updateIds) : undefined)).orderBy(desc(incidentUpdates.publishedAt), desc(incidentUpdates.id)).all() : [],
    maintenanceIds.length && (!noticeIds || noticeIds.length) ? binding.prepare(`SELECT id,maintenance_id AS maintenanceId,kind,body,published_at AS publishedAt FROM maintenance_notices WHERE maintenance_id IN (${maintenanceIds.map(() => "?").join(",")})${noticeIds ? ` AND id IN (${noticeIds.map(() => "?").join(",")})` : ""} ORDER BY published_at DESC,id DESC`).bind(...maintenanceIds, ...(noticeIds ?? [])).all<PublicSnapshotSource["maintenanceNotices"][number]>().then(rows => rows.results) : [],
    incidentIds.length ? binding.prepare(`SELECT incident_id AS incidentId,summary,timeline,cause,remediation,published_at AS publishedAt FROM incident_reports WHERE published_at IS NOT NULL AND incident_id IN (${incidentIds.map(() => "?").join(",")})`).bind(...incidentIds).all<PublicSnapshotSource["reports"][number]>().then(rows => rows.results) : [],
    maintenanceIds.length && request.kind !== "feed" ? binding.prepare(`SELECT id,maintenance_id AS maintenanceId,body,published_at AS publishedAt FROM import_maintenance_updates WHERE maintenance_id IN (${maintenanceIds.map(() => "?").join(",")}) ORDER BY published_at DESC,id`).bind(...maintenanceIds).all<NonNullable<PublicSnapshotSource["importedMaintenanceUpdates"]>[number]>().then(rows => rows.results) : [],
    incidentIds.length ? binding.prepare(`SELECT id,peak_impact AS impact FROM incidents WHERE id IN (${incidentIds.map(() => "?").join(",")})`).bind(...incidentIds).all<{id: string;impact: PublicSnapshotSource["claims"][number]["state"] | null}>().then(rows => rows.results) : [],
  ]);
  const archive: ArchivePage = { kind: request.kind, cursor: request.cursor, month: request.month, previousMonth, nextMonth, componentSlug: request.componentSlug, nextCursor, pageSize: ARCHIVE_PAGE_SIZE };
  return { ...context, archive, incidents: incidentRows, maintenance: maintenanceRows, incidentComponents: attachments, maintenanceComponents: maintenanceAttachments, updates, maintenanceNotices: notices, reports, importedMaintenanceUpdates: importedUpdates, incidentImpacts: Object.fromEntries(impacts.filter(row => row.impact !== null).map(row => [row.id, row.impact!])) };
}
