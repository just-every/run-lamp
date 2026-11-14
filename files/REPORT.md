# sd-lamp-qgrowth-tick-2-fix1

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-tick-2-fix1
Product head: 8bc4c80dfa69b4371c2d913f87227570df2007ed
Predecessor: 9fec60c9129dc05eea8ba21ca49d6bb3596fe9d6
Merged current main: bef5115afc3972d78962fbb899a2a32433f5f3a6

## Result

Fixed stage finding R4c/P3: initial bounded snapshot selection now applies the archive's existing public membership predicate before selecting the newest 50 resolved incidents or completed/cancelled maintenance windows. Internal-only records cannot consume a public history slot. Report and maintenance-notice hydration reuse the same bounded selections. The current active-record selection and public rendering, feed ordering, summary, archive cursor ordering and 50-record page size remain in place. No unbounded history scan was restored.

The candidate is one merge commit with current main as first parent and the exact frozen tick candidate as second parent. It retains main's subscriber migration 0079, test assertions, XML sanitization fix and Vite dependency pin. Migration 0081 is byte-identical to the predecessor; 0080 remains reserved and absent. RELEASE.json records both introduced migrations while preserving main's version and other metadata. Main's setup-migration test wins its conflict whole. sources.lock.json was regenerated last and its check passed.

No CONTRACT.md Status, Gap or Evidence changes; no contract text or generated-view changes. No homepage, new dependency bump, release version, tag, deployment, landing or acceptance claim. Seven candidate commits, including all six predecessor side-parent commits, have fleet author and committer identities and no co-author trailers.

## Plan and implementation

The complete original execution plan is in PLAN.md. The implemented steps were:

1. Read launcher and repository instructions; install fleet credential helper, push guard, identity and preserved commit hooks; clone shallow with blob filtering, then unshallow for history custody.
2. Branch from current main and merge exact frozen predecessor without rewriting either published history. Resolve release inventory with both 0079 and 0081 and retain main's newer test assertions and metadata.
3. Add an isolated source fixture to the existing HIST-001 native-history journey, with no new registration. It creates exactly 51 recently resolved, non-deleted incidents in April 2031, one internal-only among the newest 50, 50 public in total, and no completed maintenance. Source rows are synthetic; application code is real. The script-disabled Chromium browser follows public /history and any advertised Older history links. It compares complete unique public permalink membership and checks private title, update, component name and permalink absence.
4. Run the fixture before the product fix, then share archive membership predicates with initial bounded selection and hydration. Document that public membership precedes the limit.
5. Regenerate source lock, commit once, run only affected history/retained-snapshot journeys plus typecheck and metadata checks. Preserve existing larger cursor/feed fixtures and full-size ceilings unchanged. Push the named branch with fleet identity and guarded transport.
6. Observe exact-SHA Verify with REST within the call budget, leave a PR for the lane, and publish explicitly selected reports, receipts and browser proof only to the evidence ref. Mac publication and independent gates remain separate.

## Before and after proof

The before probe ran in the integrated workspace with the original predecessor snapshot selection still in place, before the product fix. This is a source-level before/after probe, not a claim that the entire before workspace was a clean frozen commit.

- Before: 49 public records, 49 unique, expected 50, one document, zero private disclosures; no Older history link. The assertion names missing /incidents/INC-9550.
- After: all 50 public records, 50 unique, expected 50, one document, zero private disclosures. The internal-only incident permalink returns 404.
- The existing larger native-history fixture still follows Older history links over multiple bounded pages, verifies all records exactly once including tied timestamps, checks permanent records, and traverses global/component feeds and native API collections.
- The existing HIST-008 reviewed-import journey still reaches all five configured-zone months in both directions, all four resolved incidents and two completed maintenance windows, correct native month vs Sorry alias behavior, and working public permalinks without scripts, cookies or foreign requests.
- Assertions run at 1440. Screenshots show the changed history document at 1440 and 390, plus existing history and imported-month documents. No new interface design was introduced.

