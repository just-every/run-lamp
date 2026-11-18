# sd-lamp-c-f140 · Lamp NOTIFY-001

Prepared by Run Edit Run fleet on 2026-11-18.

Repository `just-every/run-lamp`, branch `cloud/sd-lamp-c-f140`, candidate `8f5dacaffef33c1b553ee6e485dc60da03188c57`, base `177378a989a7496a2e3dc00ac9a43947efd7c031`.

## Plan and result

- Read the NOTIFY-001 acceptance text and current Status row, the planner's NOTIFY-001 row, MAINT-005, and the maintenance policy, service and delivery publication code. The old Status Gap names all three outcomes. The planner identifies points 1 and 3 as covered by the current incident and component journeys and leased only the two remaining lifecycle deliveries within point 2.
- Extend the registered maintenance reminder journey through the window's native Cron start and completion. Reconcile the confirmed recipient and an active subscriber following another component through the native directory. For each notice, match the native maintenance and delivery records, the persisted delivery-to-notice link, the accepted attempt and one captured provider request. Check the recipient, the wire subject and status, Message-ID and idempotency header. Run Cron again at the same instant and the next minute for both transitions and compare the full window and its deliveries and captured mail.
- Keep the MAINT-005 scheduling and reminder-time assertions within the existing publishing test registration. The inventory remains at 111 test cases and 10 assertion scripts.
- Run the focused journey and the touched publishing file on Node 22.20.0. Run TypeScript, the first-party check, the contract generator and the edition source lock check. Publish the exact branch head after local checks and read its Verify run through GitHub.
- Plan row `CLAUSES="NOTIFY-001"` is the only row addressed. Point 2's started and completed delivery proof is added. Points 1 and 3 retain their registered proof. The release, adoption and real-provider receipt prerequisites retain their existing owners. The product diff contains the extended test helper and the regenerated edition source lock.
- Contract counts before and after the candidate are 60 DONE, 129 PARTIAL and 55 MISSING out of 244. The guarded promotion of NOTIFY-001 would yield 61 DONE, 128 PARTIAL and 55 MISSING.

## Acceptance and inherited duty

| Item | Public door and outcome | Evidence |
| --- | --- | --- |
| Acceptance 1 | First publication, later update and resolution are received as three successive webhook notifications for the same incident, each with a recorded delivered outcome. | Existing delivery registration `tests/e2e/delivery-contract.test.mjs:28` calls `tests/e2e/helpers/statuspage-webhook-flow.mjs:112`. |
| Acceptance 2 | The confirmed subscriber following the affected component receives scheduling, reminder, start and completion. The unrelated confirmed subscriber receives none. Each receipt and wire message identifies the stored delivery and its exact notice. | Extended `tests/e2e/publishing-contract.test.mjs:1187` calls `tests/e2e/helpers/maintenance-notices-flow.mjs:21`. Delivery reconciliation starts at line 45 and native Cron at line 92. |
| Acceptance 3 | A standing change is silent for a non-opted-in email subscriber and sends once to the explicit component subscriber in a later standing change. | Existing delivery registration calls `tests/e2e/helpers/component-notification-flow.mjs:44` through the webhook journey. The opted-in request and provider acceptance are asserted at lines 75–89. |
| Inherited MAINT-005 | Schedule, twenty-four-hour reminder, In progress and Completed each notify. Existing lead-boundary, recent-announcement, rescheduling and cancellation controls still run. | `CONTRACT.md:790` cites MAINT-005 in acceptance 2. `tests/e2e/helpers/maintenance-notices-flow.mjs:75` exercises all four notices. |
| NOTIFY-017 boundary | Existing opted-in standing-claim proof remains active. Further claimant and flap proof belongs to NOTIFY-017. | `CONTRACT.md:790` and `tests/e2e/helpers/component-notification-flow.mjs:44`. |

PROBE NOTIFY-001 2: public subscription and captured confirmation, native maintenance creation and Cron at start and end -> one matching notice, one matching delivery for the original selected subscriber and one matching provider request per transition, with no additional requests on same-time and next-minute Cron repeats.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## DONE-RIDERS and self-check

