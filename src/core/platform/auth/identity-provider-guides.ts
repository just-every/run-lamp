// The guides on /auth/settings/identity for the providers Settings › Sign-in does not set up: Microsoft Entra and
// Run Edit Run Auth. Google and Okta are set up in the app. Each guide says exactly what to copy where, with the
// installation's own addresses; a provider this page cannot finish says so and what would.

export const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function copyBlock(id: string, text: string, label: string) {
  return `<div class="copy-block"><pre id="${id}"><code>${escapeHtml(text)}</code></pre><button type="button" class="copy-button" data-copy="${id}">${escapeHtml(label)}</button></div>`;
}

export interface GuideInput { origin: string; local: boolean; identityProvider?: string }

const deployCommand = 'rer deploy --environment production --env-file "$HOME/.config/lamp/production.env"';

function enableStep(provider: string, account: string) {
  return `<li>Invite each person from <a href="/app/settings">Settings → Operators</a> with ${account}. Then tick <strong>Allow provider sign-in</strong> above and save. Having a ${provider} account alone never grants access.</li>`;
}

export function microsoftGuide(input: GuideInput) {
  const redirect = `${input.origin}/auth/oidc/microsoft/callback`;
  const provider = '[{"id":"microsoft","preset":"microsoft","tenant":"DIRECTORY-ID","clientId":"APPLICATION-ID","tokenAuthMethod":"client_secret_post","clientSecret":"SECRET-VALUE","subjectEmails":{"SIGN-IN-ID":"person@example.com"}}]';
  return `<details><summary>Set up Microsoft Entra sign-in</summary>${input.local ? '<p class="notice">Microsoft needs this Lamp on its public address to call back. Follow these steps on your hosted Lamp.</p>' : ''}<ol>
      <li>In the <a href="https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" rel="noreferrer">Entra admin center</a>, choose <strong>App registrations</strong>, then <strong>New registration</strong>. Choose <strong>Single tenant</strong>. Under <strong>Redirect URI</strong> choose <strong>Web</strong> and enter this address, then register:${copyBlock('lamp-entra-callback', redirect, 'Copy the address')}</li>
      <li>On the app's <strong>Overview</strong>, copy the <strong>Application (client) ID</strong> and the <strong>Directory (tenant) ID</strong>. Under <strong>Certificates &amp; secrets</strong>, choose <strong>New client secret</strong> and copy its <strong>Value</strong> now: Entra shows it once.</li>
      <li>Microsoft gives each person a different sign-in ID for each app, and the admin center never shows it. To read it, add <code>https://jwt.ms</code> as a second <strong>Web</strong> redirect URI under <strong>Authentication</strong>, tick <strong>ID tokens</strong> there and save. Then enter your two IDs here:
        <label class="form-label">Directory (tenant) ID<input id="lamp-entra-tenant" autocomplete="off" spellcheck="false"></label>
        <label class="form-label">Application (client) ID<input id="lamp-entra-client" autocomplete="off" spellcheck="false"></label>
        <p><button type="button" class="copy-button" data-entra-link>Make the sign-in ID link</button></p>
        <p role="status" data-entra-result></p>
        Send that link to each person, or open it yourself in a private window as them. After they sign in, Microsoft's own token viewer, jwt.ms, shows the token in their browser. Copy the value of <code>sub</code>: it is that person's sign-in ID for this app.</li>
      <li>Add this line to the private settings file you deploy Lamp with, replacing each capitalised placeholder. Add one <code>"SIGN-IN-ID":"email"</code> pair for each person, with the email you invited them with. Also add <code>OIDC_TRANSACTION_SECRET</code>, then deploy again; the <a href="/docs/operators-and-sign-in#configure-lamp-and-check-sign-in">sign-in guide</a> gives that step.${copyBlock('lamp-entra-setting', `AUTH_PROVIDERS=${provider}`, 'Copy the line')}${copyBlock('lamp-entra-deploy', deployCommand, 'Copy the deploy command')}</li>
      ${enableStep('Microsoft', 'the email their Microsoft account uses')}
    </ol></details>`;
}

