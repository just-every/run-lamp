# Lamp size-check continuation sd-lamp-sizecheck-4-pc1

Product repository: just-every/run-lamp.
Product branch: cloud/sd-lamp-sizecheck-4-pc1.
Product head: 97812189f9156d64b05cb8d5d21c30e4eb044864.
Starting published head preserved: e726cb9a0f786c96a19f3cfb16e84b3bc56c32a8.
Merged origin/main: bef5115afc3972d78962fbb899a2a32433f5f3a6 (including 6a3fe92809524f6463f98454cd72af0cd8724100).

## Outcome and scope

This continuation preserves the complete qualified rer 0.2.116 adoption and merges the newer main feed-safety repair. The two new commits are ordinary two-parent merges, with sources.lock.json regenerated last and checked. It preserves main's component/subscriber query repairs, migration 0079 and release metadata. No incident/tick candidate was cherry-picked, no SQL/schema/query repair was authored, and no generated contract view or fleet report was committed to the product branch.

The declaration now runs through the supported native owner and public-host verification path. Base copies already all record qualified c3532e238fe3e4b9d1bc70c957b775185c8207de (258 records); offline verification passes. No additional Base refresh or rer version change was needed. The exact package pin, agent-surface.json, size-check.json, eleven flows, original ceilings/growth limits, nightly/query/migration CI selection, shared build and 200 MiB declaration guard remain unchanged.

The requested green Verify cannot be obtained by a permitted config/fixture repair: ordinary incident-list and minute-tick queries still grow with the fixture, the scheduled handler throws, and the public routes consequently lack a snapshot. These match the prior completed run. The brief assigns those product repairs to independent rounds and explicitly forbids cherry-picking them or authoring duplicate writers. This branch does not weaken those measurements. Exact pushed CI state is recorded separately below and in CI-RECEIPT.json. No READY, landing submission, release, tag, deploy, production acceptance or real-D1 confirmation is claimed.

## Full plan and completed work

PLAN.md records the full task plan. Completed: installed fleet identity, bundle-only Git helper, cloud push guard and co-author cleanup; cloned only the declared product repository at the fleet-created continuation; read inline rules, seed instructions and prior evidence; read the completed prior failed size-check/runtime jobs once; merged current main without rewriting history; installed frozen dependencies; ran supported public local setup/build, typecheck, merged feed tests, contract and source checks; measured all ordinary flows at both sizes; reran the same deliberate negative control; checked emitted statements; restored disposable build bytes; regenerated the source lock last; committed with explicit fleet author/committer; checked all candidate ancestry identities/trailers; and ran the approved exact-tree full-history publication scan. Product push/CI/PR/evidence receipts are retained as actual separate files.

The product differences from the saved continuation are main's feed-safety source/test change, its Vite 8.2.4 package/lock upgrade, and regenerated source locks. Both qualified rer 0.2.116 and the Vite upgrade are preserved. No acceptance clause was targeted for promotion, so there are no CLAIM lines or clause-status changes. No full local verifier/suite was run; exact-SHA branch Verify is the full wall. There is no UI change requiring browser screenshots.

## Ordinary flows, actual local D1 results

The supported command was `cloud_run pnpm exec rer size --json --write-statements ../packet/ordinary-statements`, exit 1. The initially attempted CI-only `--no-queue` flag was refused because the original caller was not CI; it was removed for the local run. No CI flag or queue guard was bypassed.

| Flow | Small rows | Large rows | Status small/large | Verdict |
|---|---:|---:|---|---|
| component-list | 3,873 | 3,873 | 200/200 | pass |
| incident-list | 4,450 | 343,030 | 200/200 | ceiling, growth |
| incident-detail | 1,317 | 1,343 | 200/200 | pass |
| component-history | 13 | 110 | 200/200 | pass |
| subscriber-list | 1,109 | 1,109 | 200/200 | pass |
| monitor-list | 653 | 653 | 200/200 | pass |
| maintenance-list | 13 | 13 | 200/200 | pass |
| minute-tick | 24,219 | 1,671,933 | None/None | status, ceiling, growth |
| public-summary | 0 | 0 | 503/503 | status |
| public-history | 0 | 0 | 503/503 | status |
| public-feed | 0 | 0 | 503/503 | status |

