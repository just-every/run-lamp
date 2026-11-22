import { useEffect, useId, useMemo, useRef, useState, type Ref } from "react";

import { renderIncidentUpdate, type RenderedIncidentUpdate } from "../renderer";
import type { IncidentView } from "../service";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { usePageTimezone } from "../../../app/client/ui/timezone";
import { formatTime } from "../../public-snapshot/format";
import { PUBLIC_PAGE_PATH, type StatusPage } from "../../page-settings/ui/status-page-selection";
import { PreviewCard } from "./incident-composer-tools";

/** UPDATE-004: the draft as the public page and as the notification email render it, one view at a time. */
export function IncidentPreview({ preview, error, headingRef, hidden, publicPage = true, emailOff }: { hidden?: boolean; publicPage?: boolean; emailOff: boolean; preview: RenderedIncidentUpdate | null; error: string | null; headingRef?: Ref<HTMLHeadingElement> }) {
  const timezone = usePageTimezone();
  const nextUpdate = preview?.public.fields.find(field => field.instant)?.instant;
  const [view, setView] = useState<"page" | "email">("page");
  return <aside id="draft-preview" hidden={hidden} className="preview-panel" aria-labelledby="preview-title">
    <div className="preview-heading">
      <h2 id="preview-title" className="eyebrow" ref={headingRef}>Preview</h2>
      {publicPage ? <div className="preview-switch" role="group" aria-label="Preview as">
        <button type="button" aria-pressed={view === "page"} onClick={() => setView("page")}>Page</button>
        <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")}>{emailOff ? "Email (off)" : "Email"}</button>
      </div> : null}
    </div>
    {error ? <FormError>{error}</FormError> : !preview ? <LoadingState>Rendering this draft…</LoadingState> : !publicPage || view === "page"
      ? <PreviewCard title={publicPage ? "Public page" : "Selected pages"} heading={preview.public.heading} lifecycle={preview.public.lifecycle} fields={preview.public.fields} />
      : <section className="preview-card email-preview">
        <p className="preview-type">Notification email</p>
        {emailOff ? <p role="status">Email is turned off for this installation.</p>
          : preview.email.deliverySuppressed ? <p role="status">{preview.email.deliveryNotice}</p> : null}
        <dl>{preview.email.from && !preview.email.deliverySuppressed ? <div><dt>From</dt><dd>{preview.email.from}</dd></div> : null}{preview.email.replyTo ? <div><dt>Reply-To</dt><dd>{preview.email.replyTo}</dd></div> : null}</dl>
        <h3>{preview.email.subject}</h3>
        {preview.email.html ? <EmailMessage key={preview.email.html} html={preview.email.html} /> : <div className="email-preview-text">{preview.email.plainText}</div>}
        {nextUpdate ? <details><summary>Time details</summary><time dateTime={nextUpdate}>{formatTime(nextUpdate, timezone)}</time></details> : null}
        {preview.impactExplanation ? <p className="email-impact-source">{preview.impactExplanation}</p> : null}
      </section>}
  </aside>;
}

/** The publication is saved before the public snapshot advances. Confirm the actual customer page before calling it live. */
export function PublishedIncidentPreview({ incident, publishedUpdateId, publicOrigin, pages }: { incident: IncidentView; publishedUpdateId: string; publicOrigin: string; pages?: readonly StatusPage[] }) {
  const headingId = useId();
  const confirmation = useRef<HTMLParagraphElement>(null);
  const latest = incident.updates[0];
  const links = useMemo(() => (incident.pagePaths ?? [PUBLIC_PAGE_PATH]).map(path => {
    const record = `incidents/${encodeURIComponent(incident.reference)}`;
    if (path === PUBLIC_PAGE_PATH) return { href: new URL(record, publicOrigin + "/").href, label: "View public page", publicPage: true };
    const page = pages?.find(page => page.path === path);
    return { href: page ? new URL(record, page.url).href : `/status-pages/${encodeURIComponent(path)}/${record}`, label: `View ${page?.pageName ?? path}`, publicPage: false };
  }), [incident.pagePaths, incident.reference, pages, publicOrigin]);
  const [confirmedUpdateId, setConfirmedUpdateId] = useState<string>();
  const confirmed = confirmedUpdateId === latest.id;
  const includesPublic = links.some(link => link.publicPage);
  useEffect(() => { confirmation.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const delays = [250, 500, 1000, 2000, 4000];
    const check = async (index: number) => {
      try {
        const visible = await Promise.all(links.map(async link => {
          const response = await fetch(link.href, { credentials: link.publicPage ? "omit" : "same-origin", cache: "no-store", referrerPolicy: "no-referrer", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)]) });
          if (!response.ok) return false;
          const page = document.createElement("template");
          page.innerHTML = await response.text();
          const first = page.content.querySelector("article.update[data-update-id]");
          return first?.getAttribute("data-update-id") === latest.id && Boolean(page.content.querySelector(`article.update[data-update-id="${publishedUpdateId}"]`));
        }));
        if (visible.length && visible.every(Boolean)) {
          if (!controller.signal.aborted) setConfirmedUpdateId(latest.id);
          return;
        }
      } catch { /* The incident was saved. Keep its publication confirmation if the page cannot be read. */ }
      if (!controller.signal.aborted && index < delays.length) retry = setTimeout(() => void check(index + 1), delays[index]);
    };
    void check(0);
    return () => { controller.abort(); clearTimeout(retry); };
  }, [links, latest.id, publishedUpdateId]);

  const { public: preview } = renderIncidentUpdate({
    ...latest,
    incidentReference: incident.reference,
    incidentTitle: incident.title,
  });
  return <div className="published-update">
    <div className="publication-confirmation">
      <p ref={confirmation} tabIndex={-1} role="status"><strong>Published.</strong>{confirmed ? includesPublic ? " Customers can see this now." : " Readers can see this now." : null}</p>
      {links.map(link => <a className="text-link" key={link.href} href={link.href} target="_blank" rel="noopener">{link.label}</a>)}
    </div>
    <section className="live-preview" aria-labelledby={headingId}>
      <h2 id={headingId}>{confirmed && includesPublic ? "What customers see now" : "Published update"}</h2>
      <PreviewCard heading={preview.heading} lifecycle={preview.lifecycle} fields={preview.fields} />
    </section>
  </div>;
}

/** Keep the customer's document readable when the preview changes width. */
export function EmailMessage({ html }: { html: string }) {
  const observer = useRef<ResizeObserver | null>(null);
  useEffect(() => () => observer.current?.disconnect(), []);
  return <iframe title="Notification email message" sandbox="allow-same-origin" srcDoc={html} onLoad={event => {
    const frame = event.currentTarget;
    observer.current?.disconnect();
    const body = frame.contentDocument?.body;
    if (!body) return;
    const resize = () => { frame.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`; };
    resize();
    observer.current = new ResizeObserver(resize);
    observer.current.observe(body);
  }} />;
}
