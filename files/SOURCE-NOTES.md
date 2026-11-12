# Read-only source evidence on the candidate

## tests/e2e/helpers/traffic-alerts-flow.mjs:56

```
56:     const componentResult = await post('/api/app/components', { groupId: null, name: 'Synthetic Lamp traffic API', description: '', internal: false, displayOrder: 0, note: '' });
57:     assert.equal(componentResult.status, 201, componentResult.text);
58:     const component = componentResult.body.component;
59:     const target = Math.floor(Date.now() / HOUR) * HOUR + 30 * MINUTE;
60:     const readAt = async (at, count, path = '/', surface = 'page') => {
61:       await fixture.clock(at);
62:       const before = await minuteCount(surface, at);
63:       await Promise.all(Array.from({ length: count }, async (_, request) => {
64:         const response = await runtime.dispatchFetch(`${publicOrigin}${path}?visitor=synthetic-private-query-${request}`, { headers: {
65:           'User-Agent': `synthetic-private-agent-${request}`, Cookie: `private_visitor=synthetic-private-cookie-${request}`,
66:           'CF-Connecting-IP': `192.0.2.${request + 1}`, 'X-Forwarded-For': `198.51.100.${request + 1}`,
67:         } });
68:         assert.equal(response.status, 200, await response.text());
69:       }));
70:       await eventually(() => minuteCount(surface, at), value => value === before + count, 'each controlled public request increments its minute once');
71:     };
72:     // Two controlled observed minutes produce 120 reads/hour; the other minutes
73:     // have zero requests. Uneven minute counts distinguish the same-hour mean
74:     // from a same-minute lookup. No fabricated counter row establishes baseline.
75:     for (let day = 7; day >= 1; day--) {
76:       const start = Math.floor((target - day * DAY) / HOUR) * HOUR;
77:       await readAt(start, 1);
78:       await readAt(start + 30 * MINUTE, 119);
79:       if (day !== 4) await readAt(start, 70, '/feed.atom', 'feed');
80:       const history = await rows('page', start);
81:       assert.equal(new Set(history.map(row => row.minute)).size, 2);
82:       assert.equal(history.reduce((sum, row) => sum + row.count, 0), 120);
83:       t?.diagnostic(`HIST-006 observed baseline day ${day}: 2 observed minutes / 120 public page requests`);
84:     }
85:     await configure(6);
86:     await readAt(target, 10);
87:     await fixture.tick(target + 2 * MINUTE);
88:     assert.equal((await trafficAlerts()).length, 0, 'the owner’s 6× multiple suppresses a 5× burst');
89:     await configure(3);
90:     const burst = target + MINUTE;
91:     await readAt(burst, 10);
92:     const publicBefore = await (await runtime.dispatchFetch(`${publicOrigin}/api/public/status`)).text();
93:     await fixture.tick(burst + 2 * MINUTE);
94:     const [pageAlert] = await eventually(() => sent('page:'), value => value.length === 1, 'a 5× burst sends exactly one real operator-provider request');
95:     assert.equal((await trafficAlerts()).length, 1, 'this page burst creates exactly one operator alert across all surfaces');
96:     assert.equal(pageAlert.eventId, `traffic:page:${Math.floor(burst / MINUTE)}`, 'the alert names the page surface and its burst minute');
97:     const [pageRequest] = requests(pageAlert);
98:     assert.equal(requests(pageAlert).length, 1);
99:     assert.ok(figures(pageRequest.text).includes(10), 'the provider request carries the minute’s 10 requests');
100:     assert.ok(figures(pageRequest.text).includes(2), 'the provider request carries the same-hour mean of 2 per minute, not a same-minute lookup');
101:     assert.ok(pageRequest.text.includes(`${origin}/app`), 'the operator alert links to the actual app');
102:     assert.deepEqual(pageRequest.to, ['synthetic-lamp-owner@example.test']);
103:     const providerRequests = fixture.messages.length;
104:     await fixture.tick(burst + 2 * MINUTE);
105:     await fixture.tick(burst + 2 * MINUTE);
106:     assert.equal((await trafficAlerts()).length, 1, 'repeated Cron delivery does not resend the alert');
107:     await readAt(burst + MINUTE, 10);
108:     await fixture.tick(burst + 3 * MINUTE);
109:     assert.equal((await trafficAlerts()).length, 1, 'the same consecutive burst remains one episode');
110:     assert.equal(fixture.messages.length, providerRequests, 'no further provider request');
111:     assert.equal(await (await runtime.dispatchFetch(`${publicOrigin}/api/public/status`)).text(), publicBefore, 'traffic alerts publish no customer-facing incident or content');
112: 
```

