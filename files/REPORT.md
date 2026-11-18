# Lamp Sorry import replay

Run Edit Run fleet, 2026-11-18T08:55:54Z. Product branch `cloud/sd-lamp-import-sorry-2-c5` is at `9b5ba66360536dabf23be730e4eddc3e15371e65` on Lamp main `71ab9b43f5069cd612bf998d3a2bf8a32691393b`. The lane can open the integration PR.

## Changes and contract counts

Replayed c4's two commits linearly, preserving main's newer Sorry template support, public branding and contract judgments. The replay uses existing migration `0083_sorry_template_metadata`, then adds `0084_sorry_component_hierarchy` and `0085_sorry_notice_metadata`. The source marker query still has four terms. Recursive group ancestry, authored notice metadata, subgroup affected scope, readable imported paragraphs and safe links, silent import and undo are carried forward. Native closed groups retain the exact `<details class="component-group">` opener that THEME-001 asserts.

The overlap with main's template work touched the field ledger, import rollback lookups and the moving-in guide. The resolved ledger describes both recursive groups and the two template collections. Rollback checks retain template dependency protection and also account for child group links. The release ledger keeps main's MOVE-001 entry and 0083, then adds COMP-002 and the two carried migrations.

The full contract counted 60 done, 129 partial and 55 missing (244 clauses) before and after the replay. COMP-002's requirement and acceptance wording now includes recursive imported groups and original source metadata. MAINT-015's acceptance wording now includes original notice meaning and Sorry automation. The contract keeps COMP-002 partial and MAINT-015 missing. Status, Gap and Evidence text stayed byte-for-byte intact. MOVE-003 and HIST-008 keep their inherited done judgments. The original scoped claim lines below describe the earlier round's Sorry evidence.

## Verification

The Lander-Regenerate writes and checks passed. Generation changed only ACCEPTANCE.md and left CONTRACT.md byte-for-byte intact. The product commit restores both views from main. The committed source lock was regenerated and checked against that tree. For local build verification, the generated views were paired with a fresh temporary lock. After nine ordered build steps passed, all three files were restored to their committed bytes. Both published commits use the fleet author and committer identity with no trailers.

- Ordered build passed 9/9 steps: contract docs, Base copies, source integrity, typecheck, syntax, release metadata, visual-source validation, application and site.
- composer passed 13/13; exit 0.
- public passed 8/8; exit 0.
- cutover passed 1/1; exit 0.
- sorry passed 9/9; exit 0.
- page-data passed 1/1; exit 0.
- THEME-001 on the pinned Playwright headless shell: passed.
- Cutover assertions ran at 1440 and captured twenty screen pairs at 1440 and 390. The image headers and hashes are recorded in CUTOVER-BROWSER-RECEIPT.json.
- Scoped `rer verify` runtime ran test:runtime and test:publishing. Overall command exit was 0.

The synthetic public export reconciled 56 component rows into 52 components and 4 native groups, 53 notices into 43 incidents and 10 maintenance records, and 106 source updates into 106 native updates with zero unexplained differences. The preview ledger accounted for 3,680 fields: 826 mapped, 1,361 changed and 1,493 raw-only. Repeat and undo passed, with reserved reference numbers retained. The authenticated preview accounted for all 1,003 subscribers. Main's template regression probe exercised 27 notice and 27 update templates across both paginated collections.

## CI and handoff

Verify [44269485145](https://github.com/just-every/run-lamp/actions/runs/44269485145) reported completed/failure on the product SHA. Build job 134682275422 stopped at `ACCEPTANCE.md: generated content differs; run contract-docs write`. No test shard ran. The aggregate failed after the build receipt was unavailable. This qualifies for the brief's generated-view exception because every local build step and both browser requirements passed.

The Mac lander performs its publication scan and regenerates the views and source lock on the landing candidate. The current verification plan contains eight test shards plus the shared build, 112 registered cases and 10 assertion scripts.

## Original round's claim lines

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
