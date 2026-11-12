# Lamp audit-label repair — sd-lamp-audit-labels-fix-1

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-audit-labels-fix-1.
Starting audit-label revision: 4e97cd125e6e6cb60a8c05e05878a3c96d78490b (verified).
Integrated main: 7bfb459185882497098b4fed00155f248874ce81.
Candidate: 3f0e64e7bd465d33d312e73d8c69921b7db4924f.

## Final custody and CI

PUSHED, not READY. The exact product head is preserved remotely, and all local touched checks passed. Verify run 43285493624 succeeded in both originally failing shards: delivery job 131418482560 and public job 131418482495. Build, plan, imports, demo, ownership, portability and runtime also succeeded. Composer job 131418482217 was cancelled after 45 minutes 17 seconds (the workflow declares a 45-minute job timeout); aggregate verify job 131445618059 consequently failed. No product assertion failure was supplied by that cancellation metadata. Its underlying cause is not established, and no unrelated code or timeout was changed.

The single permitted retry of composer and its dependent jobs was requested through `POST repos/just-every/run-lamp/actions/jobs/131418482217/rerun`; GitHub accepted it with HTTP/2.0 201 Created at 2026-11-12T19:51:53.954329+00:00. The ten-call GitHub budget is exhausted, so its final result is not observed and no READY claim is made. COMPOSER-RETRY-RECEIPT.json and the CI JSON files retain the actual responses. No duplicate workflow dispatch or source change was made to obtain another run.

No PR was created while the retry was pending. PR-REQUEST.json contains the prepared request for the lane to open after green push evidence, avoiding duplicate full verification. PR 343 was not changed. The fleet still owns publication scanning, required exact-SHA completion, integration and landing. No product landing or main/tag write was attempted.

## Plan and scope

The full working plan is PLAN.md. Integrate the existing readable-label implementation with current main, reproduce both reported failures, preserve all recording/filter/CSV guarantees, fix only obsolete audit selectors and rendering defects demonstrated by those tests, run touched journeys and typecheck, regenerate/check the source lock last, then push the named branch and inspect its exact-SHA Verify. Return reports through the separate evidence ref. No landing, main/tag write, unrelated screen change, clause-status change or PR 343 change is authorized or performed.

The original implementation was merged with main, preserving main's newer tests and contract judgments. The sole merge conflict was sources.lock.json; main's copy was restored and the documented lock generator regenerated it. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain byte-identical to integrated main. The integration save 36c8db6fefadd53f93001d6e836e024b55a78949 was pushed immediately with [skip ci]. The repair commit carries no skip marker.

## Failure classification and change

Delivery: the unchanged AUTO-001 monitor journey reproduced the exact reported 30-second timeout. Its selector looked for a raw rule ULID and lowercase `updated` in the visible audit row. The rendered contract deliberately replaces both with readable labels. The revised selector identifies the row through the saved rule name, the human action `Updated an item`, and the approving operator's name. It retains the native updated-event/actor check and displayed time check, and explicitly checks that the native entry still identifies the approved rule. It adds assertions for the saved subject name and exclusion of its opaque ID from the visible row. No assertion was deleted or skipped.

That reproduction also demonstrated a rendering defect: a real, saved `Prepared API availability` rule was labeled `Removed item`. The existing audit repository resolved incidents, publications, maintenance, components and operators, but had no live alert-rule lookup. One CASE branch now joins alert_rules by the recorded entity ID to obtain the saved name. Missing/deleted rules continue to fall back to `Removed item`; no historical payload identity is revived. Recording, schema, filter semantics and CSV machine keys are unchanged. The captured synthetic fixture observation is rule-label-before.json.

Public: the complete reported SUB-019 subscriber consent/publication/delivery/export/erasure registration passed locally unchanged (1/1, about 442 seconds). No audit-related cause or unrelated defect was inferred for the old public failure, and no public test/product code was repaired. Because the failure did not reproduce, a failing-main comparison was unnecessary. The independent NOTIFY-002 capacity probe was not treated as the cause of another registration's failure.

The two prescribed once-per-job archive reads for historical Verify 43267587466 exited 0 with empty stdout and stderr. They supplied no failing assertion. ARCHIVED-LOG-RECEIPT.json records their exact commands and job IDs. No blocked log-blob redirect was retried.

## Tests changed and preserved

Only this existing registration is changed by the repair (through its helper):

- tests/e2e/channels-and-presets.test.mjs: `AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence`; helper tests/e2e/helpers/automation-rules-browser-flow.mjs.

The inherited source implementation adds the existing target registration `TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys` in tests/e2e/publishing-browser.test.mjs through helpers/audit-labels-flow.mjs. This repair preserves that registration and its operator, subject, action-filter, CSV machine-key, erasure and removed-subject assertions. API and CSV assertions elsewhere that intentionally use recorded IDs/action codes remain intact. A search of browser audit-log selectors found no other stale raw-ID/action selector requiring conversion.

Inventory before/after this repair: 90 registrations + 10 executable assertion scripts = 100 / 100. No added registration, skip, timeout relaxation, pin test or weakened acceptance assertion. The one inherited focused registration is included in both counts.

## Validation and custody

Final local/CI outcomes, exact commands, run IDs, screenshots, publication state and UTC timestamps are in RECEIPT.json and the selected actual logs. The only browser proof selected for this repair is the changed audit screen at 1440 and 390. Assertions for the changed helper run at 1440; the existing screenshot mechanism captures the same state at both widths.

The source lock is generated with `node scripts/edition-authoring/cli.mjs lock` and checked with `node scripts/edition-authoring/cli.mjs check`. Generated contract views are restored whole from origin/main. Contract document check passes with zero errors/warnings. The candidate's typecheck passes. Every candidate commit, including the original source side parent, has fleet author/committer identity and no co-author trailers; final-identities.txt and identity-validation.txt retain the checks.

The cloud cannot perform the fleet's Mac publication scan or land a product. The fleet retains those independent gates. Evidence publication is report transport only and does not assert acceptance, landing or product READY.

## Clause claim

CLAIM TEAM-007 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#TEAM-007 (audit labels identify people and subjects while filters and CSV retain machine keys)
GAP TEAM-007: unchanged — logo removal/replacement, standing-claim removal without aggregate change and archive-restored subscriber expiry proof remain absent; role, rule and token event authority belongs to TEAM-004, AUTO-001 and API-001.

No clause status, Gap or Evidence cell changed. No DONE claim.
