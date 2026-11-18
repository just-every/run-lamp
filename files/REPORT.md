# Lamp Sorry import entry 2 replay

The cloud branch `cloud/sd-lamp-import-sorry-2-c2` was pushed once at `945b67f0f86820ade33827df2a05532f310ce129`. PR #417 targets the main revision `177378a989a7496a2e3dc00ac9a43947efd7c031`, fetched again before the push. The remote returned the exact candidate SHA. Both linear commits use the fleet identity and have no trailers. [PR #417](https://github.com/just-every/run-lamp/pull/417)

## Replay and generated documents

- Confirmed historical tip `564366bf4c4dfe477e841d82dd7a409564fa9c7e`. Replayed `28fe21dfb4abf70a3c26dfe512b2097d9fdb5c63` as `e437a337ebcaa0edfa695628ad917e3219dc9fb8`, and `564366bf4c4dfe477e841d82dd7a409564fa9c7e` as `945b67f0f86820ade33827df2a05532f310ce129`. The replay has two ordinary commits and no merge commits.
- Kept main’s maintenance time formatter, public branding and chrome. Added the replayed source metadata beside that rendering. The historical patch and the replay affect the same 52 paths. Only the public record conflict resolution and regenerated source lock differ in content from the historical patch. Migrations `0083_sorry_component_hierarchy.sql` and `0084_sorry_notice_metadata.sql` retained their numbers.
- Extended the COMP-002 requirement and both clauses’ acceptance text. COMP-002 stays published partial. MAINT-015 stays target missing. Status, Gap and Evidence cells and acceptance-point counts are unchanged. The release validates with the existing COMP-002 change entry and both migration entries.
- Ran the seed’s `contract-docs write` and `check`. Only the local ACCEPTANCE.md changed during regeneration. The candidate restored ACCEPTANCE.md and docs/CLAIMS.md from main and regenerated and checked the final source lock against the committed tree. The locally generated tree also had a matching lock during build verification.

| Contract tier | Before done / partial / missing | After done / partial / missing | Total |
| --- | --- | --- | ---: |
| Core | 60 / 129 / 50 | 60 / 129 / 50 | 239 |
| Agent surface | 0 / 0 / 5 | 0 / 0 / 5 | 5 |
| Later | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| Full target | 60 / 129 / 55 | 60 / 129 / 55 | 244 |

## Local and GitHub verification

The nine ordered local steps passed on pinned Node 22.20.0 and pnpm 10.12.4 with the regenerated view. See `BUILD.log` and `LOCK.log`.

1. `check:contract-docs`
2. `source:copies`
3. `source:check`
4. `typecheck`
5. `check:syntax`
6. `validate:release`
7. `verify:visual:source`
8. `build:app`
9. `build:site`

The imports suite passed 13 tests, including the built-output Sorry receipt, recursive subgroup affected scope, silent apply and undo, frozen-clock maintenance, and Cutover browser tests. Separate Cutover passed and recorded 15 Sorry screens at 1440 and 390, with assertions at 1440. The public snapshots show readable update paragraphs, a safe recovery link, and the current page chrome. Page-data restore and consent passed. The initial public test invocation missed the Playwright executable variable. The retry used both test-specific variables with system Chromium and passed all six public-contract tests.

The full-scale unsigned synthetic receipt on the exact candidate passed authenticated and public preview, silent apply, repeat and undo. Both fixtures reconciled 56 component rows to 52 components and four groups, 53 notices to 43 incidents and 10 maintenance records, and 106 updates to 106 native updates. The authenticated fixture reviewed 1,003 subscriber rows and left 994 eligible addresses held. The authenticated ledger accounted for 23,974 paths and the public ledger for 3,680. Both recorded zero unexplained differences. The original report’s narrower authenticated gap is quoted below as historical context. This replay used generated fixtures.

Both exact-SHA Verify runs completed with failure. Their build archives report that `contract-docs check` found the lander-owned ACCEPTANCE.md stale. The early exit prevented the build completion artifact and skipped eight test jobs. The final aggregate had zero of nine planned completion records. The cloud brief’s generated-view-only rule applies because all nine local build steps passed. The fleet still needs to regenerate the views and obtain a genuinely green Verify for its landing commit. [Push Verify](https://github.com/just-every/run-lamp/actions/runs/44244289501) · [PR Verify](https://github.com/just-every/run-lamp/actions/runs/44244319410)

A supplemental full local `rer verify` passed its build and ownership shards, then was stopped during the wider portability shard after the requested build and touched journeys completed. That run logged a dev fixture warning about the SnapshotCache binding and did not yield a completed portability result. The focused page-data restore had already passed. See `RER-VERIFY.log`.

The publication scan and landing remain with the fleet. This task created no main commit, tag, release or deployment.

## Original round’s reported claims, defaults, gaps and evidence

These lines preserve the historical report verbatim. The candidate’s clause judgments follow the table and replay notes above.

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
