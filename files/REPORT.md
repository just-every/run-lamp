# sd-lamp-c-f128 — SUB-023 native import capacity

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-c-f128.
Candidate: d2812f4aee110ab6de04d4c7dffbb86d34239da9. Integrated main: 708ff579db8ac27b05765f63e00a80f8832bebba. Product push succeeded on its first attempt. Push Verify 43227436804 is in progress on exactly this candidate; no green conclusion is claimed. Integrated main Verify 43226178741 and Run site 43226178483 are green. No PR was created because the named branch has a push Verify entry point and the maintained fleet owns landing.

SUB-023 remains PARTIAL. This round closes the leased native acceptance points 1, 2, 4 and 5. Acceptance 3's 5,000-subscriber Business and 25,000-subscriber Enterprise admission proof was explicitly omitted from this lease and remains unclaimed. It is not represented as an external blocker or narrowed out of the contract. The plan row changes from PARTIAL to PARTIAL, with the four selected point groups restored. No other plan row changes.

Before and after relative to integrated main: 60 done, 129 partial, 55 missing, 244 total. The initial main had 59 done and 130 partial; PAGE-019 landed independently during this run, and its newer judgment was retained by the clean rebase. CONTRACT.md and both generated views remain byte-for-byte unchanged. No new policy default, migration, product code, visual file, homepage, documentation-site file or test registration is introduced. Existing assertions remain active. The source lock records only the two changed test files.

## Plan and implementation

The full executable plan is retained in PLAN.md. The work follows its six steps: inspect the target and native doors; activate the unused move-in capacity source; reconcile the email-free source graph; extend the existing CSV limits journey; run touched registered journeys and mechanical checks; integrate main, audit candidate history and publish the product and separate evidence refs.

The move-in source now includes one group, component, resolved incident with two original updates and a published report, completed maintenance and an incident template with its component selection. Only population of the existing 24,900 active subscriptions is direct fixture SQL. Every review, refusal, apply and operator readback uses native HTTP routes. No service or mapper is called to supply an expected result.

The owner review of 300 additional emails names the literal excess 200 and accounts for all 300 source identities: first 100 fit and final 200 are rejected with the over-limit reason. Review preserves complete imported-record and outbound-work inventories. Applying the retained over-limit plan returns 409 and preserves every application table, including every subscriber state, plus complete outbound rows and captured transports. A different, email-free upload receives a new fitting plan and applies. The journey independently reads the native catalogue, incident with both original updates, maintenance and template, and reconciles all associated persisted children, report, component claims and five state-history records. Existing subscriber inventories and outbound work remain unchanged.

The CSV path repeats the same 300-into-100 calculation, checks every row number and reason, refuses apply and compares the full database and outbound inventory. A newly reviewed fitting file then stores one email and one webhook, both pending; the native oldest-first list is read at the offset following the complete pre-existing inventory, and both full destination, channel, contact and state records are independently compared. All previous subscriber rows survive unchanged. The existing full-installation CSV refusal, public refusal equality, deletion and slot-recovery assertions remain active after this new proof.

Inspected implementation: ./src/core/features/statuspage-import/rows.ts computes whole-source demand and labels rejected rows; ./src/core/features/statuspage-import/door.ts refuses retained over-limit plans before apply; ./src/core/features/subscribers/intake.service.ts replans the CSV and refuses its excess before insert. No production correction was necessary.

## Acceptance and frozen proof rubric

All references below are in ./tests/e2e/helpers/subscriber-limits-flow.mjs unless another path is named. The registered Statuspage test is ./tests/e2e/statuspage-import.test.mjs, line 24, “SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes”. The CSV registration is ./tests/e2e/delivery-contract.test.mjs, line 28, “SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure”, through subscriberCsvFlow and subscriberLimitsFlow.

| Rubric | Acceptance sentence | Native proof |
| --- | --- | --- |
| R1 | 1: dry run names channel excess | Move-in line 53 and CSV line 170 compare literal channel, projected total, limit and excess. |
| R2 | 1: excess rows refused with reason | Move-in lines 54–56 account for all 300 source identities and exact reasons; CSV lines 171–172 account for all 300 physical rows. |
| R3 | 2: over-limit apply refused without changes | Move-in lines 60–66 and CSV lines 168–178 compare complete application-table snapshots and full notification inventory after the actual refused apply. |
| R4 | 2: fresh narrowed review fits before successful apply | Move-in lines 68–78 require a different fitting plan, then native reconciliation; CSV lines 184–202 require a fresh fitting fingerprint, actual apply and independent readback. |
| R5 | 3: Business 5,000 fits without narrowing | UNPROVEN, outside the lease. No DONE claim. |
| R6 | 3: Enterprise 25,000 fits without narrowing | UNPROVEN, outside the lease. No DONE claim. |
| R7 | 4: 300 with 100 free yields exact 200 refusals and refused apply | Move-in lines 45–66. |
| R8 | 4: removing email allows fresh review and successful apply | Move-in lines 68–110, including complete non-subscriber source graph and component. |
| R9 | 5: analogous CSV excess and refusal until a fresh file fits | CSV lines 161–202, plus the preserved full-installation refusal and recovery at lines 126–154. |

No new inherited Base duty is claimed. SUB-020 continues to own general capacity counting, public refusal and channel alert duties. SUB-017 continues to own normal Add and CSV consent. The original provider, hosted delivery, import, adoption, archive restore and release boundaries remain unchanged.

## DONE-RIDERS

