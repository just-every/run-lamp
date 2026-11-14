# Complete import/export reader inspection

The production import target reader and native archive export operate on persisted tables, not the visible /api/app/incidents list. Their incident sets are already complete. Only HTTP snapshot consumers needed cursor traversal. The shared test helper now follows nextCursor without raising the API limit, checks a stable reported total, refuses a repeated cursor, checks unique identities, and reconciles the final count. Sorry's 60-record Business flow retains full snapshots, catch-up, undo, address erasure and notification-silence assertions. Statuspage/provider history counts and retained owner-edited incident reads, plus the follow-up import helper, use the same complete reader.

Relevant source excerpts:

scripts/export.mjs
```
50:     const tables = await tableNames(platform.env.DB);
51:     const entities = [];
52:     // D1 batch executes these reads in one transaction, so related records
53:     // cannot be captured on opposite sides of a concurrent publication.
54:     const ordering = await Promise.all(tables.map(async (name) => {
55:       const columns = (await platform.env.DB.prepare(`PRAGMA table_info(${quotedIdentifier(name)})`).all()).results;
56:       const keys = columns.filter((column) => column.pk > 0).sort((left, right) => left.pk - right.pk);
57:       return keys.length ? keys.map((column) => quotedIdentifier(column.name)).join(", ") : "rowid";
58:     }));
59:     const snapshot = tables.length ? await platform.env.DB.batch(tables.map((name, index) => platform.env.DB.prepare(`SELECT * FROM ${quotedIdentifier(name)} ORDER BY ${ordering[index]}`))) : [];
60:     for (const [index, name] of tables.entries()) {
61:       entities.push({ name, dependsOn: await dependencies(platform.env.DB, name), rows: snapshot[index].results.map(row => name === "public_metrics" ? { ...row, sealed_credentials: null, pull_lease_until: null, pull_after: 0 } : name === "alert_sources" && "responder_sealed_credentials" in row ? { ...row, responder_sealed_credentials: null } : name === "sign_in_providers" ? { ...row, sealed_secret: null } : row) });
62:     }
63:     const entitiesPath = join(output, "entities.json");
64:     const entitiesBytes = Buffer.from(`${JSON.stringify({ version: 1, tables: entities }, null, 2)}\n`);
```

