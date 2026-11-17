import type { IncidentView } from "../service";
import { componentChangeLines } from "../renderer";
import { useOperatorTime } from "../../../app/client/ui/states";

/** What was already published, newest first. Nothing before the first update; its reach is a row of the panel below. */
export function IncidentTimeline({ incident, onCorrect, disabled }: { incident: IncidentView; onCorrect: (update: IncidentView["updates"][number]) => void; disabled?: boolean }) {
  const formatOperatorTime = useOperatorTime();
  if (!incident.updates.length) return null;
  return <section className="incident-record context-section" aria-labelledby="timeline-title"><h2 id="timeline-title">Timeline</h2>
    <ol className="timeline">{incident.updates.map((update) => {
      const correction = incident.updates.find(row => row.correctsUpdateId === update.id);
      const original = incident.updates.find(row => row.id === update.correctsUpdateId);
      return <li key={update.id} id={`update-${update.id}`} data-update-id={update.id}><strong>{update.lifecycle}</strong><span>{formatOperatorTime(update.publishedAt)}</span><p>{update.customerImpact}</p><button type="button" className="text-link" disabled={disabled} onClick={() => onCorrect(update)}>Correct</button>{original ? <p className="update-correction" data-corrects-update-id={original.id}><strong>Correction</strong> · Corrects <a className="text-link" href={`#update-${original.id}`}>{original.lifecycle} · <time dateTime={original.publishedAt}>{formatOperatorTime(original.publishedAt)}</time></a></p> : null}{correction ? <p className="update-correction" data-corrected-by-update-id={correction.id}>Corrected · <a className="text-link" href={`#update-${correction.id}`}>Read corrected update</a></p> : null}{update.automationAttribution ? <p>{update.automationAttribution}</p> : null}{update.automationReceiptId ? <p>Triggered by <a className="text-link" href={`/app/settings?receipt=${update.automationReceiptId}#tools`}>alert receipt {update.automationReceiptId}</a>.</p> : null}{componentChangeLines(update.componentChanges).map((line, index) => <p key={index}>{line}</p>)}</li>;
    })}</ol>
  </section>;
}
