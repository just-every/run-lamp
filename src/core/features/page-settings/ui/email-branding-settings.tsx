import { useState, type FormEvent } from "react";
import { appApi, useAppData } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { EmailMessage } from "../../incidents/ui/incident-preview";
import { defaultEmailBranding, managedMailIdentityReason, type EmailBranding } from "../../../shared/email-branding";
import { PUBLIC_PAGE_PATH, useStatusPages } from "./status-page-selection";

type BrandingFieldsProps = {
  value: EmailBranding;
  onChange: (value: EmailBranding, immediate?: boolean) => void;
  identityEditable: boolean;
  displayNameEditable?: boolean;
};

function BrandingFields({ value, onChange, identityEditable, displayNameEditable = identityEditable }: BrandingFieldsProps) {
  const update = <K extends keyof EmailBranding>(key: K, next: EmailBranding[K], immediate = false) => onChange({ ...value, [key]: next }, immediate);
  return <div className="settings-grid">
    <label className="form-label">Sender display name<input maxLength={120} disabled={!displayNameEditable} value={value.displayName} onChange={event => update("displayName", event.target.value)} /></label>
    <label className="form-label">Reply-to address<input type="email" disabled={!identityEditable} value={value.replyTo} onChange={event => update("replyTo", event.target.value)} /></label>
    <label className="form-label full-width">Subject prefix<input maxLength={80} value={value.subjectPrefix} onChange={event => update("subjectPrefix", event.target.value)} placeholder="[Acme status]" /></label>
    <label className="form-label full-width">Email header<textarea maxLength={500} value={value.header} onChange={event => update("header", event.target.value)} /><small>Plain text, shown above the update.</small></label>
    <label className="form-label full-width">Email footer<textarea maxLength={1000} value={value.footer} onChange={event => update("footer", event.target.value)} /><small>You can include your business’s postal address. Management, unsubscribe and List headers are always added and cannot be removed.</small></label>
    <label className="form-label full-width">Postal address line<input maxLength={250} value={value.postalLine ?? ""} onChange={event => update("postalLine", event.target.value)} /></label>
    <label className="checkbox-label full-width"><input type="checkbox" checked={value.usePageLogo} onChange={event => update("usePageLogo", event.target.checked, true)} />Use the uploaded page logo in email</label>
  </div>;
}

type AudienceEmailBranding = {
  branding: EmailBranding | null;
  preview: { subject: string; html: string; from: string; replyTo?: string };
};

function AudienceBrandingEditor({ endpoint, initial, identityEditable }: {
  endpoint: string; initial: AudienceEmailBranding; identityEditable: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [branding, setBranding] = useState(initial.branding);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const next = await appApi<AudienceEmailBranding>(endpoint, { method: "PUT", body: JSON.stringify({ branding }) });
      setSaved(next);
      setBranding(next.branding);
      setMessage("Email branding saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Email branding could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <p>Save and preview branding for this page here. Subscriber delivery currently uses Public branding.</p>
    {!identityEditable && <p>{managedMailIdentityReason} The relay also supplies its own sender name.</p>}
    <form onSubmit={save}>
      <fieldset disabled={saving} className="settings-form">
        <label className="checkbox-label">
          <input type="checkbox" checked={branding === null} onChange={event => setBranding(event.target.checked ? null : { ...defaultEmailBranding })} />
          Use deployment branding
        </label>
        {branding && <BrandingFields value={branding} onChange={setBranding} identityEditable={identityEditable} displayNameEditable />}
        <div className="form-actions">
          <Button type="submit">{saving ? "Saving…" : "Save email branding"}</Button>
          <Button type="button" variant="secondary" aria-expanded={showPreview} onClick={() => setShowPreview(!showPreview)}>{showPreview ? "Hide sample email" : "Preview saved branding"}</Button>
        </div>
      </fieldset>
      {error && <FormError>{error}</FormError>}
      {message && <p role="status">{message}</p>}
    </form>
    {showPreview && <section className="preview-card email-preview" aria-label="Sample email">
      <dl>
        <div><dt>From</dt><dd>{saved.preview.from}</dd></div>
        {saved.preview.replyTo && <div><dt>Reply-To</dt><dd>{saved.preview.replyTo}</dd></div>}
      </dl>
      <h3>{saved.preview.subject}</h3>
      <EmailMessage key={saved.preview.html} html={saved.preview.html} />
    </section>}
  </>;
}

function AudienceEmailSettings({ path, identityEditable }: { path: string; identityEditable: boolean }) {
  const endpoint = `/api/app/status-pages/${path}/email-branding`;
  const resource = useAppData<AudienceEmailBranding>(endpoint);
  if (resource.error) return <FormError>{resource.error}</FormError>;
  if (!resource.data) return <LoadingState>Loading email branding…</LoadingState>;
  return <AudienceBrandingEditor endpoint={endpoint} initial={resource.data} identityEditable={identityEditable} />;
}

export function EmailBrandingSettings(props: BrandingFieldsProps) {
  const pages = useStatusPages();
  const [path, setPath] = useState(PUBLIC_PAGE_PATH);
  const audiences = pages.data?.pages.filter(page => page.kind !== "public") ?? [];

  return <section className="data-card email-branding-settings" aria-labelledby="email-branding-title">
    <p className="card-kicker">Subscriber notifications</p><h2 id="email-branding-title">Notification email</h2>
    {audiences.length > 0 && <label className="form-label">Status page
      <select value={path} onChange={event => setPath(event.target.value)}>
        <option value={PUBLIC_PAGE_PATH}>Public (deployment default)</option>
        {audiences.map(page => <option key={page.path} value={page.path}>{page.pageName} ({page.path})</option>)}
      </select>
    </label>}
    {pages.error && <FormError>{pages.error}</FormError>}
    {path === PUBLIC_PAGE_PATH ? <>
      <p>Preview saved email branding in an incident’s Email preview.</p>
      {!props.identityEditable && <p>{managedMailIdentityReason} You can still brand the subject and message below.</p>}
      <BrandingFields {...props} />
      <p>The logo comes from the Page tab. Email loads it only from your public status host; the text part has no image reference.</p>
    </> : <AudienceEmailSettings key={path} path={path} identityEditable={props.identityEditable} />}
  </section>;
}