Actual before failure is in before.log. Actual after run is in history-journeys.log. Browser proof is under before/ and after/.

## Validation

- node --test --test-concurrency=1 --test-name-pattern='HIST-001|HIST-008' tests/e2e/public-contract.test.mjs: PASS, 2 tests, 0 failed/skipped, 36.2 seconds. This includes the new regression within the existing native-history registration.
- node --test --test-concurrency=1 tests/e2e/snapshot-retained.test.mjs: PASS, 1 test, 0 failed/skipped, 11.8 seconds; native snapshot survives database/storage/queue failures and cold restart.
- pnpm run typecheck: PASS.
- node scripts/edition-authoring/cli.mjs check: PASS after lock generation and again on committed HEAD; source-check-receipt.json records the actual result.
- node scripts/validate-release.mjs: PASS, release 1.11.15.
- assertReleaseMigrationInventory: PASS, 79 SQL files; 0079 and 0081 present, 0080 absent. The fixture runtime also successfully applies every core SQL migration to isolated D1. No private fleet migration_check helper was supplied; the actual repository release-ledger check is recorded in migration-inventory.json.
- node src/base/contract-docs.mjs check: PASS; generated views are current and untouched.
- Verification inventory: main 93 registered cases + 10 assertion scripts = 103; predecessor 92 + 10 = 102; candidate 93 + 10 = 103. The one-case increase from the predecessor comes from merging main's existing site-reader security test, not this fix. The regression extends the existing registration.
- Current-main CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md, package.json, pnpm-lock.yaml and setup-migrations.test.mjs are byte-identical on the candidate.
- Migration 0081 is byte-identical to the predecessor. Existing ceiling and fixture assertions were not deleted, skipped or weakened.

## Publication and gates

The product branch push succeeded on its first attempt. Main/default branches were never pushed. The publication command used full local Git history, --public-base https://github.com/just-every/run-lamp#main, --project just-every/lamp and --repository https://github.com/just-every/run-lamp. It returned INCOMPLETE / scan.gitleaks-unavailable. This cloud cannot provide the fleet's COMPLETE publication scan; exact-tree full-history publication custody remains pending on the Mac before landing. publication-check.json is the actual incomplete result, never a pass receipt.

Independent frozen-rubric stage gate has NOT RUN on this head. The original frozen rubric remains fixed and was not read as remote input. No held-out gate files are included in this packet. No stage, scale, production, outside-user or visual acceptance is claimed. The required independent stage re-gate follows this refreshed head; production/outside-user/visual Opus remains owed. Incident-list/intake repairs and the other unlanded incident migration were not merged.

Clause statuses: unchanged. This fix supplies partial evidence for HIST-008 point 3 and preserves inherited history behavior. It does not independently re-prove every HIST-008 point, hosted snapshot availability or the entire inherited tick scope.

CLAIM HIST-008 PARTIAL points=3 tests=tests/e2e/public-contract.test.mjs#HIST-001 — completed native records retain their month, window, components and complete publication inventory; tests/e2e/public-contract.test.mjs#HIST-008 — reviewed imported history stays completely browsable without scripts
GAP HIST-008: Independent frozen-rubric stage re-gate and production/outside-user/visual review remain owed; no contract judgment was changed.

## Terminal product custody

PR: https://github.com/just-every/run-lamp/pull/376

Exact-SHA Verify run 43581570724: completed / success; https://github.com/just-every/run-lamp/actions/runs/43581570724

Terminal status: READY branch=cloud/sd-lamp-qgrowth-tick-2-fix1 head=8bc4c80dfa69b4371c2d913f87227570df2007ed

The product remains gated by the Mac COMPLETE publication scan and the required independent frozen-rubric stage review. READY/PUSHED is product custody, not acceptance, landing or evidence publication. The clean pushed owned clone is removed after evidence transfer verification; the packet stays outside the clone.
