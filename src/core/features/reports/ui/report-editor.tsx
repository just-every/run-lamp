import { ReportWaiver } from "./report-waiver";
import { useEffect, useState } from "react";
import { appApi, useAppData } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { REPORT_PROMPTS, reportReview, type ReportReview } from "../draft";

type Report = { summary: string; timeline: string; cause: string; remediation: string; publishedAt: string | null };
type ReportResource = { report: Report | null; review: ReportReview | null; waiver: { reason: string } | null; owed: boolean };
type ReportPublicationState = "pending" | "confirmed" | "private";
const emptyReport: Report = { summary: "", timeline: "", cause: "", remediation: "", publishedAt: null };

/** The incident's post-incident report as the server holds it; the panel row and the editor share one read. */
export function useIncidentReport(incidentId: string) {
  const endpoint = `/api/app/incidents/${incidentId}/report`;
  const resource = useAppData<ReportResource>(endpoint);
  const publicationPath = resource.data?.report?.publishedAt ? `${endpoint}/publication` : null;
  const [observation, setObservation] = useState<{ path: string; state: ReportPublicationState } | null>(null);
  const publication = observation?.path === publicationPath ? observation.state : "pending";
  useEffect(() => {
    if (!publicationPath) return;
    const path = publicationPath;
    const controller = new AbortController();
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    async function check() {
      const status = await appApi<{ state: ReportPublicationState }>(path, { signal: controller.signal }).catch(() => null);
      if (controller.signal.aborted) return;
      if (status && status.state !== "pending") setObservation({ path, state: status.state });
      else timer = setTimeout(check, Date.now() - started < 60_000 ? 2_000 : 15_000);
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [publicationPath]);
  return { endpoint, ...resource, publication };
}

/** The report row's one line: what the server holds, and what is still owed. */
export function reportSummary({ data, error, publication }: ReturnType<typeof useIncidentReport>, time: (iso: string | null) => string) {
  if (!data) return error ? "Could not be read" : "Reading the report…";
  if (data.report?.publishedAt) return publication === "pending" ? "Publishing…" : `Published ${time(data.report.publishedAt)}`;
  if (data.waiver) return data.report ? "Draft saved · reminder waived" : "Reminder waived";
  if (data.report) return data.owed ? "Draft saved · report owed" : "Draft saved · optional report";
  return data.owed ? "Owed: draft it or waive the reminder" : "Optional report";
}

export function ReportEditor({ incidentId, resource }: { incidentId: string; resource: ReturnType<typeof useIncidentReport> }) {
  const { endpoint, data, refresh, loading, error, publication } = resource;
  const [report, setReport] = useState<Report>(emptyReport);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (data && !dirty) setReport(data.report ?? emptyReport); }, [data]);
  if (report.publishedAt) return <div className="report-editor"><p role="status" data-publication-state={publication}>
    {publication === "pending" ? "Publishing… Waiting for the incident page to update." : publication === "confirmed" ? "Readers can see this now." : "Published for operators."}
  </p></div>;
  const review = reportReview(report);
  const busy = pending || loading || !data;
  const { summary, timeline, cause, remediation } = report;
  const fields = { summary, timeline, cause, remediation };
  const canPublish = Boolean(summary.trim() && timeline.trim()) && !review.cause.required && !review.remediation.required;
  const update = (field: keyof Omit<Report, "publishedAt">, value: string) => { setDirty(true); setReport((current) => ({ ...current, [field]: value })); };
  const draft = async () => {
    setPending(true);
    try {
      const response = await appApi<{ report: Report }>(`${endpoint}/draft`, { method: "POST" });
      setReport(response.report); setDirty(false); refresh();
      setMessage("Report drafted from the record and saved privately. Review the cited timeline, then write the cause and remediation.");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Report could not be drafted."); }
    finally { setPending(false); }
  };
  const saveDraft = async () => {
    await appApi(endpoint, { method: "PUT", body: JSON.stringify(fields) });
    setDirty(false);
  };
  const save = async () => {
    setPending(true);
    try { await saveDraft(); setMessage("Report saved."); refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Report could not be saved."); }
    finally { setPending(false); }
  };
  const publish = async () => {
    setPending(true);
    try {
      if (dirty || !data?.report) await saveDraft();
      const response = await appApi<{ report: Report }>(`${endpoint}/publish`, {
        method: "POST", body: JSON.stringify({ channels: ["email"], expectedReport: fields }),
      });
      setReport(response.report);
    }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Report could not be published."); }
    finally { refresh(); setPending(false); }
  };
  return <div className="report-editor">
    <p className="report-prompt">{data?.owed ? "A report is owed. Publish it or waive the reminder." : "You can publish an optional report for this incident."}</p>
    <Button type="button" variant="secondary" disabled={busy || Boolean(data?.report) || dirty} onClick={draft}>Draft report</Button>
    <p>{data?.report || dirty ? "Keep editing your report. Drafting never replaces existing work." : "Draft a private report from the incident's alerts and published updates."}</p>
    {data?.review?.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
    {(["summary", "timeline", "cause", "remediation"] as const).map((field) => {
      const humanField = field === "cause" || field === "remediation";
      const flagged = humanField ? review[field].required : false;
      const prompt = humanField ? REPORT_PROMPTS[field] : undefined;
      const hintId = `report-${incidentId}-${field}-review`;
      return <div key={field}><label className="form-label">{field[0].toUpperCase() + field.slice(1)}
        <textarea aria-label={field[0].toUpperCase() + field.slice(1)} value={report[field]} maxLength={10_000} disabled={busy} placeholder={prompt} aria-describedby={flagged ? hintId : undefined} onChange={(event) => update(field, event.target.value)} />
      </label>{flagged ? <p id={hintId}><strong>Human input required.</strong> {prompt} Check the timeline sources.</p> : null}</div>;
    })}
    {message || error ? <p role="status">{message ?? error}</p> : null}
    <div className="form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={save}>Save report</Button><Button type="button" disabled={busy || !canPublish} onClick={publish}>Publish report</Button></div>
    {data?.owed || data?.waiver ? <ReportWaiver incidentId={incidentId} waiver={data.waiver} onChanged={refresh} /> : null}
  </div>;
}