| Row | Candidate result |
| --- | --- |
| 1 | The public-door outcomes are represented in the acceptance table. Point 2 passed on the focused exact-head run. The existing delivery registration for points 1 and 3 passed within the exact-head public shard, job 134627239932. The runtime shard covering point 2 passed as job 134627240056. |
| 2 | The native subscription writes, real scheduled transitions, single matched receipts and repeated-Cron invariance are asserted on populated records at helper lines 21–34 and 45–112. |
| 3 | Push Verify ran both registrations. The parent workflow conclusion is tracked separately below. |
| 4 | Local receipts bind candidate `8f5dacaffef33c1b553ee6e485dc60da03188c57` to the test and mechanical checks. |
| 5 | Acceptance 2 names MAINT-005 and the journey exercises its four notice moments. |
| 6 | The generator check passed on the candidate. The lander owns the Status Gap, Evidence and provenance updates. |
| 7 | The candidate diff leaves CONTRACT.md and both generated views byte-for-byte equal to the base. |
| 8 | The fixture establishes both public confirmations and limits every logged and captured send to the matching selection. The confirmed subscriber for another component receives no notice. The existing webhook journey also checks management-token revocation after unsubscribe at `tests/e2e/helpers/statuspage-webhook-flow.mjs:138`. |
| 9 | The accepted receipt comes from the existing synthetic network edge. Live provider delivery, hosted adoption and release remain separate qualifications. |
| 10 | No new policy or conservative default was introduced. |
| 11 | Guarded landing, exact-main Run site and the complete full-history publication scan remain the Mac lander's checks. |

The diff adds assertions to the existing journey and retains the timing and replay controls. The test exercises consent, component selection and repeat Cron through the existing runtime. The transition delivery requirements are asserted through native HTTP and Cron. Supplementary built Worker screenshots show the accepted start and completion rows in the delivery log and the public maintenance timeline. Browser assertions ran at 1440 pixels and the packet includes captures at 1440 and 390 pixels with the synthetic subscriber address masked. The source lock is fresh and an added-line check reported no address literals or bare slash references.

## Local receipts and landing

- `publishing-contract.tap` records 11 of 11 passing tests. `notify-001.tap` records the focused registered maintenance journey passing. The build, typecheck, first-party check, contract-doc generation and source lock check succeeded. `mechanical.log` records the candidate checks and inventory.
- `browser.log` records the built Worker proof at 1440 pixels. The four PNGs show both screens at 1440 and 390 pixels. The existing browser cancellation and reinstatement journey also passed with its receipt in `maintenance-browser.tap`.
- The branch was pushed by the fleet guard. `product-refs.tsv` records the exact remote branch and main refs. The candidate commit has the fleet author and committer and no trailers.
- The base main SHA `177378a989a7496a2e3dc00ac9a43947efd7c031` had successful push Verify `44242051847` and Run site `44242052319`. The candidate requires the guarded Mac landing and that resulting main SHA's Run site.
- Publication scan for commit `8f5dacaffef33c1b553ee6e485dc60da03188c57` remains with the Mac lander. Cloud receipt fields are `complete=unestablished historyScanned=unestablished findings=unestablished`.
- Candidate push Verify `44252625089` was in progress on the exact SHA at 07:22 UTC, when the task's ten-call GitHub budget was used. The earlier job snapshot shows the public and runtime shards complete and successful, with only the composer shard `134627239979` still running among the started jobs. The aggregate result remains pending. The candidate SHA differs from remote main.
- The landed adjudication remains PARTIAL and the landed totals remain 60 DONE, 129 PARTIAL and 55 MISSING. The behavior behind all three points has exact-head shard evidence. DONE requires the aggregate Verify and the guarded landing.

CLAIM NOTIFY-001 PARTIAL points=1,2,3 tests=tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure; tests/e2e/publishing-contract.test.mjs#Maintenance reminders respect the lead time and skip recent announcements

GAP NOTIFY-001: Aggregate Verify on the candidate was still in progress when the GitHub budget ended. The exact-head public and runtime shards passed.

PUSHED branch=cloud/sd-lamp-c-f140 head=8f5dacaffef33c1b553ee6e485dc60da03188c57
