import { useState, type FormEvent } from "react";
import { ApiError, appApi } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError } from "../../../app/client/ui/states";

type Profile = { displayName: string; email: string };
type Saved = { operator: Profile; notice: "sent" | "none" | "failed" };
const path = "/auth/owner-profile";

const errors: Record<string, string> = {
  step_up_required: "Confirm your identity before saving.",
  email_in_use: "That email belongs to another operator or pending invitation.",
  invalid_email: "Enter a valid email address.",
  invalid_input: "Enter a name and a valid email address.",
  email_not_allowed: "Choose a different sign-in email.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
  authority_changed: "Your account changed while you were saving. Reload and try again.",
  mail_unavailable: "Email confirmation is unavailable. On a hosted installation, use a fresh session from rer signin.",
};

function message(cause: unknown, fallback: string) {
  return cause instanceof ApiError ? errors[cause.message] ?? fallback : fallback;
}

export function OwnerProfileCard({ owner, onSaved }: { owner: Profile; onSaved: () => void }) {
  const [saved, setSaved] = useState(owner);
  const [name, setName] = useState(owner.displayName);
  const [email, setEmail] = useState(owner.email);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const changedName = name.trim() !== saved.displayName;
  const changedEmail = email.trim().toLowerCase() !== saved.email;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const result = await appApi<Saved>(path, { method: "POST", body: JSON.stringify({
        ...(changedName ? { displayName: name } : {}), ...(changedEmail ? { email } : {}),
      }) });
      setSaved(result.operator);
      setName(result.operator.displayName);
      setEmail(result.operator.email);
      setConfirmation(false);
      setStatus(result.notice === "sent" ? "Owner details saved. Lamp sent a notice to the new address."
        : result.notice === "failed" ? "Owner details saved. Lamp could not send the email notice." : "Owner details saved.");
      onSaved();
    } catch (cause) {
      setConfirmation(cause instanceof ApiError && cause.message === "step_up_required");
      setError(message(cause, "Owner details could not be saved."));
    } finally { setBusy(false); }
  }

  async function confirm() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await appApi("/auth/step-up", { method: "POST", body: JSON.stringify({ action: "email:change", returnTo: "/app/settings#operators" }) });
      setStatus("Open the confirmation link in your current inbox using this browser, then save again.");
    } catch (cause) {
      setError(message(cause, "Lamp could not start identity confirmation."));
    } finally { setBusy(false); }
  }

  return <section className="data-card page-stack" aria-labelledby="owner-profile-title">
    <div>
      <h2 id="owner-profile-title">Owner account</h2>
      <p>Use this email the next time you sign in. Changing it keeps your existing sessions and passkeys.</p>
    </div>
    <form className="settings-grid" onSubmit={save}>
      <label className="form-label">Name<input required maxLength={120} autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>
      <label className="form-label">Sign-in email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <div className="form-actions full-width">
        <Button disabled={busy || (!changedName && !changedEmail)}>Save owner details</Button>
        {confirmation && <Button type="button" variant="secondary" disabled={busy} onClick={confirm}>Confirm my identity</Button>}
      </div>
    </form>
    {error && <FormError>{error}</FormError>}
    {status && <p className="save-message" role="status">{status}</p>}
  </section>;
}
