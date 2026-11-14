# sd-lamp-qgrowth-incidents-1

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-incidents-1
Candidate: 0b9fce0bf4ad2f38b420494ad3a9fecbcbb0354f
Base: 4271d1caa8f044a0265eb287c660e1777bd5b942
PR: https://github.com/just-every/run-lamp/pull/366

## Result

BLOCKED on the release-manifest lease conflict and the unchanged fixture’s strict 200 MiB database guard. The completed initial query measurements below are diagnostic, not guard-compliant acceptance proof.

Incident-list reads fell from 180,005 to 959 at large size (99.47% fewer). Small and large now both read 959 rows, within the unchanged 5,000-row ceiling and 10% + 200 growth limit. Detail remains 1,317 / 1,343 and retains complete history. The full declaration still exits 1 because other leased findings and public snapshot readiness remain unchanged. No ceiling, flow, fixture, dependency pin, release file, contract judgment or generated contract view was changed.

## Plan and implementation

The complete original plan is PLAN.md. The product pages incidents before loading any children, using the existing newest-first opening-time order and an ID tie-breaker. The default visible size is 50; the API accepts 1–100. Responses expose limit, total, activeTotal, resolvedTotal and nextCursor. Lifecycle/group predicates run before LIMIT. Both existing sections expose their full totals, displayed range, page size, Previous and Next. Every incident remains reachable and every selected incident retains its complete children. Overview continues using its original unpaged service method. The detail route is unchanged.

Migration 0079 is the next number above main’s 0078. It adds three partial seek indexes and four lifecycle count rows maintained in the same transaction as incident inserts, state changes and deletion. COUNT(*) was independently confirmed to read all 9,000 rows even with an index, so fetching an aggregate per request would have preserved query growth. The migration backfills exact counts, replays idempotently and preserves older archive restoration. No migration history was rewritten. Gate: required; the independent fleet gate owns admission.

The existing API journey now browses 53 tied-time incidents across pages, checks exhaustive ordering with no duplicate/lost IDs, lifecycle/group filtering, full totals, deletion, invalid queries and equality with complete detail records. The existing owner browser journey checks next/previous and detail navigation at 1440. It captures the changed screen once at 1440 and 390 using /usr/bin/chromium with --no-sandbox. No registrations were added. The repository inventory remains 92 registrations + 10 assertion scripts = 102.

The setup migration test now derives its missing-range assertion from the actual inventory; it still verifies refusal on incomplete apply, all missing names and successful retry. The existing previous-release archive journey also checks the reconstructed count table against independently aggregated restored incidents. These two test changes are necessary for the new migration; no other findings’ product paths were edited.

## Measurements

Published @runeditrun/rer 0.2.115, with byte-identical size-check.json and agent-surface.json fetched from cloud/sd-lamp-sizecheck-3, ran against the real emitted Worker in a disposable scratch checkout. The product keeps its original rer pin. Synthetic data only. Initial completed runs did not enforce the required 200 MiB database limit. Strict repetitions use a 209,715,200-byte SQLite logical-database-size guard (page_count × page_size, including committed WAL pages). On unchanged main it stopped generation at 211,640,320 bytes, before large-flow measurement; the exact candidate was also stopped at 227,864,576 bytes. The limit stayed 209,715,200 bytes. Each observed crossing reflects the sampling interval, after which only this run’s owned processes were stopped. The original shape was not changed and the guard was not raised. Earlier aggregate/per-file cap attempts also stopped generation and are retained as failures, not passing measurements. Baseline shape: 6,782 / 541,170 total rows. After: 6,787 / 541,175; the five additional rows are four derived counters and the added migration ledger entry, without changing declared fixture geometry. Three repeated requests per declared incident flow.

| Flow | Before small | Before large | After small | After large | After verdict |
|---|---:|---:|---:|---:|---|
| component-list | 4,121 | 182,321 | 4,121 | 182,321 | existing/out of scope failure |
| incident-list | 1,805 | 180,005 | 959 | 959 | PASS |
| incident-detail | 1,317 | 1,343 | 1,317 | 1,343 | PASS |
| component-history | 13 | 511 | 13 | 511 | existing/out of scope failure |
| subscriber-list | 4,299 | 325,059 | 4,299 | 325,059 | existing/out of scope failure |
| monitor-list | 653 | 653 | 653 | 653 | PASS |
| maintenance-list | 13 | 13 | 13 | 13 | PASS |
| minute-tick | 24,219 | 1,671,933 | 23,949 | 1,644,933 | existing/out of scope failure |
| public-summary | 0 | 0 | 0 | 0 | existing/out of scope failure |
| public-history | 0 | 0 | 0 | 0 | existing/out of scope failure |
| public-feed | 0 | 0 | 0 | 0 | existing/out of scope failure |

