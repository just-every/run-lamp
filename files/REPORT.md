# Lamp NOTIFY-001 · sd-lamp-c-f143

Run Edit Run fleet · 18 November 2026

The continuation takes the scheduled maintenance subscriber through automatic start and completion using Lamp's native maintenance, subscriber, and delivery routes. It records the original provider request at the synthetic mail edge, then matches its idempotency key, payload and acceptance ID to the exact delivery and persisted notice. A confirmed subscriber who selected another component receives none of the window's four notices. Repeated Cron at the same instant and on the next minute preserves the complete notice and delivery records and makes no more provider requests.

## Plan and scope

1. Continue the previous candidate at 8f5dacaffef33c1b553ee6e485dc60da03188c57 and rebase on current main before the candidate push.
2. Extend the existing maintenance reminder journey. Reuse its native subscribe and confirm controls, synthetic provider edge, controlled Worker clock and Cron handler. Preserve its scheduling and reminder boundary checks.
3. Reconcile the two automatic transitions with the selected subscriber, exact notice and delivery IDs, and captured provider request. Assert no duplicate notice, delivery, request or acceptance when Cron repeats.
4. Run the maintenance journey, rerun the existing incident and component proof, and check the generated contract views, source lock and first-party profile. Publish the product and evidence separately.

Only the registered maintenance helper and its source lock entry changed. The maintenance service and policy and the delivery publication code were inspected. No registration was added, removed or narrowed. No UI or migration changed. The MAINT-005 timing scope and NOTIFY-017 claimant and flap scope still govern their respective coverage. Provider proof ends at synthetic provider acceptance. Hosted provider receipts, adoption, the UI gate and release are unchanged prerequisites for their own scopes.

Plan row to update is the continuation of the NOTIFY-001 item dispatched as sd-lamp-c-f140. Other campaign rows stay held as recorded in the plan extract.

## Acceptance and inherited duties

| Point | Public door and assertion |
| --- | --- |
| 1, first incident update | The registered delivery journey publishes Identified with native draft and publish routes. The signed captured receiver and delivered native log identify the committed publication. See tests/e2e/delivery-contract.test.mjs:28 and tests/e2e/helpers/statuspage-webhook-flow.mjs:112-132. |
| 1, subsequent incident update | The same journey publishes Monitoring for the same incident and reconciles the new publication, receiver payload and delivery log. See tests/e2e/helpers/statuspage-webhook-flow.mjs:112-132. |
| 1, resolution | The same journey publishes Resolved and reconciles the new publication, receiver payload and delivery log. See tests/e2e/helpers/statuspage-webhook-flow.mjs:112-132. |
| 2, MAINT-005 scheduling | The reminder journey confirms two native subscriptions with distinct selections, schedules a window and binds its Scheduled notice to one selected-recipient delivery and captured request. See tests/e2e/publishing-contract.test.mjs:1187 and tests/e2e/helpers/maintenance-notices-flow.mjs:24-93. |
| 2, MAINT-005 lead-time reminder | The same journey advances the Worker clock and runs native Cron before and at the existing twenty-four-hour boundary and checks the accepted selected-recipient delivery. Recent, changed and cancelled windows retain their controls. See tests/e2e/helpers/maintenance-notices-flow.mjs:94-106. |
| 2, MAINT-005 In progress | The Worker clock reaches the committed start, the native window advances from Scheduled, and its single started notice maps to one delivery and provider request. Same-minute and next-minute Cron leave all notice and delivery records and outbound requests unchanged. See tests/e2e/helpers/maintenance-notices-flow.mjs:57-89 and :108-137. |
| 2, MAINT-005 Completed | The same window advances from In progress at its committed end and the single completed notice maps to one delivery and provider request. The same repeated-Cron silence and stable records are checked independently after completion. See tests/e2e/helpers/maintenance-notices-flow.mjs:57-89 and :108-137. |
| 3, component change without opt-in | The registered delivery journey makes a standalone standing-claim change. The opted-in webhook receives it, and the confirmed email subscriber without the component preference receives none. See tests/e2e/helpers/statuspage-webhook-flow.mjs:137 and tests/e2e/helpers/component-notification-flow.mjs:44-67. |
| 3, component change with opt-in | The existing journey enables email opt-in, records one provider-accepted delivery and confirms replay leaves one attempt. See tests/e2e/helpers/component-notification-flow.mjs:75-99. Further claimant and flap tests belong to NOTIFY-017. |