export function authGuide(input: GuideInput) {
  const provider = input.identityProvider;
  const callbacks = [`${input.origin}/.well-known/rer-link/callback`, `${input.origin}/auth/oidc/auth/callback`, `${input.origin}/auth/oidc/auth/logout`].join('\n');
  const first = provider
    ? `<li>This installation names <code>${escapeHtml(provider)}</code> as its Auth installation.</li>`
    : `<li>Add this line to the private settings file you deploy Lamp with, replacing the address with your Auth installation's own address, and deploy again:${copyBlock('lamp-auth-setting', 'IDENTITY_PROVIDER=https://auth.example.com', 'Copy the line')}${copyBlock('lamp-auth-deploy', deployCommand, 'Copy the deploy command')}</li>`;
  return `<details><summary>Set up Run Edit Run Auth sign-in</summary>${input.local ? '<p class="notice">Linking an Auth installation needs this Lamp on its public address. Follow these steps on your hosted Lamp.</p>' : ''}<ol>
      ${first}
      <li>Open <a href="/app/settings">Settings → Operators</a>, choose <strong>Confirm my identity</strong> and follow the email it sends, in this browser.</li>
      <li>Send the Auth owner this Lamp's address and these three exact addresses to approve for it:${copyBlock('lamp-auth-callbacks', `${input.origin}\n${callbacks}`, 'Copy the addresses')}</li>
      <li>${provider ? `Start the link. Lamp then waits ten minutes for the Auth owner to finish it in Auth:<p><button type="button" class="copy-button" data-auth-link="${escapeHtml(provider)}">Start the link</button></p>` : 'After the deploy, this step offers a button that starts the link; Lamp then waits ten minutes for the Auth owner to finish it in Auth.'}<p role="status" data-auth-result></p></li>
      <li>Check the link: <button type="button" class="copy-button" data-auth-status>Check the Auth link</button> It says <strong>Linked</strong> when Auth has finished. Lamp creates its own key; nothing else is pasted.</li>
      ${enableStep('Auth', 'the email their Auth account uses')}
    </ol></details>`;
}

// Copy buttons and the two Auth link calls need no framework: the page is Base's
// server-rendered settings document, and these are same-origin requests with its session.
export const guideScript = `document.addEventListener('click',async e=>{const b=e.target.closest('[data-copy],[data-auth-link],[data-auth-status],[data-entra-link]');if(!b)return;const out=document.querySelector('[data-auth-result]');
if(b.dataset.entraLink!==undefined){const t=document.getElementById('lamp-entra-tenant').value.trim(),c=document.getElementById('lamp-entra-client').value.trim(),o=document.querySelector('[data-entra-result]');if(!/^[A-Za-z0-9.-]{3,100}$/.test(t)||!/^[0-9a-fA-F-]{36}$/.test(c)){o.textContent='Enter the Directory (tenant) ID and the Application (client) ID exactly as Entra shows them.';return;}const u='https://login.microsoftonline.com/'+encodeURIComponent(t)+'/oauth2/v2.0/authorize?client_id='+encodeURIComponent(c)+'&response_type=id_token&response_mode=fragment&scope=openid%20email&redirect_uri='+encodeURIComponent('https://jwt.ms')+'&nonce='+crypto.randomUUID();o.textContent='';const a=document.createElement('a');a.href=u;a.rel='noreferrer';a.textContent='Open the sign-in ID link';o.append(a,' ',Object.assign(document.createElement('code'),{textContent:u}));return;}
if(b.dataset.copy){try{await navigator.clipboard.writeText(document.getElementById(b.dataset.copy).textContent);b.textContent='Copied';}catch{b.textContent='Select and copy the text';}return;}
try{if(b.dataset.authLink){const r=await fetch('/auth/dependencies/relink',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interface:'oidc-provider@1',issuer:b.dataset.authLink})});const j=await r.json().catch(()=>({}));out.textContent=j.pending?'Waiting for the Auth owner to finish the link in Auth (ten minutes).':'Lamp refused to start the link ('+(j.error||r.status)+'). Confirm your identity first, then try again.';}
else{const r=await fetch('/auth/dependencies/status');const j=await r.json().catch(()=>({}));out.textContent=j.linked?'Linked.':j.needsRelink?'The link needs approving again: start the link once more.':'Not linked yet.';}}catch{out.textContent='The request did not reach Lamp. Check your connection and try again.';}});`;
