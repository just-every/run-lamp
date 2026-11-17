import { Link } from "@tanstack/react-router";

import { INCIDENT_CLAIM_STATES, type IncidentClaimState } from "../../../shared/incident-component-changes";
import type { IncidentDraftInput } from "../../../shared/schemas";
import type { ComponentsService } from "../../components";
import type { IncidentView } from "../service";
import { useAppData } from "../../../app/client/ui/api";
import { FormError } from "../../../app/client/ui/states";
import type { NewClaim } from "./use-new-incident";

type ComponentsResponse = { components: Awaited<ReturnType<ComponentsService["list"]>> };
type Relationship = "Primary" | "Dependent";
const newClaimLabels = {
  Operational: "Working",
  "Degraded performance": "Slow or partly down",
  "Major outage": "Down",
} as const;
const newClaimStates: readonly IncidentClaimState[] = ["Operational", "Degraded performance", "Major outage"];
export const componentChoiceReason = (name: string) => `Choose what customers should see for ${name}.`;

const slug = (state: string) => state.toLowerCase().replaceAll(" ", "-");

function usePublicComponents() {
  const { data, error } = useAppData<ComponentsResponse>("/api/app/components");
  return { components: data?.components.filter(component => !component.internal) ?? null, error };
}

/** One chip per affected component: its name and the state it claims, chosen in place. When this update
 * changes an attached claim, the chip also names the claim it has now (UPDATE-012). */
function ComponentChip({ name, state, isNew, now, disabled, onState, onRemove }: { name: string; state: IncidentClaimState | null; isNew?: boolean; now?: IncidentClaimState; disabled?: boolean; onState: (state: IncidentClaimState) => void; onRemove?: () => void }) {
  const changed = now !== undefined && now !== state;
  const states = isNew ? (state === "Partially unavailable" ? [...newClaimStates, state] : newClaimStates) : INCIDENT_CLAIM_STATES;
  return <span className={`component-chip${changed ? " is-changed" : ""}`}>
    {!disabled && state ? <span className={`fact-dot state-${slug(state)}`} aria-hidden="true" /> : null}
    <span className="component-chip-name">{name}</span>
    {changed ? <span className="component-chip-now">{now} →</span> : null}
    <select aria-label={`${name} state with this update`} disabled={disabled} value={state ?? ""} onChange={(event) => onState(event.target.value as IncidentClaimState)}>
      {state === null ? <option value="" disabled>Choose a state</option> : null}
      {states.map(value => <option key={value} value={value}>{disabled && value === "Operational" ? "Effect ends" : isNew && value !== "Partially unavailable" ? newClaimLabels[value] : value}</option>)}</select>
    {onRemove ? <button type="button" className="chip-remove" aria-label={`Remove ${name}`} title="Remove affected component" onClick={onRemove}>×</button> : null}
  </span>;
}

function AddComponent({ options, onAdd }: { options: Array<{ id: string; name: string }>; onAdd: (componentId: string) => void }) {
  if (!options.length) return null;
  return <select className="add-component" aria-label="Add component" value="" onChange={(event) => { if (event.target.value) onAdd(event.target.value); }}><option value="">+ Add component</option>{options.map(component => <option key={component.id} value={component.id}>{component.name}</option>)}</select>;
}

/** The new incident's components (INCIDENT-002: at least one). Each attachment needs an explicit state. */
export function NewIncidentComponents({ claims, onChange }: { claims: NewClaim[]; onChange: (claims: NewClaim[]) => void }) {
  const { components, error } = usePublicComponents();
  if (error) return <FormError>{error}</FormError>;
  if (components && !components.length) return <p className="component-chips-empty">Add a public component first. <Link className="quiet-link" to="/app/components">Components</Link></p>;
  const name = (id: string) => components?.find(component => component.id === id)?.name ?? "Component";
  return <div className="component-chips">
    {claims.map(claim => <ComponentChip key={claim.componentId} name={name(claim.componentId)} state={claim.state} isNew onState={(state) => onChange(claims.map(item => item.componentId === claim.componentId ? { ...item, state } : item))} onRemove={() => onChange(claims.filter(item => item.componentId !== claim.componentId))} />)}
    <AddComponent options={(components ?? []).filter(component => !claims.some(claim => claim.componentId === component.id))} onAdd={(componentId) => onChange([...claims, { componentId, state: null, relationship: "Primary" }])} />
  </div>;
}

export type PendingComponent = { componentId: string; name: string };

type DraftRow = { componentId: string; name: string; relationship: Relationship; attached: boolean };

function draftRows(incident: IncidentView, draft: IncidentDraftInput, components: ComponentsResponse["components"] | null): DraftRow[] {
  const choices = draft.componentChanges ?? [];
  return [
    ...incident.components.flatMap(row => row.componentId ? [{ componentId: row.componentId, name: row.componentName, relationship: row.relationship, attached: true }] : []),
    ...choices.filter(choice => !incident.components.some(row => row.componentId === choice.componentId)).map(choice => ({ componentId: choice.componentId, name: components?.find(component => component.id === choice.componentId)?.name ?? incident.draft?.componentChanges.find(component => component.componentId === choice.componentId)?.componentName ?? choice.componentId, relationship: choice.relationship ?? "Primary" as const, attached: false })),
  ];
}

