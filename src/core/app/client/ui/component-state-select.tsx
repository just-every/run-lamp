import type { ComponentState } from "../../../shared/domain";
import { componentStateLabel } from "../../../shared/component-state-label";
import { INCIDENT_CLAIM_STATES } from "../../../shared/incident-component-changes";
import { Button } from "./button";

export function ComponentStateSelect({ label, state, onChange, disabled, automatic }: {
  label: string;
  state: ComponentState | "";
  onChange: (state: ComponentState | "") => void;
  disabled?: boolean;
  automatic?: boolean;
}) {
  return <>
    <label className="form-label">{label}
      <select aria-label={label} value={state} disabled={disabled} required={!automatic} onChange={event => onChange(event.target.value as ComponentState | "")}>
        <option value="" disabled={!automatic}>{automatic ? "Automatic (uses current claims)" : "Choose a state"}</option>
        {INCIDENT_CLAIM_STATES.map(option => <option key={option} value={option}>{componentStateLabel(option)}</option>)}
        {state === "Under maintenance" ? <option value={state}>{componentStateLabel(state)}</option> : null}
      </select>
    </label>
    <details>
      <summary>Details</summary>
      <Button type="button" variant="secondary" disabled={disabled || state === "Under maintenance"} onClick={() => onChange("Under maintenance")}>
        Choose Under maintenance
      </Button>
    </details>
  </>;
}
