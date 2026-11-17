import { useEffect, useId, useRef, useState, type Ref } from "react";

import { renderIncidentUpdate, type RenderedIncidentUpdate } from "../renderer";
import type { IncidentView } from "../service";
import { useCommittedTime } from "./update-due-notice";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { PreviewCard } from "./incident-composer-tools";

/** UPDATE-004: the draft as the public page and as the notification email render it, one view at a time. */
export function IncidentPreview({ preview, error, headingRef, hidden }: { hidden?: boolean; preview: RenderedIncidentUpdate | null; error: string | null; headingRef?: Ref<HTMLHeadingElement> }) {
  const [view, setView] = useState<"page" | "email">("page");
  return <aside id="draft-preview" hidden={hidden} className="preview-panel" aria-labelledby="preview-title">
    <div className="preview-heading">
      <h2 id="preview-title" className="eyebrow" ref={headingRef}>Preview</h2>
      <div className="preview-switch" role="group" aria-label="Preview as">
        <button type="button" aria-pressed={view === "page"} onClick={() => setView("page")}>Page</button>
        <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")}>Email</button>
      </div>
    </div>
    {error ? <FormError>{error}</FormError> : !preview ? <LoadingState>Rendering this draft…</LoadingState> : view === "page"
      ? <PreviewCard title="Public page" heading={preview.public.heading} lifecycle={preview.public.lifecycle} fields={preview.public.fields} />
      : <section className="preview-card email-preview">
        <p className="preview-type">Notification email</p>
        {preview.email.deliverySuppressed ? <p role="status">{preview.email.deliveryNotice}</p> : null}
        <dl>{preview.email.from && !preview.email.deliverySuppressed ? <div><dt>From</dt><dd>{preview.email.from}</dd></div> : null}{preview.email.replyTo ? <div><dt>Reply-To</dt><dd>{preview.email.replyTo}</dd></div> : null}</dl>
        <h3>{preview.email.subject}</h3>
        {preview.email.html ? <EmailMessage key={preview.email.html} html={preview.email.html} /> : <div className="email-preview-text">{preview.email.plainText}</div>}
        {preview.impactExplanation ? <p className="email-impact-source">{preview.impactExplanation}</p> : null}
      </section>}
  </aside>;
}

/** The publication is saved before the public snapshot advances. Confirm the actual customer page before calling it live. */
export function PublishedIncidentPreview({ incident, publishedUpdateId, publicOrigin }: { incident: IncidentView; publishedUpdateId: string; publicOrigin: string }) {
  const headingId = useId();
  const confirmation = useRef<HTMLParagraphElement>(null);
  const formatTime = useCommittedTime();
  const latest = incident.updates[0];
  const href = `${publicOrigin}/incidents/${encodeURIComponent(incident.reference)}`;
  const [confirmedUpdateId, setConfirmedUpdateId] = useState<string>();
  const confirmed = confirmedUpdateId === latest.id;
  useEffect(() => { confirmation.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const delays = [250, 500, 1000, 2000, 4000];
    const check = async (index: number) => {
      try {
        const response = await fetch(href, { credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4000)]) });
        if (response.ok) {
          const page = document.createElement("template");
          page.innerHTML = await response.text();
          const first = page.content.querySelector("article.update[data-update-id]");
          if (first?.getAttribute("data-update-id") === latest.id && page.content.querySelector(`article.update[data-update-id="${publishedUpdateId}"]`)) {
            if (!controller.signal.aborted) setConfirmedUpdateId(latest.id);
            return;
          }
        }
      } catch { /* The incident was saved. Keep its publication confirmation if the page cannot be read. */ }
      if (!controller.signal.aborted && index < delays.length) retry = setTimeout(() => void check(index + 1), delays[index]);
    };
    void check(0);
    return () => { controller.abort(); clearTimeout(retry); };
  }, [href, latest.id, publishedUpdateId]);

  const { public: preview } = renderIncidentUpdate({
    ...latest,
    incidentReference: incident.reference,
    incidentTitle: incident.title,
    nextUpdateDisplay: latest.nextUpdateAt ? formatTime(latest.nextUpdateAt) : null,
  });
  return <div className="published-update">
    <div className="publication-confirmation">
      <p ref={confirmation} tabIndex={-1} role="status"><strong>Published.</strong>{confirmed ? " Customers can see this now." : null}</p>
      <a className="text-link" href={href} target="_blank" rel="noopener">View public page</a>
    </div>
    <section className="live-preview" aria-labelledby={headingId}>
      <h2 id={headingId}>{confirmed ? "What customers see now" : "Published update"}</h2>
      <PreviewCard heading={preview.heading} lifecycle={preview.lifecycle} fields={preview.fields} />
    </section>
  </div>;
}

/** Keep the customer's document readable when the preview changes width. */
function EmailMessage({ html }: { html: string }) {
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
