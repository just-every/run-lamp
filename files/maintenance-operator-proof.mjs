// Run from the declared Lamp checkout after sourcing /tmp/rer-cloud-toolchain.sh.
// Uses public owner sign-in and reviewed import doors with synthetic source data.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const local=path=>import(pathToFileURL(join(root,path)).href);
const {chromium}=await local('node_modules/playwright/index.mjs');
const {openNativeRuntime,nativeRequest}=await local('tests/dev-ingress/runtime.mjs');
const {devKey}=await local('tests/helpers/dev-key.mjs');
const {signInAs}=await import(pathToFileURL(resolve(root,'node_modules/@runeditrun/rer/modules/operator-auth/dev/sign-in-as.mjs')).href);
const {moveInDoor}=await local('tests/helpers/import-notifications.mjs');
const packet=resolve(process.env.HOME,'rer-consolidation/work/sd-lamp-run1-faults-2/packet');
const runtime=await openNativeRuntime();let browser;
try {
 await runtime.start();await runtime.seedOperator();
 const entered=await signInAs({origin:runtime.origin,key:devKey});
 const send=async(path,json,headers,method=json===undefined?'GET':'POST')=>{
  const response=await nativeRequest(path,{cookie:entered.header,method,json,headers});
  return {status:response.status,body:response.status===204?null:await response.json()};
 };
 const door=moveInDoor(send);
 const times=['2026-01-10T09:00:00.000Z','2026-01-11T09:00:00.000Z','2026-01-11T10:00:00.000Z'];
 const messages=[
  {status:'scheduled',body:'Scheduled database work is planned for tomorrow.'},
  {status:'in_progress',body:'The database work is now underway.'},
  {status:'completed',body:'Database work is complete and normal service has resumed.'},
 ];
 const window={id:'operatorwindow1',name:'Source maintenance lifecycle',status:'completed',impact:'maintenance',created_at:times[0],scheduled_for:times[1],scheduled_until:times[2],resolved_at:times[2],components:[{id:'c0000000001'}],incident_updates:messages.map((message,index)=>({...message,id:'operatorupdate'+index,created_at:times[index],display_at:times[index],affected_components:[{code:'c0000000001',new_status:index===2?'operational':'under_maintenance'}]}))};
 const files=await Promise.all(['page.json','page-access-groups.json','components.json'].map(async name=>({name,text:await readFile(join(root,'tests/fixtures/statuspage/small',name),'utf8')})));
 files.push({name:'incidents.json',text:JSON.stringify([window])});
 const review=await door.preview({source:'statuspage',files,pageId:'synthpage01',publicAccessAcknowledged:true});
 assert.equal(review.status,200,JSON.stringify(review.body));
 const applied=await door.apply(review.body);
 assert.equal(applied.status,200,JSON.stringify(applied.body));assert.equal(applied.body.job.state,'completed');
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route(url=>url.pathname.startsWith('/@fs/'),route=>route.continue({headers:{...route.request().headers(),'x-rer-dev-key':devKey}}));
 await context.addCookies(entered.cookies.map(cookie=>({...cookie,url:runtime.origin})));
 const page=await context.newPage();await page.goto(runtime.origin+'/app/maintenance');
 await page.locator('.operator-shell[data-hydrated]').waitFor({timeout:60000});
 const row=page.locator('article.maintenance-row').filter({has:page.getByRole('heading',{name:window.name,exact:true})});
 await row.getByText('3 imported updates',{exact:true}).click();
 const labels=await row.locator('details section strong').allTextContents();
 assert.deepEqual([...labels].sort(),['Completed','In progress','Scheduled']);
 for(const message of messages)assert.equal(await row.getByText(message.body,{exact:true}).isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'operator maintenance fits 1440px');
 const sizes=await row.locator('details section').evaluateAll(sections=>sections.map(section=>({label:section.querySelector('strong').textContent,labelFont:getComputedStyle(section.querySelector('strong')).fontSize,bodyFont:getComputedStyle(section.querySelector('p')).fontSize})));
 assert.ok(sizes.every(size=>parseFloat(size.labelFont)>=13&&parseFloat(size.bodyFont)>=13),'imported labels and source messages are at least13px');
 await mkdir(packet,{recursive:true});await page.screenshot({path:join(packet,'maintenance-operator-1440.png'),fullPage:true});
 await page.setViewportSize({width:390,height:1000});await page.screenshot({path:join(packet,'maintenance-operator-390.png'),fullPage:true});
 const receipt={source:'synthetic Statuspage export',reviewStatus:review.status,applyStatus:applied.status,jobState:applied.body.job.state,jobId:applied.body.job.id,sourceMessages:messages,displayedLabels:labels,sizes,assertedWidth:1440,visuallyReviewedWidths:[1440,390],screenshots:['maintenance-operator-1440.png','maintenance-operator-390.png']};
 await writeFile(join(packet,'maintenance-operator-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt));
} finally {await browser?.close();await runtime.close();}