src/core/features/statuspage-import/targets.ts
```
1: import type { D1Database, D1Sql, D1TargetAdapter, D1UndoDependency, D1UndoEffect, TargetRow } from "../../../../modules/import-kit/src/d1/index.ts";
2: import { insertJsonRows } from "../../../../modules/import-kit/src/d1/sets.ts";
3: import { entityTables, type EntityKind, type NativeValue, type Row } from "./rows";
4: import { allMarkers, markerTable, markerWhere, sealedDefaults, tablesOf } from "./native-tables";
5: import { createUlid, nowIso } from "../../shared/ids";
6: import { matchesAll } from "./target-digest";
7: 
8: const kinds = Object.keys(entityTables) as EntityKind[];
9: const valueOf = (row: TargetRow) => row.value as unknown as NativeValue;
10: 
11: /** Balanced AND keeps nested snapshot predicates inside D1's expression depth. */
12: function conjunction(parts: readonly string[]): string {
13:   const join = (start: number, end: number): string => end - start === 1 ? `(${parts[start]})` : `(${join(start, start + Math.floor((end - start) / 2))} AND ${join(start + Math.floor((end - start) / 2), end)})`;
14:   return parts.length ? join(0, parts.length) : "1";
15: }
16: 
17: /** Exactly these rows, and no others, under the entity's owning column. */
18: function exactRows(table: string, column: string, id: string, rows: Row[]): D1Sql {
19:   const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
20:   if (columns.some((key) => !/^\w+$/u.test(key))) throw new Error("Invalid native column.");
21:   return {
22:     sql: `(SELECT count(*) FROM ${table} WHERE ${column}=?)=? AND NOT EXISTS(SELECT 1 FROM json_each(?) wanted WHERE NOT EXISTS(SELECT 1 FROM ${table} actual WHERE ${conjunction(columns.map((key) => {
23:       const wanted = `json_extract(wanted.value,'$.${key}')`;
24:       // One incident can mix sealed pre-migration updates with a later native
25:       // publication. Missing new fields mean their database default, not NULL.
26:       const value = table === "incident_updates" && ["component_changes_json", "component_snapshot_json"].includes(key) ? `COALESCE(${wanted},'[]')` : wanted;
27:       return `actual.${key} IS ${value}`;
28:     }))}))`,
29:     params: [id, rows.length, JSON.stringify(rows)],
30:   };
31: }
32: 
33: /** No subscriber row beyond the anonymised record an operator's deletion keeps
34:  * (destination `deleted:<id>`) for its delivery history; no import owns it. */
35: const anonymisedOnly = (id: string): D1Sql => ({ sql: "NOT EXISTS(SELECT 1 FROM subscribers WHERE id=? AND destination<>'deleted:'||id)", params: [id] });
36: 
37: // Archive restore changes rowids. New imported history has a stable order
38: // shared with its planned value, including updates at the same instant.
39: const orderOf = (table: string) => table === "import_maintenance_updates" ? "x.published_at,x.id" : table === "incident_template_components" ? "x.id" : "x.rowid";
40: 
41: /** One owner's rows of one table, as its revision value holds them. */
42: function settle(tables: NativeValue["tables"], table: string, rows: Row[]) {
43:   // Defaults added after old import journals were sealed do not constitute
44:   // an owner edit. Non-default values remain visible to custody and undo.
45:   for (const [column, value] of Object.entries(sealedDefaults[table] ?? {})) for (const row of rows) if (row[column] === value) delete row[column];
46:   // Legacy journals have no history key: empty additions must not change their revision value.
47:   if (!["import_maintenance_updates", "component_standing_claims", "incident_reports", "incident_subscriptions"].includes(table) || rows.length) tables[table] = rows;
48: }
49: 
50: /** Imported targets (every one, or those wanted) with their owned tables, in
51:  * one query for the markers and one per owned table, whatever their number:
52:  * each table joined to its kind's markers, then grouped by owner. */
53: async function readTargets(db: D1Database, destination: string, wanted?: ReadonlyArray<{ targetKind: string; targetId: string }>): Promise<TargetRow[]> {
54:   const only = wanted ? JSON.stringify(wanted.map((target) => [target.targetKind, target.targetId])) : undefined;
55:   const markers = (await (only
56:     ? db.prepare(`SELECT a.kind,a.id,a.revision FROM (${allMarkers}) a WHERE a.id IN (SELECT json_extract(value,'$[1]') FROM json_each(?1)) AND EXISTS(SELECT 1 FROM json_each(?1) w WHERE json_extract(w.value,'$[0]')=a.kind AND json_extract(w.value,'$[1]')=a.id) ORDER BY a.kind,a.id`).bind(only)
57:     : db.prepare(`${allMarkers} ORDER BY kind,id`)).all<{ kind: string; id: string; revision: string }>()).results;
58:   const owned = new Map<string, Row[]>();
59:   const of = (key: string) => { let rows = owned.get(key); if (!rows) owned.set(key, rows = []); return rows; };
60:   for (const kind of new Set(markers.map((marker) => marker.kind))) {
61:     const shared = markerWhere(kind).params.length > 0;
62:     const where = [...shared ? ["m.kind=?"] : [], ...only ? ["m.id IN (SELECT value FROM json_each(?))"] : []];
63:     const params = [...shared ? [kind] : [], ...only ? [JSON.stringify(markers.filter((marker) => marker.kind === kind).map((marker) => marker.id))] : []];
64:     for (const [table, column] of Object.entries(tablesOf(kind))) {
65:       const rows = (await db.prepare(`SELECT x.* FROM ${markerTable(kind)} m JOIN ${table} x ON x.${column}=m.id${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY ${orderOf(table)}`).bind(...params).all<Row>()).results;
66:       for (const row of rows) of(`${kind}:${table}:${row[column]}`).push(row);
67:     }
68:   }
69:   return markers.map((marker) => {
70:     const tables: NativeValue["tables"] = {};
71:     for (const table of Object.keys(tablesOf(marker.kind))) settle(tables, table, owned.get(`${marker.kind}:${table}:${marker.id}`) ?? []);
72:     return { destination, targetKind: marker.kind, targetId: marker.id, revision: marker.revision, value: { tables } as never };
73:   });
74: }
75: 
```

src/core/features/statuspage-import/service.ts
```
110:   async function snapshot(context: D1ImportContext): Promise<Snapshot> {
111:     await assertAuthority(context);
112:     const [groups, components, counters, allocated, destinations, templates, references, orders] = await db.batch<Record<string, unknown>>([
113:       db.prepare("SELECT coalesce(max(display_order), -1) AS value FROM component_groups"),
114:       db.prepare("SELECT coalesce(max(display_order), -1) AS value FROM components"),
115:       db.prepare("SELECT namespace, last_number FROM reference_counters"),
116:       db.prepare("SELECT reference FROM reference_allocations"),
117:       db.prepare("SELECT s.destination, CASE WHEN EXISTS (SELECT 1 FROM ik_provenance p WHERE p.destination='lamp' AND p.target_kind='subscriber' AND p.target_id=s.id AND p.reversed=0) THEN s.id END AS imported FROM subscribers s"),
118:       db.prepare("SELECT t.name, CASE WHEN EXISTS (SELECT 1 FROM ik_provenance p WHERE p.destination='lamp' AND p.target_kind='template' AND p.target_id=t.id AND p.reversed=0) THEN t.id END AS imported FROM incident_templates t"),
119:       db.prepare("SELECT id, reference FROM incidents UNION ALL SELECT id, reference FROM maintenance"),
120:       db.prepare("SELECT id, display_order FROM components UNION ALL SELECT id, display_order FROM component_groups"),
121:     ]);
122:     await assertAuthority(context);
123:     const last = Object.fromEntries(counters.results.map((row) => [row.namespace, Number(row.last_number)]));
124:     return {
125:       subscriberCounts: await createSubscriberLimitRepository(db).counts(),
126:       incidentIncludeReport: (await createIncidentFollowSettingsRepository(db).get()).includeReport,
127:       maxGroupOrder: Number(groups.results[0].value), maxComponentOrder: Number(components.results[0].value),
128:       lastReference: { INC: last.INC ?? 0, SCH: last.SCH ?? 0 },
```
