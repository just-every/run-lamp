import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {chromium} from '/workspace/run-lamp/node_modules/playwright/index.mjs';
import {secret} from '/workspace/run-lamp/tests/auth-adoption/runtime.mjs';
import {insertRealOperatorSession} from '/workspace/run-lamp/tests/e2e/real-session-helper.mjs';
import {reservePort,waitForWorker} from '/workspace/run-lamp/tests/e2e/worker-startup.mjs';
import {sessionCookieName} from '/workspace/run-lamp/tests/helpers/session-cookie.mjs';
import {fixtureProcessEnv,isolatedWorkerEnvArgs} from '/workspace/run-lamp/tests/helpers/worker-environment.mjs';
import {withDraftVersion} from '/workspace/run-lamp/tests/e2e/draft-version-helper.mjs';
import {incidentOwnerJourney} from '/workspace/run-lamp/tests/e2e/helpers/incident-owner-journey.mjs';
import {inspectEmailPreviewAccessibility} from '/workspace/run-lamp/tests/e2e/helpers/email-preview-accessibility.mjs';
const state=await mkdtemp(join(tmpdir(),'lamp-incident-built-proof-'));
let worker,pageWorker,browser,output='',pageOutput='';
try {
 const port=await reservePort();const appUrl=`http://127.0.0.1:${port}`; const pagePort=await reservePort(); const pageUrl=`http://localhost:${pagePort}`;
 const builtPath=resolve('dist/server/wrangler.json'),directory=dirname(builtPath),built=JSON.parse(await readFile(builtPath,'utf8'));
 const config=join(state,'wrangler.json');
 await writeFile(config,JSON.stringify({...built,main:resolve(directory,built.main),assets:{...built.assets,directory:resolve(directory,built.assets.directory)},d1_databases:built.d1_databases.map(db=>({...db,migrations_dir:resolve(directory,db.migrations_dir)})),queues:built.queues?{producers:built.queues.producers}:undefined}));
 const env=fixtureProcessEnv();
 execFileSync('pnpm',['exec','wrangler','d1','migrations','apply','DB','--local','--config',config,'--persist-to',state],{env,maxBuffer:8*1024*1024,stdio:'pipe'});
 const session=await insertRealOperatorSession({persistTo:state,configPath:config});
 worker=spawn('pnpm',['exec','wrangler','dev','--local','--config',config,...isolatedWorkerEnvArgs(state),'--persist-to',state,'--show-interactive-dev-session=false','--ip','127.0.0.1','--port',String(port),'--inspector-port','0','--local-upstream',`127.0.0.1:${port}`,'--var','LAMP_PAGE_HOST:localhost','--var','LAMP_APP_HOST:127.0.0.1','--var',`AUTH_ORIGIN:${appUrl}`,'--var','AUTH_LOCAL:true','--var',`SESSION_SECRET:${secret}`,'--var','SETUP_OPERATOR_EMAIL:operator@example.test','--var','MAIL_PROVIDER:resend','--var','RER_DEV_KEY:test-only-publishing-browser-dev-key','--var',`RER_DEV_ORIGIN:${appUrl}`,'--var','RER_DEV_IDENTITY:off','--log-level','warn'],{env,detached:true,stdio:['ignore','pipe','pipe']});
 worker.stdout.on('data',c=>output+=c);worker.stderr.on('data',c=>output+=c);
 await waitForWorker({origin:appUrl,child:worker,timeoutMs:60000,output:()=>output});
 pageWorker=spawn('pnpm',['exec','wrangler','dev','--local','--config',config,...isolatedWorkerEnvArgs(state),'--persist-to',state,'--show-interactive-dev-session=false','--ip','127.0.0.1','--port',String(pagePort),'--inspector-port','0','--local-upstream',`localhost:${pagePort}`,'--var','LAMP_PAGE_HOST:localhost','--var','LAMP_APP_HOST:127.0.0.1','--var',`AUTH_ORIGIN:${appUrl}`,'--var','AUTH_LOCAL:true','--var',`SESSION_SECRET:${secret}`,'--var','SETUP_OPERATOR_EMAIL:operator@example.test','--log-level','warn'],{env,detached:true,stdio:['ignore','pipe','pipe']});
 pageWorker.stdout.on('data',c=>pageOutput+=c);pageWorker.stderr.on('data',c=>pageOutput+=c);
 await waitForWorker({origin:pageUrl,child:pageWorker,timeoutMs:60000,output:()=>pageOutput});
 const appFetch=async(path,init={})=>{init=await withDraftVersion(path,init,appFetch);return fetch(appUrl+path,{...init,headers:{Origin:appUrl,Cookie:`${sessionCookieName(appUrl)}=${session}`,'Content-Type':'application/json',...init.headers}})};
 const api=async(path,method='GET',body)=>{const response=await appFetch(path,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});assert.ok(response.ok,`${method} ${path}: ${response.status} ${await response.clone().text()}`);return response.status===204?null:response.json()};
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-mock-keychain','--password-store=basic']});
 const browserContext=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'Australia/Brisbane'});browserContext.setDefaultTimeout(30000);
 await browserContext.addCookies([{name:sessionCookieName(appUrl),value:session,url:appUrl}]);
 const page=await browserContext.newPage();
 await incidentOwnerJourney({page,browserContext,appUrl,pageUrl,api});
 const a11y=await inspectEmailPreviewAccessibility(page);assert.deepEqual(a11y.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id),[]);
 console.log(JSON.stringify({result:'passed',surface:'built production Worker',assertionWidth:1440,proofWidths:[1440,390],journeys:['manual degradation preserved on resolve','customer email preview','published update correction','return component to Automatic'],accessibility:'no serious or critical violations',date:new Date().toISOString()}));
} finally {
 await browser?.close();
 for(const child of [worker,pageWorker]) if(child && child.exitCode===null){const closed=new Promise(r=>child.once('close',r));try{process.kill(-child.pid,'SIGTERM')}catch(e){if(e.code!=='ESRCH')throw e}await closed;}
 await rm(state,{recursive:true,force:true});
}
