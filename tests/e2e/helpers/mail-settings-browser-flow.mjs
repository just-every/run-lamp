import { incidentBrowserReceiptKey } from './incident-follow-browser-lifecycle.mjs';
import { incidentFollowBrowserFlow } from './incident-follow-browser-flow.mjs';
import { smsBindings, smsProviderEdge } from './sms-subscriber-flow.mjs';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { subscriberCsvRows } from './subscriber-management-fixture.mjs';
import { assertDeliveryFact } from './delivery-log-flow.mjs';
import { createRequire } from 'node:module';
import { mkdir,readdir } from 'node:fs/promises';
import { dirname,resolve,join } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { readBuiltWorkerArtifact } from '../../../scripts/build-output.mjs';
import { startMiniflare } from '../worker-startup.mjs';
import { withDraftVersion } from '../draft-version-helper.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';
import { providerSettingsGuideFlow } from './provider-settings-guide-flow.mjs';
import { migrate,executeSql } from '../../reference-storage/runtime.mjs';
import { accessibilitySubscriptionFlow } from './accessibility-subscription-flow.mjs';

const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler'));
const {Miniflare,convertV4MiniflareOptions}=wranglerRequire('miniflare');
const {unstable_getMiniflareWorkerOptions}=require('wrangler');

/** Built production Worker and assets, with fake responses only at mail's
 * external network edge. Sign-in, preferences, publish and log reads are real. */
