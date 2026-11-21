import { useState, type FormEvent } from "react";

import { ApiError, appApi } from "../../../app/client/ui/api";
import { Button } from "../../../app/client/ui/button";
import { FormError } from "../../../app/client/ui/states";
import type { SignInStatusView } from "../types";
import { failureText } from "./wording";

export function RequiredSignIn({ view, onSaved }: { view: SignInStatusView; onSaved: () => void }) {
  const [choice, setChoice] = useState(view.requiredProvider ?? "");
  const [saved, setSaved] = useState(view.requiredProvider ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlisted = saved && !view.qualifiedProviders.some(provider => provider.id === saved);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await appApi<SignInStatusView>("/api/app/sign-in/policy", {
        method: "PUT", body: JSON.stringify({ providerId: choice || null }),
      });
      setSaved(result.requiredProvider ?? "");
      onSaved();
    } catch (cause) {
      setError(failureText(cause instanceof ApiError ? cause.message : "", null, null));
    } finally {
      setBusy(false);
    }
  }

  return <section className="data-card tool-step" aria-labelledby="required-sign-in-title">
    <h2 id="required-sign-in-title">Required sign-in</h2>
    <p className="tool-note" role="status">{saved ? "Single sign-on (SSO) is required." : "Email sign-in is allowed."}</p>
    {view.canEdit && <>
      <p className="tool-note">Requiring a provider turns off email sign-in links. For emergency access, the deployment owner can run <code>rer signin</code>.</p>
      {view.qualifiedProviders.length === 0 && !saved && <p className="tool-note">Complete a test sign-in with an enabled provider to make it available here.</p>}
      <form className="tool-step" onSubmit={save}>
        <label className="form-label">Sign-in method
          <select value={choice} disabled={!view.confirmed || busy} onChange={event => setChoice(event.target.value)}>
            <option value="">Allow email sign-in</option>
            {unlisted && <option value={saved}>Required provider · unavailable</option>}
            {view.qualifiedProviders.map(provider => <option key={provider.id} value={provider.id}>Require {provider.label}</option>)}
          </select>
        </label>
        <div className="form-actions"><Button type="submit" disabled={!view.confirmed || busy || choice === saved}>{busy ? "Saving…" : "Save sign-in method"}</Button></div>
        {error && <FormError>{error}</FormError>}
      </form>
    </>}
  </section>;
}