| Row | Result | Evidence or boundary |
| --- | --- | --- |
| 1 | PASS for leased points; FAIL for a whole-clause DONE claim | R1–R4 and R7–R9 are reached through native journeys; R5–R6 remain unproven. |
| 2 | PASS for leased points | Seeded nonempty inventories; unsafe apply is attempted and compared unchanged; fresh supported apply completes with all expected native records read. |
| 3 | PENDING exact-SHA Verify 43227436804 (push, in progress); local registrations PASS | Both selected registrations passed locally: 2 tests, 0 failures, 0 skipped, 584.36 seconds. Both existing registrations remain in push Verify through test:imports and test:delivery in the imports and public shards. No environment flag hides new assertions. |
| 4 | PASS for local byte identity | RECEIPTS.json binds command results and exact SHA to the changed file digests. No relevant code or test byte changes after the successful run. |
| 5 | INSPECTED | No inheritance or clause text change. Existing SUB-020 origin retained; no new Base duty claimed. |
| 6 | PASS mechanical | Documented generator write and check pass; views restored from main, no status cells or counts edited. Lander owns any later judgment flip. |
| 7 | PASS | No acceptance point, ruling, clause shape or coverage map changes. |
| 8 | PASS within this change | Only native owner import and existing CSV doors are used. Existing revoked-session and changed-review refusal controls remain loaded in the Statuspage registration. No authority implementation changes. |
| 9 | PASS boundary | Synthetic network edges prove native admission and silence. No live provider delivery, real export, release or hosted scale qualification is claimed. |
| 10 | PASS | No new policy default adopted. |
| 11 | PENDING guarded landing | Branch publication is not main equality, a publication scan, acceptance or Run site. The Mac lander owns those receipts. |

## Pre-ready self-check

1. New assertions reach every leased outcome through native doors and would fail if the named observed outcome broke. Exact-SHA Verify observation is retained in CI.json; no result from a different SHA is substituted.
2. No pre-existing assertion is removed, narrowed or placed behind a conditional. No test is deleted, skipped or newly registered. The selected local runner filter only selects touched existing registrations and does not alter Verify's plan.
3. Complete refusal snapshots cover subscriber states and outbound work. Email-free apply preserves all existing subscription and selection records. Existing erasure, revoked-credential and replay controls in the touched registrations remain active; no authority or replay code changes.
4. No screen or visual file changes. Existing intake browser controls in the subscriber registration retain their own 1440 assertions and 1440 and 390 screenshots. No new design proof is claimed.
5. Source lock and contract generation results are retained. Cloud publication scanning is NOT RUN; exact-tree commit, complete, historyScanned and findings are unestablished until the Mac lander scans. Candidate main equality and candidate Run site are likewise not claimed. Changed text adds no email-shaped literal and only native paths, module paths and full HTTPS URLs use slashes.

## Local execution and diagnostics

The launcher refresh and fleet Git helper ran before clone. The clone uses full history and the named branch. Local fleet identity and the cleanup hook remain active, preserving repository hooks. Every product commit uses explicit author and committer environment values. Before push, the complete origin/main candidate range, including side parents, is checked for identity and trailers; an additional local pre-push check repeats that audit on transport retries.

An initial inline module probe stalled before assertions because Miniflare's synchronous worker inherited the inline Node invocation. A module-file invocation passed startup. Temporary startup instrumentation was restored, and only owned probe PIDs were stopped. The first direct native move-in flow passed. The initial direct CSV proof found the new rows were beyond the oldest-first list's first page; its failure was 0 versus 2 retained rows. The proof now reads the known following offset and still requires both complete records. These were local development diagnostics, not failed CI jobs or Verify repair rounds.

The successful terminal touched run, typecheck, source lock, contract checks and first-party profile results, product push, exact-SHA workflow observation and file hashes are preserved in RECEIPTS.json and the explicitly selected actual logs. No credentials, environment dumps, private gate material or symlinks are included.

## Probe return

PROBE SUB-023 1: owner Move in review with 300 email rows and 100 free slots -> exact email excess 200, all 300 identities accounted for and final 200 refused with exact over-limit reasons.
PROBE SUB-023 2: actual over-limit Move in and CSV apply -> 409, complete application-table snapshots and outbound work and captured transports unchanged.
PROBE SUB-023 4: remove email, freshly review and apply -> completed, complete group, component, incident history, report, maintenance and template graph reconciled; existing subscribers and outbound work unchanged.
PROBE SUB-023 5: native CSV with 300 rows and 100 free slots -> excess 200 and exact refusal accounting; fresh fitting email and webhook file -> two independently read pending destinations and prior subscriber inventory preserved.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0, generated files restored from origin/main; ledger=none exit=0.

Terminal product head: d2812f4aee110ab6de04d4c7dffbb86d34239da9. Branch: cloud/sd-lamp-c-f128. The clean rebase retained the exact bytes of both successfully tested modules; it imported only unrelated public-page tests and their contract judgments. Final views write, views check, lock generation and lock check each returned 0 after that rebase.

CLAIM SUB-023 PARTIAL points=1,2,4,5 tests=tests/e2e/helpers/subscriber-limits-flow.mjs#subscriberMoveInCapacityFlow; tests/e2e/helpers/subscriber-limits-flow.mjs#subscriberLimitsFlow
GAP SUB-023: Acceptance 3 Business 5,000 and Enterprise 25,000 fits without narrowing remain unproven and outside this lease. No other selected native point remains open.
