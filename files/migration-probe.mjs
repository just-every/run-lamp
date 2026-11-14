import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openRuntime, migrate, executeSql } from '/workspace/run-lamp/tests/reference-storage/runtime.mjs';
const directory=await mkdtemp(join(tmpdir(),'lamp-incident-migration-probe-'));
const runtime=openRuntime(directory);
try{
 const db=await runtime.getD1Database('DB');
 await migrate(db,name=>name!=='0080_incident_list_paging.sql');
 await db.prepare("INSERT INTO operators(id,email,display_name,created_at,updated_at) VALUES('synthetic-lamp-operator','owner@example.test','Synthetic owner','2026-01-01','2026-01-01')").run();
 await db.prepare("INSERT INTO oa_operators(id,email,display_name,role,status,created_at) VALUES('synthetic-lamp-operator','owner@example.test','Synthetic owner','owner','active',0)").run();
 let reference=1;
 const add=async(id,lifecycle,deleted=null)=>db.prepare("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,created_by_operator_id,deleted_at,created_at,updated_at) VALUES(?,?,?,?,'2026-01-01','synthetic-lamp-operator',?,'2026-01-01','2026-01-01')").bind(id,'INC-'+reference++,id,lifecycle,deleted).run();
 await add('synthetic-lamp-one','Investigating');
 await add('synthetic-lamp-two','Resolved');
 await add('synthetic-lamp-hidden','Monitoring','2026-01-01');
 const records=(await db.prepare('SELECT * FROM incidents ORDER BY id').all()).results;
 const sql=await readFile('migrations/core/0080_incident_list_paging.sql','utf8');
 await executeSql(db,sql);
 assert.deepEqual((await db.prepare('SELECT * FROM incidents ORDER BY id').all()).results,records);
 const counts=async()=>{
  const expected=(await db.prepare("SELECT lifecycle,count(*) AS total FROM incidents WHERE deleted_at IS NULL GROUP BY lifecycle ORDER BY lifecycle").all()).results;
  const actual=(await db.prepare("SELECT lifecycle,total FROM incident_list_counts WHERE total>0 ORDER BY lifecycle").all()).results;
  assert.deepEqual(actual,expected);
 };
 await counts();
 await executeSql(db,sql);await executeSql(db,sql);await counts();
 await add('synthetic-lamp-three','Identified');await counts();
 await db.prepare("UPDATE incidents SET lifecycle='Monitoring' WHERE id='synthetic-lamp-three'").run();await counts();
 await db.prepare("UPDATE incidents SET deleted_at='2026-01-01' WHERE id='synthetic-lamp-one'").run();await counts();
 await db.prepare("UPDATE incidents SET deleted_at=NULL WHERE id='synthetic-lamp-hidden'").run();await counts();
 await db.prepare("DELETE FROM incidents WHERE id='synthetic-lamp-two'").run();await counts();
 const triggers=(await db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'incident_list_count_%'").all()).results;
 assert.equal(triggers.length,3);
 assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
 console.log('PASS: forward migration preserves retained incidents; backfill, two replays, insertion, lifecycle transition, soft deletion, restoration and physical deletion retain exact counts with three nonduplicated triggers; foreign keys valid.');
}finally{await runtime.dispose();await rm(directory,{recursive:true,force:true});}