PROBE NOTIFY-001 2: Public subscribe and confirm for two component selections, native maintenance creation, controlled native Cron at start and end, then native maintenance and delivery reads and synthetic provider capture -> one notice, accepted delivery and request per transition for the selected recipient, preceding records unchanged and repeat-Cron requests zero.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Exact candidate and receipts

- Branch cloud/sd-lamp-c-f143, head fe66086cbaeae8d6cf407d0582d6c16c984ff939.
- Main at rebase and push was 177378a989a7496a2e3dc00ac9a43947efd7c031. Its push Verify 44242051847 and Run site 44242052319 both completed successfully. Observed remote main at handoff was 71ab9b43f5069cd612bf998d3a2bf8a32691393b. Main and candidate have different SHAs.
- Candidate Verify 44261650833, push, completed, conclusion success, observed 2026-11-18T08:18:10Z. Both journeys ran locally on the exact head under pinned Node 22.20.0. Verify routes the publishing registration through the runtime shard and the delivery registration through the public shard.
- Exact candidate Run site is pending landing. The production workflow runs on main. No pull request was needed for branch Verify.
- Full-history publication scan on fe66086cbaeae8d6cf407d0582d6c16c984ff939 is pending with the guarded lander. Complete, historyScanned, and findings are unestablished. The branch contains two audited fleet commits with no co-author trailers. Added test lines contain no fixture email literals or newly recognized repository shorthand.
- All 185 concrete Status Evidence paths resolve. The contract view generator wrote zero files and reported no prose warnings or errors. The protected views match the candidate baseline. The lock check, typecheck and first-party check passed. The test inventory has zero registration delta.
- Counts before and after the product branch are 60 DONE, 129 PARTIAL and 55 MISSING (244). NOTIFY-001's recorded cell remains PARTIAL until the guarded lander judges the claim. Acceptance of this clause as DONE would produce 61 DONE, 128 PARTIAL and 55 MISSING on those counts.

## DONE-RIDERS and pre-READY checks

| Row | Result and evidence |
| --- | --- |
| 1 | PASS. Both exact-head local journeys passed. Every native acceptance outcome is mapped above. |
| 2 | PASS. Confirmed recipients with different selections, an opted-out component subscriber, opted-in controls and exact recipient results are exercised. See maintenance-notices-flow.mjs:24-88 and component-notification-flow.mjs:44-99. |
| 3 | PASS. Verify 44261650833, push, completed, conclusion success. Existing Verify registration reaches both named journeys. The leased slice is a Worker and transport test with no UI change. |
| 4 | PASS. Both journeys and mechanical checks were rerun locally on fe66086cbaeae8d6cf407d0582d6c16c984ff939. |
| 5 | PASS. CONTRACT.md:790-797 names the MAINT-005 and NOTIFY-017 duties. No Base duty is inherited independently in this clause. |
| 6 | PASS for candidate generation and resolved evidence paths. The Status, Gap, Evidence and provenance edits belong to the guard's landing step. View and count checks passed locally. |
| 7 | PASS. Acceptance wording and rider placement are verbatim from the candidate's main baseline. |
| 8 | PASS. Native unsubscribe revokes management reads and writes, and the directory shows the retained deactivation. See statuspage-webhook-flow.mjs:138-144. The same existing suite exercises erasure and receipt replay at component-notification-flow.mjs:89-102. The maintenance replay assertions check exact record and request stability. |
| 9 | PASS within the clause. The proof demonstrates synthetic provider submission and acceptance at the captured network edge. Real-provider receipts and adoption stay with their existing scopes. |
| 10 | PASS. Existing subscription eligibility and publication policy are exercised without a policy default change. |
| 11 | PENDING guarded landing. Main equality, COMPLETE scan with history and findings, and exact landed-head Run site are the lander's receipts. |

The pre-READY check retains the existing assertions and covers the changed delivery outcome with native publication and independent provider capture. Component-scoped refusal and the existing authority, erasure and replay controls are exercised. The lease changed no screens. Lock freshness and candidate CI are documented above.

CLAIM NOTIFY-001 DONE points=1,2,3 tests=tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure; tests/e2e/publishing-contract.test.mjs#Maintenance reminders respect the lead time and skip recent announcements

## Verify job snapshot

Observed 2026-11-18T08:13:09Z.

- plan 134656171373 completed success
- build 134656225326 completed success
- shards (composer) 134656756086 completed success
- shards (demo) 134656756095 completed success
- shards (ownership) 134656756100 completed success
- shards (imports) 134656756110 completed success
- shards (portability) 134656756111 completed success
- shards (delivery) 134656756117 completed success
- shards (runtime) 134656756219 completed success
- shards (public) 134656756276 completed success
- verify 134665378360 completed success
