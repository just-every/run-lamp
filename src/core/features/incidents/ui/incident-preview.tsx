import { useLayoutEffect, useRef, useState, type Ref } from "react";

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

/** Keep customer content in an opaque origin; only its own size crosses back. */
const EMAIL_SIZE_SCRIPT = `<script>
  const report = () => parent.postMessage({ type: "lamp-email-size", height: Math.ceil(document.body.getBoundingClientRect().height) }, "*");
  new ResizeObserver(report).observe(document.body);
  report();
</script>`;

/** Keep the customer's document readable when the preview changes width. */
function EmailMessage({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useLayoutEffect(() => {
    const resize = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow || event.data?.type !== "lamp-email-size") return;
      const height = event.data.height;
      if (typeof height === "number" && Number.isFinite(height) && height > 0 && height <= 100_000) frame.current.style.height = `${height}px`;
    };
    window.addEventListener("message", resize);
    return () => window.removeEventListener("message", resize);
  }, []);
  return <iframe ref={frame} title="Notification email message" sandbox="allow-scripts" srcDoc={html.replace("</body>", `${EMAIL_SIZE_SCRIPT}</body>`)} />;
}