Six of eleven flows pass, unchanged from saved Verify 43558458719. In the earlier sizecheck-2 report three of eleven passed; main's landed component and subscriber repairs account for the improvement already present in the saved continuation. No additional flow is claimed repaired by this merge.

Incident list exceeds its 5,000 ceiling by 338,030 rows at large; growth is 338,580 against 645 allowed. Its largest reads include the 162,003-row SMS subscriber scan and unbounded incident updates/attachments. Minute tick exceeds its 40,000 ceiling by 1,631,933; growth is 1,647,714 against 2,621 allowed. It reports `Native scheduled preparation failed (exception); fixture values are not logged.` at both sizes. Its largest read is the history scan: 971,358 rows across three executions at large. Each public route answers 503 with `The last known public status snapshot is unavailable. No current state is being inferred.` Zero public-route reads with a failed response do not qualify a successful public read.

The shape has 4,979 / 370,183 explicitly declared rows in nine tables. Readback exactly matches every table. With native owner/derived rows the databases contain 6,783 / 541,171 rows before the measured flows. Generation takes 0.206 / 5.593 seconds, all measured phases 26.420 / 59.096 seconds. These are synthetic translation/geometry results, not measured customer cardinalities, real D1 service limits or production scale acceptance. Queue consumer work remains explicitly unmeasured.

## Negative control, statement proof and local checks

The prior negative declaration is retained unchanged in negative-size-check.json. A disposable wrapper on the production build's `/api/app/size-negative-control` runs `SELECT id FROM subscribers` without predicate/limit. It reads 1,620 / 162,000, answers 200/200, and is correctly rejected for ceiling and growth (exit 1). Production source and the committed ordinary declaration are unchanged. restored-build-sha256.txt proves the original and restored production-build file have identical SHA-256. The wrapper and actual results/statements are in this evidence packet only.

All 502 schema view/trigger statements pass the structural margin checks; maximum FROM items is 4 and maximum depth 21. Both emitted-statement files independently pass `rer size --statements ... --json` (378 executions each). This is local SQLite/D1 metering, not the separately held real-D1 confirmation.

Frozen pnpm installation: pass. Public `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: pass, including local production build and native owner setup. Private generated installation/session output is intentionally excluded from the packet. Typecheck: pass. Merged main feed-safety tests: 2/2 pass. Contract generator check: pass. Qualified Base-copy offline check: pass. Package source-lock command and declared source check: pass. git diff --check: pass. Source-check and raw relevant local check receipts are retained.

No test is removed, skipped or weakened. Adoption adds zero test registrations; merging main imports its one new feed assertion. The merged feed test file has 2 registrations. The 11 ordinary size flows and 1 disposable negative control remain the same. Contract totals before/after are 244/244: 60/60 done, 129/129 partial, 55/55 missing. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged.

## Publication and custody

The clone began shallow/blob-filtered, then acquired full history for the approved publication scan. Initial scan attempts correctly refused missing pinned Gitleaks and a thin-pack public-base fetch with unresolved deltas. Gitleaks 8.30.1 was acquired through gh api and verified against the release's SHA-256 digest; a no-filter refetch repaired the missing-object acquisition. A complete scan attempt on the first merged head exceeded the supported default 300-second timeout; the final committed head is checked with the supported 1,800-second timeout. No scanner code or publication rule was changed. The completed scan on the setup/build checkout then flagged only generated working-tree state (.dev.vars, dist output, local SQLite state and setup answers). That actual report is publish-check-local-state.json. The final approved scan runs against a separate clean full-history checkout of the identical committed SHA/tree, containing no installation/build state. The final scan report is publish-check.json; its actual status and push/CI state are recorded in the final receipt.

The publication invocation names the exact committed HEAD, public base `https://github.com/just-every/run-lamp.git#main`, edition `just-every/lamp` and destination `https://github.com/just-every/run-lamp`. All candidate commits, including side parents, have fleet author and committer identities and no trailers. candidate-identities.txt is the actual required log output. Only the named product branch may be pushed. Evidence uses a separate report-only ref and does not imply READY or acceptance.

