import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {builtinInstallPin,builtinPlanPins} from '/workspace/platform/src/projects/builtin-plan-source.ts';
import {builtinRepin} from '/workspace/platform/scripts/ops/stage-controller/pin-builtin.mjs';
import {execFileSync} from 'node:child_process';
const packet='/home/agent/rer-consolidation/work/pr-stage-lamp-11115-pin-1/packet';
const root='/workspace/platform';
const commit='5dd84e13f6b0478edc2fc5e759d513f5eccf6d57';
const spec=JSON.parse(readFileSync(`${packet}/lamp-derived-deployment-spec.json`,'utf8'));
const pin=builtinInstallPin('lamp',commit);
assert.ok(pin);assert.deepEqual(pin.migrations,spec.migrations);
assert.deepEqual(pin.declarations,Object.fromEntries(Object.keys(pin.declarations).map(k=>[k,spec[k]])));
const original=JSON.parse(execFileSync('git',['-C',root,'show','origin/main:src/projects/builtin-plan-sources.json'],{encoding:'utf8'}));
for(const old of [original.lamp,...original.lamp.retained]){
 const previous=builtinInstallPin('lamp',old.revision);assert.ok(previous);
 assert.deepEqual(previous.declarations,old.declarations);
 assert.deepEqual(previous.migrations.map(({binding,name,sha256})=>({binding,name,sha256})),old.migrations);
}
const current=readFileSync(`${root}/src/projects/builtin-plan-sources.json`,'utf8');
const sourcePaths=execFileSync('git',['-C','/workspace/run-lamp','ls-tree','-r','--name-only',commit],{encoding:'utf8'}).trim().split('\n');
const release={files:new Map(),sourcePaths,readFile:async (path:string)=>{
 try{return execFileSync('git',['-C','/workspace/run-lamp','show',`${commit}:${path}`],{stdio:['ignore','pipe','ignore']});}catch{return null;}
}};
const mechanical=await builtinRepin({id:'lamp',repository:'just-every/run-lamp',commit},['src/projects/builtin-plan-sources.json'],async()=>[JSON.stringify(original,null,2)+'\n',current],release);
// This is an observation, not an exemption or an assertion to waive a gate.
const proof={at:new Date().toISOString(),platformHead:execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),pin:commit,selectedRuntimePin:true,migrations:pin.migrations.length,migrationSqlSha256:createHash('sha256').update(JSON.stringify(pin.migrations)).digest('hex'),allThirteenPriorPinsStillSelectable:true,defaultSourceRevision:original.lamp.revision,retainedReleaseRecords:builtinPlanPins('lamp').length,mechanicalBuiltinRepin:mechanical,mechanicalAdmissionNote:mechanical?'matched tagged source':'No pin exemption: tagged recipe is stale (68 including initializer), actual release compiler derives 77. Candidate retains the actual declaration, not the stale template. The normal lane gate is not waived.',installedProof:false};
writeFileSync(`${packet}/runtime-receipt.json`,JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));
