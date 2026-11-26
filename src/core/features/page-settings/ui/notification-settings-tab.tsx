import { useAppData } from "../../../app/client/ui/api";
import { TrafficAlertSettings, type TrafficSavePhase } from "./traffic-alert-settings";
import type { LiveStatus } from "../../overview/live-status";
import type { SettingsForm } from "./settings-form";
import { Button } from "../../../app/client/ui/button";
import { SenderStatusLine } from "./sender-status";
import { MailDeliverySettings, type MailSettings } from "./mail-delivery-settings";
import { EmailBrandingSettings } from "./email-branding-settings";
import { SmsSettings, type SmsSettingsResponse } from "./sms-settings";
import { IncidentFollowSettings } from "./incident-follow-settings";
import { PrelaunchSettings } from "./prelaunch-settings";
import { MaintenanceAutomationCard } from "../../maintenance/ui/automation-default-card";

export function NotificationSettingsTab({ settings, live, identityEditable, update, needsConfirm, confirm, onTrafficPhase }: {
  settings: SettingsForm; live: LiveStatus | null; identityEditable: boolean;
  update: <K extends keyof SettingsForm>(field: K, value: SettingsForm[K], immediate?: boolean) => void;
  needsConfirm: boolean; confirm: () => void; onTrafficPhase: (phase: TrafficSavePhase) => void;
}) {
  const mail = useAppData<MailSettings>("/api/app/mail-settings");
  const sms = useAppData<SmsSettingsResponse>("/api/app/sms/settings");
  const sending = Boolean(mail.data?.primaryProvider) && !mail.data?.local;
  const ownerOnly = live?.sender.state === "owner-only";
  const localPage = live && !live.preview && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(live.publicOrigin).hostname);
  return <>
    {localPage ? <p>This copy runs only on this computer. Customers and your team can’t open this page yet. <a href="/docs/deploy">Put Lamp online</a></p> : null}
    {ownerOnly ? <SenderStatusLine sender={live?.sender ?? null} /> : null}
    {mail.data && !sending && !ownerOnly ? <p>{sms.data?.configured === false ? "This copy doesn’t send emails or texts." : "This copy doesn’t send emails."} When Lamp is online and connected to an email service, confirmed subscribers can receive your published updates by email. <a href="/docs/subscribers-and-notifications#connect-email-delivery">Put Lamp online</a></p> : null}
    {sending ? <section className="data-card" aria-labelledby="sender-title">
      <p className="card-kicker" id="sender-title">Sender</p>
      <label className="form-label">From email<input aria-label="From email" required type="email" value={settings.mailFromAddress} onChange={event => update("mailFromAddress", event.target.value)} /><small>Notification email is sent only from this configured address.</small></label>
      {needsConfirm && <div className="settings-confirm"><small>This address is not live until you confirm.</small><Button type="button" variant="secondary" className="table-action" onClick={confirm}>Confirm</Button></div>}
      <SenderStatusLine sender={live?.sender ?? null} />
    </section> : null}
    <TrafficAlertSettings onPhase={onTrafficPhase} />
    <MailDeliverySettings resource={mail} />
    <SmsSettings resource={sms} />
    <details className="data-card"><summary>Details</summary>
      <p>From address: {settings.mailFromAddress || "Not configured"}</p>
      {ownerOnly ? <p>This installation is in owner-only mail mode (<code>MAIL_RECIPIENTS=owner</code>). Set <code>MAIL_RECIPIENTS=any</code> in your private deployment inputs, then redeploy, to email subscribers.</p> : mail.data?.primaryProvider === "rer" ? <p>Managed mail uses <code>MAIL_PROVIDER</code>, <code>MAIL_FROM</code>, <code>MAIL_RELAY_URL</code> and <code>MAIL_API_KEY</code>.</p> : mail.data?.primaryProvider === "custom" ? <p>Your edition uses a custom <code>mail.sender.v1</code> adapter configured in <code>src/ext/index.server.ts</code>.</p> : <p>For hosted email, set <code>MAIL_PROVIDER</code>, <code>MAIL_FROM_ADDRESS</code>, <code>MAIL_DKIM_SELECTOR</code> and <code>MAIL_PROVIDER_API_KEY</code> in your private deployment inputs, then redeploy.</p>}
      <p>For a secondary email provider, set <code>MAIL_SECONDARY_PROVIDER</code> and <code>MAIL_SECONDARY_API_KEY</code> in the same private deployment inputs, then redeploy.</p>
      <p>For texts, set <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code>, plus <code>TWILIO_FROM_NUMBER</code> or <code>TWILIO_MESSAGING_SERVICE</code>, in your private deployment inputs, then redeploy.</p>
      <p><a href="/docs/subscribers-and-notifications#connect-email-delivery">Email and text setup guide</a></p>
    </details>
    <PrelaunchSettings />
    <IncidentFollowSettings />
    <EmailBrandingSettings value={settings.emailBranding} onChange={(value, immediate) => update("emailBranding", value, immediate)} identityEditable={identityEditable} />
    <MaintenanceAutomationCard />
  </>;
}
