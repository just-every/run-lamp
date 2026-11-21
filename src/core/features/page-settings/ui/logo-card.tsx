import { useState } from "react";
import type { PageSettingsView } from "../service";
import { appApi } from "../../../app/client/ui/api";
import { markToPng, readFileAsDataUrl, uploadMark, uploadIcon } from "../../../app/client/ui/mark-image";
import { Button } from "../../../app/client/ui/button";

export function LogoCard({ settings, onSettings }: { settings: PageSettingsView; onSettings: (settings: PageSettingsView) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const version = encodeURIComponent(settings.updatedAt);
  async function run(work: () => Promise<PageSettingsView>) {
    setBusy(true); setMessage(null);
    try { onSettings(await work()); setMessage("Saved · live"); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "The image could not be saved."); }
    finally { setBusy(false); }
  }
  const upload = (file: File | undefined, icon: boolean) => {
    if (!file) return;
    void run(async () => {
      const png = await markToPng(await readFileAsDataUrl(file), file.type === "image/svg+xml", icon);
      return await (icon ? uploadIcon(png) : uploadMark(png)) as PageSettingsView;
    });
  };
  const remove = (icon: boolean) => run(async () => (await appApi<{ settings: PageSettingsView }>(icon ? "/api/app/page-settings/theme-assets/icon" : "/api/app/page-settings/logo", { method: "DELETE" })).settings);
  return <section className="data-card logo-card" aria-label="Logo and square icon"><p className="card-kicker">Logo and square icon</p>
    <p>Wide logos work best, at least 480 px wide. A separate square icon is optional.</p>
    <label className="form-label">Logo{settings.logoKey && <img className="page-logo-preview" src={`/api/app/page-settings/brand/logo?v=${version}`} alt="Your logo" />}<input aria-label="Logo" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" disabled={busy} onChange={event => upload(event.target.files?.[0], false)} /></label>
    {settings.logoKey && <Button type="button" variant="secondary" disabled={busy} onClick={() => remove(false)}>Remove logo</Button>}
    <label className="form-label">Square icon<img width="36" height="36" src={`/api/app/page-settings/brand/mark?v=${version}`} alt="Your small mark" /><input aria-label="Square icon" type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" disabled={busy} onChange={event => upload(event.target.files?.[0], true)} /><small>Used for your tab and small mark.</small></label>
    {settings.themeAssetAvailability.icon && <Button type="button" variant="secondary" disabled={busy} onClick={() => remove(true)}>Remove square icon</Button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
