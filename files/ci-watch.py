import datetime,json,subprocess,time
from pathlib import Path
packet=Path.home()/'rer-consolidation/work/sd-lamp-qgrowth-incidents-3/packet'
head='c65066509dc724bdd5e09c45f17f18d1758bc796'
budget=packet.parent/'gh-calls.txt'
def call(*args):
 if len(budget.read_text().splitlines())>=9: raise RuntimeError('reserved final GitHub call for PR; CI budget exhausted')
 result=subprocess.run(['python3','/tmp/fleet-gh.py',*args],text=True,capture_output=True)
 if result.returncode: raise RuntimeError('GitHub REST failed: '+result.stderr)
 return json.loads(result.stdout)
query=f'repos/just-every/run-lamp/actions/runs?head_sha={head}&per_page=100'
discovered=call('api',query,'--jq','{total_count,workflow_runs:[.workflow_runs[]|{id,name,event,status,conclusion,head_sha,html_url}]}')
(packet/'ci-discovery.json').write_text(json.dumps(discovered,indent=2)+'\n')
last=time.time()
candidates=[r for r in discovered['workflow_runs'] if r['name']=='Verify' and r['event']=='push' and r['head_sha']==head]
if not candidates: raise RuntimeError('No exact-SHA push Verify discovered; no automatic workflow dispatch or rerun')
run=max(candidates,key=lambda r:r['id'])
print('CI_DISCOVERED '+json.dumps(run),flush=True)
index=0
while run['status']!='completed':
 remaining=300-(time.time()-last)
 while remaining>0:
  time.sleep(min(30,remaining)); remaining=300-(time.time()-last)
  print('CI_WAIT next_rest_check_seconds='+str(max(0,round(remaining))),flush=True)
 run=call('api',f"repos/just-every/run-lamp/actions/runs/{run['id']}",'--jq','{id,status,conclusion,head_sha,html_url}')
 last=time.time(); index+=1
 (packet/f'ci-status-{index}.json').write_text(json.dumps(run,indent=2)+'\n')
 print('CI_STATUS '+json.dumps(run),flush=True)
 assert run['head_sha']==head
(packet/'ci-final.json').write_text(json.dumps(run,indent=2)+'\n')
print('CI_FINAL '+json.dumps(run),flush=True)
raise SystemExit(0 if run['conclusion']=='success' else 1)
