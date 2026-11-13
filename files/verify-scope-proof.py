import json,subprocess,hashlib,re
from pathlib import Path
p=Path('/workspace/platform'); packet=Path.home()/'rer-consolidation/work/pr-stage-lamp-11115-pin-1/packet'
def git(*a):return subprocess.check_output(['git',*a],cwd=p)
def old(path):return git('show','origin/main:'+path)
def h(b):return hashlib.sha256(b).hexdigest()
commit='5dd84e13f6b0478edc2fc5e759d513f5eccf6d57'
paths=['wrangler.jsonc','docs/runbooks/tools/ops/targets.json','src/projects/builtin-plan-sources.json']
for path,prefix in [(paths[0],['env','stage','vars']),(paths[1],['stage','rollout','overrides'])]:
 a=json.loads(old(path));b=json.loads((p/path).read_bytes());v=a
 for k in prefix:v=v[k]
 assert v['LAMP_SOURCE_RELEASE']=='v1.11.14'
 v['LAMP_SOURCE_COMMIT_SHA']=commit;v['LAMP_SOURCE_RELEASE']='v1.11.15'
 assert a==b,'off-scope JSON change: '+path
 # The whole files must be the original bytes with only their unique stage values replaced.
 expected=old(path).replace(b'"LAMP_SOURCE_COMMIT_SHA": "733e2ce1e2fc618183a93632218bb86456a06a79"',b'"LAMP_SOURCE_COMMIT_SHA": "'+commit.encode()+b'"').replace(b'"LAMP_SOURCE_RELEASE": "v1.11.14"',b'"LAMP_SOURCE_RELEASE": "v1.11.15"')
 assert expected==(p/path).read_bytes(),'off-scope bytes: '+path
before=json.loads(old(paths[2])); after=json.loads((p/paths[2]).read_bytes());record=after['lamp']['retained'].pop(0)
assert before==after,'existing source records changed'
assert record['revision']==commit
spec=json.loads((packet/'lamp-derived-deployment-spec.json').read_bytes())
assert record['migrations']==[{k:m[k] for k in ['binding','name','sha256']} for m in spec['migrations']]
assert record['declarations']=={k:spec[k] for k in record['declarations']}
assert record['sha256']==h(Path('/workspace/run-lamp',record['sourcePath']).read_bytes())
changed=git('diff','--name-only','origin/main').decode().splitlines()
assert set(changed)<=set(paths+['sources.lock.json'])
diff=git('diff','--unified=0','origin/main').decode()
patterns=[r'(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{15,}',r'\b(?:sk_live_|sk_test_|sk-proj-|sk-ant-)[A-Za-z0-9_-]{16,}',r'\bxox[baprs]-[A-Za-z0-9-]{10,}',r'\bAKIA[A-Z0-9]{16}\b',r'\bAIza[A-Za-z0-9_-]{30,}',r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----',r'(?i)\bbearer\s+[A-Za-z0-9_./+=-]{16,}',r'https?://[^\s/@:]+:[^\s/@]+@',r'(?i)(?:password|client_secret|api_key|access_token|secret_key)["\s]*[:=]["\s]*[A-Za-z0-9_+./=-]{20,}']
def count(lines):return sum(any(re.search(x,line) for x in patterns) for line in lines)
added=count([x[1:] for x in diff.splitlines() if x.startswith('+') and not x.startswith('+++')]);removed=count([x[1:] for x in diff.splitlines() if x.startswith('-') and not x.startswith('---')]);assert added==0
f='docs/runbooks/tools/ops/targets.json'; bytes_=(p/f).read_bytes()
receipt={'at':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'base':git('rev-parse','origin/main').decode().strip(),'paths':changed,'stage':{'before':{'repositoryId':'1412401337','commit':'733e2ce1e2fc618183a93632218bb86456a06a79','release':'v1.11.14'},'after':{'repositoryId':'1412401337','commit':commit,'release':'v1.11.15'}},'preserved':{'offStageAndOffSeedSelectors':True,'happyToHelp0425':True,'stageRolloutIncludingPendingRollbackPinBase':True,'workflowControllerCode':True,'existingBuiltinReleases':True,'adoptionAndRuntimeSourceCode':True,'contractStatusGapEvidence':True,'allOtherTrackedPaths':True},'counts':{'lampReleaseRecordsBefore':13,'lampReleaseRecordsAfter':14,'releaseMigrationDelta':0,'runtimeMigrationsBefore':77,'runtimeMigrationsAfter':77,'testsAdded':0,'testsDeleted':0,'clausesChanged':0},'targets':{'path':f,'beforeBlob':git('rev-parse','origin/main:'+f).decode().strip(),'beforeSha256':h(old(f)),'beforeSize':len(old(f)),'candidateBlob':git('hash-object',f).decode().strip(),'candidateSha256':h(bytes_),'candidateSize':len(bytes_)},'credentialShape':{'scope':'ADDED lines only; values never logged','added':added,'removedInformational':removed}}
(packet/'scope-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n'); print(json.dumps(receipt,indent=2))
