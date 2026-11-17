import { TimezoneField } from "../../../app/client/ui/timezone-field";
import { zoneLabel } from "../../../shared/timezone-label";
import type { ChangeEvent } from "react";

import { EditableRow } from "./editable-row";
import { FoundComponents, foundLayout } from "./found-components";
import { PagePreview } from "../../page-settings/ui/page-preview";
import { readFileAsDataUrl } from "../../../app/client/ui/mark-image";

export interface FoundMark { src: string; vector: boolean; from: string | null }
/** The status page the business already runs, as its public feeds listed it when setup read it. */
export interface FoundExisting {
  url: string; host: string; source: "statuspage" | "instatus" | "betterstack";
  components: Array<{ id: string; name: string; groupId: string | null }>; pastIncidents: number;
}
export interface FoundPage {
  pageName: string; tagline: string; accentColor: string; timezone: string; icon?: FoundMark | null;
  mark: FoundMark | null; statusPage: string | null;
  /** Components outside any group, and the page's own groups with theirs; a group keeps the page's own ID, as two groups may share a name. */
  components: string[]; groups: Array<{ id: string; name: string; components: string[] }>;
  existing: FoundExisting | null;
  /** The owner chose to bring the existing page's past incidents across as resolved history. */
  history: boolean;
}

const shortUrl = (value: string) => value.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const markHost = (value: string) => new URL(value).hostname.replace(/^www\./, "");

/** What Lamp found, every fact editable, beside a preview of the page it makes. */
export function FoundCard({ page, address, onChange }: { page: FoundPage; address: string; onChange: (next: Partial<FoundPage>) => void }) {
  async function chooseMark(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onChange({ mark: { src: await readFileAsDataUrl(file), vector: file.type === "image/svg+xml", from: null } });
  }
  const layout = foundLayout(page);
  // In the public page's order: each group's components, then the rest.
  const components = [...layout.groups.flatMap((group) => group.components.map((name) => ({ name, group: group.name }))), ...layout.components.map((name) => ({ name, group: null }))];
  const pastIncidents = page.existing?.pastIncidents ?? 0;
  return <div className="found-card data-card">
    <div className="found-list">
      <EditableRow label="What should we call this?" name="page name" value={page.pageName} editor={<label className="form-label">Page name<input placeholder="Brightwell Support" required maxLength={120} value={page.pageName} onChange={(event) => onChange({ pageName: event.target.value })} /></label>} />
      <EditableRow label="Tagline" name="tagline" value={page.tagline} editor={<label className="form-label">Tagline<textarea required maxLength={280} value={page.tagline} onChange={(event) => onChange({ tagline: event.target.value })} /></label>} />
      <EditableRow label="Logo" name="logo" value={page.mark
        ? <span className="found-mark"><img src={page.mark.src} alt="" /><small>{page.mark.from ? `From ${markHost(page.mark.from)}` : "Your logo"}</small></span>
        : page.icon ? <img className="found-icon" src={page.icon.src} alt="Your square icon" /> : <span className="found-muted">A letter mark from your page name</span>}
        editor={<div className="found-mark-editor"><p>Wide logos work best, at least 480 px wide. A separate square icon is optional.</p><label className="form-label">Logo<input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" onChange={chooseMark} /></label>{page.mark ? <button type="button" className="text-link" onClick={() => onChange({ mark: null })}>Remove logo</button> : null}</div>} />
      <EditableRow label="Square icon" name="square icon" value={page.icon ? <img className="found-icon" src={page.icon.src} alt="Your square icon" /> : "Optional"} editor={<label className="form-label">Square icon<input aria-label="Square icon" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; if (file) onChange({ icon: { src: await readFileAsDataUrl(file), vector: file.type === "image/svg+xml", from: null } }); }} /><small>Used for your tab and small mark.</small></label>} />
      <EditableRow label="Accent colour" name="accent colour" value={<span className="found-colour"><i style={{ background: page.accentColor }} />{page.accentColor.toUpperCase()}</span>}
        editor={<label className="form-label">Accent colour<span className="found-colour-editor"><input type="color" aria-label="Pick accent colour" value={/^#[0-9a-f]{6}$/i.test(page.accentColor) ? page.accentColor : "#000000"} onChange={(event) => onChange({ accentColor: event.target.value.toUpperCase() })} /><input required pattern="#[0-9A-Fa-f]{6}" aria-label="Accent colour" value={page.accentColor} onChange={(event) => onChange({ accentColor: event.target.value })} /></span></label>} />
      <div className="found-row" data-found="time zone"><TimezoneField label="Which time zone are you in?" value={page.timezone} onChange={timezone => onChange({ timezone })} /><p className="found-muted">{zoneLabel(page.timezone)}: correct?</p></div>
      <FoundComponents page={page} onChange={onChange} />
      {page.statusPage ? <div className="found-row" data-found="status page"><p className="found-label">Your current status page</p><div className="found-value">{shortUrl(page.statusPage)}
        {pastIncidents ? <label className="found-history"><input type="checkbox" aria-labelledby="first-run-history" aria-describedby="first-run-history-note" checked={page.history} onChange={(event) => onChange({ history: event.target.checked })} /><span><span id="first-run-history">Bring its incident history too</span><small id="first-run-history-note" className="found-muted found-note">{pastIncidents} past incident{pastIncidents === 1 ? "" : "s"}, added as resolved history. No one is notified.</small></span></label>
          : page.existing ? null : <small className="found-muted found-note">Move its history in later from Settings.</small>}</div></div> : null}
    </div>
    <div className="found-preview">
      <PagePreview pageName={page.pageName || "Status"} accentColor={page.accentColor} markSrc={page.mark?.src ?? page.icon?.src ?? null} components={components} address={address} />
      <p className="found-caption">Preview of {address}</p>
    </div>
  </div>;
}