The three public reads return the existing 503 (no retained public snapshot) at both sizes, rather than succeeding at zero reads. They are reported as failures. Component-history still fails its growth rule despite its low absolute read count. Minute-tick benefits from the new incident indexes but remains far above its ceiling; no scheduler code changed.

OBSERVED-MEASUREMENTS.json preserves the actual values parsed into this report from the completed initial before/after runs. size-after.json retains the full working-tree rer result. Initial exact-candidate execution also observed 959/959 and detail 1,317/1,343. The final strict-guard attempts fail during generation and do not produce large-flow results; their actual guard receipts and earlier file-cap failure results are retained separately. The overwritten initial baseline/exact-candidate raw JSON is not represented as retained evidence. Selected incident statement receipts exclude authentication queries and contain only public SQL and synthetic incident/component identifiers. No credentials, environment values or private held-out material are included.

## Validation and custody

RECEIPT.json contains the actual commands, outcomes and log hashes. Touched API and browser journeys, migration replay/index plans, setup inventory, identity forward upgrade, technical archive restore, older native archive restore, typecheck, generated contract documents and final source lock all pass. The first old-archive run under VM Node 24 returned a native ERR_ASSERTION; the repository-pinned Node 22.20.0 runs pass. The existing old-release backup bytes were not edited.

Current main was fetched with full history before publication, then the candidate was rebased (no upstream drift). sources.lock.json was regenerated last and checked. All candidate authors and committers are Run Edit Run fleet <fleet@runeditrun.com>; no co-author trailers are present. A single guarded product push succeeded on its first attempt. No published history was rewritten.

Exact-SHA Verify FAILED: https://github.com/just-every/run-lamp/actions/runs/43541517057. Build job 132282942648 fails validate:release: `RELEASE.json migrations must exactly match newly introduced migrations/core in apply order.` The current manifest lists no migrations but the authorized repair adds 0079_incident_list_paging.sql. Verify job 132283272164 fails downstream because no build/shard artifacts are available; shards are skipped. Both failed job logs were read once through `gh run view --log-failed`. Eight total GitHub calls were used, with no short-interval polling. The brief explicitly forbids release changes, so neither RELEASE.json nor the validator was changed. This scope conflict requires a lane ruling before the candidate can become READY. Product branch and PR remain preserved; no landing or release occurred. The cloud brief reserves the complete Base publication scan and landing for the fleet. Scan inputs: full-history clone, public base run-lamp#main, edition just-every/lamp, destination https://github.com/just-every/run-lamp. Product and evidence refs are separate.

Contract status changes: none. No clause Status, Gap or Evidence cells changed.

CLAIM INCIDENT-001 PARTIAL points=2 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion
DEFAULT INCIDENT-001: Use 50 incidents per visible section with keyset navigation; retain all child history for selected incidents.
GAP INCIDENT-001: This is a query-scaling repair and preserves the current partial clause judgment; independent gate, publication scan and landing remain with the fleet.

## Retained artifacts

PLAN.md; REPORT.md; RECEIPT.json; OBSERVED-MEASUREMENTS.json; size-after.json (completed initial diagnostic); size-before.json and size-candidate.json (actual final guarded cancellation events); logical guard receipts and implementation; earlier failed cap attempts; selected incident statement receipts; migration-probe.txt; product-push.txt; PR and exact-SHA CI receipts; incidents-1440.png and incidents-390.png. All are non-secret and explicitly selected for the evidence-only branch.

## Terminal status

BLOCKED: exact-SHA Verify requires release-manifest migration inventory bookkeeping that this brief explicitly forbids. The strict 200 MiB guard also prevents generation of the unchanged large fixture, so the initial diagnostic improvement is not accepted guarded proof. No contract status changes. Independent migration gate and fleet publication scan remain pending.
