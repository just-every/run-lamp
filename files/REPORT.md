# Lamp minute-tick repair: partial, measured blocker remains

Product branch: `cloud/sd-lamp-qgrowth-tick-1`.
Candidate: `7d3c98681313082a83752abe8d1c4b6f4f7c92fb`.
Base: `4271d1caa8f044a0265eb287c660e1777bd5b942`.
Draft PR: https://github.com/just-every/run-lamp/pull/365.

The candidate is pushed and is **not READY**. The assigned size check still fails. It reduces minute-tick reads by 92.66% at large, but neither measured installation publishes a snapshot. Small exceeds the existing 25 MiB retained-bundle limit; large exhausts workerd's JavaScript heap while rendering the complete artifact set. Public summary/history/feed remain 503. Nothing was truncated, fabricated, seeded as a snapshot, or exempted. `PLAN.md` contains the complete plan and the remaining architecture work.

## Product changes

- Snapshot loading conditionally persists a fresh feed identity when the settings row still has the migration's `pending-feed-identity` placeholder (or an empty identity). Competing builders reread the winning persisted value; retries do not rotate it. No fixture or snapshot is seeded.
- Snapshot joins use unique group-column aliases and select only the needed attachment columns. Published rer's meter obtains `raw()` data through `all()` and therefore collapses duplicate SQL names. The old ungrouped component query lost names/order and threw in `compareComponentOrder`. The harness is unchanged; the product query is now unambiguous under both D1 result forms.
- The uptime renderer already ignores `cause_type='correction'` audit history and reads correction intervals separately. The repository now omits those unused audit rows with a partial index, preserving all observation/correction behavior.
- Source/renderer preparation runs once per build. Deterministic preparation failures remain durable pending work for a later tick; only delivery of prepared immutable bytes to storage/replica/pointer is immediately retried. This avoids rereading the same history three times after an unrepairable renderer failure.
- Scheduled default-policy report reminders filter eligible severity/age in SQL, using a due index. Historical-only imported incidents remain silent; replaceable nondefault policies retain the prior unrestricted policy evaluation. Existing due-day/weekly/waiver/publication assertions pass.
- Additive, idempotent migration `0079_scheduled_work_indexes.sql` indexes held-subscriber expiry, usable uptime observations, active/unresolved incidents and severe report due work. All previously applied migration bytes are unchanged. **Gate: required**, fleet gate pending.
- Existing public recovery flow now exercises placeholder recovery and the published meter's named-row boundary, with two ungrouped components, stable feed identity and settled idle snapshots. No test registration was added. The existing setup migration test derives the unapplied range instead of pinning its last number.

No adoption file, size fixture, ceiling, contract text, Status/Gap/Evidence cell, generated view, homepage, version pin, release metadata or unrelated finding's product path was changed. `sources.lock.json` was regenerated last after staging the migration and all touched source/tests.

## Reproduction and measured results

The real emitted production Worker ran in disposable local D1/R2/DO installations. Published `@runeditrun/rer@0.2.115` was installed through npm; its exported CLI main was invoked through `/tmp/rer115.mjs` because the global `npx rer` dispatcher otherwise selects this repository's unchanged 0.2.108 pin. Command:

```
cloud_run env CI=true node /tmp/rer115.mjs size --no-queue --json --write-statements <packet statement directory>
```

`CI=true --no-queue` avoids the shared CLI job queue in this dedicated VM; it does not bypass a test or change the declaration. Shape and owner declaration came unchanged from `origin/cloud/sd-lamp-sizecheck-3`. Declaration bytes: 10,488, below the 200 MiB synthetic-input guard. SHA256: `60e2c2ab6d35aa9dce8312d19d50f3bd512812ebb850cb7c8f4566da3a4a9c59`. No database/WAL cap was invented. Synthetic input only; no provider account, production data or network effects. Queue consumers remain held/unmeasured by the published runner.

Baseline `before-size.jsonl` reproduces the brief exactly. Final product behavior is recorded by `alias-size.jsonl` (including the actual fatal-runtime output), parsed `after-size.json`, and emitted `after-statements/{small,large}.json`. This measurement used the final product code and migration; subsequent edits only strengthened test coverage and regenerated the source lock.

