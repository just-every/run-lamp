# Lamp owner-journey re-apply

Run Edit Run fleet, 17 November 2026 (UTC).

## Candidate and scope

Repository: just-every/run-lamp. Branch: cloud/sd-lamp-design-notify-2.
Candidate: 28998ea138ef6c8c8572984a2a64cf27b832403b. Main at build and final fetch: 96794ba126e1cf93642760b65a92a02541221045.
Previous round confirmed at aa25410deb9a5d8597c5a63779bff8ebcd20ee74.

One ordinary commit reapplies only the prior round’s leased product, guide and focused tests, plus the regenerated source lock. There are no merge commits, contract edits, generated-view edits, release metadata edits or tooling pin changes. Contribution PR: https://github.com/just-every/run-lamp/pull/416 (head 28998ea138ef6c8c8572984a2a64cf27b832403b). CI result: https://github.com/just-every/run-lamp/actions/runs/44191683781 — completed/success on this exact candidate SHA.

## Plan and result

The full plan is in PLAN.md. Confirmed both source refs; repeated baseline Overview and Notifications journeys at 1440/390; applied the previous round’s own diff on current main; resolved the overlapping maintenance behavior by retaining main’s newer rules and assertions; ran focused checks and browser journeys; regenerated and checked sources.lock.json last; audited all candidate authors, committers, trailers and ancestry; pushed the first real commit through the fleet guard. Exact-SHA Verify run 44191683781 completed successfully on 28998ea138ef6c8c8572984a2a64cf27b832403b (observed 22:56:46Z). Six GitHub calls were used in total: five CI discovery/status calls and one PR creation. No failed jobs were observed and no workflow was re-run or dispatched.

### Lamp-D13

Future automatic start/completion steps no longer appear as owner follow-ups. Scheduled shows the actual saved start/end times in the configured page timezone and the automatic plan with “Nothing for you to do.” Manual obligations remain. Missed automatic start/completion steps appear as failures and disappear after ordinary maintenance processing and Cron recover them.

Fresh main’s advance-announcement reminder is retained. Its recent-announcement exclusion is also retained: no reminder minutes after a notice. The baseline advance fixture had three follow-ups; the candidate has one (the reminder). Automatic start/completion steps fall from two to zero. The previous round’s reported three-to-zero total is intentionally superseded by main’s newer reminder expectations. A recent-notice window still owes zero reminders.

### Lamp-D14

Notifications explains local email and actual SMS availability in plain words. The inactive From field is hidden, while active configured providers retain it. Technical deployment names and the stored From value are in one collapsed Details block, with the on-site guide remaining reachable through its section links. The quiet computer-only line uses the product’s loopback public origin and is absent for an online hostname. All added behavioral statements were checked against code and public-door journeys; see TRUTHFULNESS.md. No unsupported claim was added or removed during this re-apply.

## Main-versus-prior reconciliation

All six leased UI modules, the guide paragraph, and three unaffected browser helpers are byte-identical to the previous round. REAPPLY-RECEIPT.json lists those files. The SQL difference from aa25410d is main’s newer announcement/reminder eligibility. The follow-up test retains main’s advance/recent fixtures, no-immediate-reminder and repeated-Cron assertions, and cancellation cleanup, with this round’s automatic-step assertions beside them. The timezone browser test expects the retained advance reminder rather than an empty list. Sources.lock.json is generated against current main plus this round. All other differences between aa25410d and this candidate are inherited main changes, including the newer maintenance behavior, incident/owner changes and Sorry import. REAPPLY-DIFF.patch records the three overlapping files.

## Validation and proof

Typecheck, release validation, build, source-lock check, verification-plan inventory and whitespace check passed. No RELEASE.json entry was demanded. The follow-up recovery public-door case passed. All three maintenance/timezone and local-notification cases passed, including keyboard subscription and accessibility checks. The configured-provider browser helper passed its real adapter-edge delivery and settings persistence checks. The built production Worker passed the existing maintenance browser helper, including separate incident/scheduled lists and public records. CHECKS-RECEIPT.json records commands and results, with actual logs alongside.

The affected Overview and local Notifications screens were captured before and after at 1440 and 390 and visually inspected. Assertions run at 1440; the 390 captures add phone proof. No tests were added or removed: 111 registered cases plus 10 assertion scripts remain 121 checks. Contract counts remain 60 done, 129 partial and 55 missing. No clause status changed.

The initial temporary baseline evidence probe used an incorrect route and received 404. It was corrected to the public operator endpoint /api/app/overview/follow-ups and rerun successfully. That temporary probe is absent from the product diff. Both attempts are disclosed in the baseline logs and receipt.

## Custody and limits

The product guard succeeded on its first attempt. Only cloud/sd-lamp-design-notify-2 was pushed as a product ref. Every candidate author and committer is Run Edit Run fleet <fleet@runeditrun.com>; there are no co-author trailers or merge side parents. The exact identity log is in IDENTITY-RECEIPT.txt. Product checkout, head and index remain independent from report publication. The fleet’s publication scan and landing stay on its Mac as directed; no default branch, release, deploy or acceptance judgment is changed by this task.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

## Terminal outcome

READY: branch cloud/sd-lamp-design-notify-2 at 28998ea138ef6c8c8572984a2a64cf27b832403b. PR #416 remains open for the lane; no self-submit or landing was performed. Exact-SHA Verify is completed/success. No blockers. TERMINAL-RECEIPT.json records actual product custody and the six-call total. The report-only evidence transfer is separate from this product result and is identified by its exact EVIDENCE line in the final return. The clone is removed only after product/evidence publication succeeds; reports remain in the task packet.
