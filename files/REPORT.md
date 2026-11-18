# Lamp Sorry import entry 2 c3

## Product replay

Two ordinary commits were replayed on Lamp main `177378a989a7496a2e3dc00ac9a43947efd7c031`. The original source tip was `564366bf4c4dfe477e841d82dd7a409564fa9c7e`. The c2 tip `945b67f0f86820ade33827df2a05532f310ce129` already contained the public snapshot conflict resolution on that base. The c3 replay preserves Lamp’s current page chrome, branding and maintenance time format, and preserves readable Sorry paragraphs, links, recursive groups and source metadata.

The candidate tip is `268d121c326aeb65deefd7c1db06609ede6679d6` on `cloud/sd-lamp-import-sorry-2-c3`. The first save was `a11b01a3676253fc199c52378a9e042982e7b2d1` with `[skip ci]`. Both commits have the fleet author and committer and no trailers. The branch has zero merge commits.

The component hierarchy migration moved from 0083 to `0084_sorry_component_hierarchy.sql`. The notice metadata migration moved from 0084 to `0085_sorry_notice_metadata.sql`. The designated owner-ledger migration retains 0083. Both SQL files preserve their c2 bytes. The migration inventory and COMP-002 release reference use the new filenames. Deployment, portability and the Sorry receipt read the ordered migration directory. Relative to c2, the only tree changes are the two renames, the release references and the regenerated source lock.

## Contract and local checks

The COMP-002 requirement and acceptance points were extended. The MAINT-015 acceptance points were extended. COMP-002 remains published partial and MAINT-015 remains target missing. A comparison of all 244 Status rows confirmed zero status, gap and evidence changes.

| Tier | Before done / partial / missing | After done / partial / missing | Total |
| --- | --- | --- | ---: |
| Core | 60 / 129 / 50 | 60 / 129 / 50 | 239 |
| Agent surface | 0 / 0 / 5 | 0 / 0 / 5 | 5 |
| Later | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| Full target | 60 / 129 / 55 | 60 / 129 / 55 | 244 |

The seed’s contract generator wrote the local acceptance view and its check passed. All nine local build steps passed in order with the generated view and corresponding local lock on Node 22.20.0 and pnpm 10.12.4. The product commit kept both tracked views from main, and the final source lock was generated and checked against that tree.

1. `check:contract-docs`
2. `source:copies`
3. `source:check`
4. `typecheck`
5. `check:syntax`
6. `validate:release`
7. `verify:visual:source`
8. `build:app`
9. `build:site`

The imports run and Cutover passed 13 tests in total. These include built-output Sorry receipt verification, nested subgroup scope, and silent apply and undo. Cutover asserted at 1440 and captured 15 Sorry screens at both 1440 and 390. The public hierarchy and incident captures show the current chrome, nested groups and readable paragraphs with a recovery link.

The public contract and Page data portability run passed seven tests, including the no-script imported history, complete public catalogue and restoration of verified consent.

## Candidate custody