## tests/e2e/helpers/traffic-alerts-runtime.mjs:30

```
30:     return files;
31:   }
32:   const modules = await moduleFiles(dirname(options.main));
33:   const wrapper = join(dirname(options.main), '__traffic-clock.mjs');
34:   modules.sort((a, b) => a.path === options.main ? -1 : b.path === options.main ? 1 : a.path.localeCompare(b.path));
35:   modules.unshift({ type: 'ESModule', path: wrapper, contents: `
36:     import worker from './index.js';
37:     export * from './index.js';
38:     const RealDate = Date;
39:     let at;
40:     globalThis.Date = class extends RealDate {
41:       constructor(...args) { super(...(args.length ? args : [at === undefined ? RealDate.now() : at])); }
42:       static now() { return at === undefined ? RealDate.now() : at; }
43:     };
44:     export default {
45:       async fetch(request, env, context) {
46:         if (new URL(request.url).pathname === '/__fixture/clock' && request.method === 'PUT') {
47:           at = (await request.json()).at;
48:           return new Response(null, {status:204});
49:         }
50:         return worker.fetch(request, env, context);
51:       },
52:       queue: (...args) => worker.queue(...args),
53:       scheduled: (...args) => worker.scheduled(...args),
```

## tests/e2e/helpers/traffic-alerts-runtime.mjs:122

```
122: }
```

## src/core/features/public-snapshot/service.ts:15

```
15: import { defaultPublicSnapshotEvents, type PublicSnapshotEvents } from "./events";
16: 
17: const CURRENT_POINTER_KEY = "snapshots/current.json";
18: const STALE_MARKER_KEY = "snapshots/stale.json";
19: const STALE_BUILD_MS = 5 * 60_000;
20: const RETRY_LEASE_MS = 2 * 60_000;
21: // The minute scheduler periodically rereads source data even without a mutation.
22: const SNAPSHOT_REFRESH_MS = 5 * 60_000;
23: const LOGO_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
24: export const PUBLIC_SNAPSHOT_RENDERER_VERSION = "lamp-public-snapshot-v21";
```

## src/core/features/public-snapshot/service.ts:346

```
346:     async retryPendingBuild() {
347:       try {
348:         const now = new Date();
349:         const nowText = now.toISOString();
350:         const staleBefore = new Date(now.getTime() - STALE_BUILD_MS).toISOString();
351:         await repository.markInterruptedBuilds(nowText, staleBefore);
352:         let work = await repository.currentWork();
353:         if (work.completedRevision >= work.requestedRevision) {
354:           const pointer = await readPointer();
355:           const missingReplica = retained && pointer && (await retained.generation()) === null;
356:           if (missingReplica) {
357:             const archived = await blobs.getText(`snapshots/${pointer.version}/retained.json`);
358:             if (archived) { await retained!.write(archived.text); return true; }
359:           }
360:           const refreshDue = pointer && now.getTime() - Date.parse(pointer.generatedAt) >= SNAPSHOT_REFRESH_MS;
361:           if (!missingReplica && !refreshDue && !(await staleRevisionNeedsRebuild(pointer)) && !rendererNeedsRebuild(pointer) && !releaseNeedsRebuild(pointer)) return false;
362:           await repository.requestWork(nowText);
363:           work = await repository.currentWork();
364:         }
365:         const leaseId = createUlid();
366:         if (!(await repository.claimPendingWork({ leaseId, now: nowText, leaseUntil: new Date(now.getTime() + RETRY_LEASE_MS).toISOString(), staleBefore }))) return false;
```

## .github/workflows/verify.yml:1

```
1: name: Verify
2: 
3: on:
4:   push:
5:     branches: ['**']
6:   pull_request:
7:   workflow_dispatch:
8: 
9: permissions:
10:   contents: read
11: 
12: concurrency:
13:   group: verify-${{ github.workflow }}-${{ github.event_name }}-${{ github.ref == 'refs/heads/main' && github.run_id || github.event.pull_request.number || github.ref }}
14:   cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
15: 
16: jobs:
17:   plan:
18:     runs-on: ubuntu-24.04
19:     timeout-minutes: 30
20:     permissions:
```

## scripts/verification/plan.mjs:1

```
1: // Local verification and CI execute the same commands. Production output is
2: // built once, then each journey gets its own database, runtime and browser.
3: export const verificationPlan = {
4:   build: ['check:contract-docs', 'source:copies', 'source:check', 'typecheck', 'check:syntax', 'validate:release', 'verify:visual:source', 'build:app', 'build:site'],
5:   ownership: ['test:ownership', 'test:owner-claim', 'test:owner-backup'],
6:   portability: ['test:portability'],
7:   imports: ['test:imports', 'test:mail', 'test:site'],
8:   composer: ['test:composer', 'test:public'],
9:   delivery: ['test:channels'],
10:   public: ['test:delivery'],
11:   runtime: ['test:runtime', 'test:publishing'],
12:   demo: ['test:demo', 'test:baseline'],
13: };
14: export const shardNames = Object.keys(verificationPlan);
15: // The separate build job contributes its own commit-bound completion record.
16: export const ciShardNames = shardNames.filter(name => name !== 'build');
```

## tests/e2e/update-reminders.test.mjs:153

```
153:     }
154:     t.diagnostic('PROBE NOTIFY-006 acceptance-3 alert-created draft: signed public POST /api/intake/:source for two firing events, exact replay, new receipt for each same incident and repeated Cron -> private drafts and exactly one captured email per operator per incident');
155:   } finally { await j.close(); }
156: });
157: test('HIST-006 — independent public readership produces private traffic alerts and recoverable owner actions', async t => trafficAlertsFlow(t));
158: test('AUTO-004 HIST-003 — both severe incidents become report-due at seven days and reviewed publication or reasoned waiver stops weekly reminders', reportRemindersFlow);
```

## tests/e2e/helpers/automation-rules-browser-flow.mjs:165

```
165:     assert.ok(undoRun);
166:     const undoButton=rules.getByRole("button",{name:`Undo automatic change ${undoRun.id}`,exact:true});
167:     await undoButton.waitFor();
168:     await audit("active automatic change");
169:     if(proof)await captureBoth("automatic-change-undo",()=>rules.screenshot.bind(rules));
170:     page.once("dialog",dialog=>dialog.accept());
171:     await undoButton.click();
172:     await rules.getByText("Automatic change undone. Earlier publications and history are retained.",{exact:true}).waitFor();
173:     const afterUndo=(await api("/api/app/intake/rule-runs")).body.runs.find(row=>row.id===undoRun.id);
174:     assert.ok(afterUndo.undoneAt&&afterUndo.undoneByOperatorId);
175:     assert.equal(await undoButton.count(),0,"the ended change is no longer offered for Undo");
176:     await page.goto(`${origin}/app/incidents/${undoRun.incidentId}`);await operatorHydrated(page);
```

## Matched main reproduction facility

The repository Verify workflow declares no dispatch inputs and has fixed planned shard commands. The cloud launcher installed only ci-wait.sh, heavy-slot.py and credential injection helpers; no remote-run controller or targeted GitHub-hosted runner command door is present. No matching one-test main run was launched.
