import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { chromium } from '/workspace/run-lamp/node_modules/playwright/index.mjs';
import { openStatusJourney } from '/workspace/run-lamp/tests/e2e/helpers/status-journey.mjs';
import { moveInDoor } from '/workspace/run-lamp/tests/helpers/import-notifications.mjs';
import { incidentSnapshot } from '/workspace/run-lamp/tests/helpers/incident-snapshot.mjs';
const packet=process.env.HOME+'/rer-consolidation/work/sd-lamp-run1-faults-2/packet';
const runtime=await openStatusJourney();
let browser;
try {
 const api=async(path,body,headers,method=body===undefined?'GET':'POST')=>{
  const response=await runtime.request(path,{method,...body===undefined?{}:{body:JSON.stringify(body)},headers});
  return {status:response.status,body:response.status===204?null:await response.json()};
 };
 const files=readdirSync('tests/fixtures/statuspage/small').map(name=>({name,text:readFileSync('tests/fixtures/statuspage/small/'+name,'utf8')}));
 const at=['2026-01-10T09:00:00.000Z','2026-01-11T09:00:00.000Z','2026-01-11T10:00:00.000Z'];
 const longBody='We are investigating delayed processing for customer requests. '.repeat(18)+'The next complete update will be posted here after our checks finish.';
 const records=[
  {id:'visualincident',name:'Customer request processing',status:'resolved',impact:'minor',created_at:at[1],resolved_at:at[2],components:[{id:'c0000000001'}],
   incident_updates:[{id:'visualincidentupdate',status:'resolved',body:longBody,created_at:at[2],display_at:at[2],affected_components:[{code:'c0000000001',new_status:'operational'}]}]},
  {id:'visualmaintenance',name:'Planned database maintenance',status:'completed',impact:'maintenance',created_at:at[0],scheduled_for:at[1],scheduled_until:at[2],resolved_at:at[2],components:[{id:'c0000000001'}],
   incident_updates:['scheduled','in_progress','completed'].map((status,i)=>({id:'visualmaintenance'+i,status,body:['Database maintenance is scheduled. Existing requests continue to work.','Database maintenance is underway. We are checking progress.','Database maintenance is complete. All services are available.'][i],created_at:at[i],display_at:at[i]}))},
 ];
 files.find(f=>f.name==='incidents.json').text=JSON.stringify(records);
 const door=moveInDoor(api),review=await door.preview({source:'statuspage',files,pageId:'synthpage01',publicAccessAcknowledged:true});
 assert.equal(review.status,200,JSON.stringify(review.body));
 const applied=await door.apply(review.body);assert.equal(applied.status,200,JSON.stringify(applied.body));
 const incident=(await incidentSnapshot(api)).find(i=>i.title===records[0].name);
 const maintenance=(await api('/api/app/maintenance')).body.maintenance.find(m=>m.title===records[1].name);
 assert.equal(incident.updates[0].customerImpact,longBody);
 await runtime.visible('/incidents/'+incident.reference,longBody);
 await runtime.visible('/maintenance/'+maintenance.reference,records[1].incident_updates[0].body);
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox'],headless:true});
 const context=await browser.newContext();
 await context.route(runtime.publicOrigin+'/**',async route=>{
  const response=await runtime.raw(route.request().url());
  await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
 });
 const page=await context.newPage(),screens=[];
 for(const [name,path] of [['imported-incident','/incidents/'+incident.reference],['imported-maintenance','/maintenance/'+maintenance.reference]]){
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});
   await page.goto(runtime.publicOrigin+path);await page.locator('h1').waitFor();
   const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,wordingFont:Math.min(...[...document.querySelectorAll('.update dd,.update p,.update-head strong')].map(el=>parseFloat(getComputedStyle(el).fontSize)))}));
   // Tests assert one width; the phone capture is visual review evidence.
   if(width===1440){assert.ok(metrics.scrollWidth<=width);assert.ok(metrics.wordingFont>=13);}
   await page.screenshot({path:packet+'/'+name+'-'+width+'.png',fullPage:true});
   screens.push({name,path,...metrics,screenshot:name+'-'+width+'.png'});
  }
 }
 writeFileSync(packet+'/import-browser-receipt.json',JSON.stringify({publicDoor:'review and apply saved Statuspage responses',sourceCharacters:longBody.length,importedIncidentUpdates:incident.updates.length,importedMaintenanceUpdates:maintenance.importedUpdates.length,screens},null,2)+'\n');
 await context.close();
}finally{await browser?.close();await runtime.close();}