/** An open incident's components with this update: changes stay private until publication; Operational releases one. */
export function DraftComponentChips({ incident, draft, pending, onPendingChange, onChange }: { incident: IncidentView; draft: IncidentDraftInput; pending: PendingComponent[]; onPendingChange: (pending: PendingComponent[]) => void; onChange: (changes: NonNullable<IncidentDraftInput["componentChanges"]>) => void }) {
  const { components, error } = usePublicComponents();
  const choices = draft.componentChanges ?? [];
  const resolved = draft.lifecycle === "Resolved";
  const rows = draftRows(incident, draft, components);
  const pendingRows = pending.filter(choice => !rows.some(row => row.componentId === choice.componentId));
  const removePending = (componentId: string) => onPendingChange(pending.filter(choice => choice.componentId !== componentId));
  const staged = (row: DraftRow) => choices.find(choice => choice.componentId === row.componentId);
  const claimed = (row: DraftRow) => staged(row)?.state ?? incident.components.find(component => component.componentId === row.componentId)?.state as IncidentClaimState | undefined ?? "Operational";
  const choose = (row: DraftRow, state: IncidentClaimState) => {
    const others = choices.filter(choice => choice.componentId !== row.componentId);
    const attached = incident.components.find(component => component.componentId === row.componentId);
    const relationship = staged(row)?.relationship ?? row.relationship;
    // Choosing the attached claim again keeps its current status rather than staging a no-op.
    onChange(attached && state === attached.state && relationship === attached.relationship ? others : [...others, { componentId: row.componentId, state, relationship }]);
  };
  return <div className="component-chips">
    {rows.map(row => <ComponentChip key={row.componentId} name={row.name} state={resolved ? "Operational" : claimed(row)} isNew={!row.attached} now={row.attached ? incident.components.find(component => component.componentId === row.componentId)?.state as IncidentClaimState : undefined} disabled={resolved} onState={(state) => choose(row, state)} onRemove={!row.attached ? () => onChange(choices.filter(choice => choice.componentId !== row.componentId)) : undefined} />)}
    {!resolved && pendingRows.map(row => <ComponentChip key={row.componentId} name={row.name} state={null} isNew
      onState={state => { choose({ ...row, attached: false, relationship: "Primary" }, state); removePending(row.componentId); }}
      onRemove={() => removePending(row.componentId)} />)}
    {resolved ? null : <AddComponent options={(components ?? []).filter(component => !rows.some(row => row.componentId === component.id) && !pendingRows.some(row => row.componentId === component.id))}
      onAdd={componentId => { const component = components?.find(item => item.id === componentId); if (component) onPendingChange([...pending, { componentId, name: component.name }]); }} />}
    {error ? <FormError>{error}</FormError> : null}
  </div>;
}

/** The relationship entry's summary: one word when every component shares it. */
export const relationshipSummary = (rows: Array<{ relationship: Relationship }>) => [...new Set(rows.map(row => row.relationship))].join(", ");

/** Primary or Dependent per component, in the Relationship panel under the Publish row. */
export function ComponentRelationships({ rows, onChange }: { rows: Array<{ componentId: string; name: string; relationship: Relationship }>; onChange: (componentId: string, relationship: Relationship) => void }) {
  if (!rows.length) return null;
  return <fieldset className="option-group">
    <legend className="sr-only">Relationship</legend>
    <div className="relationship-rows">{rows.map(row => <label key={row.componentId} className="form-label">{row.name}<select aria-label={`${row.name} relationship with this update`} value={row.relationship} onChange={(event) => onChange(row.componentId, event.target.value as Relationship)}><option>Primary</option><option>Dependent</option></select></label>)}</div>
  </fieldset>;
}

/** The relationship rows for an open incident's draft; a change stages that component with its claimed state. */
export function useDraftRelationships(incident: IncidentView | null, draft: IncidentDraftInput, onChange: (changes: NonNullable<IncidentDraftInput["componentChanges"]>) => void) {
  const { components } = usePublicComponents();
  const choices = draft.componentChanges ?? [];
  const rows = incident ? draftRows(incident, draft, components).map(row => ({ ...row, relationship: choices.find(choice => choice.componentId === row.componentId)?.relationship ?? row.relationship })) : [];
  const change = (componentId: string, relationship: Relationship) => {
    const row = rows.find(item => item.componentId === componentId);
    if (!row || !incident) return;
    const state = choices.find(choice => choice.componentId === componentId)?.state ?? incident.components.find(component => component.componentId === componentId)?.state as IncidentClaimState | undefined ?? "Operational";
    onChange([...choices.filter(choice => choice.componentId !== componentId), { componentId, state, relationship }]);
  };
  return { rows: draft.lifecycle === "Resolved" ? [] : rows, change };
}
