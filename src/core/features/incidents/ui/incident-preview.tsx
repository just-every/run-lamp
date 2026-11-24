import { useEffect, useId, useRef, useState, type Ref } from "react";

import { renderIncidentUpdate, type RenderedIncidentUpdate } from "../renderer";
import type { IncidentPublication } from "../publication-status";
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
  const emailAvailable = publicPage && !emailOff;
  return <aside id="draft-preview" hidden={hidden} className="preview-panel" aria-labelledby="preview-title">
    <div className="preview-heading">
      <h2 id="preview-title" className="eyebrow" ref={headingRef}>Preview</h2>
      {emailAvailable ? <div className="preview-switch" role="group" aria-label="Preview as">
        <button type="button" aria-pressed={view === "page"} onClick={() => setView("page")}>Page</button>
        <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")}>Email</button>
      </div> : null}
    </div>
    {error ? <FormError>{error}</FormError> : !preview ? <LoadingState>Rendering this draft…</LoadingState> : !emailAvailable || view === "page"
      ? <PreviewCard title={publicPage ? "Public page" : "Selected pages"} heading={preview.public.heading} lifecycle={preview.public.lifecycle} fields={preview.public.fields} />
      : <section className="preview-card email-preview">
        <p className="preview-type">Notification email</p>
        {preview.email.deliverySuppressed ? <p role="status">{preview.email.deliveryNotice}</p> : null}
        <dl>{preview.email.from && !preview.email.deliverySuppressed ? <div><dt>From</dt><dd>{preview.email.from}</dd></div> : null}{preview.email.replyTo ? <div><dt>Reply-To</dt><dd>{preview.email.replyTo}</dd></div> : null}</dl>
        <h3>{preview.email.subject}</h3>
        {preview.email.html ? <EmailMessage key={preview.email.html} html={preview.email.html} /> : <div className="email-preview-text">{preview.email.plainText}</div>}
        {nextUpdate ? <details><summary>Time details</summary><time dateTime={nextUpdate}>{formatTime(nextUpdate, timezone)}</time></details> : null}
        {preview.impactExplanation ? <p className="email-impact-source">{preview.impactExplanation}</p> : null}
      </section>}
  </aside>;
}

/** The draft commit and the reader-visible generation are separate steps. */
export function PublishedIncidentPreview({ incident, publication, publicOrigin, pages }: { incident: IncidentView; publication: IncidentPublication; publicOrigin: string; pages?: readonly StatusPage[] }) {
  const headingId = useId();
  const confirmation = useRef<HTMLParagraphElement>(null);
  const { receipt } = publication;
  const { reference } = incident;
  const update = incident.updates.find(update => update.id === receipt.updateId)!;
  const record = `incidents/${encodeURIComponent(reference)}`;
  const [confirmed, setConfirmed] = useState(false);
  const includesPublic = receipt.pages.some(page => page.path === PUBLIC_PAGE_PATH);
  useEffect(() => { confirmation.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const delays = [250, 500, 1_000, 2_000, 4_000];
    const check = async (index: number) => {
      const visible = await Promise.all(receipt.pages.map(async ({ path, afterGeneration, proof }) => {
        const base = path === PUBLIC_PAGE_PATH ? new URL("/", publicOrigin) : new URL(`/status-pages/${encodeURIComponent(path)}/`, location.origin);
        const url = new URL(`${record}/publication`, base);
        url.search = new URLSearchParams({ update: receipt.updateId, after: String(afterGeneration ?? "unknown"), expires: String(receipt.expiresAt), proof, wait: "1" }).toString();
        try {
          const response = await fetch(url, {
            credentials: path === PUBLIC_PAGE_PATH ? "omit" : "same-origin",
            cache: "no-store", referrerPolicy: "no-referrer",
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(16_000)]),
          });
          return response.status === 200 && (await response.json() as { state: string }).state === "confirmed";
        } catch { return false; }
      }));
      if (controller.signal.aborted) return;
      if (visible.length && visible.every(Boolean)) setConfirmed(true);
      else if (index < delays.length) retry = setTimeout(() => void check(index + 1), delays[index]);
    };
    void check(0);
    return () => { controller.abort(); clearTimeout(retry); };
  }, [publicOrigin, receipt, record]);

  const { public: preview } = renderIncidentUpdate({
    ...update,
    incidentReference: incident.reference,
    incidentTitle: incident.title,
  });
  return <div className="published-update">
    <div className="publication-confirmation">
      <p ref={confirmation} tabIndex={-1} role="status">{confirmed ? <><strong>Published.</strong>{includesPublic ? " Customers can see this now." : " Readers can see this now."}</> : publication.message}</p>
      {receipt.pages.map(({ path }) => {
        const publicPage = path === PUBLIC_PAGE_PATH;
        const page = pages?.find(page => page.path === path);
        const href = publicPage ? new URL(record, publicOrigin + "/").href
          : page ? new URL(record, page.url).href : `/status-pages/${encodeURIComponent(path)}/${record}`;
        return <a className="text-link" key={path} href={href} target="_blank" rel="noopener">{publicPage ? "View public page" : `View ${page?.pageName ?? path}`}</a>;
      })}
    </div>
    <section className="live-preview" aria-labelledby={headingId}>
      <h2 id={headingId}>{confirmed ? includesPublic ? "What customers see now" : "Published update" : "Update preview"}</h2>
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
