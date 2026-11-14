# Lamp audit subject labels

Repository: just-every/run-lamp
Branch: cloud/main-lamp-audit-record-labels-1
Baseline: 429a46081ce68bab2dbdae46b8402b8ccce3ee2a (Lamp 1.11.16)

## Reproduction

The native public POST /subscribe door created an email subscriber; the local operator confirmation door made it active. The native CSV preview/apply/invite doors created two pending subscribers and invitation/mail history. Native incident draft/publication/resolution and report draft/save/publication doors created a published report. Settings > Audit log > Open audit log then reproduced the stranger finding on unmodified product source. The extended existing journey failed because the active subscriber's subscription-mail row read Removed item. Desktop and phone screenshots also show both pending subscribers, their invitation and import rows, the import batch and the published report falsely labeled Removed item (nine live-subject rows).

## Implementation

Audit names resolve at read time from live native subjects, through the existing shared query used by the JSON view and CSV. Subscribers use subscriber_directory, preserving email/phone/webhook destinations, the list's Slack/Teams channel labels, incident-scoped addresses and tombstone exclusion. Reports join their owning incident and include its reference and title; waiver events use their incident ID. Soft-deleted incidents cannot restore report titles.

The same omission affected other event families. Current component history, template component sets, alert sources, metrics, vendor dependencies, management tokens, channels and social accounts resolve their existing names. Settings, subscriber CSV batches, sign-in, access and other event subjects have meaningful non-removal labels. Missing native subjects retain the anonymous Removed item fallback. No audit event, historical entry, migration, admission rule, filter, pagination, erasure or retention behavior changed.

DIVERGENCE.md records the presentation requirement. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are untouched. No status promotion is requested.

## Proof and counts

The existing audit journey is extended, with no added registrations. It checks active subscriber mail, pending import/invitation/mail subjects, published report reference/title, other existing record families, exact row/name parity in CSV, actor/action/time filtering, complete ordered pagination, deletion attribution and anonymous subscriber erasure. It retains original operator-erasure, machine-key and soft-deleted-publication assertions. Erasure checks both System and operator history, the refreshed view and the full CSV. Browser assertions run at 1440; visual proof captures the audit screen at 1440 and 390 before and after erasure.

Baseline/current registration counts: 93 -> 93 cases; 10 -> 10 assertion scripts; total 103 -> 103 (cap 200). Clause summary counts remain 60 done, 129 partial, 52 missing. TEAM-007 stays PARTIAL. The original fixture's falsely removed live-subject rows change from nine to zero.

## Scope and remaining gaps

No migration, provider credentials or ruling is needed. TEAM-007's existing gaps for logo changes, standing-claim removal without aggregate state change and archive-restored subscriber expiry remain. Roles, rules and token authority belong to their existing clauses. The fleet's independent Mac publication scan and landing workflow remain required. Product publication and evidence transfer are separate.

The full execution plan is PLAN.md. Actual command outcomes, product provenance and CI observations are recorded in receipt.json and the selected logs. No credentials, environment dumps, private gate material or symlinks are included.

## Local validation

- Extended audit and existing roles/permissions audit journeys: 2 passed, 0 failed (63.9 seconds), through Chromium /usr/bin/chromium with --no-sandbox.
- pnpm run typecheck: passed.
- node src/base/contract-docs.mjs check: current, zero errors/warnings.
- node scripts/verification/check-plan.mjs: 103 checks, unchanged.
- node scripts/edition-authoring/cli.mjs lock, then check: passed; source lock regenerated last.
- git diff --check and changed-diff credential-shaped-value check: passed.
- Fetched main and rebased with the fleet identity before committing: main remained 429a46081ce68bab2dbdae46b8402b8ccce3ee2a; no conflicts.
- All candidate author/committer identities and messages inspected, including side parents: one fleet-authored commit, no trailers.

