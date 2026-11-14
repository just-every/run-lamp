# sd-lamp-qgrowth-incidents-2

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-incidents-2
Candidate: 8ab15b4dc74832de43b662299e95a6de303d8aa3
Previous incident candidate: 0b9fce0bf4ad2f38b420494ad3a9fecbcbb0354f
Main base: 4271d1caa8f044a0265eb287c660e1777bd5b942
PR: https://github.com/just-every/run-lamp/pull/369

## Result

The release inventory blocker from incidents-1 is repaired. The candidate is BLOCKED on additional exact-SHA Verify failures outside this continuation’s explicit file lease; it is not READY. Migration 0079 was renamed to the reserved 0080, with every SQL byte preserved, and RELEASE.json now records that migration with its buyer steps. The release validator passes. No version, release note, changelog, other release metadata, contract judgment or size-check adoption file changed.

The previous incident paging code and tests remain intact. Lists page parent records before reading children, retain stable opening-time/ID cursor order, filter before LIMIT, expose complete active/resolved totals and Previous/Next navigation, and retain every selected incident's full detail history. This continuation changes only RELEASE.json, the unreleased migration filename and sources.lock.json relative to incidents-1.

Final Verify conclusion: failure. Build and release inventory validation pass; runtime, delivery and imports fail. The final head remains safely pushed and PR #369 stays open.

## Plan and scope

PLAN.md contains the complete plan. The execution followed it: establish fleet credentials, identity and hooks; fetch full main history; continue the previous pushed head on the named new branch; merge main; inspect the inventory validator and release records; rename the migration without changing its contents; add its inventory entry; regenerate the source lock last; commit and preserve the candidate through the guarded push; run the requested local journeys and migration diagnostics; measure under the unchanged fixture guard; open the PR; observe exact-SHA Verify within the GitHub budget; return non-secret evidence separately.

Current main was already the previous incident candidate's parent. Both main integration attempts reported “Already up to date.” Main's highest migration was 0078 at publication, so reserved 0080 was free. No merge conflict or contract generation was needed. The source lock was regenerated after staging the renamed migration and release inventory and then checked. No published history was rewritten.

The standalone RELEASE schema requires each migration entry to contain id and buyerSteps. assertReleaseMigrationInventory in scripts/release-metadata.mjs requires the current migration array to equal the newly introduced migration suffix, in apply order; retained predecessor records supply the earlier prefix. Main's v1.11.14 and v1.11.15 migration deltas were empty. Adding the single new entry satisfies the designed check without a version bump or new release section.

0080_incident_list_paging.sql SHA256:
9d8f532665c8cc129b4a9306b07f28cbbb32c9532f67b97380d9abdf660cb023
This equals the bytes of incidents-1's 0079_incident_list_paging.sql. Its old filename has no remaining product references on the candidate. The source lock names 0080. Previously applied migration history remains unchanged.

## Local validation

All requested local checks pass on 8ab15b4dc74832de43b662299e95a6de303d8aa3 under the repository-pinned Node 22.20.0 and pnpm 10.12.4:

- Incident API journey: tied-time pagination, all records reachable without duplication, filtering/totals, full detail equality, deletion and invalid-query refusal.
- Existing operator browser publication journey: incident paging next/previous and detail navigation at 1440, with candidate screenshots once at 1440 and 390 using /usr/bin/chromium and --no-sandbox.
- Setup migration inventory: incomplete apply refuses with all missing names; retry completes the actual shipped inventory.
- Identity forward upgrade: retained identities, audit history, subscriber authority and setup-authority cases.
- Native emitted-Worker release upgrade from v1.11.14: populated in-place upgrade, retained owner authority/history and portable archive restore all pass; release-upgrade-receipt.json records the actual command and exit 0. The synthetic authority-bearing archives remain outside public evidence.
- Technical archive restore: failed-upgrade rollback, repeated migrations, full export/import/reexport comparison and restored customization behavior.
- Previous-release native archive restore: original rows and object bytes, preserved history/consent, exact incident counter reconstruction and valid foreign keys.
- Current native archive round trip: whole-product restore without reviving temporary authority.
- Migration diagnostic: upgrade an existing populated schema through 0080, preserve every incident row, replay 0080 twice, check insertion, lifecycle transition, soft deletion, restoration and physical deletion against independently aggregated exact counts; three nonduplicated triggers and valid foreign keys.
- Release inventory validation, typecheck, generated contract-document check, verification-plan count, final source-lock check, clean working tree and diff whitespace check.