export async function mailSettingsBrowserFlow(t){
  await readBuiltWorkerArtifact();
  let origin, pageOrigin;
  const options=unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
  const {modulesRules,...workerOptions}=options.workerOptions;
  async function moduleFiles(directory){
    const files=[];
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const path=join(directory,entry.name);
      if(entry.isDirectory())files.push(...await moduleFiles(path));
      else if(/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path))files.push({type:/\.(?:js|mjs)$/.test(path)?'ESModule':/\.(?:txt|html|sql)$/.test(path)?'Text':path.endsWith('.bin')?'Data':'CompiledWasm',path});
    }
    return files;
  }
  const modules=await moduleFiles(dirname(options.main));
  modules.sort((a,b)=>a.path===options.main?-1:b.path===options.main?1:a.path.localeCompare(b.path));
  const messages=[];
  let runtime,browser;
  const bindings={...options.workerOptions.bindings,...smsBindings,LAMP_APP_HOST:'127.0.0.1',LAMP_PAGE_HOST:'localhost',AUTH_LOCAL:'true',
    SETUP_OPERATOR_EMAIL:'synthetic-lamp-owner@example.test',SESSION_SECRET:'synthetic-lamp-ui-session-1'.repeat(3),SETUP_TOKEN:'synthetic-lamp-ui-setup-1'.repeat(3),
    RESEND_WEBHOOK_SECRET:`whsec_${incidentBrowserReceiptKey.toString('base64url')}`,SUBSCRIBER_TOKEN_SECRET:'synthetic-lamp-ui-subscriber-1'.repeat(3),WEBHOOK_SIGNING_SECRET:'synthetic-lamp-ui-webhook-1'.repeat(3),
    MAIL_FROM_ADDRESS:'lamp@example.test',MAIL_PROVIDER:'resend',MAIL_PROVIDER_API_KEY:'synthetic-lamp-ui-resend-1',MAIL_SECONDARY_PROVIDER:'mailgun',MAIL_SECONDARY_API_KEY:'synthetic-lamp-ui-mailgun-1'};
  const twilioEdge=smsProviderEdge([]);
  const outboundService=async request=>{
    const smsResponse=await twilioEdge(request);if(smsResponse)return smsResponse;
    const url=new URL(request.url);
    if(url.origin==='https://api.resend.com'&&url.pathname==='/emails'){const message=await request.json();messages.push(message);return Response.json({id:`synthetic-lamp-ui-receipt-${messages.length}`});}
    if(url.origin==='https://api.resend.com'&&url.pathname==='/domains')return Response.json({data:[{id:'synthetic-lamp-ui-domain-1',name:'example.test',status:'verified'}],has_more:false});
    if(url.origin===origin||url.origin===pageOrigin)return runtime.dispatchFetch(request);
    throw new Error(`Unexpected mail UI provider edge: ${url.origin}${url.pathname}`);
  };
  try{
    runtime = await startMiniflare({
      label: 'mail settings browser',
      create(port) {
        origin = `http://127.0.0.1:${port}`;
        pageOrigin = `http://localhost:${port}`;
        const localBindings = { ...bindings, LAMP_LOCAL_ORIGIN: origin, AUTH_ORIGIN: origin };
        return new Miniflare(convertV4MiniflareOptions({port,inspectorPort:0,workers:[{...workerOptions,modules,modulesRoot:dirname(options.main),bindings:localBindings,outboundService},...options.externalWorkers]}));
      },
    });
    const env=await runtime.getBindings();
    await migrate(env.DB);
    await executeSql(env.DB,`INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('01J00000000000000000000091','synthetic-lamp-owner@example.test','Synthetic Lamp owner','owner','active',${Date.now()});
      INSERT INTO oa_bootstrap(singleton,claim_id,claimed_at) VALUES(1,'01J00000000000000000000091',${Date.now()});
      INSERT INTO page_settings(id,page_name,tagline,accent_color,timezone,hostname,feed_id,mail_from_address,created_at,updated_at) VALUES('default','Synthetic Lamp UI','Mail delivery fixture','#16794C','UTC','localhost','synthetic-lamp-ui-feed-1','lamp@example.test','2026-10-01','2026-10-01');
      INSERT INTO setup_readiness(step,evidence_key,checked_at) VALUES('first-run','complete','2026-10-01');`);
    const login=await runtime.dispatchFetch(`${origin}/auth/magic-link`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:'synthetic-lamp-owner@example.test'})});
    assert.ok(login.status>=200&&login.status<300,await login.text());
    const invitation=messages.find(message=>message.to.includes('synthetic-lamp-owner@example.test'));
    assert.ok(invitation,'the real primary adapter sends owner sign-in');
    const token=new URL(invitation.text.match(/https?:\/\/[^\s]+/)[0]).searchParams.get('token');
    const confirmed=await runtime.dispatchFetch(`${origin}/auth/confirm`,{method:'POST',redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token})});
    assert.equal(confirmed.status,303,await confirmed.text());
    const cookie=confirmed.headers.get('set-cookie').split(';')[0];
    const raw=(path,init={})=>runtime.dispatchFetch(new URL(path,origin).href,{redirect:'manual',...init,headers:{Origin:origin,Cookie:cookie,...init.headers}});
    const api=async(path,init={})=>{init=await withDraftVersion(path,init,read=>raw(read));const response=await raw(path,{...init,headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}});const text=await response.text();return {status:response.status,body:text?JSON.parse(text):null,text};};
    const post=(path,body)=>api(path,{method:'POST',body:JSON.stringify(body)});
    browser=await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),headless:true,args:['--no-sandbox','--use-mock-keychain','--password-store=basic']});
    const context=await browser.newContext();
    await context.addCookies([{name:cookie.slice(0,cookie.indexOf('=')),value:cookie.slice(cookie.indexOf('=')+1),url:origin}]);
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await incidentFollowBrowserFlow({page,origin,pageOrigin,api,post,raw,messages,runtime,db:env.DB});
    if(process.env.LAMP_BROWSER_EVIDENCE)await mkdir(process.env.LAMP_BROWSER_EVIDENCE,{recursive:true});
    for(const width of [1440]){
      await page.setViewportSize({width,height:width===390?844:1000});
      await page.goto(`${origin}/app/settings#notifications`);await operatorHydrated(page);
      const configured = (await api('/api/app/mail-settings')).body;
      assert.equal(configured.local, false);
      assert.equal(configured.primaryProvider, bindings.MAIL_PROVIDER);
      await expect(page.getByRole('textbox', { name: 'From email', exact: true })).toBeVisible();
      const emailStatus = page.getByRole('region', { name: 'Email delivery', exact: true }).getByRole('status');
      await expect(emailStatus).toHaveAttribute('data-mail-mode', 'configured');
      await expect(emailStatus).toHaveAttribute('data-provider', configured.primaryProvider);
      await expect(page.getByRole('region', { name: 'SMS delivery', exact: true }).getByRole('status'))
        .toHaveAttribute('data-sms-configured', 'true');
      await providerSettingsGuideFlow(page); await operatorHydrated(page);
      const select=page.getByRole('combobox',{name:'Secondary provider',exact:true});await expect(select).toBeVisible();await expect(select).toHaveValue('');
      const saved=page.waitForResponse(response=>response.url()===`${origin}/api/app/mail-settings`&&response.request().method()==='PATCH');
      await select.selectOption('mailgun');assert.equal((await saved).status(),200);await expect(select).toBeEnabled();
      assert.equal((await api('/api/app/mail-settings')).body.secondaryProvider,'mailgun');
      await page.reload();await operatorHydrated(page);await expect(select).toHaveValue('mailgun');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px Settings has no overflow`);
      assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.filter(row=>['serious','critical'].includes(row.impact)),[]);
      await captureDeliveryScreen(page, 'mail-settings', [page.getByRole('textbox', { name: 'From email', exact: true })]);
      const disabled=page.waitForResponse(response=>response.url()===`${origin}/api/app/mail-settings`&&response.request().method()==='PATCH');
      await select.selectOption('');assert.equal((await disabled).status(),200);await expect(select).toBeEnabled();assert.equal((await api('/api/app/mail-settings')).body.secondaryProvider,null);
    }
    const componentResponse=await post('/api/app/components',{groupId:null,name:'Synthetic Lamp UI API',description:'',internal:false,displayOrder:1,note:''});assert.equal(componentResponse.status,201,componentResponse.text);
    const component = componentResponse.body.component;
    const address = ['synthetic-lamp-ui-1', 'example.test'].join('@');
    const subscribed=await runtime.dispatchFetch(`${pageOrigin}/subscribe`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:address,componentId:component.id})});assert.equal(subscribed.status,202,await subscribed.text());
    const invitationMail=messages.find(message=>message.to.includes(address)&&message.text.includes('/confirm-subscription/'));assert.ok(invitationMail);
    assert.equal((await runtime.dispatchFetch(invitationMail.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)[0])).status,200);
    const subscribers = await api('/api/app/subscribers');
    assert.equal(subscribers.status, 200, subscribers.text);
    const subscriber = subscribers.body.subscribers.find(record => record.destination === address && record.channel === 'email');
    assert.equal(subscriber?.state, 'active', 'the exact recipient confirmed through the public door');
    // Selecting a secondary wraps routing even while it remains off; the primary
    // still records its real acceptance and its unchanged frozen envelope.
    const incident=await post('/api/app/incidents',{title:'Synthetic Lamp provider log',components:[{componentId:component.id,state:'Partially unavailable',relationship:'Primary'}]});assert.equal(incident.status,201,incident.text);
    const draft=await api(`/api/app/incidents/${incident.body.incident.id}/draft`,{method:'PUT',body:JSON.stringify({lifecycle:'Investigating',affectedAudience:'Synthetic readers',customerImpact:'Requests are delayed.',whatStillWorks:'Reads continue.',details:'The operator is investigating.',nextUpdateAt:new Date(Date.now()+3600000).toISOString()})});assert.equal(draft.status,200,draft.text);
    const queuedAt = Date.now();
    const published=await post(`/api/app/incidents/${incident.body.incident.id}/publish`,{channels:['email']});assert.equal(published.status,200,published.text);
    const queuedBetween = [queuedAt, Date.now()];
    await expect.poll(async()=>{const log=await api(`/api/app/deliveries?incidentUpdateId=${published.body.update.id}`);assert.equal(log.status,200,log.text);return log.body.deliveries.find(row=>row.destination===address)?.acceptingProvider;}).toBe('resend');
    for(const width of [1440]){
      await page.setViewportSize({width,height:width===390?844:1000});
      await page.goto(`${origin}/app/subscribers?view=log`);await operatorHydrated(page);
      const row=page.getByRole('region',{name:'Delivery records',exact:true}).getByRole('row').filter({hasText:address});await expect(row).toBeVisible();await expect(row).toContainText('Resend accepted');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px Deliveries has no overflow`);
      assert.deepEqual((await new AxeBuilder({page}).analyze()).violations.filter(row=>['serious','critical'].includes(row.impact)),[]);
      await assertComplaintLog({ page, origin, pageOrigin, api, raw, messages, address, title: incident.body.incident.title,
        subscriberId: subscriber.id, updateId: published.body.update.id, queuedBetween, row });
      await captureDeliveryScreen(page, 'mail-deliveries');
      assert.deepEqual(errors,[],`${width}px mail Settings and Deliveries have no hydration or page errors`);
      t.diagnostic(`NOTIFY-013 ${width}px default-off owner choice persists; real Resend acceptance names its provider in Deliveries`);
    }
    const catalogue = await api('/api/app/components');
    assert.equal(catalogue.status, 200, catalogue.text);
    const other = catalogue.body.components.find(row => row.id !== component.id);
    assert.ok(other);
    await accessibilitySubscriptionFlow({
      browser, pageUrl: pageOrigin, components: [other, component], messages,
      tokenSecret: bindings.SUBSCRIBER_TOKEN_SECRET,
      tokenRows: async address => (await env.DB.prepare(`SELECT t.id,t.scope FROM subscriber_tokens t
        JOIN subscribers s ON s.id=t.subscriber_id WHERE s.destination=? AND t.revoked_at IS NULL`).bind(address).all()).results,
      diagnostic: text => t.diagnostic(text),
    });
    await context.close();
  }finally{await browser?.close();await runtime?.dispose();}
}

