import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const require = createRequire(join(root, 'package.json'));
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const load = path => import(pathToFileURL(join(root, path)).href);
const { appOrigin } = await load('tests/e2e/helpers/hosts.mjs');
const { reservePort, waitForWorker } = await load('tests/e2e/worker-startup.mjs');
const { isolatedWranglerConfig } = await load('tests/helpers/wrangler-config.mjs');
const { insertRealOperatorSession } = await load('tests/e2e/real-session-helper.mjs');
const { sessionCookieName } = await load('tests/helpers/session-cookie.mjs');
const { operatorHydrated } = await load('tests/e2e/helpers/operator-hydrated.mjs');
const packet = process.env.LAMP_PROOF_PACKET;
assert.ok(packet);
const head = execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim();
const port = await reservePort({ label: 'connected-tool guidance proof' });
const origin = appOrigin(port);
const config = isolatedWranglerConfig();
const state = await mkdtemp(join(tmpdir(), 'lamp-connect-proof-d1-'));
const cache = await mkdtemp(resolve('node_modules/.lamp-connect-proof-vite-'));
let worker, browser, output = '';
const checks = [], screenshots = [], errors = [];
try {
  execFileSync('pnpm',['exec','wrangler','d1','migrations','apply','DB','--local','--config',config.path,'--persist-to',state],{stdio:'pipe',maxBuffer:8*1024*1024});
  worker = spawn('pnpm',['exec','vite','--host','127.0.0.1','--port',String(port),'--strictPort'],{
    detached:true,stdio:'pipe',env:{...process.env,LAMP_DISABLE_INSPECTOR:'true',LAMP_WORKERS_STATE_PATH:state,LAMP_VITE_CACHE_DIR:cache,LAMP_WRANGLER_CONFIG:config.path}
  });
  worker.stdout.on('data',chunk=>output+=chunk);
  worker.stderr.on('data',chunk=>output+=chunk);
  await waitForWorker({origin,timeoutMs:180_000,child:worker,output:()=>output,label:'connected-tool proof Worker'});
  const session = await insertRealOperatorSession({persistTo:state,configPath:config.path});
  browser = await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-mock-keychain','--password-store=basic']});
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.addCookies([{name:sessionCookieName(origin),value:session,url:origin}]);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error' && /hydrat|did not match|server rendered/i.test(m.text())) errors.push(m.text());});
  await mkdir(join(packet,'screenshots'),{recursive:true});
  async function capture(name, locator=page) {
    const file='screenshots/'+name+'.png';
    await locator.screenshot({path:join(packet,file)});
    screenshots.push(file);
  }
  async function inspect(label) {
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': no horizontal overflow');
    const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    assert.deepEqual(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],label+': accessibility');
    checks.push(label+': no overflow or serious/critical accessibility violation');
  }
  await page.goto(origin+'/app/settings#channels');
  await operatorHydrated(page);
  const chat=page.getByRole('region',{name:'Chat links',exact:true});
  const social=page.getByRole('region',{name:'X, Bluesky and Mastodon',exact:true});
  await chat.getByRole('button',{name:'Create link code',exact:true}).waitFor();
  assert.equal(await chat.getByRole('link',{name:'Set up Slack or Teams'}).getAttribute('href'),'/docs/chat-desk');
  assert.ok(await chat.getByRole('button',{name:'Refresh chat links',exact:true}).isVisible());
  await capture('1440-chat-links',chat);
  for (const network of ['x','bluesky','mastodon']) {
    await social.getByLabel('Social network',{exact:true}).selectOption(network);
    const link=social.locator('a[href^="/docs/social-accounts#"]');
    assert.equal(await link.getAttribute('href'),'/docs/social-accounts#'+network);
    assert.ok(await link.isVisible());
  }
  await social.getByLabel('Social network',{exact:true}).selectOption('x');
  await capture('1440-social-accounts',social);
  await inspect('1440 Settings connected-tool guides');
  checks.push('Chat setup and all three social setup choices expose the on-site guide through real Settings controls');
  await chat.getByRole('link',{name:'Set up Slack or Teams'}).click();
  await page.waitForURL(origin+'/docs/chat-desk');
  await page.getByRole('heading',{level:1}).waitFor();
  await inspect('1440 chat guide');
  await capture('1440-chat-guide');
  for(const slug of ['chat-desk','social-accounts']) {
    await page.goto(origin+'/docs/'+slug);
    await page.getByRole('heading',{level:1}).waitFor();
    const localLinks=await page.locator('.docs-prose a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')).filter(h=>h && !/^(?:https?:|mailto:|#)/.test(h)));
    for(const href of localLinks) {
      const response=await context.request.get(new URL(href,page.url()).href);
      assert.equal(response.status(),200,'guide local link '+href);
    }
    checks.push(slug+': all local guide and manifest links return HTTP 200');
  }
  await inspect('1440 social guide');
  await capture('1440-social-guide');
  await page.goto(origin+'/docs');
  for(const slug of ['chat-desk','social-accounts']) {
    const card=page.locator('.docs-index-card[href="/docs/'+slug+'"]');
    assert.ok(await card.isVisible(),slug+': reachable docs index card');
    await card.click();
    await page.waitForURL(origin+'/docs/'+slug);
    await page.getByRole('heading',{level:1}).waitFor();
    await page.goto(origin+'/docs');
  }
  await capture('1440-docs-index');
  checks.push('Docs index exposes both connected-tool guides');
  assert.deepEqual(errors,[]);
  // Only 1440 is the assertion width; phone output is the requested visual proof.
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+'/app/settings#channels'); await operatorHydrated(page);
  await capture('390-chat-links',chat);
  await capture('390-social-accounts',social);
  for(const slug of ['chat-desk','social-accounts']) {
    await page.goto(origin+'/docs/'+slug);
    await page.getByRole('heading',{level:1}).waitFor();
    await capture('390-'+slug+'-guide');
  }
  await page.goto(origin+'/docs'); await capture('390-docs-index');
  const receipt={status:'passed',head,assertionWidth:1440,proofWidths:[1440,390],checks,screenshots,pageErrors:errors,providerCalls:false,fixture:'isolated local Worker and synthetic owner session; no real profile or provider credentials'};
  await writeFile(join(packet,'BROWSER-RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt,null,2));
  await context.close();
} finally {
  await browser?.close();
  if(worker?.pid && worker.exitCode===null) {
    const exited=new Promise(resolve=>worker.once('exit',resolve));
    try{process.kill(-worker.pid,'SIGTERM');}catch{}
    await exited;
  }
  await Promise.all([rm(state,{recursive:true,force:true}),rm(cache,{recursive:true,force:true})]);
  config.cleanup();
}
