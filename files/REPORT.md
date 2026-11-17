# Lamp maintenance owner journeys

Run Edit Run fleet, 2026-11-17 UTC. Task sd-lamp-maint-1. Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-maint-1.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

## Result

Finding 1: Cancel maintenance now opens a review that names the work, explains the customer cancellation notice and public-history result, and offers Keep scheduled. An optional customer reason is frozen in the notice. Cancelled work offers Reinstate maintenance, with dates to review and an explicit confirmation. It restores the same record, public address, history, components and automatic start/completion choices, and sends one change notice to the previous audience. Future dates are required, and expired dates can be replaced in that form. A forward migration permits cancelling reinstated work again while retaining the database uniqueness of scheduled, reminder, started and completed notices. Existing migration history is unchanged.

Finding 5: The default reminder remains 24 hours before the start. An announcement or change already inside that window replaces the reminder. The scheduler and owner follow-up list use the same eligibility rule, so there is no spurious reminder debt. An advance notice still generates one reminder at the boundary, never before it, and repeated scheduled work cannot repeat it. Cancelled work never reminds.

Finding 6: Native public notices use separate Who is affected, Customer impact and optional Reason fields, matching the incident update typography. All current-page templates retain customer wording without repeating the current notice. Existing stored notice bodies and permanent addresses remain intact; rendering removes the internal heading from customer-visible text. Maintenance email subjects, email bodies and delivery descriptions omit the internal reference. Email status describes its own notice even if the window was subsequently reinstated.

## Before and after

The built baseline was main cb6f9af49f440380caeca1722bac8fb7b7815699. A synthetic reader confirmed a subscription, and the owner scheduled Billing system upgrade for six hours later. Within two minutes the baseline had scheduled and reminder notices containing the same customer wording. One Cancel maintenance click changed the state to Cancelled and left zero actions. The public permanent page flattened each notice into a paragraph headed by an internal code. Actual baseline receipts and owner/public screenshots at 1440 and 390 are in this packet.

The final browser journey performs scheduling through the real owner page, dismisses cancellation without mutation or mail, confirms cancellation with a reason, checks retained public history and removal from the upcoming list, and reinstates the same window. After undo, the notice inventory is scheduled, cancelled and rescheduled, with no replacement record and no near-start reminder. One confirmed subscriber receives three distinct notices for those three real decisions. The journey also refuses repeated reinstatement and invalid past dates, permits a second cancellation, and proves automatic start and completion after reinstatement. Assertions run at 1440; screenshots of the changed states run once each at 1440 and 390.

Test inventory before: 102 registered cases plus 10 assertion scripts = 112 checks. After: 104 registered cases plus the same 10 scripts = 114 checks. Two added journeys cover reminder timing and the reviewed cancellation/reinstatement flow. Existing maintenance and provider-mail journeys now expect the recent announcement to replace a reminder. The separate timing journey preserves positive proof of a reminder delivered to a confirmed subscriber at the 24-hour boundary. Public-history tests retain complete event, timestamp and customer-field assertions while expecting customer views to omit internal references.

## Plan and validation

PLAN.md records the full scoped plan and defaults. Local checks include typecheck, JavaScript syntax, the changed maintenance journeys, provider-mail integration, public native history, source-lock integrity, contract document checks, and a production build. The candidate's receipts identify commands and outcomes. The final source lock is generated after staging every new source/test/migration file and is checked again before commit. No generated acceptance view, release metadata, version, rer pin or contract clause is changed.

During implementation the public-history check exposed old assertions that required the hidden internal heading and a flat paragraph. These now assert the original customer values and complete publication inventory. The reinstatement journey exposed the once-ever cancellation index; the migration and second-cancellation proof fix that defect. Early clock-fixture mistakes were corrected by using the existing controlled-clock Worker and positioning the reschedule at its actual lead boundary.

The final fresh-main fetch and first two product push attempts received temporary authentication rejections. The third guarded push succeeded after the required refresh/backoff sequence; a subsequent fetch and remote branch probe succeeded. Recovery used only the launcher refresh and shared decrypted-bundle helper, with no alternative credential. Product custody and CI details are recorded in the final receipt below and terminal message.

## Limits and custody

Mail/network assertions use the repository's synthetic provider boundary; no hosted inbox delivery is claimed. The 12ui hosted improve operation requested interactive sign-in, so this scoped change keeps Lamp's existing incident design and is reviewed using actual built-page screenshots. The shipped polish essentials were followed. The fleet's Mac owns the complete publication scan and landing; this cloud never pushes main or submits itself for landing. Evidence is published only on evidence/sd-lamp-maint-1, separate from product readiness.

No unrelated product finding is included in the diff. Clause status changes: none.

## Product provenance and CI

The product commit is 2b8e632f16dd3ff2006ae72e9c3ff3649c2ce3b9, tree 28350deb04601df2c85587fa695832ee0c1cecfd. Git confirmed the remote cloud branch at that exact commit. The successful post-push fresh-main fetch still reports cb6f9af49f440380caeca1722bac8fb7b7815699, so no ancestry replay or merge was needed. Push Verify run 44090302049 is on the candidate SHA; the terminal receipt records its final result. Draft PR: https://github.com/just-every/run-lamp/pull/406.

The wider public catalogue journey also passed. Its earlier combined command had the old history assertion failure described above; the final dedicated history rerun passed. Both actual logs are retained so the earlier failure is not hidden.

Out-of-scope note: GitHub’s push response reported 12 existing default-branch dependency alerts (10 moderate, 2 low); no dependency or release change is included in this round.

## Terminal blocker

Exact-SHA Verify 44090302049 completed with failure on 2b8e632f16dd3ff2006ae72e9c3ff3649c2ce3b9. Its sole underlying build failure is validate:release: RELEASE.json must list the newly introduced 0082_repeated_maintenance_cancellation.sql migration. Contract docs, source-copy and source-lock integrity, typecheck, syntax, visual source checks, Worker build and site build passed in that job. The aggregate verify job failed because build completion was unsuccessful; the test shards were skipped. The release gate failure is reproduced locally and its actual log is in the packet. This is not the special generated-contract-view exception, and READY is not claimed.

The brief expressly says “no release metadata (no version, CHANGELOG, RELEASE.json or seed.json edit)”. The lane must authorize or supply the required release-manifest entry before this candidate can pass Verify. Removing the migration would break repeat cancellation after reinstatement, so the complete product fix and its passing flow assertions are retained. No check is weakened or bypassed, and no published commit is rewritten. Draft PR 406 leaves this concrete candidate for the lane. The final product status is BLOCKED with the required Successful exact-SHA Verify prerequisite.

GitHub calls used: 6 (discovery, status, jobs, one build-log read, PR creation, one aggregate-log read). No workflow is rerun or dispatched. The product is pushed; evidence transport remains a separate report-only operation.
