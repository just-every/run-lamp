import { useState } from "react";
import { appApi, useAppData } from "../../../app/client/ui/api";
import { FormError } from "../../../app/client/ui/states";
import type { PrelaunchSettings as Prelaunch } from "../../prelaunch/store";

export function PrelaunchSettings() {
  const resource = useAppData<Prelaunch>("/api/app/prelaunch");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  async function change(enabled: boolean) {
    setSaving(true); setError(null); setSaved(false); setSelected(enabled);
    try {
      const result = await appApi<Prelaunch>("/api/app/prelaunch", { method: "PATCH", body: JSON.stringify({ enabled }) });
      setSelected(result.enabled); resource.refresh(); setSaved(true);
    } catch (cause) {
      setSelected(null); setError(cause instanceof Error ? cause.message : "The pre-launch setting could not be saved.");
    } finally { setSaving(false); }
  }
  return <section className="data-card" aria-labelledby="prelaunch-settings-title">
    <h2 id="prelaunch-settings-title">Pre-launch</h2>
    {resource.data ? <>
      <label className="checkbox-label"><input type="checkbox" checked={selected ?? resource.data.enabled} disabled={saving} onChange={event => void change(event.target.checked)} />This page has not launched yet</label>
      <p>While this is on, the public page shows no subscribe forms, every subscribe request is refused before anything is saved or sent, and search engines are asked not to index the page. Existing subscribers keep their confirm, manage and unsubscribe links. Turn it off when you launch.</p>
      {saving && <p role="status">Saving…</p>}
      {saved && !saving && <p role="status">Pre-launch setting saved.</p>}
    </> : <p>Loading the pre-launch setting…</p>}
    {(error || resource.error) && <FormError>{error || resource.error}</FormError>}
  </section>;
}
