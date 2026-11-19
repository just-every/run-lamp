import { z } from "zod";
import { sha256 } from "../../../../../modules/import-kit/src/d1/index.ts";
import type { SourceArtifact } from "../../../../../modules/import-kit/src/types.ts";
import { importLimits, type SavedFile } from "../source";
import { componentSchema, envelopeSchema, incidentSchema, maintenanceSchema, statusIoId } from "./schema";

type SavedRow<T, S = never> = { row: T; artifact: SourceArtifact; state?: S };
type IncidentState = "active" | "resolved";
type MaintenanceState = "pending" | "active" | "closed";
const splitName = /^statusio-(incidents-(active|resolved)|maintenances-(pending|active|closed))(?:-([1-9][0-9]{0,2}))?\.json$/u;
const incidentList = z.object({ active_incidents: z.array(incidentSchema), resolved_incidents: z.array(incidentSchema) });
const maintenanceList = z.object({ upcoming_maintenances: z.array(maintenanceSchema), active_maintenances: z.array(maintenanceSchema), resolved_maintenances: z.array(maintenanceSchema) });

export function readStatusIoFiles(files: SavedFile[], pageId: string) {
  if (!statusIoId.safeParse(pageId).success) throw new Error("Enter the Status.io page ID for these saved responses.");
  if (!files.length || files.length > importLimits.files) throw new Error("Choose between 1 and 200 saved Status.io response files.");

  const artifacts: SourceArtifact[] = [];
  const components: Array<SavedRow<z.infer<typeof componentSchema>>> = [];
  const incidents: Array<SavedRow<z.infer<typeof incidentSchema>, IncidentState>> = [];
  const maintenance: Array<SavedRow<z.infer<typeof maintenanceSchema>, MaintenanceState>> = [];
  const names = new Set<string>(), pages = new Map<string, Map<number, number>>();
  const encoder = new TextEncoder();
  let bytes = 0;
  for (const file of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    if (names.has(file.name)) throw new Error(`Duplicate Status.io response: ${file.name}.`);
    names.add(file.name);
    const size = encoder.encode(file.text).byteLength;
    bytes += size;
    if (bytes > importLimits.maxBytes) throw new Error("Saved Status.io responses exceed the 8 MiB total limit.");
    const artifact = { name: file.name, size, sha256: sha256(file.text) };
    artifacts.push(artifact);
    const split = splitName.exec(file.name);
    try {
      const { result } = envelopeSchema.parse(JSON.parse(file.text));
      if (file.name === "statusio-components.json") {
        for (const row of z.array(componentSchema).parse(result)) components.push({ row, artifact });
      } else if (file.name === "statusio-incidents.json") {
        const list = incidentList.parse(result);
        for (const row of list.active_incidents) incidents.push({ row, artifact, state: "active" });
        for (const row of list.resolved_incidents) incidents.push({ row, artifact, state: "resolved" });
      } else if (file.name === "statusio-maintenances.json") {
        const list = maintenanceList.parse(result);
        for (const row of list.upcoming_maintenances) maintenance.push({ row, artifact, state: "pending" });
        for (const row of list.active_maintenances) maintenance.push({ row, artifact, state: "active" });
        for (const row of list.resolved_maintenances) maintenance.push({ row, artifact, state: "closed" });
      } else if (split) {
        const [, collection, incidentState, maintenanceState, suffix] = split;
        const page = Number(suffix ?? 1);
        const lengths = pages.get(collection) ?? new Map<number, number>();
        if (lengths.has(page)) throw new Error("Duplicate page");
        if (incidentState) {
          const rows = z.array(incidentSchema).parse(result);
          for (const row of rows) incidents.push({ row, artifact, state: incidentState as IncidentState });
          lengths.set(page, rows.length);
        } else {
          const rows = z.array(maintenanceSchema).parse(result);
          for (const row of rows) maintenance.push({ row, artifact, state: maintenanceState as MaintenanceState });
          lengths.set(page, rows.length);
        }
        pages.set(collection, lengths);
      } else throw new Error("Unknown response file");
    } catch {
      throw new Error(`${file.name}: expected a successful Status.io Developer API response with documented records. Check the JSON, filename and page number.`);
    }
  }
  if (!names.has("statusio-components.json")) throw new Error("Include statusio-components.json with the page's component list.");
  if (!names.has("statusio-incidents.json") && !(pages.has("incidents-active") && pages.has("incidents-resolved"))) {
    throw new Error("Include the saved Status.io active and resolved incident lists, even when empty.");
  }
  if (!names.has("statusio-maintenances.json") && !["pending", "active", "closed"].every(state => pages.has(`maintenances-${state}`))) {
    throw new Error("Include the saved Status.io pending, active and closed maintenance lists, even when empty.");
  }
  for (const [collection, lengths] of pages) {
    if (names.has(`statusio-${collection.startsWith("incidents-") ? "incidents" : "maintenances"}.json`)) {
      throw new Error(`Choose either the combined Status.io list or the separate ${collection} lists.`);
    }
    const numbers = [...lengths.keys()].sort((a, b) => a - b);
    if (numbers.some((page, index) => page !== index + 1 || (index < numbers.length - 1 && lengths.get(page) === 0))) {
      throw new Error(`Status.io ${collection} pages must be consecutive from page 1.`);
    }
  }

  let total = 0;
  for (const collection of [components, incidents, maintenance]) {
    const seen = new Set<string>();
    for (const { row } of collection) {
      const messages = "messages" in row ? row.messages : [];
      const references = "messages" in row
        ? [...(row.components_affected ?? []), ...(row.infrastructure_affected ?? []).flatMap(pair => [pair.component, pair.container]), ...messages]
        : [];
      if ([row, ...references].some(item => item.statuspage !== undefined && item.statuspage !== pageId)) {
        throw new Error("A Status.io response belongs to a different page than the selected page ID.");
      }
      if (messages.some(update => (update.incident ?? update.maintenance ?? row._id) !== row._id)) {
        throw new Error("A Status.io message belongs to a different notice.");
      }
      if (seen.has(row._id) || new Set(messages.map(update => update._id)).size !== messages.length) {
        throw new Error("The saved Status.io responses contain duplicate records or messages.");
      }
      seen.add(row._id);
      total += 1 + messages.length + ("containers" in row ? row.containers.length : 0);
      if (total > importLimits.maxOtherRecords || encoder.encode(JSON.stringify(row)).byteLength > importLimits.maxRecordBytes) {
        throw new Error("Saved Status.io responses exceed Lamp's record limits.");
      }
    }
  }
  return { artifacts, components, incidents, maintenance };
}
