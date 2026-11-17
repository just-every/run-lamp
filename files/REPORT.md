# sd-lamp-maint-1-c2 plan and investigation

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-maint-1-c2
Parent confirmed: 77afda40065ed1a462bdbd069b0cb6ab417929af
Main at investigation: cb6f9af49f440380caeca1722bac8fb7b7815699 (already an ancestor).

## Plan

1. Apply fleet credentials, identity and hook setup; read launcher and repository instructions.
2. Read the completed runtime failure for Verify 44095306243 / job 134081537475 and reproduce its exact AUTO-003 NOTIFY-006 case before edits.
3. Determine whether the assertion conflicts with the owner requirement or exposes a runtime defect. Preserve the stated rule: one reminder at 24 hours before work, none for an announcement already inside that window.
4. Update only the leased reminder/follow-up tests if the fixture encodes obsolete behavior. Keep positive coverage for an advance announcement and negative coverage for a recent announcement.
5. Re-run the failing case, maintenance and follow-up/reminder tests, typecheck, syntax, contract and source checks; regenerate the source lock last if required. Run the repository verifier.
6. Inspect every candidate identity, message and trailer; make one real commit; publish only cloud/sd-lamp-maint-1-c2 using the fleet push guard. Open only its PR as repository instructions require.
7. Discover and poll exact-SHA Verify through bounded REST reads, retain actual receipts, publish this packet on evidence/sd-lamp-maint-1-c2, then report terminal custody separately.

## Finding before editing

Case (a): the obsolete fixture schedules work 23 hours ahead and expects a reminder due one hour ago; the deliberate new 24-hour announcement rule correctly omits it.

CI actual was undefined, expected 2026-11-17T12:48:20.283Z, at tests/e2e/helpers/follow-ups-flow.mjs:112.
Local unchanged reproduction also failed at that exact line, actual undefined; see before-follow-ups.log.

Both src/core/features/overview/follow-ups/maintenance.repository.ts and src/core/features/maintenance/repository.ts exclude reminders when a scheduled/rescheduled announcement was published at or after startsAt minus 24 hours. This matches the stated owner requirement. tests/e2e/helpers/maintenance-notices-flow.mjs already exercises no immediate reminder, exact boundary, real synthetic subscriber delivery, rescheduling and cancellation with a controlled Worker clock.

Test being repaired: AUTO-003 NOTIFY-006 — operator follows real scheduled, delivery and import obligations through failures, reasoned dismissal and recovery (tests/e2e/update-reminders.test.mjs), helper followUpsFlow.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

## Implemented change

Only tests/e2e/helpers/follow-ups-flow.mjs and its generated source-lock hash change. The advance-announcement fixture starts 48 hours ahead; its reminder remains due 24 hours before the start and is not a failed obligation. A separate 23-hour notice has no reminder follow-up or reminder notice after repeated reads/Cron. Both windows are cancelled and their obligations disappear. Existing exact-boundary delivery, rescheduling, cancellation, overrun and recovery assertions remain. No reminder implementation change is needed.

## Completed local checks

The original focused case changed from 0 passed / 1 failed to 1 passed / 0 failed. Build, typecheck, 473-module syntax, contract document check and regenerated source-lock check pass. The timezone/subscriber browser suite passes 3/3 at 1440 using /usr/bin/chromium with --no-sandbox, including accessibility and keyboard journeys. The complete runtime shard passes: 2/2 runtime and 17/17 publishing/reminder cases (the predecessor had 16/17 publishing cases). The outer rer verify also passes hosted-output, hydration and 548-statement checks. The built-Worker browser confirmation passes 1/1 with system Chromium.

## Clause counts

Before and after: Core 60 done / 129 partial / 50 missing (239); Agent surface 0 / 0 / 5 (5); Full target 60 / 129 / 55 (244). There are no clause status changes, no contract edits, and no generated view edits.

## Product publication

One new commit: 702b422888916ecb9de06e3470466ada06ec5209. Both changed files are within the lease; the lock was regenerated last. All three candidate commits above main were inspected for author, committer, complete messages and trailers: fleet identity throughout, no co-author trailers. Product push succeeded on attempt 1 through cloud-push.py, to the named branch only. No merge, rebase, version, release, tag, pin, or default-branch write occurred.

## Final CI and contribution result

Exact-SHA Verify 44107919732 completed/success for 702b422888916ecb9de06e3470466ada06ec5209:
https://github.com/just-every/run-lamp/actions/runs/44107919732

PR 409 is open against main, with this same branch and head:
https://github.com/just-every/run-lamp/pull/409

The workflow success is direct; no failed-job rerun or contract-view exception was used. Nine GitHub API calls were used in total: predecessor jobs and one failed-job log, exact-SHA discovery, existing-PR discovery, four spaced run polls, and PR creation. No separate watcher was started.

Product custody is READY based on that exact-SHA Verify. Evidence transport is separate: this complete non-secret packet is selected explicitly for refs/heads/evidence/sd-lamp-maint-1-c2 using the provided cloud_evidence.py entrypoint. That ref is report transport only and does not land or accept the product.

Blockers: none. The fleet owns landing from the contribution PR after its independent publication scan and gates.

## Final results

- Case (a), an obsolete test fixture, not a reminder-timing implementation defect. The unchanged failing case was reproduced before editing; the corrected focused case and the final full runtime shard pass afterward.
- Focused case: 0 pass / 1 fail before; 1 pass / 0 fail after. Publishing/reminder suite: predecessor 16/17; local candidate 17/17. Runtime 2/2; timezone/subscriber browser suite 3/3; built-Worker system-Chromium confirmation 1/1.
- Build, typecheck, syntax (473 modules), contract document generation check, regenerated source lock, hosted-output, hydration and statement checks pass. The source-lock diff is one hash only.
- One new commit above the requested c1 head; product pushed once with the fleet guard; no other product branch was pushed. All candidate identities and full messages/trailers were inspected, including all parent paths above main.
- Before/after clause counts are unchanged: Core 60 done / 129 partial / 50 missing; Agent surface 0 / 0 / 5; Full target 60 / 129 / 55. No clause status changes. No contract clause claimed; these are owner-journey fixes (DIRECT 87).

Final report stamp: 2026-11-17T15:19:13Z (date -u).
