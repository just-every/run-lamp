import { useEffect, useState, type FormEvent } from "react";
import { ApiError, appApi, useAppData } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError } from "../../../app/client/ui/states";

type Profile = { displayName: string; email: string };
type ConfirmationMethod = "email" | "local" | "terminal";
type Pending = { id: string; email: string; method: ConfirmationMethod; expiresAt: number };
type Saved = { operator: Profile; pending: Pending | null; confirmationUrl?: string };
const path = "/auth/owner-profile";

const errors: Record<string, string> = {
  step_up_required: "Confirm your identity before saving.",
  email_in_use: "That email belongs to another operator or pending invitation.",
  invalid_email: "Enter a valid email address.",
  invalid_input: "Enter a name and a valid email address.",
  email_not_allowed: "Choose a different sign-in email.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  authority_changed: "Your account changed while you were saving. Reload and try again.",
  mail_unavailable: "Lamp could not send the confirmation email. Check your mail settings and try again.",
  owner_link_unavailable: "With email off, only the installation Owner can use a terminal link to confirm an address change.",
};

function message(cause: unknown, fallback: string) {
  return cause instanceof ApiError ? errors[cause.message] ?? fallback : fallback;
}

export function OwnerProfileCard({ owner, onSaved }: { owner: Profile; onSaved: () => void }) {
  const details = useAppData<Saved & { method: ConfirmationMethod }>(path);
  const [saved, setSaved] = useState(owner);
  const [name, setName] = useState(owner.displayName);
  const [email, setEmail] = useState(owner.email);
  const [revokeAccess, setRevokeAccess] = useState(true);
  const [pendingWrite, setPendingWrite] = useState<{ pending: Pending | null; confirmationUrl?: string }>();
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const changedName = name.trim() !== saved.displayName;
  const changedEmail = email.trim().toLowerCase() !== saved.email;
  const pending = pendingWrite ? pendingWrite.pending : details.data?.pending;

  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("ownerEmail");
    if (result !== "confirmed" && result !== "notice_failed") return;
    setStatus(result === "confirmed" ? "Sign-in email changed."
      : "Sign-in email changed. Lamp could not notify the previous address.");
    url.searchParams.delete("ownerEmail");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  function begin() {
    setBusy(true);
    setError("");
    setStatus("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    begin();
    try {
      const result = await appApi<Saved>(path, { method: "POST", body: JSON.stringify({
        ...(changedName ? { displayName: name } : {}), ...(changedEmail ? { email, revokeAccess } : {}),
      }) });
      setPendingWrite(result);
      setSaved(result.operator);
      setName(result.operator.displayName);
      setEmail(result.operator.email);
      setConfirmation(false);
      if (!result.pending) {
        setStatus("Owner details saved.");
        onSaved();
      }
    } catch (cause) {
      const stepUp = cause instanceof ApiError && cause.message === "step_up_required";
      setConfirmation(stepUp && details.data?.method === "email");
      setError(stepUp && details.data?.method === "terminal"
        ? "Use a fresh Owner session from rer signin, then save again."
        : stepUp && details.data?.method === "local"
          ? "Reopen Lamp using its private Owner link, then save again."
          : message(cause, "Owner details could not be saved."));
    } finally { setBusy(false); }
  }

  async function confirmIdentity() {
    begin();
    try {
      await appApi("/auth/step-up", { method: "POST", body: JSON.stringify({ action: "email:change", returnTo: "/app/settings#operators" }) });
      setStatus("Open the link in your current inbox using this browser, then save again.");
    } catch (cause) {
      setError(message(cause, "Lamp could not start identity confirmation."));
    } finally { setBusy(false); }
  }

  async function cancel(id: string) {
    begin();
    try {
      const result = await appApi<{ pending: Pending | null }>(path + "/cancel", { method: "POST", body: JSON.stringify({ id }) });
      setPendingWrite(result);
      setStatus("Email change cancelled.");
      setRevokeAccess(true);
    } catch (cause) {
      setError(message(cause, "The email change could not be cancelled."));
    } finally { setBusy(false); }
  }

  return <section className="data-card page-stack" aria-labelledby="owner-profile-title">
    <div>
      <h2 id="owner-profile-title">Owner account</h2>
      <p>Your current address stays active until you confirm a new one.</p>
    </div>
    {pending ? <div className="page-stack">
      <p role="status">Change to <strong>{pending.email}</strong> is pending.</p>
      <p>{pending.method === "email" ? "Open the link sent to the new address in this same browser session."
        : pending.method === "terminal" ? <>Run <code>rer signin</code> again and open the new one-time Owner link in this same browser session.</>
          : pendingWrite?.confirmationUrl ? "Open the one-time Owner link in this browser."
            : "If you no longer have the one-time Owner link, cancel this change and save again."}</p>
      <div className="form-actions">
        {pending.method === "local" && pendingWrite?.confirmationUrl &&
          <Button asChild><a href={pendingWrite.confirmationUrl}>Open Owner confirmation link</a></Button>}
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void cancel(pending.id)}>Cancel email change</Button>
      </div>
    </div> : <form className="settings-grid" onSubmit={save}>
      <label className="form-label">Name<input required maxLength={120} autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>
      <label className="form-label">Sign-in email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      {changedEmail && <div className="full-width">
        <label className="checkbox-label">
          <input type="checkbox" checked={revokeAccess} onChange={event => setRevokeAccess(event.target.checked)} />
          Sign out every other session and revoke minted credentials and linked sign-ins
        </label>
        <p>Leave this checked for a handover. Turn it off for a rename that keeps existing access.</p>
      </div>}
      <div className="form-actions full-width">
        <Button disabled={busy || (!changedName && !changedEmail)}>Save owner details</Button>
        {confirmation && <Button type="button" variant="secondary" disabled={busy} onClick={confirmIdentity}>Confirm my identity</Button>}
      </div>
    </form>}
    {error && <FormError>{error}</FormError>}
    {status && <p className="save-message" role="status">{status}</p>}
  </section>;
}
