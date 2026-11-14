import datetime,json,subprocess,time
from pathlib import Path
packet=Path.home()/'rer-consolidation/work/sd-lamp-sizecheck-3/packet'
sha='2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1'
run=43536233833
not_before=datetime.datetime(2026,11,14,0,59,45,tzinfo=datetime.timezone.utc).timestamp()
for attempt in range(1,3):
 last_heartbeat=0
 while time.time()<not_before:
  now=time.time()
  if now-last_heartbeat>=55:
   print('CI_WAIT utc='+datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')+' next_rest_utc='+datetime.datetime.fromtimestamp(not_before,datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),flush=True)
   last_heartbeat=now
  time.sleep(min(30,max(0,not_before-time.time())))
 timestamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
 command=['python3','/tmp/fleet-gh.py','api',f'repos/just-every/run-lamp/actions/runs/{run}','--jq','{status,conclusion,head_sha,html_url}']
 result=subprocess.run(command,capture_output=True,text=True)
 if result.returncode:
  print('CI_REST_FAILED exit='+str(result.returncode)+' '+result.stderr,flush=True)
  break
 row=json.loads(result.stdout)
 assert row['head_sha']==sha,'refusing result from another SHA'
 row.update(observed_utc=timestamp,run_id=run,github_call=4+attempt)
 (packet/f'ci-poll-{attempt}.json').write_text(json.dumps(row,indent=2)+'\n')
 (packet/'CI-RECEIPT.json').write_text(json.dumps(row,indent=2)+'\n')
 print('CI_REST '+json.dumps(row),flush=True)
 if row['status']=='completed':break
 not_before=time.time()+300
print('CI_WATCH_DONE',flush=True)