The final product push completed at 06:55:12 UTC on 18 November 2026. Main was fetched immediately before the push and still matched the replay base. The branch ref and PR both reported the full product SHA. [PR #418](https://github.com/just-every/run-lamp/pull/418)

## Full-scale synthetic receipt

The unsigned generated-fixture proof passed authenticated and public preview, silent apply, repeat and undo on the exact candidate. Each mode reconciled 56 source component rows to 52 native components and four groups, 53 notices to 43 incidents and ten maintenance windows, and all 106 updates. The authenticated proof reviewed 1,003 subscriber rows and retained 994 eligible addresses in held state. The field ledgers accounted for 23,974 authenticated paths and 3,680 public paths. Both modes recorded zero unexplained differences. The original round’s narrower claim below is retained verbatim.

## Exact-SHA GitHub Verify

Push Verify 44254900494 and PR Verify 44255005311 completed with failure on the candidate SHA. The failed-job archives show that both build jobs stopped at `node src/base/contract-docs.mjs check` because the tracked `ACCEPTANCE.md` needs regeneration. The build receipt was absent, all eight matrix jobs skipped and each aggregate recorded 0 of 9 completion records. The archives show no other primary Verify failure. The separate dynamic PR check 44255002112 succeeded. [Push Verify](https://github.com/just-every/run-lamp/actions/runs/44254900494) · [PR Verify](https://github.com/just-every/run-lamp/actions/runs/44255005311)

The cloud generated-view handoff rule applies after all nine local build steps passed and the GitHub failure was traced to the lander-owned acceptance view. The fleet lander owns publication scanning, regeneration and a fresh Verify after regeneration.

Supplemental full local `rer verify` passed the build, ownership and portability shards in a disposable checkout. It was stopped during the repeated imports run after the independent scoped import, public, portability, browser and synthetic checks had passed. The remaining supplemental shards have no local completion claim.

## Original round’s reported lines

CLAIM MOVE-001 PARTIAL points=2 tests=tests/e2e/sorry-documented-export.test.mjs#documented Sorry exports account for every field through preview, saved jobs and explicit refusals; tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover
CLAIM MOVE-002 PARTIAL points=1,2,3 tests=tests/e2e/sorry-import.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 — Sorry move-in, Business approval, bounded catch-up, original archive, cutover and erasure remain one recoverable owner flow; tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover
CLAIM MOVE-003 PARTIAL points=1 tests=tests/e2e/sorry-import.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 — Sorry move-in, Business approval, bounded catch-up, original archive, cutover and erasure remain one recoverable owner flow; tests/e2e/sorry-reconciliation.test.mjs#MOVE-001 Move in explains how Sorry component rows arrive as components and groups
CLAIM MOVE-004 PARTIAL points=1,2,3 tests=tests/e2e/sorry-reconciliation.test.mjs#MOVE-001 Move in explains how Sorry component rows arrive as components and groups; tests/e2e/sorry-import.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 — Sorry move-in, Business approval, bounded catch-up, original archive, cutover and erasure remain one recoverable owner flow
CLAIM MOVE-005 PARTIAL points=1,2,4 tests=tests/e2e/sorry-import.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 — Sorry move-in, Business approval, bounded catch-up, original archive, cutover and erasure remain one recoverable owner flow; tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover
CLAIM COMP-002 PARTIAL points=1,2 tests=tests/e2e/sorry-reconciliation.test.mjs#MOVE-001 Move in explains how Sorry component rows arrive as components and groups; tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover
CLAIM COMP-009 PARTIAL points=3 tests=tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover; tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
CLAIM MAINT-015 PARTIAL points=2,3 tests=tests/e2e/sorry-import.test.mjs#MAINT-015 — Sorry maintenance labels use authored source states and keep missing states neutral; tests/e2e/page-data.test.mjs#Page data restores verified consent and holds unverified addresses until confirmation
CLAIM HIST-008 PARTIAL points=1,2,3,5 tests=tests/e2e/public-contract.test.mjs#HIST-008 — reviewed imported history stays completely browsable without scripts; tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover
DEFAULT COMP-002: Preserve one native group per source parent; original source state is labeled metadata, not a duplicate monitored component.
DEFAULT MAINT-015: Missing Sorry automation is off; unavailable authored lifecycle and actual start remain unavailable. Normal native owner reminders remain separate from silent customer history import.
DEFAULT MOVE-002: Import never activates an outbound customer notification or replays a source publication.
GAP MAINT-015: The pre-existing Statuspage automatic-start/completion preservation gap remains outside this Sorry round; no whole-clause DONE claim.
GAP MOVE-001: Full-scale authenticated 1003 subscriber apply is not rerun here; authenticated full preview and generated public apply/repeat/undo are proven, with existing small subscriber erasure/catch-up tested.
GAP external: None held; no real account/export/provider assertion is fabricated.
EVIDENCE: Actual complete selected packet is published only on evidence/sd-lamp-import-sorry-2; product custody is independent and recorded separately.