| Flow | Before small | Before large | After small | After large | Final result |
|---|---:|---:|---:|---:|---|
| component-list | 4,121 | 182,321 | 4,121 | 182,321 | unchanged, outside lease |
| incident-list | 1,805 | 180,005 | 1,805 | 180,005 | unchanged, outside lease |
| incident-detail | 1,317 | 1,343 | 1,317 | 1,343 | unchanged, pass |
| component-history | 13 | 511 | 13 | 511 | unchanged, outside lease |
| subscriber-list | 4,299 | 325,059 | 4,299 | 325,059 | unchanged, outside lease |
| monitor-list | 653 | 653 | 653 | 653 | unchanged, pass |
| maintenance-list | 13 | 13 | 13 | 13 | unchanged, pass |
| minute-tick | 24,219 | 1,671,933 | 6,853 | 122,680 | fails status, ceiling and growth |
| public-summary | 0 (503) | 0 (503) | 0 (503) | 0 (503) | fails status |
| public-history | 0 (503) | 0 (503) | 0 (503) | 0 (503) | fails status |
| public-feed | 0 (503) | 0 (503) | 0 (503) | 0 (503) | fails status |

Fixture readback is exact. Baseline total rows before flows: 6,782 / 541,170. Candidate: 6,783 / 541,171; the extra row is the additive migration ledger entry. Explicit fixture geometry is unchanged. The minute ceiling remains 40,000; public ceiling 1,000; growth remains 10% of small +200. Zero D1 reads paired with 503 do not qualify a public-route pass. Large minute-tick's 122,680 reads are the reads measured before the fatal renderer failure, not a successful-run bound.

## Actual safe exception receipts

`diagnostic-errors.json` captures the original native scheduled failure at large:

```
Error: Public snapshot build failed after 3 attempts: Lamp requires a persisted feed identity before rendering feeds.
```

After repairing identity, `identity-diagnostic-errors.json` and `second-diagnostic-errors.json` identify:

```
TypeError: Cannot read properties of null (reading 'localeCompare')
at compareComponentOrder -> sortComponentsByOrder -> groupComponentsByHeading -> componentHealthMarkup
```

After unambiguous joins, `final-small-diagnostic-errors.json` captures:

```
Error: Retained snapshot exceeds the 25 MiB retained bundle limit.
```

The actual large final ordinary run emits:

```
V8 fatal error; location = Reached heap limit; message = : allocation failed: JavaScript heap out of memory
```

Its published scheduled result is `Native scheduled preparation failed (fetch failed)`. Scratch-only error instrumentation records class/message/stack in a scratch diagnostic table and reads only that diagnostic and snapshot build status/error; no fixture rows, bindings, keys or environment values are dumped. Authoritative ordinary measurements use the untouched published runner and uninstrumented product build. Instrumentation is not in a product commit.

## Validation and custody

Passing touched checks: typecheck; existing PAGE-005 public release/recovery journey with named-row regression coverage; AUTO-004/HIST-003 report reminder journey; retained snapshot outage/recovery journey; setup migration/ledger refusal-and-recovery test; auth forward-upgrade tests; owner SQL archive/restore journey. Actual logs are selected in the packet. The first migration batch found the old setup test's pinned `0061-0078` range; it was replaced by the computed end of the shipped migration list, and the same behavior test then passed. No existing assertion was removed or weakened.

The populated release forward-upgrade was rerun after the exact final commit so migration 0079 is tracked in its candidate source. Its final receipt follows below. Verification inventory is unchanged: 92 registered cases plus 10 assertion scripts =102 checks, below 200. No UI changes or browser screenshots were needed. No full local verify or broad suite was run.

Full Git history was fetched for the requested scanner. The installed Base scan used exact HEAD, public base `https://github.com/just-every/run-lamp#main`, edition `just-every/lamp` and destination `https://github.com/just-every/run-lamp`. Both attempts returned **INCOMPLETE**, `scan.gitleaks-unavailable`, requiring Gitleaks 8.30.1. `publication-scan.json` is the actual receipt. This cloud does not claim the independent fleet/Mac publication scan or its private proof; that gate must run before landing.

Fleet author/committer identity and all candidate trailers, including all parents, were audited before both guarded pushes. First save `4c0053d848a2be76be6fb20edf0427fb28bca504` carries `[skip ci]`; final candidate has no skip marker. Main was fetched and merged after the save; no drift occurred. Product push logs are actual receipts. No force push, default-branch push, landing, tag, release or deployment occurred. The PR is deliberately draft.