Product pushed successfully on the first guarded attempt: 577fa7ff9172b8921e6c4e2605ebb83f7b604d7c. Exact-SHA Verify run 43646243127 is being observed by one REST watcher at 300-second intervals. One preceding discovery used an incorrect SHA, returned no runs, and supplied no evidence; that call is counted in the ten-call budget.

CLAIM TEAM-007 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys

## First Verify result and repair

Exact-SHA Verify 43646243127 completed with build and seven product shards green, including composer (the changed audit browser journey). The public shard failed at tests/e2e/helpers/subscriber-add-flow.mjs:93 because an older privacy assertion required an active subscriber's entire audit response to contain no destination. That expectation conflicts with this brief's explicit live subject naming. The same expectation existed for token-created subscribers and SMS additions.

The repair preserves and strengthens the privacy guarantee: existing journeys now assert live read-time labels equal current directory destinations, inspect persisted audit entries to prove destinations/contact addresses are never copied there, and additionally check that erased destinations disappear from both the audit API view and CSV. The original full retained-storage erasure assertions remain intact. No user-visible flow assertion is deleted or skipped. The local subscriber-consent journey and typecheck are rerun before the second real commit.

The local reproduction subsequently reached and confirmed the equivalent old SMS response assertion. It was repaired on the same storage/projection distinction, retaining all SMS consent, signed callback, suppression and storage-erasure checks and adding erased audit/CSV checks. The final touched journeys are rerun after the repair and merge.

Before the second candidate, main advanced to 280a76e and was merged without rewriting the published product commit. Its scheduled-work/public-history changes, migration 0081 and newer report write guards are retained whole. This round adds no migration of its own. Contract judgments and test counts remain unchanged. The final lock is regenerated after this merge and all local checks.

## Final candidate

Final product head: ed52f740415afc4959285a72afb6d26d28c18edf
Branch: cloud/main-lamp-audit-record-labels-1
Main merged: 280a76e (full identity recorded in receipt.json)
Second guarded push: succeeded on its first attempt, preserving the published first head and normal merge history. No force push or default-branch write occurred.

After the merge and privacy-test repair, the exact touched local set passed: the complete subscriber-consent/publication/delivery/export/erasure journey plus audit labels and roles/permissions audit journeys, 3 passed and 0 failed (328.8 seconds). Typecheck also passed. Contract generator write/check passed, generated views were restored from main, and the source lock was regenerated last and checked. All three candidate commits, including the merge and side-parent ancestry, passed fleet identity/message inspection. No registrations were added; counts remain 93 cases plus 10 scripts = 103.

Final exact-SHA Verify: 43648707293. Its final observation and contribution PR receipt follow in the terminal section below. The API budget includes the original failed run and its single failed-job archive read; the final watcher reserves the last call for the required PR.

## Terminal status and handoff

Product custody: PUSHED, not READY. Final exact-SHA Verify 43648707293 was still in_progress at the last REST observation after fifteen minutes. The ten-call GitHub budget is exhausted after creating the required contribution PR, so no green result is claimed. The earlier failed run 43646243127 and its public-shard assertion are recorded above; its cause was repaired before the final push. The fleet must observe the final run and perform its publication/landing gates.

PR: https://github.com/just-every/run-lamp/pull/385
Final branch: cloud/main-lamp-audit-record-labels-1
Final head: ed52f740415afc4959285a72afb6d26d28c18edf
Final Verify: https://github.com/just-every/run-lamp/actions/runs/43648707293

No account, ruling or product implementation blocker remains. CI completion is pending. TEAM-007 remains PARTIAL; acceptance points 1 and 2 are claimed by the extended existing audit journey, with the original remaining clause gaps retained. Counts remain 103/103 checks and 60 done, 129 partial, 52 missing. Browser proof at 1440 and 390 and complete actual non-secret reports/receipts are returned on the report-only evidence ref. This evidence publication is not acceptance, landing or READY.

The product clone is removed only after successful evidence transfer and verification; packet and transport receipts remain outside it.
