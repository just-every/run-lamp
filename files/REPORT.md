# Lamp subscriber-list query growth repair

Product: `just-every/run-lamp`, branch `cloud/sd-lamp-qgrowth-subscribers-1`, head `21500d4b8032db437098a7c1e8cd1b175cea144d`.
PR: https://github.com/just-every/run-lamp/pull/364.
Gate: **required**, because this candidate adds an index migration. The fleet owns the independent landing gate; this packet does not land or qualify a provider installation.

## Plan and scope

The full executed plan is PLAN.md. Started from current main `4271d1caa8f044a0265eb287c660e1777bd5b942`; refreshed main and rebased with autostash before the single candidate commit and product push. Main had not moved. No published history was rewritten. The product checkout is full history for the publication-scan attempt. Every candidate identity, committer and trailer was inspected, including side-parent scope, and passes fleet policy. No co-author trailers remain. The branch was pushed once through the fleet push guard, on its first attempt.

The size flow from adoption branch `cloud/sd-lamp-sizecheck-3` is `GET /api/app/subscribers?limit=50&offset=0`. The current product already applied SQL LIMIT/OFFSET and loaded per-subscriber details. Its missing order index made SQLite scan and sort the whole subscriber directory before applying that limit. The measured list statement read 324,000 rows at large; the existing aggregate capacity count read 1,003. This is the actual root cause on main, rather than an unbounded JavaScript slice.

Changes are limited to the subscriber repository/service/route, their existing public-door directory flow, a numbered migration, the existing migration-setup test, and the regenerated source lock. No other finding's product files change. The migration setup test adjustment is necessary because its old assertion pinned the last migration at 0078; it now checks the actual unapplied range and still requires every missing migration filename and a complete rerun ledger. No assertions were deleted, skipped or weakened.

## Product behavior

- Migration `0079_subscriber_directory_order.sql` adds `subscribers_directory_order_idx(created_at, id)` with `IF NOT EXISTS`. It changes no table, trigger, stored row or existing migration.
- The list retains its oldest-first ordering and explicitly orders equal timestamps by subscriber id, so repeated pages and different page sizes agree. Existing limits remain 1–100 (default 100), offset remains explicit, and every record remains reachable. There was no search or channel-filter query on this strict-schema route; that interface is unchanged.
- The route asks SQL for `limit + 1` records, uses the extra record solely for `hasMore`, and hydrates selections, incident scope, operator attribution and webhook format only for the displayed records. No related detail is fetched for the sentinel.
- Capacity remains the existing SQL aggregate over all pending/active subscriptions, including channels outside the current page. No count is inferred from page length. Deactivated rows remain visible, and erasure behavior is preserved.
- No UI component, layout, CSS or browser interaction changes. Existing visible pagination is retained, so this backend-only round does not require new 1440/390 browser captures.

## Measurement through the emitted Worker

Both runs use published `@runeditrun/rer@0.2.115` against a separate scratch clone's actual production build, with the adoption branch's exact `size-check.json`, `agent-surface.json` and `hosted-check.json`. No size file, workflow, tool pin, ceiling, flow, fixture or exemption was committed to the product branch. All synthetic fixture bytes remain under the 200 MiB input guard. Geometry and read-back totals are unchanged: small 6,782 total rows; large 541,170. Every declared table read back exactly. `measurement-provenance.json` records declaration hashes and equality between measured scratch source and candidate source.

Actual ordinary output: before-size.jsonl and after-size.jsonl. Actual emitted statements, with only disposable synthetic fixture parameters, are in before-statements/ and after-statements/. Both complete ordinary runs exit 1 because the other known findings remain red; the targeted subscriber-list result passes after the repair.

