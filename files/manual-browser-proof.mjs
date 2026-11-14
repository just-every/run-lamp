import { chromium } from '/workspace/run-lamp/node_modules/playwright/index.mjs';
import { nativeRequest, openNativeRuntime, origin, publicOrigin } from '/workspace/run-lamp/tests/dev-ingress/runtime.mjs';
import { devKey } from '/workspace/run-lamp/tests/helpers/dev-key.mjs';
import { signInAs } from '/workspace/run-lamp/node_modules/@runeditrun/rer/modules/operator-auth/dev/sign-in-as.mjs';
const packet='/home/agent/rer-consolidation/work/sd-lamp-tz-release-fix-2/packet';
const runtime=await openNativeRuntime();
let browser;
try {
  await runtime.start(); await runtime.seedOperator();
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'America/New_York'});
  await context.route(url=>url.pathname.startsWith('/@fs/'),route=>route.continue({headers:{...route.request().headers(),'x-rer-dev-key':devKey}}));
  const entered=await signInAs({origin,key:devKey});
  await context.addCookies(entered.cookies.map(cookie=>({...cookie,url:origin})));
  const cookie=entered.cookies.map(({name,value})=>`${name}=${value}`).join('; ');
  const {settings}=await (await nativeRequest('/api/app/page-settings',{cookie})).json();
  const keys=['theme','template','widgetAppearance','pageName','tagline','accentColor','hostname','footerCreditEnabled','widgetAllowedOrigins','mailFromAddress','emailBranding','aiToneInstructions','wordingBlockedTerms','wordingFriendlyLength'];
  const result=await nativeRequest('/api/app/page-settings',{method:'PUT',cookie,json:{...Object.fromEntries(keys.map(key=>[key,settings[key]])),timezone:'Australia/Sydney'}});
  console.log('MANUAL_PROBE Sydney settings write status='+result.status);
  if (result.status!==200) throw new Error('Fixture settings write refused: '+await result.text());
  const page=await context.newPage();
  await page.goto(origin+'/app/settings#page');
  const zone=page.locator('label').filter({hasText:/^Time zone/}).locator('select,input');
  await zone.waitFor();
  console.log('MANUAL_PROBE selected zone='+await zone.inputValue());
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    await page.screenshot({path:packet+'/settings-'+width+'.png',fullPage:true});
  }
  const publicPage=await context.newPage();
  await publicPage.goto(publicOrigin+'/');
  await publicPage.locator('[data-timezone-label]').waitFor();
  console.log('MANUAL_PROBE public timezone label='+await publicPage.locator('[data-timezone-label]').innerText());
  for (const width of [1440,390]) {
    await publicPage.setViewportSize({width,height:900});
    await publicPage.screenshot({path:packet+'/public-'+width+'.png',fullPage:true});
  }
  console.log('BROWSER_PROOF settings/public captured at 1440 and 390; setup captured in existing onboarding journey');
} finally { await browser?.close(); await runtime.close(); }
