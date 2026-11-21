# Lamp maintenance automation defaults

Run sd-lamp-c-f177 for just-every/run-lamp. Author Codex, 2026-11-21 UTC.

## Plan and scope

Use the planner-selected MAINT-013 acceptance 1 lease. Read the clause and its recorded gap, map the existing assertions, trace the native worker routes and persistence read-only, extend the single existing publishing journey, run the touched checks, and return the exact candidate and evidence. Update only the MAINT-013 row in the lane's Next campaign handoff. Its native evidence advances and its judgment stays PARTIAL. No policy default was adopted and no scope ruling was needed.

The prior journey proves transitions and notices with explicit choices, and its browser sibling proves a saved auto-start opt-out. Neither proves what the page settings return initially or what native create does when switches are omitted. The native routes delegate settings and creates to the maintenance service. The service resolves each omitted switch independently with nullish fallback, and the automation repository persists the defaults separately from each window. The collection reads the per-window choices from those saved records.

## Native proof on the candidate

The existing registration at `tests/e2e/publishing-contract.test.mjs:894` runs against a disposable migrated Worker using authenticated requests and real database persistence. Verify loads the file through the runtime shard's `test:publishing` script in `scripts/verification/plan.mjs:12`.

- Lines 1129–1142 check that a fresh settings GET returns both switches on, then save each of the two opposite mixed settings and check the saved result via a separate GET.
- Lines 1144–1158 POST three future windows under each mixed setting. One omits both switches, one explicitly reverses start and omits completion, and one omits start and explicitly reverses completion. Consequently each switch inherits both values and each explicit override wins in both directions. The POST must return HTTP 201 and the expected choices for that window.
- Lines 1161–1166 independently fetch the collection and find each created window by ID. The original window and the windows from the first mixed setting remain in the expectations after defaults are reversed.
- The six new fixtures use the existing internal test component and sit beyond the journey's controlled scheduler horizon. Existing assertions and registrations are preserved. No UI or production code changed.

PROBE MAINT-013 1: native automation GET, two settings PUTs followed by separate GETs, and six native maintenance POSTs followed by collection GETs -> initial both-on, saved mixed pairs, correct inheritance and explicit overrides in both directions, and prior choices retained after defaults reversed.

## Acceptance and riders

| Acceptance | Result |
| --- | --- |
| 1 | Native slice proven by the settings and window matrix above. API-002 maintenance create and imported-message proof remain held. |
| 2 | Existing manual-start behavior is supplemental. The complete five-minute due, operator-alert, push and publication proof stays held. |
| 3 | Existing auto-complete-off behavior is supplemental. The full Verifying and notice proof stays held. |
| 4 | Existing overrun display is supplemental. The exact deadline, alert uniqueness and AUTO-003 list proof stay held. |
| 5 | Existing manual completion and claim release are supplemental. The complete twenty-minute, publication and notice proof stays held. |

| Rider | Result |
| --- | --- |
| 1 | Native slice passes locally, with the balance of MAINT-013 held as listed above. |
| 2 | Pass for the slice. Six actual creates and an independent, populated collection with expectations tied to the submitted settings and explicit choices. |
| 3 | See the exact-SHA CI status below. |
| 4 | The receipt binds the tested journey bytes and candidate. |
| 5 | Inspected. CONTRACT.md identifies MAINT-009 as the source clause. No Base duty added or claimed in this lease. |
| 6 | Generator write and check passed. The inherited partial judgment, gap and earlier provenance remain with the contract owner. |
| 7 | Pass. No acceptance sentence or status table row changed. |
| 8 | No new permission or authority path. Existing authenticated native owner route exercised. |
| 9 | External proof remains open. No push-provider, API compatibility or import claim made. |
| 10 | No policy default adopted. |
| 11 | Cloud product branch only. The Mac lander owns main equality, the complete publication scan and Run site. |

No migration changed. The source lock was regenerated with the edition command after final edits. Generated views were restored from main. No production data or provider account participated. The added assertions guard missing or incorrect settings, missing or incorrect choices on persisted windows, and retrospective changes when defaults are edited. Auth revocation, erasure, replay, icon tooltips, responsive screens and design are outside this native test-only claim. The publication scan result remains unestablished in cloud.

CLAIM MAINT-013 PARTIAL points=1 tests=tests/e2e/publishing-contract.test.mjs#MAINT-001 MAINT-002 MAINT-003 MAINT-004 MAINT-005 MAINT-006 MAINT-007 MAINT-009 MAINT-013 — owner schedules, announces, starts, extends and completes maintenance without losing window or calendar history

GAP MAINT-013: API-002 maintenance create and imported messages remain held, along with acceptances 2–5 for due and overrun timing and alerts, NOTIFY-016 push, AUTO-003 listing, Verifying and manual publication, claims and notices.

## Handoff

Product HEAD `aac02ad17dcbf10ea11675276995eb806849483b` on `cloud/sd-lamp-c-f177`, based on `bafb632174ace2da2191b88bb186d0364e1415c7`. Verify 44880054287 (push) is in_progress. https://github.com/just-every/run-lamp/actions/runs/44880054287
The candidate is branch-only. On the observed main base, Verify 44876986189 and Run site 44876986360 completed successfully. Candidate Run site and main equality await guarded landing.

Contract counts before and after were 66 DONE, 123 PARTIAL and 56 MISSING of 245. Test inventory before and after was 116 registrations plus 10 assertion scripts. The touched test file passed all 11 registrations with system Chromium. The first local invocation passed the native maintenance journey and hit a missing Playwright browser executable in the existing cancellation journey. The full rerun passed with the repository's executable-path input set to system Chromium. The focused native journey also passed after publication on the exact committed candidate.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The complete check receipt is CHECKS.json.