| Flow | Before small | Before large | After small | After large | After result |
|---|---:|---:|---:|---:|---|
| component-list | 4,121 | 182,321 | 4,121 | 182,321 | unchanged failure |
| incident-list | 1,805 | 180,005 | 1,805 | 180,005 | unchanged failure |
| incident-detail | 1,317 | 1,343 | 1,317 | 1,343 | pass |
| component-history | 13 | 511 | 13 | 511 | unchanged failure |
| subscriber-list | 4,299 | 325,059 | 1,109 | 1,109 | pass |
| monitor-list | 653 | 653 | 653 | 653 | pass |
| maintenance-list | 13 | 13 | 13 | 13 | pass |
| minute-tick | 24,219 | 1,671,933 | 24,219 | 1,671,933 | unchanged failure |
| public-summary | 0 | 0 | 0 | 0 | unchanged failure |
| public-history | 0 | 0 | 0 | 0 | unchanged failure |
| public-feed | 0 | 0 | 0 | 0 | unchanged failure |

Subscriber-list answers HTTP 200 at both sizes before and after. Its total reads fall from 4,299/325,059 to 1,109/1,109, with growth from 320,760 to zero. The fixed large ceiling remains 5,000, and the fixed rule remains 10% of small plus 200 (original displayed growth allowance 629; after 310). The list statement itself now reads 51 rows at either size; capacity remains 1,003; operator-attribution reads fall from 51 to 50. Statement count falls from 159 to 156. All unrelated measured row totals and HTTP statuses are identical to before. Four of eleven flows now pass, up from three. Public flows remain HTTP 503 without a retained snapshot; minute-tick retains its native scheduled preparation exception. Those are outside this lease and are not disguised as success.

`callsInRow=3` is retained unchanged in the declaration; these are the published runner's actual per-flow totals, not multiplied estimates. Queue consumers remain held and unmeasured by that runner. Both emitted after statement files pass supported `rer size --migrations migrations/core --statements FILE --json` (exit 0). This is local SQLite structural confirmation, not real D1 provider confirmation. No cloud account, provider resources, customer data or held-out gate material was accessed.

## Validation

- Typecheck passes; product build passes.
- Existing `subscriberDirectoryFlow` passes through native owner/public HTTP doors. It reconciles 106 real Add identities across 100-row and 17-row pages, verifies oldest-first stable order, no duplicates/omissions, correct full-directory eligible channel counts, exact component selections, consent/deactivation facts, empty final pages, invalid bound refusal, owner erasure, anonymous refusal and revoked subscriber authority. The existing registration in `tests/e2e/delivery-contract.test.mjs` is unchanged. The local targeted harness called this same exported flow; no additional test is committed.
- Existing setup-migration test passes after replacing its fixed endpoint assertion with the computed range. Existing auth forward-upgrade cases pass. The technical archive/rollback/restore journey and previous-release backup import journey pass. The first combined invocation reports seven passing cases and the one stale range assertion; setup-migrations-retry.log records its repaired pass. No remaining failure from that combined invocation is hidden.
- The targeted baseline installation-restores-and-upgrades case passes, including previous/current migration ledger, preserved rows and archive recovery. Its first launch overlapped a build and failed resolving stale emitted chunks; migration-ledger-baseline-retry.log records the clean sequential replay. This was an execution ordering mistake, not a product failure.
- An additional disposable upgrade probe applies migration 0079 twice, compares every stored table value, checks indexed EXPLAIN without a temporary sort, and exercises equal-timestamp offset pagination. index-upgrade-receipt.json and index-upgrade.log are actual successful output.
- Initial ad hoc top-level-await Miniflare invocations made no progress and were stopped by their own recorded PIDs. Replaying through the Node test harness completes normally. No shared process was stopped, and all own runtimes are closed.
- Source lock regenerated last, after staging the new migration and all edits; source check passes. Contract generator check passes. Diff whitespace check passes. No full local suite or rer verify was run; exact-SHA Verify is the full wall.
- Registered test budget remains 92 cases plus 10 executable assertion scripts = 102, unchanged and under 200.

The actual logs and validation-receipt.json retain successes, initial failed attempts and their corrections. No test or receipt is fabricated.

## Contract and claims

