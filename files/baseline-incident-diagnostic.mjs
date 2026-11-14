import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { declared } from '/tmp/rer-size-tool/node_modules/@runeditrun/rer/cli/size/grow.mjs';
import { prepareRun, buildInstall } from '/tmp/rer-size-tool/node_modules/@runeditrun/rer/cli/size/install.mjs';
import { runClock } from '/tmp/rer-size-tool/node_modules/@runeditrun/rer/cli/size/clock.mjs';
import { measureInstall } from '/tmp/rer-size-tool/node_modules/@runeditrun/rer/cli/size/measure.mjs';
import { statementsFile } from '/tmp/rer-size-tool/node_modules/@runeditrun/rer/cli/size/verdict.mjs';
const packet='/home/agent/rer-consolidation/work/sd-lamp-qgrowth-incidents-3/packet';
const root=process.cwd();
const {declaration,project}=await declared({cwd:root});
const run=await prepareRun(root,declaration,{project});
const target={...run,declaration:{...declaration,flows:declaration.flows.filter(flow=>['incident-list','incident-detail'].includes(flow.name)).map(flow=>({...flow,repeat:3}))}};
// Query-isolation diagnostic only: keep all original incident, component,
// history and monitor expressions/counts. Full untouched-fixture guard ran
// separately. Subscriber population is outside this incident read diagnostic;
// this result is never full-fixture size acceptance.
for(const fixture of Object.values(run.fixtures)){
 const keep=fixture.parts.map((part,i)=>!['subscribers','component_state_history'].includes(part.table)?i:null).filter(i=>i!==null);
 fixture.statements=keep.map(i=>fixture.statements[i]);
 fixture.parts=keep.map(i=>fixture.parts[i]);
 fixture.tables=fixture.tables.filter(table=>!['subscribers','component_state_history'].includes(table.table));
}
const result={diagnosticOnly:true,notFullFixtureAcceptance:true,omittedTables:['subscribers','component_state_history'],sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),harnessVersion:'0.2.115',declarationSha256:createHash('sha256').update(await readFile('size-check.json')).digest('hex'),samples:{}};
const clock=runClock(declaration.budget.timeoutSeconds);
try{
 for(const size of ['small','large']){
  const built=await buildInstall(run,size,clock,measureInstall(target));
  result.samples[size]={tables:built.tables,totalRows:built.totalRows,phases:built.phases,flows:built.measured.map(({executions,...summary})=>summary)};
  const statements=statementsFile(size,built.measured).statements;
  const selected=statements.filter(s=>s.name.startsWith('incident-')&&!/oa_|settings|dependency|session|token/i.test(s.sql));
  await writeFile(packet+'/baseline-diagnostic-'+size+'-incident-statements.json',JSON.stringify({diagnosticOnly:true,sourceSha:result.sourceSha,statements:selected},null,2)+'\n');
  await writeFile(packet+'/baseline-incident-diagnostic.json',JSON.stringify(result,null,2)+'\n');
  console.log(size,JSON.stringify(built.measured.map(x=>({name:x.name,rows_read:x.rowsRead??x.rows_read,status:x.status}))));
 }
}finally{clock.stop();}
