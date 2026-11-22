import { useEffect, useState } from "react";
import { appApi } from "../../../app/client/ui/api";
import { FormError, LoadingState } from "../../../app/client/ui/states";
import { tokenizeUpdateLinks } from "../../../shared/update-links";
import { EmailMessage } from "../../incidents/ui/incident-preview";
import type { ScheduledNoticePreview } from "../service";

export function ScheduledNoticePreviewPanel({ requestBody, pageLabel, emailAvailable }: { requestBody: string | null; pageLabel: string; emailAvailable: boolean }) {
  const [view, setView] = useState<"page" | "email">("page");
  const [result, setResult] = useState<{ body: string; preview?: ScheduledNoticePreview; error?: string } | null>(null);
  useEffect(() => {
    if (!requestBody) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { preview } = await appApi<{ preview: ScheduledNoticePreview }>("/api/app/maintenance/preview", {
          method: "POST", body: requestBody, signal: controller.signal,
        });
        if (!controller.signal.aborted) setResult({ body: requestBody, preview });
      } catch (cause) {
        if (!controller.signal.aborted) setResult({ body: requestBody, error: cause instanceof Error ? cause.message : "Maintenance notice could not be previewed." });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [requestBody]);

  const current = result?.body === requestBody ? result : null;
  const preview = current?.preview;
  const email = emailAvailable && view === "email" ? preview?.email : null;
  return <aside id="maintenance-notice-preview" aria-labelledby="maintenance-notice-preview-title">
    <div className="preview-heading">
      <h2 id="maintenance-notice-preview-title" className="eyebrow">Scheduled notice preview</h2>
      {emailAvailable ? <div className="preview-switch" role="group" aria-label="Preview as">
        <button type="button" aria-pressed={view === "page"} onClick={() => setView("page")}>Page</button>
        <button type="button" aria-pressed={view === "email"} onClick={() => setView("email")}>Email</button>
      </div> : null}
    </div>
    {!requestBody ? <p>Enter the notice wording, select pages and components, and set the window to see the preview.</p>
      : current?.error ? <FormError>{current.error}</FormError>
      : !preview ? <LoadingState>Rendering this notice…</LoadingState>
      : email ? <section className="preview-card email-preview">
        <p className="preview-type">Notification email</p>
        <h3>{email.subject}</h3>
        <EmailMessage key={email.html} html={email.html} />
      </section>
      : <section className="preview-card">
        <p className="preview-type">{pageLabel}</p>
        <span className="state-pill state-scheduled">Scheduled</span>
        <h3>{preview.title}</h3>
        <p className="maintenance-window"><time dateTime={preview.window.startsAt}>{preview.window.startText}</time>{" – "}<time dateTime={preview.window.endsAt}>{preview.window.endText}</time></p>
        {preview.fields.map((field, index) => {
          const content = tokenizeUpdateLinks(field.value).map(token => token.kind === "https" ? <a key={token.start} href={token.href} rel="nofollow noopener ugc">{token.text}</a> : token.text);
          return field.label
            ? <dl key={index}><div><dt>{field.label}</dt><dd>{content}</dd></div></dl>
            : <p key={index}>{content}</p>;
        })}
      </section>}
  </aside>;
}