Remaining work belongs to sd's incident/tick integration: land only their independently gated repairs, then merge them into this adoption and rerun unchanged size/Verify checks. Real-D1 confirmation remains with its executing session. Integration must remain last; no automatic landing authorization follows from this report.

## Product publication result

The named product branch was pushed successfully on guard attempt 1 at exact SHA `97812189f9156d64b05cb8d5d21c30e4eb044864`. Draft PR: https://github.com/just-every/run-lamp/pull/375. The completed clean-tree publication scan is PASS with zero findings, 1,127 commits, 1,110 trees, 8,554 blobs, 1,127 commit messages and 27 tag messages; its source tree is `50de611e626fb648ff59d6ef348cd497b839617f`. Six candidate commits, including merge side parents, pass the fleet identity/trailer inspection.

The two new commits are `99742981d0c492d9b751dc9157c388029dc225de` (merge main feed safety) and `97812189f9156d64b05cb8d5d21c30e4eb044864` (merge main Vite upgrade while retaining rer 0.2.116). Both use the fleet author/committer identity, no co-author trailer and no CI skip marker. The starting published history was not amended, rebased or force pushed. A verified recovery bundle is retained outside both checkouts; the actual digest and verification are in bundle-sha256.txt and bundle-verify.log.

The first exact-SHA REST discovery observed push Verify run 43565516754 in progress after more than ten minutes of wall time. No claim of the ten-minute CI target is made. ci-discovery.json and the final CI-RECEIPT.json preserve actual observations, with one watcher and at least 300 seconds between reads of a run.

A fresh main fetch at 2026-11-14T06:24:46Z still resolved to `bef5115afc3972d78962fbb899a2a32433f5f3a6`, already an ancestor of the candidate. No independent incident/tick repair had become available on main at that observation. The report does not claim the state of their separate gate sessions.

The repository-declared CI commands `pnpm run source:check` and `pnpm run source:copies` were also run directly on the pushed head and both exit 0. Their actual logs are declared-source-check.log and declared-source-copies.log.

## Final exact-SHA CI result and blocker

Push Verify https://github.com/just-every/run-lamp/actions/runs/43565516754 completed **failure** on `97812189f9156d64b05cb8d5d21c30e4eb044864`, observed at 2026-11-14T06:37:49Z. Failed jobs: size-check (132358717212, Measure declared flows on small and large local D1); shards (runtime) (132358717311, Verify this product shard); verify (132362454087, aggregate required-command check). Plan, build and all seven other product shards pass. The metadata is CI-JOBS.json.

The size job ran from 06:17:41Z to 06:19:54Z (133 seconds including its install/artifact/measurement/retention steps) and reused the shared build. The final aggregate finished at 06:32:48Z; the push was created at 06:16:20Z (16 minutes 28 seconds). The longest shard was composer (14 minutes 53 seconds), outside this adoption's size-job lease. No ten-minute CI or shard-balance qualification is claimed.

The PR Verify run 43565565881 was separately observed in progress at the initial exact-SHA discovery, 06:27:45Z. It was not polled again; its final state is not claimed. Ten GitHub calls were used in total, recorded in GH-CALLS.json. Current-head failure log archives were not downloaded after that budget was exhausted. The old runtime/size logs in the packet belong only to 43558458719 at the saved starting head; they are not presented as current-head logs. The per-flow table is the actual local run on the exact final candidate/build.

Terminal product custody: branch pushed and draft PR open; **BLOCKED**, no READY. The real remaining gate is red exact-SHA Verify. The exact-head local size command independently reproduces incident-list ceiling/growth, minute-tick scheduled exception/ceiling/growth, and three public 503s. The brief assigns these query/scheduler repairs to independent gates/landings and excludes product query/schema/SQL edits here. No permitted pin/declaration/size-job change can waive those failures. sd must integrate the independently qualified repairs and then recheck this unchanged size contract; this adoption remains last.

Clause judgments: no changes; 244 clauses, 60 done, 129 partial, 55 missing before and after. No CLAIM promotion. Real-D1, production and scale acceptance remain outside this run's custody.
