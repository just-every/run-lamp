// Actual derivation used by this task. No credentials, network, build or provider writes.
import {deploymentSpec} from '/workspace/run-lamp/scripts/delivery/base/spec.mjs';
import {parseJsonc} from '/workspace/platform/docs/runbooks/tools/ops/jsonc.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
const root='/workspace/run-lamp', packet='/home/agent/rer-consolidation/work/pr-stage-lamp-11115-pin-1/packet';
const packaging=JSON.parse(await readFile(root+'/scripts/delivery/base/packaging.json','utf8'));
const config=parseJsonc(await readFile(root+'/wrangler.jsonc','utf8'));
for(const db of config.d1_databases)db.migrations_dir='../'+db.migrations_dir;
await mkdir(root+'/.rer-derive',{recursive:true});
try{
 await writeFile(root+'/.rer-derive/wrangler.json',JSON.stringify(config));
 const spec=await deploymentSpec(root,{...packaging.artifact.specInputs,wranglerFile:'.rer-derive/wrangler.json'});
 await writeFile(packet+'/lamp-derived-deployment-spec.json',JSON.stringify(spec,null,2)+'\n');
 console.log('Derived declaration migrations',spec.migrations.length);
}finally{await rm(root+'/.rer-derive',{recursive:true,force:true});}
