# sd-lamp-qgrowth-incidents-3

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-incidents-3
Candidate: c65066509dc724bdd5e09c45f17f18d1758bc796
Parent continuation: 8ab15b4dc74832de43b662299e95a6de303d8aa3 (incidents-2 / PR #369)
Merged main: 1516f70a710d21775b8498c0357ea26a76f164d1

## Scope and implementation

PLAN.md preserves the full execution plan. Read the prior complete report and follow-up diagnosis first (PRIOR-REPORT.md), continued its pushed head, then merged current main. Main's newer component implementation, tests and metadata were retained without conflict. The first real product save b5f574d was pushed with [skip ci]; the final real commit records sources.lock.json after all source edits and carries no skip marker. The cloud only writes its declared run-lamp product/evidence refs. No history rewrite, landing, tag, release or deployment is performed.

Intake previously tested results[0].meta.changes === 1, but D1 counts writes performed by the incident-list trigger as well. The conditional INSERT now returns its own inserted id, and incidentCreated checks for that returned row. A reused incident or replay does not return a newly inserted incident, so existing deduplication and notice behavior are preserved independently of trigger write totals. The existing notice journeys exercise signed intake, exact replay, distinct repeat receipts, concurrent grouped firing and exactly-once captured operator email/notice counts.

The shared incidentSnapshot helper follows every nextCursor from the ordinary default-size HTTP incident pages. It validates response success, stable reported total, advancing cursor, unique record identities and final equality with the total. Sorry's complete snapshot and existing 60-record Business import, Statuspage/provider snapshot counts/history/undo readers, and the follow-up import helper use this reader. Their complete equality, imported count, undo, erasure and notification silence assertions are retained. The visible API/UI page limit is unchanged. SNAPSHOT-READERS.md records why product native import/export SQL readers already read all persisted rows and require no pagination workaround.

0080 remains free on main, whose highest migration is 0078. The reserved migration and incidents-2 release inventory entry remain byte-identical; no other release metadata changed. Migration SHA256 is 9d8f532665c8cc129b4a9306b07f28cbbb32c9532f67b97380d9abdf660cb023. New intake and helper changes are the only new implementation delta after the main merge; sources.lock.json was generated last and checked. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged.

## Counts and claims

Before/after registered test counts: 92 / 92. Assertion scripts: 10 / 10. Total checks: 102 / 102. No registration added, removed, skipped or weakened. Core migration inventory: main 77, candidate 78; continuation before/after 78 / 78. Release migration inventory retains exactly 0080. All contract status, gap, evidence and summary counts remain unchanged. INCIDENT-001 and NOTIFY-006 retain main's partial judgments; no acceptance promotion is claimed.

## Local results

Actual commands, exact head, UTC start, duration, exit code and log SHA256 are retained in each *-receipt.json. Final results are appended after the requested journeys finish. Local checks use Node 22.20.0 and pnpm 10.12.4 after sourcing the task toolchain. Browser commands use real HOME, /usr/bin/chromium and --no-sandbox; the existing operator publication journey supplies 1440/390 incident-list proof.

The first native release-upgrade pass included the browser probe’s temporary src/editor/visual-edits.json edit in its copied candidate. It passed but is retained as initial-visual-edit-* rather than clean-SHA proof. The test was repeated after the browser restored a clean checkout; its final receipt records no tracked working changes.

The initial combined journey command ended exit 1 with three missing-browser failures: two channel scenarios and the Statuspage import browser scenario. Those older helpers ignore the Chromium-path environment variable and expect a missing Playwright download. The runtime notice and complete Sorry import scenarios passed in that same actual run. A temporary cloud-only preload supplies /usr/bin/chromium and --no-sandbox without changing product/test source or assertions. Initial failed output remains in the packet; final rerun results are recorded separately.

## Size measurement

MEASUREMENT-REPORT.md contains the complete independent measurement plan, actual results and limits. Both full unchanged fixtures stopped at the unmodified 209,715,200-byte logical SQLite guard: main 211,640,320 bytes; candidate 213,938,176. The guard was never reduced, bypassed or raised. Full-fixture acceptance is not claimed.

The same prior smaller incident diagnostic retained 644 components/monitors, 90 / 9,000 incidents and incident attachments, 270 / 27,000 updates and one future maintenance record. Unrelated subscriber and component-state-history populations are omitted explicitly. Using the actual emitted Workers and published rer 0.2.115, three requests per door, final warmed sample, all responses 200:

| Flow | Main small | Main large | Candidate small | Candidate large |
|---|---:|---:|---:|---:|
| Incident list | 1,805 | 180,005 | 959 | 959 |
| Incident detail | 1,317 | 1,343 | 1,317 | 1,343 |

Large list reads fall 99.47%; candidate list growth is zero; detail reads are unchanged. Diagnostic logical database peaks were 19,410,944 and 21,708,800 bytes. The independent gate remeasures. Initial harness attempts (Node24 baseline later repeated on Node22 with identical reads, and missing scratch build before any fixtures) remain preserved and explained. Both measurement scratch worktrees are removed.

## Publication and independent gates

Every origin/main..HEAD commit, including side parents, was checked for fleet author/committer identity and absent trailers before pushing. Hooks remain active and repository hooks preserved. Full history is retained until final cleanup. The first guarded product push succeeded on attempt one. Product publication and evidence transfer receipts remain distinct.

The cloud task reserves the full publication scan for the fleet's own machine. Required inputs: full-history clone; public base run-lamp#main; edition just-every/lamp; full destination URL https://github.com/just-every/run-lamp. The migration gate is required on the final candidate head. Builder local migration proof does not claim this independent gate or publication scan passed. No held credentials, authority-bearing archives, private gate materials, environment dumps or symlinks belong in the public evidence selection.

DEFAULT INCIDENT-001: Retain the existing 50 incidents per visible section, stable keyset pagination and complete selected-incident child history.
GAP INCIDENT-001: Existing clause judgment remains partial; full fixtures stop at the unchanged 200 MiB guard and smaller measurements are diagnostic. Independent migration gate, publication scan and landing remain with the fleet.

## Completed local validation

- Production build: exit 0 on final candidate.
- Incident API journey: exit 0; tied-time paging, reachability without duplication, filtering and totals, retained full detail, deletion and malformed query refusal.
- Operator publication browser journey: exit 0; next/previous incident navigation, retained detail, and actual screenshots browser/incidents-1440.png and browser/incidents-390.png. Its temporary visual edit was restored; final tree is clean.
- Runtime update-reminder journeys in the initial combined run: all pass, including maintenance overrun, due/overdue, scheduled review holds, actual terminal-failure emails, signed intake firing/replay/repeat and exactly one captured intake email per active operator per incident.
- Full Sorry import journeys in the initial combined run: both pass; all 60 Business incidents are read across default visible pages. Full snapshots, catch-up, undo, erasure and notification-silence assertions remain intact.
- Full channels-and-presets file with the system Chromium adapter: exit 0, including concurrent grouped firing and one queued draft notice, monitor review/recovery, source authentication, rule integrations, copied Another tool sample and channels. This is the complete rerun of the previously failing file.
- Full Statuspage import file with that same cloud adapter: exit 0, including provider history, complete native counts, conditional owner-edit-preserving undo, public aliases, invitation boundaries and notification silence. This is the complete rerun of the third missing-browser failure.
- Identity forward upgrade, setup migration inventory, technical failed-upgrade rollback/archive restore, current native archive round trip and previous-release archive restore: exit 0. The test runner reported nine passing cases including nested setup-authority states.
- Native emitted-Worker upgrade from v1.11.14 on the clean exact candidate: exit 0. release-upgrade-receipt.json records targetSha c65066509dc724bdd5e09c45f17f18d1758bc796, trackedWorkingChanges [], added migration 0080 and result passed. Data, original owner authority/history and portable archive restore survive.
- Repeated migration and counter diagnostic: exit 0; rows retained, backfill exact, migration replay idempotent, insertion/lifecycle/soft-delete/restore/physical-delete counters reconcile, and foreign keys remain valid.
- Typecheck, release inventory validator, generated contract documents, verification plan and source lock checks: exit 0. Final fresh-main merge is already up to date and final-tree receipt proves no unstaged/staged diff and a current source lock.

The initial combined command itself exited 1: 16 passing / 3 failing runner cases (19 including nested cases), with all three failures caused by the absent bundled Chromium executable. initial-journey-results.json lists the exact observed top-level subtests. Complete subsequent channel and Statuspage reruns pass with the cloud-only Chromium adapter; no source or assertion was changed to recover them. Initial failure logs and both successful rerun receipts are preserved. No unresolved local product failure remains.

## Final product custody

Final guarded product push: exit 0, attempt one, at c65066509dc724bdd5e09c45f17f18d1758bc796. The final head has no CI skip marker. Main remained 1516f70a710d21775b8498c0357ea26a76f164d1 at the last fetch/merge. All four commits in origin/main..HEAD, including inherited side parents, have fleet authors and committers and no trailers. candidate-provenance.txt retains full identities and SHAs. No published commit was rewritten. The full channel rerun completed successfully while the final custody check/push finished. Exact-SHA Verify result follows below.

## Builder claims

CLAIM INCIDENT-001 PARTIAL points=2 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion

CLAIM NOTIFY-006 PARTIAL points=3 tests=tests/e2e/update-reminders.test.mjs#AUTO-003 NOTIFY-006 — operator follows real scheduled, delivery and import obligations through failures, reasoned dismissal and recovery; tests/e2e/update-reminders.test.mjs#NOTIFY-006 — repeated scheduled review holds and alert intake email each operator once per obligation while drafts stay private

These are partial builder evidence claims only. No clause Status, Gap or Evidence cell changed. Main’s existing MOVE-003 done judgment and all other judgments are preserved.

## Terminal CI and review result

PR: https://github.com/just-every/run-lamp/pull/371 (#371, open against main).
Final Verify: https://github.com/just-every/run-lamp/actions/runs/43549762749.
Run ID: 43549762749.
Exact head: c65066509dc724bdd5e09c45f17f18d1758bc796.
Observed final status: completed / success. This is the actual push Verify on the final candidate, not an ancestor, merge projection or another SHA. ci-discovery.json, ci-status-1.json, ci-status-2.json, ci-status-3.json and ci-final.json retain actual REST receipts. Three status requests followed discovery at intervals of at least 300 seconds, using one watcher. The full Verify completed without a generator-only exception or waived red job.

GitHub invocations used: 6 of 10: prior report, exact-head run discovery, three scheduled status reads and PR creation. No rerun, workflow dispatch or repeated log archive read was used. Product pushed successfully on attempt one for each published head. No unresolved builder blocker remains.

The final packet is explicitly selected for report-only transport to refs/heads/evidence/sd-lamp-qgrowth-incidents-3. Its report tree is separate from the product branch and PR. The evidence command preserves product HEAD/index; the existing fleet independently fetches the exact returned evidence head and verifies manifest/file hashes. Evidence transport is neither product acceptance nor landing. Synthetic authority-bearing release archives remain outside the public packet. Owned measurement worktrees, test browsers and servers are stopped/removed; the product clone is deleted after successful evidence publication as instructed. All finished product work is already retained in the two pushed heads and final PR.

READY branch=cloud/sd-lamp-qgrowth-incidents-3 head=c65066509dc724bdd5e09c45f17f18d1758bc796