local-checks.json records the actual test commands, exit codes, durations, exact head and log hashes. final-local-checks.json records the final metadata/type checks. migration-probe.mjs and its log preserve the diagnostic. Its initial synthetic fixture used an invalid incident reference and hit the existing INC-number constraint; that fixture was corrected and the probe passed. The initial failure is retained as migration-probe-fixture-error.txt and was not a product defect.

The test inventory remains 92 registered cases plus 10 assertion scripts = 102, before and after. No test registrations were added. Core migration inventory is 77 on main and 78 on the candidate; the continuation itself remains 78 before and after the rename. The current release inventory delta changes from zero migrations to this one migration. Contract Status, Gap and Evidence changes: none. ACCEPTANCE.md and docs/CLAIMS.md remain unchanged.

## Measurements and limits

The full unchanged size-check.json and agent-surface.json from cloud/sd-lamp-sizecheck-3 were copied into disposable scratch worktrees only. Product pins and tracked files remain unchanged. Published @runeditrun/rer 0.2.115 drives the emitted Worker with synthetic data. The referenced declarations and exact file hashes are retained with the packet.

Both full-fixture attempts were stopped by the strict, unchanged 209,715,200-byte SQLite logical database guard, measured as page_count × page_size including committed WAL pages:

| Full fixture | Logical bytes observed at stop | Result |
|---|---:|---|
| Unchanged main 4271d1caa8f044a0265eb287c660e1777bd5b942 | 211,640,320 | Generation stopped; no large-flow acceptance result |
| Candidate 8ab15b4dc74832de43b662299e95a6de303d8aa3 | 227,864,576 | Generation stopped; no large-flow acceptance result |

The guard samples every 0.5 seconds, so a committed growth chunk can cross the limit before cancellation. The cap was never raised, disabled or bypassed. Only the owned process group was stopped and its scratch removed. size-before-guard.json and size-candidate-guard.json preserve actual receipts, and size-before.json / size-candidate.json retain the actual cancellation events.

A separate query-isolation diagnostic then measured the same incident HTTP doors against the real emitted main and candidate Workers. It retained the original 644 components, 644 monitor definitions, 90/9,000 incidents, 90/9,000 incident attachments, 270/27,000 updates and one future maintenance window, with the original SQL expressions. It omitted the unrelated subscriber and component-state-history populations. This is explicitly a smaller diagnostic fixture and is not represented as the full declared fixture or acceptance proof. The committed declaration and its ceilings, growth budgets and count expressions were not edited. It used the same 200 MiB logical guard: main peaked at 19,410,944 bytes and candidate at 21,708,800 bytes.

Each incident door ran three requests; the final warmed request is the harness's measurement. The measured data reproduce incidents-1's diagnostic reads:

| Flow | Main small | Main large | Candidate small | Candidate large |
|---|---:|---:|---:|---:|
| Incident list | 1,805 | 180,005 | 959 | 959 |
| Incident detail | 1,317 | 1,343 | 1,317 | 1,343 |

Every measured response was HTTP 200. The large incident-list read count falls 99.47%, with zero small-to-large growth. Candidate detail reads are unchanged. The list fits the original 5,000-row ceiling and original 10% + 200 growth allowance in this diagnostic. The independent gate must re-measure its own full fixture; this packet does not claim that the guarded full fixture completed.

MEASUREMENTS.json, incident-diagnostic.json, baseline-incident-diagnostic.json, guard receipts and selected emitted incident statements preserve the actual results without authentication/session parameters. The initial cold diagnostic read 982 list rows at each size before warmed application-policy caches; the three-request run yields 959. An earlier query-isolation attempt that still included the full component-state history also hit the guard at 213,938,176 bytes before large measurement; its incomplete result and cancellation receipt are retained under history-isolation-attempt-*. No failed attempt is relabeled a pass.

## Custody, CI and remaining fleet work

The complete candidate was committed with fleet author and committer identity and no co-author trailers. Every commit in origin/main..HEAD, including side parents, was inspected before the first guarded product push. The two candidate commits both use Run Edit Run fleet <fleet@runeditrun.com>. The guarded product push succeeded on attempt one. The product checkout is clean after the browser probe restored its temporary visual edit. No force push, main push, landing, tag, release or deploy occurred.

