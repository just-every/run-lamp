import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '/workspace/run-lamp-sd-f120/node_modules/playwright/index.mjs';
import { openSubscriberManagementFixture, eventuallySubscriber } from '/workspace/run-lamp-sd-f120/tests/e2e/helpers/subscriber-management-fixture.mjs';
const directory='/home/agent/rer-consolidation/work/sd-lamp-c-f120/packet/screens';
const fixture=await openSubscriberManagementFixture();
let browser;
try {
  await mkdir(directory,{recursive:true});
  const component=await fixture.createComponent('Synthetic Lamp consent service');
  await eventuallySubscriber(async()=>{
    const response=await fixture.raw(fixture.publicOrigin+'/');
    return {status:response.status,body:await response.text()};
  },row=>row.status===200 && row.body.includes(component.name),'the actual generated public form is ready');
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
  await context.route(fixture.publicOrigin+'/**',async route=>{
    const request=route.request();
    const response=await fixture.raw(request.url(),{method:request.method(),headers:request.headers(),body:request.postDataBuffer()??undefined});
    await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
  });
  const page=await context.newPage();
  await page.goto(fixture.publicOrigin);
  const form=page.locator('form[action="/subscribe"]');
  await form.scrollIntoViewIfNeeded();
  assert.deepEqual(await context.cookies(),[]);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:1000});
    await form.scrollIntoViewIfNeeded();
    await page.screenshot({path:`${directory}/public-consent-form-${width}.png`,fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  const email=['synthetic-lamp-consent-browser','example.test'].join('@');
  await form.locator('input[name=email]').fill(email);
  await Promise.all([page.waitForNavigation(),form.locator('button[type=submit]').click()]);
  await page.getByRole('heading',{name:'Check your inbox',exact:true}).waitFor();
  assert.equal(fixture.messagesFor(email).length,1);
  assert.deepEqual(fixture.messagesFor(email)[0].to,[email]);
  assert.equal((await fixture.list()).find(row=>row.destination===email).state,'pending');
  assert.deepEqual(await context.cookies(),[]);
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:1000});
    await page.screenshot({path:`${directory}/public-consent-result-${width}.png`,fullPage:true});
  }
  await writeFile('/home/agent/rer-consolidation/work/sd-lamp-c-f120/packet/browser-observations.json',JSON.stringify({javascriptEnabled:false,assertionWidth:1440,screenshotWidths:[1440,390],formSubmitted:true,recipientCount:1,pending:true,cookies:0},null,2)+'\n');
}finally{await browser?.close();await fixture.close();}
