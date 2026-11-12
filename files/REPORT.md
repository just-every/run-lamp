# sd-lamp-audit-labels-1

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-audit-labels-1
Scope: Settings audit rendering, CSV/filter labels, one focused public-door regression journey, and the source lock.

## Plan

1. Initialize fleet identity, decrypted-bundle Git authentication, preserved repository hooks, and pinned toolchain; clone main shallow with blob filtering.
2. Start a fresh `rer setup --owner-email fleet@runeditrun.com --non-interactive` and `rer dev` installation. Enter through the native local owner link; complete first-run setup. Create a component, publish an incident, schedule maintenance and invite an operator through the authenticated application API. Open Settings > Audit log and capture the unchanged rows at 1440 and 390 before editing.
3. Resolve current actor and subject labels in the audit read repository, with no schema or recorded-event change. Remove visible opaque actor identifiers, humanize action/filter labels, and add a CSV action label while preserving separate raw action, actorId and entityId columns. Resolve erased or missing targets as Removed item.
4. Add one public-door audit journey covering labels, actual filter selection, CSV identity parity and removed subjects. Leave TEAM-003 acting-name/public-name code and existing erasure assertions intact.
5. Run only the focused touched journey and typecheck locally. Fetch and rebase on origin/main before the first publication, regenerate/check sources.lock.json last, inspect every candidate identity/trailer and push only the named branch through the cloud push guard. Open the required PR, observe one exact-SHA Verify through REST within the ten-call budget, and retain actual receipts.
6. Publish this report, receipts and before/after browser proof on the separate evidence ref. Never commit fleet evidence or generated contract views to the product branch. Leave acceptance judgments and holds unchanged.

## Reproduction

PROBE: fresh rer dev installation, native owner entry and first-run setup; public authenticated operations published Payment requests are delayed, scheduled Payments database upgrade, created Payments API and invited Morgan Patel (synthetic-lamp-3@example.test).

Before: the table displayed Owner followed by `bd8c5f42-7535-4a8a-9c51-124b64c5f2b3`; the invitation was `invited / operator / 3c5dafd9-785c-46ee-b015-1abe029a26ff`; maintenance was `notice-published / maintenance / 01M78BSSWW8GTPA3TG271PTC47`; publication was `published / incident-update / 01M78BSSP1ZRB0W37AQNF92EHA`. Component subjects already displayed Payments API. See before-rows.json, probe-before.log and before-audit-{1440,390}.png.

After: Owner appears without its UUID; invitation reads Invited an operator with synthetic-lamp-3@example.test; maintenance reads Published a maintenance notice with Payments database upgrade; publication reads Published an incident update with Payment requests are delayed. System notices still identify System. See after-rows.json, probe-after.log and after-audit-{1440,390}.png.

## Contract custody

TEAM-007 remains PARTIAL. No contract text, status, gap, evidence, generated acceptance view, or homepage changes. Existing holds for logo removal/replacement, standing-claim removal without aggregate state change and archive-restored subscriber expiry remain. TEAM-004/AUTO-001/API-001 continue to own role/rule/token event authority.

CLAIM TEAM-007 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys
GAP TEAM-007: Existing logo removal/replacement, standing-claim removal without aggregate change and archive-restored subscriber expiry proof holds remain; no DONE claim.

## Verification and publication

The focused browser journey passed (1 test, 0 failures; about 48 seconds) after correcting the initial selector for the existing wrapped Operator label. The first attempt failed because the exact accessible label included option text, not because of a product assertion; the original output is retained in touched-test-attempt-1.log. The test then selected the real human action label, observed the original `notice-published` query code, compared the filtered JSON/view/CSV row IDs, and verified erased invitation and soft-deleted incident subjects resolve as Removed item. No previous assertion was weakened or removed.

`pnpm run typecheck` passed; the documented source lock write and check passed; `git diff --check` passed. No full local verify or other suite was run. The focused registration asserts at 1440 only; the real fresh-install audit browser proof was captured once at 1440 and 390 before and after.

