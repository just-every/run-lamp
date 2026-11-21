import { useState, type FormEvent } from "react";

import { appApi } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { markToPng, readFileAsDataUrl, uploadMark } from "../../../app/client/ui/mark-image";
import { TimezoneField } from "../../../app/client/ui/timezone-field";
import { PageLogoField } from "./logo-card";
import { type StatusPage, useStatusPages } from "./status-page-selection";

type PageDraft = Pick<StatusPage, "path" | "pageName" | "tagline" | "accentColor" | "timezone" | "componentIds" | "footerCreditEnabled"> & { kind: "staff" | "audience"; cidrText: string };
type ComponentChoice = { id: string; name: string };

export function StatusPagesSettings({ canManage, canManageAccess, components, componentsReady, defaults }: {
  canManage: boolean;
  canManageAccess: boolean;
  components: ComponentChoice[];
  componentsReady: boolean;
  defaults: Pick<StatusPage, "accentColor" | "timezone">;
}) {
  const pages = useStatusPages();
  const [editor, setEditor] = useState<{ existing: boolean; originalCidrText: string; page: PageDraft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const activePage = editor?.existing ? pages.data?.pages.find(page => page.path === editor.page.path) : undefined;
  const logoUrl = activePage?.logoUrl ? `${activePage.logoUrl}?v=${encodeURIComponent(activePage.updatedAt ?? "")}` : null;

  function open(page?: StatusPage) {
    if (page?.kind === "public") return;
    setError(null);
    setSaved(null);
    const originalCidrText = page?.allowedCidrs?.join("\n") ?? "";
    setEditor({
      existing: Boolean(page),
      originalCidrText,
      page: page ? {
        path: page.path, kind: page.kind, pageName: page.pageName, tagline: page.tagline,
        accentColor: page.accentColor, timezone: page.timezone, componentIds: page.componentIds, footerCreditEnabled: page.footerCreditEnabled,
        cidrText: originalCidrText,
      } : { path: "", kind: "staff", pageName: "", tagline: "", ...defaults, footerCreditEnabled: true, componentIds: [], cidrText: "" },
    });
  }

  function update<K extends keyof PageDraft>(key: K, value: PageDraft[K]) {
    setEditor(current => current && { ...current, page: { ...current.page, [key]: value } });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    const { path, kind, cidrText, ...fields } = editor.page;
    const values = canManageAccess && kind === "staff" && cidrText !== editor.originalCidrText
      ? { ...fields, allowedCidrs: cidrText.split("\n").map(line => line.trim()).filter(Boolean) }
      : fields;
    setSaving(true);
    setError(null);
    try {
      const { page } = await appApi<{ page: StatusPage }>(editor.existing ? `/api/app/status-pages/${path}` : "/api/app/status-pages", {
        method: editor.existing ? "PUT" : "POST",
        body: JSON.stringify(editor.existing ? values : { path, kind, ...values }),
      });
      setEditor(null);
      setSaved(`${page.pageName} saved.`);
      pages.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The status page could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function changeLogo(file?: File) {
    if (!activePage || saving) return;
    setSaving(true);
    setError(null);
    setSaved(null);
    const endpoint = `/api/app/status-pages/${activePage.path}/logo`;
    try {
      if (file) {
        const png = await markToPng(await readFileAsDataUrl(file), file.type === "image/svg+xml");
        await uploadMark(png, endpoint, "page");
      } else {
        await appApi(endpoint, { method: "DELETE" });
      }
      pages.refresh();
      setSaved(file ? "Logo saved." : "Logo removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The logo could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="data-card page-card" aria-labelledby="status-pages-title">
    <div className="card-heading">
      <h2 id="status-pages-title">Status pages</h2>
      {canManage && pages.data && !editor ? <Button type="button" variant="secondary" onClick={() => open()}>Add status page</Button> : null}
    </div>
    {pages.error ? <FormError>{pages.error} <Button type="button" variant="secondary" onClick={pages.refresh}>Retry</Button></FormError> :
      !pages.data ? <LoadingState>Loading status pages…</LoadingState> : null}
    {pages.data?.pages.map(page => <div key={page.path} className="card-heading">
      <div>
        <strong>{page.kind === "public" ? "Public" : page.pageName}</strong>
        <div><a className="text-link" href={page.url} target="_blank" rel="noopener">Open {page.kind === "public" ? "public page" : page.pageName}</a></div>
      </div>
      {page.kind !== "public" && canManage ? <Button type="button" variant="secondary" aria-label={`Edit ${page.pageName}`} disabled={saving} onClick={() => open(page)}>Edit</Button> : null}
    </div>)}
    {editor ? <form className="settings-form" aria-label={editor.existing ? "Edit status page" : "New status page"} onSubmit={save} inert={saving}>
      <label className="form-label">Access
        <select value={editor.page.kind} disabled={editor.existing} onChange={event => update("kind", event.target.value === "audience" ? "audience" : "staff")}>
          <option value="staff">Staff</option><option value="audience">Named audience</option>
        </select>
        <span>{editor.page.kind === "staff" ? "Active Lamp operators can always sign in." : "Access requires operator sign-in."}</span>
      </label>
      {canManageAccess && editor.page.kind === "staff" ? <div className="form-label">
        <label htmlFor="staff-cidr-ranges">Allowed IP ranges</label>
        <textarea id="staff-cidr-ranges" rows={3} spellCheck={false} autoCapitalize="none" value={editor.page.cidrText} aria-describedby="staff-cidr-help" onChange={event => update("cidrText", event.target.value)} />
        <span className="field-hint" id="staff-cidr-help">Enter one IPv4 or IPv6 CIDR range per line to allow those visitors to read without signing in. Leave blank to require sign-in.</span>
      </div> : null}
      <label className="form-label">Page path
        <input value={editor.page.path} required disabled={editor.existing} maxLength={48} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={event => update("path", event.target.value)} />
        <span>Use lowercase letters, numbers and hyphens. This path stays fixed.</span>
      </label>
      <label className="form-label">Page name<input required maxLength={120} value={editor.page.pageName} onChange={event => update("pageName", event.target.value)} /></label>
      <label className="form-label">Tagline<textarea required maxLength={280} value={editor.page.tagline} onChange={event => update("tagline", event.target.value)} /></label>
      <label className="form-label">Accent colour<input required pattern="#[0-9A-Fa-f]{6}" value={editor.page.accentColor} onChange={event => update("accentColor", event.target.value)} /></label>
      {editor.existing ? <div className="settings-form"><PageLogoField src={logoUrl} busy={saving} upload={file => void changeLogo(file)} remove={() => void changeLogo()} /></div> : null}
      <label className="checkbox-label"><input type="checkbox" checked={editor.page.footerCreditEnabled} onChange={event => update("footerCreditEnabled", event.target.checked)} />Show the Powered by Lamp footer credit</label>
      <TimezoneField value={editor.page.timezone} onChange={zone => update("timezone", zone)} />
      <fieldset className="maintenance-components">
        <legend>Components shown</legend>
        {components.map(component => <label key={component.id} className="checkbox-label">
          <input type="checkbox" checked={editor.page.componentIds.includes(component.id)} onChange={event => update("componentIds", event.target.checked ? [...editor.page.componentIds, component.id] : editor.page.componentIds.filter(id => id !== component.id))} />
          {component.name}
        </label>)}
        {componentsReady && !components.length ? <p>No components to show yet.</p> : null}
      </fieldset>
      {error ? <FormError>{error}</FormError> : null}
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={() => setEditor(null)}>Cancel</Button>
        <Button type="submit" disabled={saving || !componentsReady}>{saving ? "Saving…" : "Save status page"}</Button>
      </div>
    </form> : null}
    {saved ? <p role="status">{saved}</p> : null}
  </section>;
}
