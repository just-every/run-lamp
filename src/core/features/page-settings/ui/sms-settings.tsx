import { useState, type FormEvent } from "react";
import { appApi, useAppData } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { useLeaveGuard } from "../../../app/client/ui/leave-guard";
import { FormError } from "../../../app/client/ui/states";

type SmsPreferences = { countries: string[]; supportContact: string };
type SmsSettingsResponse = { settings: SmsPreferences; configured: boolean };
const countries = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"], ["IN", "India"],
  ["JP", "Japan"], ["NZ", "New Zealand"], ["IE", "Ireland"], ["NL", "Netherlands"],
  ["ES", "Spain"], ["IT", "Italy"], ["BR", "Brazil"], ["MX", "Mexico"],
] as const;

export function SmsSettings() {
  const resource = useAppData<SmsSettingsResponse>("/api/app/sms/settings");
  const [draft, setDraft] = useState<SmsPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const settings = draft ?? resource.data?.settings;
  // An unsaved draft holds a pane switch, a route change and signing out until the owner agrees to drop it.
  useLeaveGuard(async () => !draft || window.confirm("SMS delivery changes have not been saved. Leave them behind?"), () => draft !== null);
  function edit(value: SmsPreferences) { setDraft(value); setSaved(false); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      await appApi<SmsSettingsResponse>("/api/app/sms/settings", { method: "PUT", body: JSON.stringify(settings) });
      setDraft(null); resource.refresh(); setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SMS settings could not be saved.");
    } finally { setSaving(false); }
  }
  return <section className="data-card" aria-label="SMS delivery">
    <h2>SMS delivery</h2>
    {settings ? <>
      <p role="status" data-sms-configured={resource.data?.configured}>{resource.data?.configured ? "SMS sending is configured with Twilio." : "SMS sending is off."}</p>
      <div className="setup-guide">
        <p>Set <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code>, plus <code>TWILIO_FROM_NUMBER</code> or <code>TWILIO_MESSAGING_SERVICE</code>, in your deploy’s private input file or environment, then redeploy.</p>
        <p><a href="/docs/subscribers-and-notifications#connect-sms-delivery">Twilio SMS setup</a></p>
      </div>
      <form className="incident-note-form" onSubmit={submit}>
        <fieldset className="option-group" disabled={saving}>
          <legend>Accepted countries</legend>
          <div className="channel-checks">{countries.map(([code, name]) => <label className="checkbox-label" key={code}><input type="checkbox" checked={settings.countries.includes(code)} onChange={event => edit({ ...settings, countries: event.target.checked ? [...settings.countries, code] : settings.countries.filter(country => country !== code) })} />{name}</label>)}</div>
        </fieldset>
        <label className="form-label">Support contact<input required maxLength={200} value={settings.supportContact} disabled={saving} onChange={event => edit({ ...settings, supportContact: event.target.value })} /></label>
        <Button type="submit" disabled={saving}>{saving ? "Saving SMS settings…" : "Save SMS settings"}</Button>
      </form>
      {saved && <p role="status">SMS settings saved.</p>}
    </> : <p>Loading SMS settings…</p>}
    {(error || resource.error) && <FormError>{error || resource.error}</FormError>}
  </section>;
}