Before/after counts: contract done 60 → 60, partial 129 → 129, missing 55 → 55. Direct test/contract registrations across tracked *.test.mjs files: 81 → 82 (one added audit journey; this is a static direct-registration count, not the full assertion-script or nested-case total). In the captured audit table, visible opaque identifier occurrences fell from 10 to 0, and the three unresolved target labels (invitee, maintenance, publication) fell from 3 to 0. The original six audit entries are retained; one later System notice also appears in the after capture.

Main was fetched and the unpublished branch rebased before its first push; main had not moved. The source lock was regenerated last and checked. Candidate has one fleet-authored/fleet-committed commit and no trailers; the complete `origin/main..HEAD` identity/message inspection passed. The first guarded push succeeded in one attempt.

Product candidate: `4e97cd125e6e6cb60a8c05e05878a3c96d78490b` on `cloud/sd-lamp-audit-labels-1`. Exact-SHA push Verify: [43267587466](https://github.com/just-every/run-lamp/actions/runs/43267587466), still in progress at the final permitted read, 2026-11-12T17:36:20Z. The terminal product status is PUSHED, with no READY or green claim. The single REST watcher waits at least 300 seconds between run reads, including discovery. The first scheduled run-status read at 17:21:17 UTC failed with exit 1; its HTTP status was not retained. The launcher bundle was refreshed, the prescribed Git setup repeated, and the required [PR #343](https://github.com/just-every/run-lamp/pull/343) was opened successfully on the exact candidate SHA at 17:22:50 UTC. The 17:26:18 UTC run read succeeded after that refresh and reported the exact candidate still in progress. The next exact-SHA read at 17:31:19 UTC also reported in progress. The final scheduled read at 17:36:20 UTC still reported in progress on the same head. Five CI reads (including the failed read), one PR request and two launcher auth-status invocations conservatively use eight of ten calls; the remaining two are held for completed failure diagnostics. The budget is short, so the watcher ends and returns PUSHED as instructed. No completed failed job was observed, so no failed-job logs were requested. No workflow was manually dispatched or rerun.

The fleet Mac retains the publication scan and landing gate; this cloud has neither run that scan nor landed the branch. No migrations, recorded audit writes, TEAM-003 acting-name/public-name code, other screen, homepage, contract judgments or generated view files changed. Full source hashes, commands, outputs and terminal provenance are in RECEIPT.json and the explicitly selected packet files.


## Browser evidence

| Width | Before | After |
| --- | --- | --- |
| 1440 | [Before audit screen](before-audit-1440.png) | [After audit screen](after-audit-1440.png) |
| 390 | [Before audit screen](before-audit-390.png) | [After audit screen](after-audit-390.png) |


## Terminal product custody

- Repository: just-every/run-lamp
- Branch: cloud/sd-lamp-audit-labels-1
- Full head: 4e97cd125e6e6cb60a8c05e05878a3c96d78490b
- PR: https://github.com/just-every/run-lamp/pull/343
- CI run: 43267587466, exact head matched, last observed in_progress at 2026-11-12T17:36:20Z.
- Status: PUSHED; Verify completion remains pending. No product blocker identified locally, no READY/acceptance/landing claimed.
- Evidence destination: refs/heads/evidence/sd-lamp-audit-labels-1 only.
- Local app/browser processes are stopped. After successful evidence publication, the product clone is removed and this packet retained.

POST lanes/sd/INBOX.md: sd-lamp-audit-labels-1 fixed audit rendering; TEAM-007 stays PARTIAL points=none, existing holds unchanged; head=4e97cd125e6e6cb60a8c05e05878a3c96d78490b; PR=https://github.com/just-every/run-lamp/pull/343; Verify run=43267587466 still in_progress at 17:36:20Z; local focused test/typecheck/lock check pass; counts done=60->60 partial=129->129 missing=55->55; PUSHED, not READY.
