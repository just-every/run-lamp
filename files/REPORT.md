# Component read query growth repair

Product: just-every/run-lamp, cloud/sd-lamp-qgrowth-components-1, commit `1516f70a710d21775b8498c0357ea26a76f164d1`. PR: https://github.com/just-every/run-lamp/pull/367. The product branch was pushed once through cloud-push.py. Exact-SHA Verify run 43542499477 completed successfully on this full candidate SHA; the product is READY for the fleet’s independent landing gates. Nothing was landed, deployed, tagged or released.

## Plan and source custody

PLAN.md is the full executed plan. Started from current main `4271d1caa8f044a0265eb287c660e1777bd5b942`, cloned shallow/filter=blob:none, then unshallowed for the publication-scan attempt. Fetched current main before the candidate, committed the product/tests and regenerated lock, and ran a non-rewriting rebase which reported the branch current. All candidate authors/committers and messages were audited, including the full origin/main..HEAD set. The only candidate commit uses Run Edit Run fleet <fleet@runeditrun.com>, no trailers, and active fleet/repository hooks. Product source is clean. No other repository was cloned or written.

Only the two named component paths, their existing catalogue test registration/new helper, the minimal shared request-work guard, and sources.lock.json changed. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md, release data, pins, size-adoption files, homepage and other findings' feature files are unchanged. There is no migration, so the migration gate is not required. The all-catalogue component response still returns every component, with the existing group/component order and counts.

## Root causes and changes

The baseline's `WITH follow_event` name was misleading: its incident_id is NULL, and the actual SMS fan-out belongs to a **maintenance reminder**. After a component GET, queueDueWork ran runDueWorkWhileCronQuiet because no recent scheduler marker existed. Its maintenance.runDue published the future window's reminder inside waitUntil, including SMS publication statements over subscriber_directory, even though this fixture has no eligible SMS recipient. The meter correctly counted that after-response work: 162,003 large rows in that one SMS insert, zero SMS deliveries inserted.

Component API and document GET/HEAD reads now leave that mutation/dispatch fallback to publication writes, scheduled work, and the existing other recovery doors. They do not publish maintenance reminders or dispatch unrelated pending notifications. Their writes still dispatch committed notifications. The new emitted-Worker journey restarts the isolate to avoid a read-throttle false positive, reads list and history without a new reminder, then proves the real scheduled trigger publishes the due reminder exactly once across two runs. The unchanged notification suite exercises actual consent, SMS, per-update choices, follow events, provider fallback, receipts, erasure and the 1,000-recipient delivery deadline.

The current-claims UNION previously walked resolved incident attachments. It now receives the exact IDs returned by the catalogue, scopes all four sources to them, and starts incident/maintenance joins from their existing indexed live-parent states. CROSS JOIN keeps that selective parent order. Severity derivation and the complete catalogue are retained; no claim, component or group is silently truncated. The synthetic catalogue has 644 components at both sizes, so its fixed join/ID-list cost remains visible.

History formerly fetched every fact and correction. Its HTTP door now validates limit (default 50, range 1–100) and independent JSON timestamp/ID cursors. SQL uses LIMIT+1 and descending tuple comparisons to expose nextCursor without a growing COUNT query. History retains changedAt/createdAt ordering with an explicit descending ID tiebreaker; corrections retain createdAt ordering with the same stable tiebreaker. The existing index prefix bounds the measured first history page without a new migration. The drawer exposes page counts and older/newer navigation for both collections; saving a correction returns to the latest pages. Writer-side full-history reads remain available. This is page navigation, not data deletion: the test retrieves every one of 55 history entries and 54 native corrections across seven-entry pages, with tied timestamps and no duplicate IDs or missing reasons.

## Unchanged size declaration and exact measurements

The adoption branch's size-check.json and agent-surface.json were fetched only into size-scratch and the evidence packet. The product has neither file. Published rer 0.2.115 was used in that scratch clone; the product retains rer 0.2.108. No fixture, flow, ceiling, timeout, growth rule or exemption was changed. Fixture input is below the 200 MiB bound; fixture-input-receipt.json records actual input hashes/bytes and defines that guard as declaration input, not an invented SQLite/WAL limit. Both sizes read back all declared table rows. Synthetic data only, no customer/provider/held-out inputs.

The ordinary emitted-Worker baseline exactly reproduced the assigned finding. The initial final-named measurement inadvertently rebuilt the still-baseline scratch source; its honest baseline confirmation is retained separately, not substituted for the repaired result. The scratch was then populated with the committed product code, rebuilt and measured. RECEIPT.json hashes each repaired code file and proves its bytes match the committed candidate. Both complete result envelopes and both sizes' emitted statements are retained.

| Flow | Before small | Before large | After small | After large | Target ceiling | Verdict |
|---|---:|---:|---:|---:|---:|---|
| component-list | 4,121 | 182,321 | 3,873 | 3,873 | 5,000 | Pass; growth 0 |
| component-history | 13 | 511 | 13 | 110 | 6,000 | Pass; growth 97, allowed 201 |

callsInRow=3 is the unchanged declaration reservation; published rer meters one ordinary request. These totals are actual metered rows, not multiplied estimates. List large rows drop by 178,448 (97.88%); history large rows drop by 401 (78.47%). The target-flow count passes from zero of two to two of two. Ordinary flows pass from three of eleven to five of eleven, with both repaired flows joining the prior passes while unrelated doors remain red. The complete per-flow table is in metrics.json.

