from pathlib import Path
import sqlite3,json
root=Path('/workspace/run-lamp')
c=sqlite3.connect(':memory:')
c.execute('PRAGMA foreign_keys=ON')
for path in sorted((root/'migrations/core').glob('*.sql')):c.executescript(path.read_text())
if not c.execute("SELECT name FROM sqlite_master WHERE name='incident_update_reminder_work'").fetchone():c.executescript(Path('/tmp/tick-work.sql').read_text())
if not c.execute("SELECT name FROM sqlite_master WHERE name='subscriber_limit_counts'").fetchone():c.executescript('-- Capacity alerts'+Path('/tmp/tick-work.sql').read_text().split('-- Capacity alerts',1)[1])
at='2026-11-01T12:00:00.000Z'
c.execute("INSERT INTO operators(id,email,display_name,created_at,updated_at) VALUES('owner','synthetic-lamp-owner@example.test','Owner',?,?)",(at,at))
def incident(id,lifecycle='Investigating'):
 c.execute("INSERT INTO incidents(id,reference,title,lifecycle,opened_at,resolved_at,created_by_operator_id,created_at,updated_at,peak_impact) VALUES(?,?,?,?,?,?,'owner',?,?,'Major outage')",(id,'INC-'+str(int(id[-1])+1),'Synthetic Lamp '+id,lifecycle,at,at if lifecycle=='Resolved' else None,at,at))
def update(id,incident_id,when,due,lifecycle='Investigating',retro=0):
 c.execute("INSERT INTO incident_updates(id,incident_id,lifecycle,affected_audience,customer_impact,published_at,author_operator_id,created_at,updated_at,next_update_at,is_retroactive) VALUES(?,?,?,'Customers','Synthetic outage',?,'owner',?,?,?,?)",(id,incident_id,lifecycle,when,when,when,due,retro))
incident('incident0')
update('u1','incident0',at,'2026-11-01T13:00:00.000Z')
assert c.execute('SELECT update_id FROM incident_update_reminder_work').fetchall()==[('u1',)]
c.execute("INSERT INTO incident_update_reminders VALUES('u1','due-soon',?)",(at,))
assert c.execute('SELECT due_soon_sent FROM incident_update_reminder_work').fetchone()[0]==1
update('u0','incident0','2026-10-01T12:00:00.000Z',None,retro=1)
assert c.execute('SELECT update_id,due_soon_sent FROM incident_update_reminder_work').fetchall()==[('u1',1)]
update('u2','incident0','2026-11-01T12:30:00.000Z','2026-11-01T14:00:00.000Z')
assert c.execute('SELECT update_id,due_soon_sent FROM incident_update_reminder_work').fetchall()==[('u2',0)]
c.execute("UPDATE incidents SET lifecycle='Resolved',resolved_at=? WHERE id='incident0'",(at,))
assert c.execute('SELECT * FROM incident_update_reminder_work').fetchall()==[]
assert c.execute('SELECT * FROM incident_report_reminder_work').fetchall()==[('incident0','2026-11-08T12:00:00.000Z')]
c.execute("INSERT INTO report_reminders VALUES('incident0',0,?)",(at,))
assert c.execute('SELECT next_due_at FROM incident_report_reminder_work').fetchone()[0]=='2026-11-15T12:00:00.000Z'
c.execute("INSERT INTO report_waivers VALUES('incident0','Synthetic review','owner',?)",(at,))
assert c.execute('SELECT * FROM incident_report_reminder_work').fetchall()==[]
incident('incident1','Resolved')
c.execute("INSERT INTO statuspage_import_targets VALUES('incident','incident1','revision1')")
assert c.execute("SELECT * FROM incident_report_reminder_work WHERE incident_id='incident1'").fetchall()==[]
update('historic','incident1',at,None,lifecycle='Resolved',retro=1)
assert c.execute("SELECT * FROM incident_report_reminder_work WHERE incident_id='incident1'").fetchall()==[]
update('live','incident1','2026-11-02T12:00:00.000Z',None,lifecycle='Resolved')
assert c.execute("SELECT incident_id FROM incident_report_reminder_work WHERE incident_id='incident1'").fetchall()==[('incident1',)]
# Effective channels, eligible-state transitions, and deletion stay exact.
for n,channel,chat,sms in [(0,'email',None,0),(1,'webhook',None,0),(2,'webhook','slack',0),(3,'webhook','teams',0),(4,'webhook',None,1)]:
 c.execute("INSERT INTO subscribers(id,channel,destination,state,token_hash,created_at,updated_at,chat_kind,sms_kind) VALUES(?,?,?,'active',?,?,?,?,?)",('s'+str(n),channel,'synthetic-lamp-'+str(n)+'@example.test','synthetic-token'+str(n),at,at,chat,sms))
assert c.execute('SELECT channel,total FROM subscriber_limit_counts ORDER BY channel').fetchall()==[('email',1),('slack',1),('sms',1),('teams',1),('webhook',1)]
c.execute("UPDATE subscribers SET state='deactivated' WHERE id='s0'")
c.execute("UPDATE subscribers SET chat_kind='teams' WHERE id='s2'")
c.execute("DELETE FROM subscribers WHERE id='s4'")
assert c.execute('SELECT channel,total FROM subscriber_limit_counts ORDER BY channel').fetchall()==[('email',0),('slack',0),('sms',0),('teams',2),('webhook',1)]
plans={}
for name,sql,args in [('due_reports','SELECT incident_id FROM incident_report_reminder_work WHERE next_due_at<=?',(at,)),('due_updates','SELECT incident_id FROM incident_update_reminder_work WHERE due_soon_sent=0 AND next_update_at>=? AND next_update_at<=?',(at,at)),('ended_subscribers',"UPDATE subscribers SET state='deactivated' WHERE rowid IN(SELECT s.rowid FROM incident_subscriptions ended CROSS JOIN subscribers s WHERE ended.ended_at IS NOT NULL AND s.id=ended.subscriber_id AND s.state IN('pending','active'))",())]:
 plans[name]=[r[3] for r in c.execute('EXPLAIN QUERY PLAN '+sql,args)]
print(json.dumps({'status':'passed','assertions':'current commitment replacement, ledger preservation, resolution, weekly advancement, waiver, silent imported history, later live update, all effective subscriber channels and state/channel/delete counters','plans':plans},indent=2))
