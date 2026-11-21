# Lamp MOVE-001 first saved Statuspage review

Fleet run sd-lamp-c-f173, 21 November 2026.

The candidate is 1baeb5fae8ebb027dea2f083e2b112bec1f82937 on `cloud/sd-lamp-c-f173`, based on main at 2d49c9f3a8eb566e43b36126dbb844b6d9591b26. The selected plan row is MOVE-001 in planner return sd-lamp-replan-37. It advances acceptance 2 for native-record and outbound-work preservation during one successful first Statuspage saved-response review. MOVE-001 remains PARTIAL. Contract counts before and after are 65 done, 124 partial, 56 missing, 245 total.

## Plan and results

1. Read the MOVE-001 clause, its current Status row and the applicable rulings. Map the selected obligation to the active import journey, with its existing review counts, revoked session, stale target, changed fingerprint, explicit apply and repeated-import controls.
2. Trace the owner route read-only. In `src/core/features/statuspage-import/door.ts` lines 184–209, the owner route checks the session and source and opens the upload and plan handler. Lines 237–255 load uploaded bytes, prepare the dry run and handle previous unstarted plans. Lines 83–91 read upload custody. In `src/core/features/statuspage-import/planning.ts` lines 20–108, the mapper derives effects from source data and a native snapshot and passes them to the D1 planner. In `door.ts` lines 258–287, starting apply separately validates the retained review against current page state, while plan readback assembles its report from the retained plan.
3. Extend the existing journey in `tests/e2e/statuspage-import.test.mjs`. Lines 210–228 create a native component, incident and private draft and submit a public subscription. Lines 240–251 capture the ordered complete native and outbound inventories and check that the expected fixtures, subscriber token and captured confirmation are present. Lines 252–263 exercise the actual saved-response upload and plan door through `moveInDoor`. The 200 response has a fingerprint and an importable component. The matching complete plan is retained with no linked apply job. All captured product rows, outbound rows and transports remain equal. The test reuses the inventory helpers in `tests/helpers/import-notifications.mjs` lines 26–68 and the move-in transport at lines 131–174.
4. Retain the existing bad-fingerprint refusal, count comparison and successful apply. Lines 265–277 show the positive control completes for the same plan and fingerprint and the native inventory grows by the expected reviewed records. The apply helper at lines 172–176 confirms the completed job. There are three registrations before and after in the touched file and zero repository registration delta.
5. Run the touched import file, typecheck, first-party check, contract-document write and check, and source lock generation and freshness check. Scope is test and source lock only. The Worker's code and screens are exercised by the existing journey. Viewport evidence for changed screens is inapplicable.

## Acceptance evidence

| Point | Outcome | Evidence |
| --- | --- | --- |
| 1 | Full provider credential and saved-response matrix held. | Existing fixed-origin Statuspage edge and response custody smoke at `tests/e2e/statuspage-import.test.mjs` lines 133–158 and 197–204. |
| 2 | Leased native-preservation outcome passed locally. Full acceptance is still partial. | `tests/e2e/statuspage-import.test.mjs` lines 215–277 compare all fields of the ordered native rows, notification work and transports before and after preview. The exact complete plan still applies. Complete source-item accounting, Sorry field and saved-job reconciliation and other-provider preservation stay held. |
| 3 | Full stale-source and stale-target matrix held. | Existing refusals at `tests/e2e/statuspage-import.test.mjs` lines 205–213 and 265–267. |
| 4 | Complete per-channel capacity matrix held. | Existing capacity flow registered at `tests/e2e/statuspage-import.test.mjs` line 134. |
| BASE-SECRET-001 | Existing citation retained. Broader provider boundary remains held. | Fixed-origin synthetic provider edge and credential absence from the plan response at `tests/e2e/statuspage-import.test.mjs` lines 133–158 and 197–204. |

## DONE-RIDERS

1. Partial. The scoped point performs and checks the native outcome at lines 215–277. The remaining outcomes are listed above.
2. Pass for the leased outcome. The component, private draft, subscriber, persisted token and captured transport exist before the review. The reviewed records are created on explicit apply.
3. Verify is the push workflow. Its imports shard runs the existing `test:imports` entry point and includes the touched file. The exact run conclusion is recorded below.
4. Pass for local evidence. The tested file matches the committed blob and source lock SHA-256. It runs against the same main source as the committed candidate.
5. Pass by inspection for the BASE-SECRET-001 citation at `CONTRACT.md` line 181.
6. Contract generation and check pass. The current Status table and prior judgment provenance are retained.
7. Acceptance sentences and coverage stay intact. The change adds proof inside the registered journey.
8. Existing authority coverage retained. Revoked owner session cannot apply at lines 205–207. Stale page and wrong fingerprint remain refused at lines 210–213 and 265–267. The scoped preview creates no outbound work.
9. Synthetic saved responses and captured transports only. Live provider boundaries and Sorry invitation release stay held.
10. No interim policy default was needed.
11. Pending guarded landing. Main at candidate push was the distinct base stated above. Publication scan for the candidate is unestablished. Run site follows landing. Base main had successful Verify 44872765882 and Run site 44872765905.

## Checks and handoff

All existing assertions are retained. Comparing complete before-and-after rows and transport captures detects a preview that inserts, removes or rewrites preserved data, even without changing aggregate counts. A replay cannot add records or notification work under the existing repeat control at lines 179–194. Aggregate counts were retained as independent old assertions. Erasure, other providers and release prerequisites retain the existing held boundaries. The candidate adds no UI, policy or migrations. Changed test text contains no email-shaped value.

PROBE MOVE-001 2: Native owner saved Statuspage response review on populated Lamp -> an importable retained plan with no linked apply job and complete ordered native and outbound work unchanged. Explicit reviewed apply completed for the same plan.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=n/a

CLAIM MOVE-001 PARTIAL points=none tests=tests/e2e/statuspage-import.test.mjs#SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes

The claim lists no complete acceptance point. Acceptance 2's one proved outcome is the probe above.

GAP MOVE-001: Acceptance 2 retains complete source-item accounting, Sorry field-path, reason, action and saved-job reconciliation, and other-provider preservation. Acceptances 1, 3 and 4 retain the full credential and saved-response, stale-review and capacity matrices. Sorry invitation release and provider, adoption, UIP and release prerequisites remain held.

## Candidate Verify receipt

Verify 44874210760 ran on push for exact candidate SHA 1baeb5fae8ebb027dea2f083e2b112bec1f82937. Last REST status is in_progress at 2026-11-21T06:20:12.418712+00:00. Candidate Run site awaits main landing. Remote main at this check was 2d49c9f3a8eb566e43b36126dbb844b6d9591b26. The full-history Base publication scan is pending guarded landing. Its completion, history-scanned status and finding count are unestablished.