Contract counts before/after: 244 clauses; 60 done /129 partial /55 missing, unchanged. Clause status changes: none.

CLAIM PAGE-005 PARTIAL points=none tests=tests/e2e/public-contract.test.mjs#PAGE-005 — a new release rebuilds the stored public page once, retries pending work, advances past a reset database and keeps pre-launch
CLAIM HIST-003 PARTIAL points=1 tests=tests/e2e/update-reminders.test.mjs#AUTO-004 HIST-003 — both severe incidents become report-due at seven days and reviewed publication or reasoned waiver stops weekly reminders
CLAIM AUTO-004 PARTIAL points=1,2,3,4,5,6 tests=tests/e2e/update-reminders.test.mjs#AUTO-004 HIST-003 — both severe incidents become report-due at seven days and reviewed publication or reasoned waiver stops weekly reminders
GAP PAGE-005: complete historical snapshot publication still exceeds retained-bundle capacity at small and exhausts renderer memory at large; the assigned public routes remain 503 in the unchanged size harness.
GAP AUTO-004: a default-policy query improvement does not qualify the entire minute handler's growth; full cold snapshot generation still reads historical publication data.
DEFAULT size-input-guard: apply the specified 200 MiB guard to the unchanged synthetic declaration, following the inherited published harness; do not invent a live SQLite file limit.

The remaining architecture must partition complete historical source/render/retention work and preserve all public records and outage guarantees. An index cannot make a cold full-history snapshot independent of accumulated publication count. This lease only authorizes a numbered migration for an index; durable change-capture/backfill schema requires a broader ruling. No snapshot limit or flow ceiling was increased and no partial generation was exposed.

## Exact-SHA CI and terminal result

Push Verify run `43541473413` is on exact candidate `7d3c98681313082a83752abe8d1c4b6f4f7c92fb`. REST discovery and later status receipts are retained. The scratch size harness is not adopted on this branch, so a green ordinary Verify cannot make the measured red flows pass.

Populated forward-upgrade and archive proof passed on the exact candidate: `forward-upgrade-receipt.json` records target SHA `7d3c98681313082a83752abe8d1c4b6f4f7c92fb`, no working changes and added migration `0079_scheduled_work_indexes.sql`. Both local builds and synthetic provider-edge journeys completed; no account/provider call was made. Local toolchain from the required script was Node 24.19.0 / pnpm 10.12.4; hosted CI uses the repository's own Node pin.


Exact-SHA Verify **completed failure**: https://github.com/just-every/run-lamp/actions/runs/43541473413. One watcher used discovery and one final status call more than 300 seconds apart. The plan passed; build job `132282822024` failed only `validate:release`: `RELEASE.json migrations must exactly match newly introduced migrations/core in apply order`, actual `[]`, expected `['0079_scheduled_work_indexes.sql']`. Typecheck, source integrity/copies, syntax, contract generation, production Worker build and site build passed in that job. Test shards were skipped because the shared build verdict was red. Aggregate job `132283054986` failed for the missing shard artifacts.

The brief explicitly says **no pin or release changes**. `RELEASE.json` was therefore left untouched. Completing the migration inventory is a concrete additional ruling required before this candidate can pass ordinary Verify; no validator was weakened. This is a genuine red check, not the permitted generated-contract-view exception. Local populated forward upgrade does include and pass the additive migration, independently of release inventory metadata.

Both failed jobs were read exactly once using the required `gh run view ... --job ... --log-failed` archive command; both transfers succeeded. `ci-build-failure-excerpt.log` preserves the complete relevant release-validation failure, and `ci-aggregate-failure.log` the cascade. GitHub API/archive budget: **6/10** calls (PR creation, exact-SHA discovery, final status, jobs, two failed-job archives). No workflow dispatch, rerun, unrelated-SHA substitution, blocked-blob retry or additional polling occurred.

Terminal result: **BLOCKED** on the measured snapshot-capacity/growth failures and the release-inventory prerequisite outside this brief's allowed changes. Product commits and the draft PR remain preserved for the lane; no READY or acceptance/landing claim is made. Evidence publication is separate report custody and does not qualify the product.
