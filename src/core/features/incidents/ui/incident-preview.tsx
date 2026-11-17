import { useEffect, useRef, useState, type Ref } from "react";

import type { RenderedIncidentUpdate } from "../renderer";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { PreviewCard } from "./incident-composer-tools";

/** UPDATE-004: the draft as the public page and as the notification email render it, one view at a time. */
export function IncidentPreview({ preview, error, headingRef }: { preview: RenderedIncidentUpdate | null; error: string | null; headingRef?: Ref<HTMLHeadingElement> }) {
  const [view, setView] = useState<"page" | "email">("page");
  return <aside className="preview-panel" aria-labelledby="preview-title">
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
