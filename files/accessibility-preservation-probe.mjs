import assert from 'node:assert/strict';
import {chromium} from '/workspace/run-lamp/node_modules/playwright/index.mjs';
import {inspectEmailPreviewAccessibility} from '/workspace/run-lamp/tests/e2e/helpers/email-preview-accessibility.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
 const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
 await page.setContent('<!doctype html><html lang="en"><head><title>Operator probe</title></head><body><main><h1>Operator probe</h1><iframe title="Notification email message" sandbox="allow-same-origin"></iframe></main></body></html>');
 await page.locator('iframe').evaluate(frame=>{frame.srcdoc='<!doctype html><html lang="en"><head><title>Email probe</title></head><body><main><h1>Email probe</h1><img src="https://example.test/missing.png"></main></body></html>';});
 await page.frameLocator('iframe').getByRole('heading',{name:'Email probe'}).waitFor();
 const email=await inspectEmailPreviewAccessibility(page);
 assert.ok(email.violations.some(v=>v.id==='image-alt' && v.impact==='critical'),'the actual email document must retain its missing-alternative-text assertion');
 await page.locator('iframe').evaluate(frame=>frame.removeAttribute('title'));
 const outer=await inspectEmailPreviewAccessibility(page);
 assert.ok(outer.violations.some(v=>v.id==='frame-title' && v.impact==='serious'),'the containing page must retain its accessible iframe-name assertion');
 console.log(JSON.stringify({result:'passed',checks:['critical email image-alt violation detected','serious containing iframe frame-title violation detected'],purpose:'prove both accessibility assertions remain effective',date:new Date().toISOString()}));
} finally {await browser.close();}
