import { useState } from "react";
import type { IncidentDraftInput } from "../../../shared/schemas";
import type { IncidentView } from "../service";
import type { ComponentView } from "../../components/service";
import { appApi, useAppData } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError } from "../../../app/client/ui/states";

/** Resolving releases this incident's effect, never a separately chosen manual status. */
export function ResolutionStatuses({ incident, draft, onChanged }: { incident: IncidentView; draft: IncidentDraftInput; onChanged: () => void }) {
  const { data, error, refresh } = useAppData<{ components: ComponentView[] }>("/api/app/components");
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const attached = new Set([...incident.components.map(component => component.componentId), ...(draft.componentChanges ?? []).map(component => component.componentId)]);
  const manual = data?.components.filter(component => attached.has(component.id) && component.standingClaimState && component.standingClaimState !== "Operational") ?? [];
  if (error) return <FormError>Component statuses could not be checked. {error}</FormError>;
  if (!manual.length) return null;
  const automatic = async (component: ComponentView) => {
    setSaving(component.id); setSaveError(null);
    try {
      await appApi(`/api/app/components/${component.id}/standing-claim`, { method: "PUT", body: JSON.stringify({ state: null }) });
      refresh(); onChanged();
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "The component status could not be saved."); }
    finally { setSaving(null); }
  };
  return <section className="resolution-statuses" aria-label="Component statuses after resolution">
    {manual.map(component => <div key={component.id}><p><strong>{component.name}</strong> also has a manual status of {component.standingClaimState}. Resolving this incident will leave that status in place.</p><Button type="button" variant="secondary" disabled={saving !== null} onClick={() => void automatic(component)}>Set {component.name} to Automatic</Button></div>)}
    <p>Automatic follows any other open incidents or maintenance, and is Operational when nothing affects the component.</p>
    {saveError ? <FormError>{saveError}</FormError> : null}
  </section>;
}