Verify run: https://github.com/just-every/run-lamp/actions/runs/43544179464
Exact head: 8ab15b4dc74832de43b662299e95a6de303d8aa3
Completed/failure on the exact candidate (ci-status-3.json). The build job 132291450203 passes, including release migration inventory validation. Composer, portability, ownership, public and demo also pass. Runtime 132291806543, delivery 132291806669 and imports 132291806717 fail, with aggregate verify 132295989464 failing downstream.

Runtime fails NOTIFY-006 in tests/e2e/update-reminders.test.mjs:142: expected two captured operator emails after alert intake, observed zero. Delivery fails tests/e2e/helpers/grouped-alerts-flow.mjs:66: expected one grouped-draft operator notice, observed zero. The cause is confirmed independently: src/core/features/intake/repository.ts:207 treats only meta.changes === 1 as a created incident. With a normally preallocated incident reference, D1 reports one changed row before migration 0080 and two afterward, because its counter trigger writes another row. Intake therefore returns incidentCreated=false and suppresses the operator notice even though the draft exists. migration-meta-changes.txt records this exact 1 -> 2 result. The first probe fixture did not preallocate references, so its existing reference trigger produced 2 -> 3; that diagnostic fixture was corrected to match the actual allocation path, with both actual outputs retained. The SQL migration remains byte-identical as required.

Imports fails tests/e2e/sorry-import.test.mjs:213: expected a 60-incident full snapshot, observed the first 50. Its snapshot helper at line 76 still reads only one default /api/app/incidents response. The follow-up must traverse every incident page while retaining the full-document equality, count, undo and erasure assertions; lowering the expected count would weaken the guarantee and was not done.

The explicit continuation lease retains the incidents-1 product code, tests and migration as already pushed plus the RELEASE.json inventory entry for that migration only. The necessary intake repository edit and import-journey pagination adaptation are outside that declared delta. No unprovided ruling was assumed, no test was weakened, and no unrelated product files were edited. A follow-up needs to preserve exactly-once intake notice detection in the presence of trigger writes (prefer the actual inserted-row result over a total-change literal), adapt full-collection test reads to the cursor API, rerun the existing notification/import journeys and obtain a green exact-SHA Verify.

Ten GitHub invocations were used. Run discovery and each status poll were separated by at least 300 seconds. After completion, failed-job metadata was read once and each of the three failed product jobs' logs was read once with gh run view --job --log-failed. No signed-URL blob retries or redundant aggregate log download occurred. All log archive reads succeeded. CI step environment blocks were omitted from the selected public log receipts. The PR body retains its earlier in-progress observation because the budget is exhausted; this final report and ci-status-3.json record the actual failure.

The independent migration gate and full publication scan remain fleet responsibilities. The cloud task explicitly reserves the scan for its own machine. Required scan inputs are retained: full-history clone, public base run-lamp#main, edition just-every/lamp, destination https://github.com/just-every/run-lamp. No scan completion, independent migration-gate pass, acceptance promotion, landing or hosted deployment is claimed here.

Evidence publication is report-only and independent of product READY/PUSHED custody. The explicitly selected complete non-secret packet goes only to refs/heads/evidence/sd-lamp-qgrowth-incidents-2. The cloud returns its exact head for manifest/file-hash verification. No credentials, environment dump, private held-out material, symlink, synthetic session parameter or archive containing authority is selected.

CLAIM INCIDENT-001 PARTIAL points=2 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion
DEFAULT INCIDENT-001: Retain incidents-1's 50 incidents per visible section, stable keyset navigation and complete selected-incident child history.
GAP INCIDENT-001: Clause judgment remains partial. Full-fixture measurement stopped at the unchanged 200 MiB guard; isolated measurements are diagnostic. Independent migration gate, full publication scan and landing remain with the fleet.

## Terminal status

BLOCKED: exact-SHA Verify 43544179464 is red on the absent intake operator notices and the import journey’s first-page snapshot. Correcting these requires files beyond the explicit inventory-only continuation lease. Product 8ab15b4dc74832de43b662299e95a6de303d8aa3 and PR #369 remain preserved; the inventory entry, byte-identical migration rename, local proofs and diagnostic measurements are complete. No READY claim is made.
