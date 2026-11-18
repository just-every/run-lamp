import { TEMPLATE_WORDING_FIELDS } from "../incidents/template-fields";
import type { ComponentState, IncidentLifecycle } from "../../shared/domain";
import type { Mapped, Snapshot } from "./rows";
import type { SourceData } from "./source";
import { richTextToPlain } from "./rich-text";

const states: Record<string, ComponentState> = { operational: "Operational", degraded_performance: "Degraded performance", partial_outage: "Partially unavailable", major_outage: "Major outage", under_maintenance: "Under maintenance" };
const lifecycles: Record<string, IncidentLifecycle> = { investigating: "Investigating", identified: "Identified", monitoring: "Monitoring", resolved: "Resolved", postmortem: "Resolved" };

export function mapTemplates(data: SourceData, components: Map<string, { id: string; name: string }>, snapshot: Snapshot, operatorId: string, asOf: string, identify: (key: string, at: string) => string): Mapped[] {
  const folders = new Map((data.templateGroups ?? []).map(group => [group.id, group.name]));
  for (const template of data.templates ?? []) if (template.group) {
    if (folders.has(template.group.id) && folders.get(template.group.id) !== template.group.name) throw new Error(`Template group ${template.group.id} has conflicting source names.`);
    folders.set(template.group.id, template.group.name);
  }
  const names = new Map(snapshot.templateNames ?? []);
  const mapped = (data.templates ?? []).map<Mapped>(source => {
    const item = { kind: "template", sourceId: source.id, name: source.name };
    const refuse = (reason: string): Mapped => ({ kind: "template", sourceId: source.id, accounting: [{ ...item, outcome: "rejected", reason }] });
    if (!source.name.trim()) return refuse("The template has no name.");
    // The template this source already imported is not someone else's name.
    const id = identify(`template:${source.id}`, source.created_at ?? "1970-01-01T00:00:00.000Z");
    if (names.has(source.name) && names.get(source.name) !== id) return refuse("A template with this name already exists; it was not replaced.");
    if (!lifecycles[source.update_status]) return refuse(`Unsupported template lifecycle '${source.update_status}'.`);
    if (!source.components.length) return refuse("The template has no affected components.");
    if (source.components.some(component => !components.has(component.id) || !states[component.status])) return refuse("A template component is missing or has an unsupported state; its selection was not broadened.");
    const selected = new Map(source.components.map(component => [component.id, component]));
    if (selected.size !== source.components.length) return refuse("The template repeats a component.");
    const body = richTextToPlain(source.body);
    const [first = "", ...rest] = body.split(/\n\s*\n/u);
    const wording = { title: source.title, affectedAudience: `Customers using ${[...selected.keys()].map(code => components.get(code)!.name).join(", ")}`, customerImpact: first, whatStillWorks: "", details: rest.join("\n\n") };
    const overflow: Record<string, string> = {};
    for (const [field, { max }] of Object.entries(TEMPLATE_WORDING_FIELDS)) if (wording[field as keyof typeof wording].length > max) overflow[field] = wording[field as keyof typeof wording];
    const fields = Object.keys(overflow);
    const groupId = source.group_id ?? source.group?.id;
    const folder = groupId ? folders.get(groupId) ?? groupId : "";
    names.set(source.name, id);
    return { kind: "template", sourceId: source.id, value: { tables: {
      incident_templates: [{ id, name: source.name, title: wording.title, folder, lifecycle: lifecycles[source.update_status], affected_audience: fields.includes("affectedAudience") ? "" : wording.affectedAudience, customer_impact: fields.includes("customerImpact") ? "" : wording.customerImpact, what_still_works: "", details: fields.includes("details") ? "" : wording.details, next_update_offset_minutes: null, should_send_notifications: source.should_send_notifications == null ? null : Number(source.should_send_notifications), imported_fields_json: fields.length ? JSON.stringify(overflow) : null, created_by_operator_id: operatorId, created_at: asOf, updated_at: asOf }],
      incident_template_components: [...selected.values()].map(component => ({ id: identify(`template-component:${source.id}:${component.id}`, source.created_at ?? "1970-01-01T00:00:00.000Z"), template_id: id, component_id: components.get(component.id)!.id, component_name: components.get(component.id)!.name, state: states[component.status], relationship: "Primary", created_at: asOf, updated_at: asOf })).sort((a, b) => a.id.localeCompare(b.id)),
    } }, accounting: [{ ...item, outcome: fields.length || (groupId && !folders.has(groupId)) ? "changed" : "imported", reason: `Template wording, title, lifecycle, components and notification default carried over; no publication or notification.${fields.length ? ` Shorten ${fields.map(field => `${field} (${TEMPLATE_WORDING_FIELDS[field as keyof typeof TEMPLATE_WORDING_FIELDS].label})`).join(", ")} before applying; the entire text is retained.` : ""}${groupId && !folders.has(groupId) ? " The folder name was not supplied; its source group ID is retained as the folder." : ""}` }] };
  });
  for (const source of data.sorryTemplates ?? []) {
    const kind = source.kind === "notice" ? "template" : "update-template";
    const item = { kind, sourceId: source.id, name: source.name };
    const refuse = (reason: string) => mapped.push({ kind, sourceId: source.id, accounting: [{ ...item, outcome: "rejected", reason }] });
    if (!source.name.trim()) { refuse("The template has no name."); continue; }
    const id = identify(`${kind}:${source.id}`, source.created_at);
    if (names.has(source.name) && names.get(source.name) !== id) { refuse("A template with this name already exists; it was not replaced."); continue; }
    // Paragraph boundaries and whitespace are kept exactly; no rich-text or
    // truncation pass may present a shortened source as complete wording.
    const boundary = /\n[ \t]*\n/u.exec(source.body);
    const wording = { title: source.subject ?? "", affectedAudience: "", customerImpact: boundary ? source.body.slice(0, boundary.index) : source.body, whatStillWorks: "", details: boundary ? source.body.slice(boundary.index + boundary[0].length) : "" };
    const overflow: Record<string, string> = {};
    for (const [field, { max }] of Object.entries(TEMPLATE_WORDING_FIELDS)) if (wording[field as keyof typeof wording].length > max) overflow[field] = wording[field as keyof typeof wording];
    const fields = Object.keys(overflow);
    const shortening = [...fields.map(field => `${field} (${TEMPLATE_WORDING_FIELDS[field as keyof typeof TEMPLATE_WORDING_FIELDS].label})`), ...(wording.title.length > 250 ? ["title (Template title)"] : [])];
    names.set(source.name, id);
    const metadata = { provider: "sorry", id: source.id, ...(source.subject === undefined ? {} : { subject: source.subject }), ...(source.component_id === undefined ? {} : { componentId: source.component_id }), body: source.body, createdAt: source.created_at, ...(source.updated_at === undefined ? {} : { updatedAt: source.updated_at }), needsLifecycle: true, needsComponents: true };
    mapped.push({ kind, sourceId: source.id, value: { tables: {
      incident_templates: [{ id, kind: source.kind, name: source.name, title: fields.includes("title") ? "" : wording.title, folder: "", lifecycle: "Investigating", affected_audience: "", customer_impact: fields.includes("customerImpact") ? "" : wording.customerImpact, what_still_works: "", details: fields.includes("details") ? "" : wording.details, next_update_offset_minutes: null, should_send_notifications: null, imported_fields_json: fields.length ? JSON.stringify(overflow) : null, source_metadata_json: JSON.stringify(metadata), created_by_operator_id: operatorId, created_at: asOf, updated_at: asOf }],
      incident_template_components: [],
    } }, accounting: [{ ...item, outcome: "changed", reason: `Sorry ${source.kind} template retained with its complete wording, subject, scope and source timestamps. Choose lifecycle, audience and affected services in the private draft; no source defaults or component impact were invented. No publication or notification.${shortening.length ? ` Shorten ${shortening.join(", ")} before applying; the entire text is retained.` : ""}` }] });
  }
  return mapped;
}