async function captureDeliveryScreen(page, name, mask = []) {
  const directory = process.env.LAMP_BROWSER_EVIDENCE;
  if (!directory) return;
  const viewport = page.viewportSize();
  const addresses = page.getByText(/@example\.test/i);
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.screenshot({ path: join(directory, width + '-' + name + '.png'),
        fullPage: true, animations: 'disabled', mask: [addresses, ...mask] });
    }
  } finally {
    await page.setViewportSize(viewport);
  }
}

async function assertComplaintLog({ page, origin, pageOrigin, api, raw, messages, address, title, subscriberId, updateId, queuedBetween, row }) {
  const initial = await api('/api/app/deliveries?incidentUpdateId=' + updateId);
  assert.equal(initial.status, 200, initial.text);
  assert.equal(initial.body.deliveries.length, 1);
  const [queued] = initial.body.deliveries;
  assertDeliveryFact(queued, {
    subscriberId, destination: address, channel: 'email', incidentUpdateId: updateId,
    queuedBetween, outcome: 'queued',
  });
  const message = messages.find(mail => mail.to.includes(address) && mail.subject.includes(title));
  assert.ok(message, 'the complaint refers to the actual accepted email');
  const providerId = 'synthetic-lamp-ui-receipt-' + (messages.indexOf(message) + 1);
  const id = 'synthetic-lamp-ui-log-complaint';
  const complaintAt = Date.now();
  const at = String(Math.floor(complaintAt / 1000));
  const body = JSON.stringify({ type: 'email.complained', data: { email_id: providerId } });
  const signature = createHmac('sha256', incidentBrowserReceiptKey).update([id, at, body].join('.')).digest('base64url');
  const receipt = await raw(pageOrigin + '/api/intake/mail-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'svix-id': id, 'svix-timestamp': at, 'svix-signature': 'v1,' + signature },
    body,
  });
  assert.equal(receipt.status, 200, await receipt.text());
  const outcomeBetween = [complaintAt, Date.now()];

  const stored = await api('/api/app/deliveries?incidentUpdateId=' + updateId);
  assert.equal(stored.status, 200, stored.text);
  assert.equal(stored.body.deliveries.length, 1);
  const [delivery] = stored.body.deliveries;
  assert.equal(delivery.id, queued.id);
  assert.equal(delivery.queuedAt, queued.queuedAt);
  assertDeliveryFact(delivery, {
    subscriberId, destination: address, channel: 'email', incidentUpdateId: updateId,
    queuedBetween, outcome: 'complained', outcomeBetween,
  });

  await page.getByRole('combobox', { name: 'Channel', exact: true }).selectOption('email');
  await page.getByRole('combobox', { name: 'Outcome', exact: true }).selectOption('complained');
  const table = page.getByRole('region', { name: 'Delivery records', exact: true });
  await expect(row.getByRole('cell', { name: 'Complained', exact: false })).toBeVisible();
  await expect(row.getByRole('cell', { name: 'Email', exact: true })).toBeVisible();
  await expect(row.getByRole('cell').first()).toContainText(title);
  const time = iso => {
    const value = new Date(iso);
    const date = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium' }).format(value);
    return date + ', ' + value.toISOString().slice(11, 16) + ' Universal time';
  };
  await expect(row.locator('[data-label="Queued"]')).toHaveText(time(delivery.queuedAt));
  await expect(row.locator('[data-label="Outcome time"]')).toHaveText(time(delivery.outcomeAt));
  await expect(table.locator('tbody tr')).toHaveCount(1);

  const link = page.getByRole('link', { name: 'Export CSV' });
  const url = new URL(await link.getAttribute('href'), origin);
  assert.deepEqual(Object.fromEntries(url.searchParams), { channel: 'email', outcome: 'complained' });
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 15_000 }), link.click()]);
  const chunks = [];
  try {
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  } finally {
    await download.delete();
  }
  const [csv, ...extra] = subscriberCsvRows(Buffer.concat(chunks).toString('utf8'));
  assert.ok(csv, 'the exported file contains the complained delivery');
  assert.deepEqual(extra, []);
  assert.deepEqual(
    { destination: csv.destination, channel: csv.channel, outcome: csv.outcome, incidentUpdateId: csv.incidentUpdateId,
      queuedAt: csv.queuedAt, outcomeAt: csv.outcomeAt },
    { destination: address, channel: 'email', outcome: 'complained', incidentUpdateId: updateId,
      queuedAt: delivery.queuedAt, outcomeAt: delivery.outcomeAt },
  );
}