The full ordinary command still exits 1. Incident-list, subscriber-list, minute-tick, public-summary, public-history and public-feed remain red and outside the lease. In the repaired run, incident-list is now the first inherited recovery door and absorbs the reminder work formerly triggered by component-list: 4,450 small /343,030 large versus 1,805/180,005 before. This is explicitly not claimed as an incident-list improvement or removal of quiet-Cron recovery from every read door. The subscriber list remains 4,299/325,059, minute tick 24,219/1,671,933 with its pre-existing scheduled-preparation exception, and the three public flows still return 503 with zero D1 rows because their disposable installation has no current public snapshot. No unrelated red result is hidden or qualified as green.

Both small and large emitted statement artifacts pass the supported rer size --statements structural check. This is local SQLite/D1 structural proof, not a provider-backed D1 qualification; no real D1 account/resources were used.

## Checks and browser proof

- Product production build and touched TypeScript check pass. After committing/pushing, the exact candidate was rebuilt and componentReadFlow/browser captures passed again against that emitted Worker; candidate-build.log and the final component-read-test.log are the final proof.
- componentReadFlow passes through the emitted Worker: bounded pages, all retained facts/reasons, stable ties, invalid inputs, current claims, observational reads, Cron reminder idempotency, and real drawer older/newer navigation.
- All seven existing delivery-contract registrations pass, including 1,000 provider acceptances and zero duplicate recipients. The capacity result records 169,273 ms p95 and 174,958 ms last acceptance.
- Browser assertions run at 1440; the changed drawer is captured once at 1440 and 390 in component-history-1440.png and component-history-390.png. No extra phone assertion battery was added.
- Source lock regenerated last and its check passes. Contract docs check passes; generated views were never committed.
- Registered cases stay 92 before/after, plus 10 existing assertion scripts =102 checks. This round extends the existing public catalogue registration and adds zero registrations. No assertion was deleted, skipped or weakened. Full local rer verify/full suite were not run; branch CI owns the full wall.

runner-diagnostic.md explains the initial direct-command stalls: --input-type=module leaked into Miniflare's CommonJS eval thread. The final passing invocation uses an ordinary .mjs file. Temporary instrumentation, dependency changes and alternate fixture code were restored/removed and are absent from the product tree. Only this task's own processes were stopped. Diagnostic logs are not passing proof.

## Publication and remaining qualification

The installed Base scanner was invoked on the committed full-history candidate with public base https://github.com/just-every/run-lamp#main, edition just-every/lamp and full destination https://github.com/just-every/run-lamp. It returns INCOMPLETE/exit 2 with only scan.gitleaks-unavailable (requires Gitleaks 8.30.1). The actual value-free scanner envelope is publication-scan.json. No complete fleet/Mac publication gate is claimed; the fleet must run its independent publication scan before landing. The available /usr/bin/go is not a Go toolchain, so the optional pinned scanner install attempt cannot supply that binary. This does not claim a product security finding or waive the fleet gate.

Report/evidence custody is separate from product READY, acceptance and landing. The actual packet is published only to evidence/sd-lamp-qgrowth-components-1. No inbox/state file was read or written. The fleet owns the final main integration, generated views, publication gate and landing.

## Clause handoff

All 244 clause judgments remain unchanged: 60 done /129 partial /55 missing. This query-growth round does not promote a clause or independently qualify all its acceptance points. Existing append-only and claimant guarantees remain under their recorded judgments.

CLAIM COMP-003 PARTIAL points=none tests=tests/e2e/helpers/component-read-flow.mjs#componentReadFlow
CLAIM COMP-006 PARTIAL points=none tests=tests/e2e/helpers/component-read-flow.mjs#componentReadFlow
DEFAULT COMP-003: History and correction pages default to 50 entries, accept 1–100, and expose stable next cursors plus older/newer drawer navigation.
GAP COMP-003: Whole-clause acceptance/provider qualification is outside this measured query repair; prior judgments remain authoritative.
GAP COMP-006: The other size-finding doors and prior claimant acceptance gaps are not repaired or promoted here.


## Exact-SHA CI and terminal custody

Exact candidate push Verify [43542499477](https://github.com/just-every/run-lamp/actions/runs/43542499477) completed **success** on `1516f70a710d21775b8498c0357ea26a76f164d1`. ci-discovery.json, ci-status.jsonl, ci-final.json and ci-watcher.log retain the actual REST observations. One watcher made four status calls, each more than 300 seconds apart after discovery. Total task GitHub API calls: **6/10** (PR creation, discovery, four status reads). No failure archive, rerun, dispatch or other-SHA green result was used.

The ten-minute CI target was not met: this run was still in progress at the third observation, 16 minutes after its recorded creation, and was complete by the final observation at 21 minutes. Workflow definitions were outside this lease and unchanged. Green Verify is the exact-SHA product wall; this report does not claim CI-shape qualification, a complete fleet publication scan, main integration, deployment or whole-clause acceptance.

The fleet must still run its complete publication scan (the cloud scanner lacked Gitleaks), integrate through PR #367 and apply its normal landing rules. No product blocker remains. Report-only evidence publication is independent of product readiness.

CLAIM COMP-003 PARTIAL points=none tests=tests/e2e/helpers/component-read-flow.mjs#componentReadFlow
CLAIM COMP-006 PARTIAL points=none tests=tests/e2e/helpers/component-read-flow.mjs#componentReadFlow
READY branch=cloud/sd-lamp-qgrowth-components-1 head=1516f70a710d21775b8498c0357ea26a76f164d1
