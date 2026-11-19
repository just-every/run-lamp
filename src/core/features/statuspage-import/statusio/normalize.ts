import { canonicalJson, sha256 } from "../../../../../modules/import-kit/src/d1/index.ts";
import type { Json, SourceArtifact, SourceRecord } from "../../../../../modules/import-kit/src/types.ts";
import type { Accounting } from "../rows";
import type { ReadSource, SavedFile, SourceData, SourceIncident, SourceUpdate } from "../source";
import { pairId, selectPairs, statusIoTopology, type Pair } from "./groups";
import { readStatusIoFiles } from "./saved";
import { componentStates, incidentStates, maintenanceStates, type StatusIoIncident, type StatusIoMaintenance } from "./schema";

export const statusIoNamespace = "statusio";

function affectedPairs(row: StatusIoIncident | StatusIoMaintenance, pairs: Map<string, Pair>) {
  if (row.infrastructure_affected?.length) {
    const ids = new Set(row.infrastructure_affected.map(({ component, container }) => pairId(component._id, container._id)));
    const selected = [...ids].map(id => pairs.get(id));
    return selected.every(pair => pair !== undefined) ? selected : null;
  }
  const components = row.components_affected?.map(ref => ref._id) ?? [];
  const containers = row.containers_affected?.map(ref => ref._id) ?? [];
  if (!components.length && !containers.length) return [];
  const selected = selectPairs([...pairs.values()], components, containers);
  // Separate lists identify the exact scope only if they give one possible pairing.
  return selected && (selected.length === Math.max(new Set(components).size, new Set(containers).size)) ? selected : null;
}

export async function readStatusIoResponses(files: SavedFile[], input: { pageId?: string; publicAccessAcknowledged?: boolean }): Promise<ReadSource> {
  if (!input.publicAccessAcknowledged) throw new Error("Confirm that this Status.io page and all supplied history are published and unrestricted.");
  const pageId = input.pageId ?? "";
  const saved = readStatusIoFiles(files, pageId);
  const topology = statusIoTopology(saved.components.map(({ row }) => row));
  const data: SourceData = { groups: topology.groups, components: topology.components, incidents: [], maintenance: [], subscribers: [] };
  const records: SourceRecord[] = [], accounting: Accounting[] = [];
  const origins = new Map<string, SourceArtifact>();
  const publicAddresses: Record<string, string[]> = {};

  function add(kind: string, sourceId: string, raw: object, artifact: SourceArtifact) {
    const payload = raw as Json;
    origins.set(`${kind}:${sourceId}`, artifact);
    records.push({ namespace: statusIoNamespace, kind, sourceId, payload, payloadHash: sha256(canonicalJson(payload)), artifactHash: artifact.sha256, location: { artifact: artifact.name } });
  }
  for (const { row, artifact } of saved.components) {
    if (!row.containers.length) add("component", row._id, row, artifact);
    for (const container of row.containers) {
      if (!origins.has(`group:${container._id}`)) {
        add("group", container._id, container, artifact);
        accounting.push({ kind: "group", sourceId: container._id, name: container.name, outcome: "changed", reason: "The Status.io container becomes a Lamp component group." });
      }
      const sourceId = pairId(row._id, container._id), name = `${row.name} (${container.name})`;
      add("component", sourceId, { ...row, containers: [container] }, artifact);
      accounting.push({ kind: "component", sourceId, name, outcome: "changed", reason: `The component and container pair becomes one Lamp component in ${container.name}.` });
    }
  }

  for (const [kind, events] of [["incident", saved.incidents], ["maintenance", saved.maintenance]] as const) {
    for (const { row, artifact, state } of events) {
      add(kind, row._id, row, artifact);
      const affected = affectedPairs(row, topology.pairs);
      const updates: SourceUpdate[] = [];
      for (const message of row.messages) {
        const pairs = affected && selectPairs(affected, message.components, message.containers);
        if (!pairs) continue;
        const status = kind === "incident" ? incidentStates[message.state as keyof typeof incidentStates] : maintenanceStates[message.state as keyof typeof maintenanceStates];
        updates.push({
          id: `${row._id}:${message._id}`, body: message.details, status, created_at: message.datetime,
          ...(message.status === undefined ? {} : { affected_components: pairs.map(pair => ({ code: pairId(pair.component, pair.container), new_status: componentStates[message.status!] })) }),
        });
      }
      if (!affected || updates.length !== row.messages.length) {
        accounting.push({ kind, sourceId: row._id, name: row.name, outcome: "rejected", reason: "The affected component and container pairs are missing or ambiguous in the saved responses." });
        continue;
      }
      const components = affected.map(pair => ({ id: pairId(pair.component, pair.container) }));
      updates.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
      const latest = updates.at(-1);
      const base = { id: row._id, name: row.name, created_at: new Date(row.datetime_open).toISOString(), components, incident_updates: updates };
      let event: SourceIncident;
      if (kind === "maintenance") {
        const window = row as StatusIoMaintenance;
        event = { ...base, status: state === "closed" ? "completed" : state === "active" ? "in_progress" : "scheduled",
          impact: "maintenance", scheduled_for: window.datetime_planned_start, scheduled_until: window.datetime_planned_end,
          resolved_at: updates.findLast(update => update.status === "completed")?.created_at };
        data.maintenance.push(event);
      } else {
        const incident = row as StatusIoIncident;
        const resolvedAt = incident.datetime_resolve ?? incident.datetime_close ?? updates.findLast(update => update.status === "resolved")?.created_at;
        if (state === "resolved" && !resolvedAt) {
          accounting.push({ kind, sourceId: row._id, name: row.name, outcome: "rejected", reason: "The resolved incident has no resolution time or resolved message." });
          continue;
        }
        event = { ...base, status: state === "resolved" || resolvedAt ? "resolved" : latest?.status ?? "investigating", resolved_at: resolvedAt };
        data.incidents.push(event);
        if (row.messages.some(message => message.status === 600)) {
          accounting.push({ kind, sourceId: row._id, name: row.name, outcome: "changed", reason: "Status.io's Security Event component status maps to Major outage." });
        }
      }
      publicAddresses[`${kind}:${row._id}`] = [`/pages/${kind}/${pageId}/${row._id}`];
    }
  }
  return { namespace: statusIoNamespace, data, records, artifacts: saved.artifacts, origins, accounting, publicAddresses };
}
