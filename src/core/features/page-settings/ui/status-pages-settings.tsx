import { useState, type FormEvent } from "react";

import { appApi } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { TimezoneField } from "../../../app/client/ui/timezone-field";
import { type StatusPage, useStatusPages } from "./status-page-selection";

type PageDraft = Pick<StatusPage, "path" | "pageName" | "tagline" | "accentColor" | "timezone" | "componentIds"> & { kind: "staff" | "audience" };
type ComponentChoice = { id: string; name: string };

export function StatusPagesSettings({ canManage, components, componentsReady, defaults }: {
  canManage: boolean;
  components: ComponentChoice[];
  componentsReady: boolean;
  defaults: Pick<StatusPage, "accentColor" | "timezone">;
}) {
  const pages = useStatusPages();
  const [editor, setEditor] = useState<{ existing: boolean; page: PageDraft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function open(page?: StatusPage) {
    if (page?.kind === "public") return;
    setError(null);
    setSaved(null);
    setEditor({
      existing: Boolean(page),
      page: page ? {
        path: page.path, kind: page.kind, pageName: page.pageName, tagline: page.tagline,
        accentColor: page.accentColor, timezone: page.timezone, componentIds: page.componentIds,
      } : { path: "", kind: "staff", pageName: "", tagline: "", ...defaults, componentIds: [] },
    });
  }

  function update<K extends keyof PageDraft>(key: K, value: PageDraft[K]) {
    setEditor(current => current && { ...current, page: { ...current.page, [key]: value } });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;
    const { path, kind, ...fields } = editor.page;
    setSaving(true);
    setError(null);
    try {
      const { page } = await appApi<{ page: StatusPage }>(editor.existing ? `/api/app/status-pages/${path}` : "/api/app/status-pages", {
        method: editor.existing ? "PUT" : "POST",
        body: JSON.stringify(editor.existing ? fields : { path, kind, ...fields }),
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
      {page.kind !== "public" && canManage ? <Button type="button" variant="secondary" disabled={saving} onClick={() => open(page)}>Edit {page.pageName}</Button> : null}
    </div>)}
    {editor ? <form className="settings-form" aria-label={editor.existing ? "Edit status page" : "New status page"} onSubmit={save} inert={saving}>
      <label className="form-label">Access
        <select value={editor.page.kind} disabled={editor.existing} onChange={event => update("kind", event.target.value === "audience" ? "audience" : "staff")}>
          <option value="staff">Staff</option><option value="audience">Named audience</option>
        </select>
        <span>Access requires operator sign-in.</span>
      </label>
      <label className="form-label">Page path
        <input value={editor.page.path} required disabled={editor.existing} maxLength={48} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" onChange={event => update("path", event.target.value)} />
        <span>Use lowercase letters, numbers and hyphens. This path stays fixed.</span>
      </label>
      <label className="form-label">Page name<input required maxLength={120} value={editor.page.pageName} onChange={event => update("pageName", event.target.value)} /></label>
      <label className="form-label">Tagline<textarea required maxLength={280} value={editor.page.tagline} onChange={event => update("tagline", event.target.value)} /></label>
      <label className="form-label">Accent colour<input required pattern="#[0-9A-Fa-f]{6}" value={editor.page.accentColor} onChange={event => update("accentColor", event.target.value)} /></label>
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