Before/after contract counts are unchanged: 244 clauses; 60 done / 129 partial / 55 missing. SUB-011 remains partial. No clause text, Status, Gap or Evidence cell, ACCEPTANCE.md or docs/CLAIMS.md changes. This query repair does not promote a clause.

CLAIM SUB-011 PARTIAL points=1,3 tests=tests/e2e/helpers/subscriber-directory-flow.mjs#subscriberDirectoryFlow
DEFAULT SUB-011: retain the current explicit offset pagination, oldest-first ordering, 100-row cap and whole-directory capacity aggregates; add deterministic id ties.
GAP SUB-011: native API flow proves the returned display data, selections and deactivation facts; a fresh rendered operator-view/browser proof and the independent landing gate are not claimed by this backend-only round.

## Release inventory constraint

The later targeted release migration ledger check is red: `node scripts/validate-release.mjs` reports `RELEASE.json migrations must exactly match newly introduced migrations/core in apply order`. Main's RELEASE.json has an empty migration delta; adding required index migration 0079 makes that existing validator require a release migration entry. The brief explicitly leases a numbered migration and forbids release changes. No release file or validator is modified to evade either constraint. `release-migration-ledger-check.log` is the actual failure. The lane needs a ruling or an authorized mechanical release-inventory update before exact-SHA Verify can be green. The product query repair, public-door, database ledger, archive and forward-upgrade checks otherwise pass. Gate remains required.

## Publication and CI custody

The exact committed-tree Base publication scan was attempted with full history, public base `https://github.com/just-every/run-lamp#main`, edition id `just-every/lamp`, and destination `https://github.com/just-every/run-lamp`. It returns **INCOMPLETE**, exit 2, `scan.gitleaks-unavailable` because pinned Gitleaks 8.30.1 is not installed. publication-scan.json is the actual result. This cloud cannot claim the fleet's complete publication/privacy/environment scan; the fleet must perform its independent scan before landing. Candidate identities and messages separately pass their required pre-push check. No secret-bearing environment or credential file is selected into this evidence packet.

Exact candidate push Verify [43540987750](https://github.com/just-every/run-lamp/actions/runs/43540987750) is **completed/failure** on `21500d4b8032db437098a7c1e8cd1b175cea144d`. Total GitHub budget: 7/10 calls (PR create and description update, one discovery, one final status read, one job listing and two failed-job archive invocations). The discovery and final status read are more than 300 seconds apart. One watcher observed the exact push run. github-calls.jsonl and ci-status files are actual REST receipts. PR #364 is left for the lane. No main push, landing, tag, release, workflow rerun or deployment occurred.

Product custody and report-only evidence custody are independent. The complete explicitly selected packet is published only to `refs/heads/evidence/sd-lamp-qgrowth-subscribers-1`; it is never included in the product branch or PR tree. The fleet must retain Gate required and rerun independent gates before landing.

## Exact-SHA failure diagnosis and handoff

Exact candidate Verify 43540987750 completed **failure**. Job `build` 132281289372 fails the release-inventory assertion while the other build-shard commands complete; job `verify` 132281554700 correctly fails on that incomplete build and missing downstream shard artifacts. The shard matrix is skipped. Plan passes. Both failed job archives were retrieved exactly once with `gh run view 43540987750 --repo just-every/run-lamp --job JOB_ID --log-failed`; both transfers succeeded. The logs confirm the same `RELEASE.json migrations must exactly match newly introduced migrations/core in apply order` assertion and show the expected new entry `0079_subscriber_directory_order.sql`. It is not a contract-generator-only failure and does not qualify for READY.

BLOCKED: The required index migration needs a release migration inventory entry, but this brief explicitly forbids release changes. Authorize the mechanical RELEASE.json inventory update in a scoped continuation, regenerate the source lock last, then push a new commit on this same published branch and require its exact-SHA Verify. Do not rebase or force-push this published head. The fleet must also run the complete publication scan and the required index-migration landing gate. No query-repair work was discarded; the product branch is pushed and product.patch is in this report packet.
