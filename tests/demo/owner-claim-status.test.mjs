import assert from 'node:assert/strict';
import { generateKeyPairSync, randomUUID, randomBytes, sign } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { database, load } from '../operator-readiness/runtime.mjs';
import { openSnapshotCacheRuntime } from '../e2e/snapshot-cache-runtime.mjs';
import { deploymentConfig, renderWranglerToml, resourceNames } from '../../scripts/ops-config.mjs';

const json64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
test('ordinary host configuration carries public Business trust into a read-only native owner verification', async () => {
 const directory = await mkdtemp(join(tmpdir(), 'lamp-owner-status-'));
 const storage = await database(directory), cache = await openSnapshotCacheRuntime(directory);
 try {
  const { createApp } = await load('src/core/app/server.ts');
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const issuer = 'https://business.example.com', origin = 'https://admin.example.com', kid = 'business', installationId = randomUUID();
  const inputs = { LAMP_PAGE_HOST: 'status.example.com', LAMP_APP_HOST: 'admin.example.com',
   LAMP_PAGE_NAME: 'Acme', LAMP_PAGE_TAGLINE: 'Service status', LAMP_PAGE_TIMEZONE: 'UTC', LAMP_ACCENT_COLOR: '#123456',
   SETUP_OPERATOR_EMAIL: 'owner@example.com', OWNER_DISPLAY_NAME: 'Acme Owner', MAIL_FROM_ADDRESS: 'status@example.com', MAIL_DKIM_SELECTOR: 'mail',
   SESSION_SECRET: randomUUID()+randomUUID(), INSTALLATION_KEY: randomBytes(32).toString('hex'), SETUP_TOKEN: randomUUID()+randomUUID(),
   MAIL_PROVIDER_API_KEY: randomUUID()+randomUUID(), SUBSCRIBER_TOKEN_SECRET: randomUUID()+randomUUID(), WEBHOOK_SIGNING_SECRET: randomUUID()+randomUUID(),
   RER_OWNER_CLAIM_ISSUER: issuer, RER_OWNER_CLAIM_INSTALLATION_ID: installationId, RER_OWNER_CLAIM_APP_ORIGIN: origin,
   RER_OWNER_CLAIM_PUBLIC_KEYS: JSON.stringify({ [kid]: publicKey.export({ format: 'jwk' }) }), RER_IMPORT_DOOR: 'on' };
  const config = deploymentConfig(inputs);
  const generated = renderWranglerToml(config, { ...resourceNames('production'), databaseId: randomUUID() });
  const vars = Object.fromEntries([...generated.matchAll(/^([A-Z][A-Z0-9_]*) = (".*")$/gm)].map(([, key, value])=>[key,JSON.parse(value)]));
  assert.equal(generated.includes(inputs.SETUP_TOKEN), false);
  assert.equal(generated.includes(inputs.SESSION_SECRET), false);
  assert.throws(()=>deploymentConfig({...inputs,RER_OWNER_CLAIM_APP_ORIGIN:'https://other.example.com'}));
  assert.throws(()=>deploymentConfig({...inputs,RER_OWNER_CLAIM_PUBLIC_KEYS:JSON.stringify({[kid]:privateKey.export({format:'jwk'})})}));
  const standalone={...inputs};for(const key of Object.keys(standalone))if(key.startsWith('RER_'))delete standalone[key];
  assert.equal(deploymentConfig(standalone).importDoor,undefined);
  const env = { ...vars, SESSION_SECRET:inputs.SESSION_SECRET, SETUP_TOKEN:inputs.SETUP_TOKEN,
   DB:storage.db, SNAPSHOT_CACHE:cache.namespace, SNAPSHOTS:storage.bucket };
  let { app }=createApp(env);
  const call=(path,init={})=>app.fetch(new Request(origin+path,{...init,headers:{Host:new URL(origin).host,Origin:origin,'CF-Connecting-IP':'192.0.2.1',...init.headers}}),env);
  const grant=(patch={},key=privateKey)=>{
   const now=Math.floor(Date.now()/1000),payload={v:1,iss:issuer,aud:origin,installationId,email:inputs.SETUP_OPERATOR_EMAIL,jti:randomUUID(),iat:now,exp:now+120,action:'owner-claim-status',...patch};
   const input=`${json64({alg:'ES256',typ:'rer-import-grant+jwt',kid})}.${json64(payload)}`;
   return {jti:payload.jti,token:`${input}.${sign('sha256',Buffer.from(input),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}`};
  };
  const read=(g=grant())=>call('/api/rer/owner-claim-status',{method:'POST',headers:{Authorization:`Bearer ${g.token}`,'Content-Type':'application/json'},body:'{}'});
  assert.equal((await read()).status,409,'trust alone cannot establish a native owner');
  assert.equal((await storage.db.prepare('SELECT COUNT(*) AS n FROM ik_door_settings').first()).n,0,'read creates no settings');
  const bootstrap=await call('/auth/bootstrap',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:inputs.SETUP_TOKEN,displayName:'Acme Owner'})});
  assert.equal(bootstrap.status,303);
  const cookie=bootstrap.headers.get('set-cookie').split(';')[0];
  const g=grant(),response=await read(g),body=await response.json();
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual([body.installationId,body.appOrigin,body.email,body.challenge],[installationId,origin,inputs.SETUP_OPERATOR_EMAIL,g.jti]);
  assert.equal(body.owner.role,'owner');assert.equal(body.importDoor.enabled,true);
  assert.deepEqual(body.deployment,{sourceSha:null,fingerprint:null,versionId:null});
  assert.deepEqual(await (await read(g)).json(),body,'read grants remain repeatable');
  for(const patch of [{action:'cutover-status'},{installationId:randomUUID()},{email:'other@example.com'},{exp:0},{namespace:'statuspage'}])assert.equal((await read(grant(patch))).status,403);
  assert.equal((await read(grant({},generateKeyPairSync('ec',{namedCurve:'P-256'}).privateKey))).status,403);
  const settings=await call('/api/app/import-door/settings',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({enabled:false})});
  assert.equal(settings.status,200);
  assert.equal((await (await read()).json()).importDoor.enabled,false,'a disabled import choice is retained');
  const otherEnv={...env,SETUP_OPERATOR_EMAIL:'other@example.com'};
  assert.equal((await createApp(otherEnv).app.fetch(new Request(origin+'/api/rer/owner-claim-status',{method:'POST',headers:{Host:new URL(origin).host,Authorization:`Bearer ${grant({email:'other@example.com'}).token}`,'Content-Type':'application/json'},body:'{}'}),otherEnv)).status,409,'configuration cannot transfer ownership');
  const revoke=await call('/api/app/import-door/settings',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({enabled:false,revokedKids:[kid]})});
  assert.equal(revoke.status,200);
  assert.equal((await read()).status,403,'permanent-key revocation applies to ownership reads');
  assert.equal((await call('/api/rer/owner-claim-status')).status,405);
 } finally { await cache.dispose();await storage.runtime.dispose();await rm(directory,{recursive:true,force:true}); }
});
