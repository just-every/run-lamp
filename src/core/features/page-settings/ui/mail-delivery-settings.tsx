import { useState } from 'react';
import { appApi,useAppData } from '../../../app/client/ui/api';
import { FormError } from '../../../app/client/ui/states';

type MailSettings={local:boolean;primaryProvider:string|null;configuredSecondaryProvider:string|null;secondaryProvider:string|null};
const names:Record<string,string>={rer:'RER',resend:'Resend',sendgrid:'SendGrid',mailgun:'Mailgun',ses:'Amazon SES',postmark:'Postmark',custom:'Custom adapter'};
const label=(provider:string)=>names[provider]??provider;

export function MailDeliverySettings(){
  const settings=useAppData<MailSettings>('/api/app/mail-settings');
  const [saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null);
  const [selected,setSelected]=useState<string|null|undefined>(undefined);
  async function change(value:string){
    setSaving(true);setError(null);setSelected(value||null);
    try{const saved=await appApi<MailSettings>('/api/app/mail-settings',{method:'PATCH',body:JSON.stringify({secondaryProvider:value||null})});setSelected(saved.secondaryProvider);settings.refresh();}
    catch(cause){setSelected(undefined);setError(cause instanceof Error?cause.message:'The secondary provider could not be saved.');}
    finally{setSaving(false);}
  }
  return <section className="data-card" aria-labelledby="email-delivery-title">
    <p className="card-kicker" id="email-delivery-title">Email delivery</p>
    {settings.data?<>
      <p role="status" data-mail-mode={settings.data.local?'local':settings.data.primaryProvider?'configured':'unconfigured'} data-provider={settings.data.primaryProvider??undefined}>
        {settings.data.local?'Email is off locally. No email is sent from this computer.':settings.data.primaryProvider?<>Primary provider: {label(settings.data.primaryProvider)}</>:'Email sending is off. No provider is configured.'}
      </p>
      <div className="setup-guide">
        {settings.data.primaryProvider==='rer'?<p>Run Edit Run supplies managed mail through the private deployment inputs <code>MAIL_PROVIDER</code>, <code>MAIL_FROM</code>, <code>MAIL_RELAY_URL</code> and <code>MAIL_API_KEY</code>.</p>:settings.data.primaryProvider==='custom'?<p>This installation uses a custom <code>mail.sender.v1</code> adapter configured in <code>src/ext/index.server.ts</code>.</p>:<p>For hosted email, set <code>MAIL_PROVIDER</code>, <code>MAIL_FROM_ADDRESS</code>, <code>MAIL_DKIM_SELECTOR</code> and <code>MAIL_PROVIDER_API_KEY</code> in your deploy’s private input file or environment, then redeploy.</p>}
        <p><a href="/docs/subscribers-and-notifications#connect-email-delivery">Email provider setup</a></p>
      </div>
      <label className="form-label">Secondary provider<select value={selected===undefined?settings.data.secondaryProvider??'':selected??''} disabled={saving} onChange={event=>void change(event.target.value)}>
        <option value="">None</option>{settings.data.configuredSecondaryProvider&&<option value={settings.data.configuredSecondaryProvider}>{label(settings.data.configuredSecondaryProvider)}</option>}
      </select></label>
      {settings.data.configuredSecondaryProvider?<p>A secondary takes over after five minutes of retryable primary rejections. An unconfirmed send stays with its original provider.</p>:<div className="setup-guide"><p>To make a secondary available here, set <code>MAIL_SECONDARY_PROVIDER</code> and <code>MAIL_SECONDARY_API_KEY</code> in the same private deployment inputs, then redeploy.</p></div>}
      <div className="setup-guide"><p><a href="/docs/subscribers-and-notifications#secondary-email-provider">Secondary provider setup</a></p></div>
      {saving&&<p role="status">Saving secondary provider…</p>}
    </>:<p>Loading email providers…</p>}
    {(error||settings.error)&&<FormError>{error||settings.error}</FormError>}
  </section>;
}
