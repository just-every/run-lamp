import { zoneLabel } from "../../../shared/timezone-label";
import { useRef, useState, type FormEvent } from "react";
import { appApi } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError } from "../../../app/client/ui/states";
import { toPageDateTime, usePageTimezone } from "../../../app/client/ui/timezone";
import { windowInstant } from "./window-time";

/** A cancelled window keeps its identity, history and automation choices. */
export function MaintenanceCancellation({ item, refresh }: { item: { id: string; title: string; state: string; startsAt: string; endsAt: string }; refresh: () => void }) {
  const timezone = usePageTimezone();
  const [reviewing, setReviewing] = useState(false);
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState(toPageDateTime(item.startsAt, timezone));
  const [endsAt, setEndsAt] = useState(toPageDateTime(item.endsAt, timezone));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  if (item.state !== "Scheduled" && item.state !== "Cancelled") return null;
  const restoring = item.state === "Cancelled";
  const dismiss = () => { setReviewing(false); setError(null); setReason(""); requestAnimationFrame(() => trigger.current?.focus()); };
  const confirm = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const body = restoring ? { startsAt: windowInstant(startsAt, item.startsAt, timezone), endsAt: windowInstant(endsAt, item.endsAt, timezone) } : { reason };
      await appApi(`/api/app/maintenance/${item.id}/${restoring ? "reinstate" : "cancel"}`, { method: "POST", body: JSON.stringify(body) });
      refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The maintenance could not be changed. Try again."); }
    finally { setSaving(false); }
  };
  return <div className="maintenance-cancellation">
    {reviewing ? <form className="maintenance-cancellation-form" aria-label={restoring ? "Reinstate maintenance" : "Cancel maintenance"} onSubmit={confirm}>
      <h4>{restoring ? "Reinstate" : "Cancel"} “{item.title}”?</h4>
      <p>{restoring ? "The work will return to the public page. Subscribers previously notified about it will receive a change notice with these times. Your automatic start and completion choices stay the same." : "Subscribers previously notified about this work will receive a cancellation notice. The work will leave the upcoming list and stay in public history. You can reinstate it here afterwards."}</p>
      {restoring ? <><p>Times in {zoneLabel(timezone)}. Choose a future start.</p><div className="schedule-window"><label className="form-label">Starts<input required type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} disabled={saving} /></label><label className="form-label">Ends<input required type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} disabled={saving} /></label></div></> : <label className="form-label">Reason for customers (optional)<textarea autoFocus maxLength={1000} rows={2} value={reason} onChange={event => setReason(event.target.value)} disabled={saving} /></label>}
      {error ? <FormError>{error}</FormError> : null}
      <div className="form-actions"><Button type="button" variant="secondary" disabled={saving} onClick={dismiss}>{restoring ? "Keep cancelled" : "Keep scheduled"}</Button><Button type="submit" variant={restoring ? "primary" : "secondary"} disabled={saving}>{saving ? "Saving…" : restoring ? "Confirm reinstatement" : "Confirm cancellation"}</Button></div>
    </form> : <Button ref={trigger} type="button" variant="secondary" onClick={() => setReviewing(true)}>{restoring ? "Reinstate maintenance" : "Cancel maintenance"}</Button>}
  </div>;
}
