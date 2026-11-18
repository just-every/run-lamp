# Lamp NOTIFY-001 continuation

Run Edit Run fleet · 18 November 2026

Product `just-every/run-lamp` · branch `cloud/sd-lamp-c-f140-pc1` · candidate `a4a343a042fdef482aa8c4daba7476b4a67a81f7`.

The candidate has both the published save `8f5dacaffef33c1b553ee6e485dc60da03188c57` and the merged main `4e97e8985ac870576ccaf3cf3a54332140c7e7d7` as parents. The branch push succeeded. Verify starts on the branch push. Lamp's guarded landing path uses that Verify directly.

## Plan and results

1. Map the three acceptance points to their existing journeys. The saved work exercised start and completion, but the provider receipt and the checked mail body could independently match two different captured requests. The saved test also did not compare the complete notice and delivery sets immediately before and after each transition.
2. Extend the same maintenance registration. Confirm one selected subscriber and a subscriber to an unrelated component through the native public subscription flow. Reconcile each notice's exact stored event ID with the private delivery log, the provider attempt's response ID and the same captured request's idempotency key, Message-ID, customer status and recipient. Prove that start and completion each append exactly one notice, delivery and message for the same maintenance window. Repeat Cron at the same instant and one minute later and verify that the retained records and provider capture stay equal.
3. Carry forward the existing schedule and reminder controls and the incident and component journeys. Exercise the runtime, type, contract document and source lock checks, then push through the fleet guard and observe Verify on the exact SHA. Capture the public maintenance permalink at both widths for each transition.
4. Return the evidence to the separate evidence ref. The guarded lander owns publication scanning, the contract status judgment, and Run site.

The only authored candidate differences against its merged main are the maintenance test helper and regenerated source lock. The service, reminder policy and delivery publication code were inspected read-only. The planning scope stays on NOTIFY-001. The lead boundary remains with MAINT-005, and claimant and flap coverage remain with NOTIFY-017. Homepage, documentation-site, brand, provider receipt, adoption and release work remain with their owning rounds.

## Acceptance evidence

| Point | Public door and result | Test location |
| --- | --- | --- |
| 1 | Confirmed subscriber receives the first published incident update, a later update and its resolution through the captured email edge. | `tests/e2e/publishing-contract.test.mjs` lines 76, 127–142, 310–332. The registered test is the reviewed incident from private template to immutable updates, recovery, report and audited deletion. |
| 2 | Native maintenance and Cron produce Scheduled, Reminder, Started and Completed requests for the same confirmed and selected recipient. The unrelated selection stays silent. The two lifecycle Cron transition ticks append one exact notice, delivery and request each, and repeated ticks preserve the previous sets. | `tests/e2e/publishing-contract.test.mjs` line 1187, Maintenance reminders respect the lead time and skip recent announcements. `tests/e2e/helpers/maintenance-notices-flow.mjs` lines 21–34 and 44–123. |
| 3 | A standing component change is quiet for the subscriber without component changes selected. An opted-in subscriber receives one captured mail and selected webhook subscribers receive their event. A signed receipt replay preserves that delivery without resending. | `tests/e2e/delivery-contract.test.mjs` lines 29 and 41, Subscriber consent, selected publication, channel delivery, export and erasure. `tests/e2e/helpers/statuspage-webhook-flow.mjs` line 156, then `tests/e2e/helpers/component-notification-flow.mjs` lines 16–54 and 75–102. |
| MAINT-005 duty | The same registered reminder journey retains scheduling, the configured 24-hour boundary, the recent and cancelled controls, and both transition notices. | `tests/e2e/helpers/maintenance-notices-flow.mjs` lines 77–123. |
| NOTIFY-017 duty | The component journey checks opt-in against standing changes, confirms one selected email and inspects receiver delivery. Further claimant and flap obligations stay in NOTIFY-017. | `tests/e2e/helpers/component-notification-flow.mjs` lines 16–54 and 75–102. |

PROBE NOTIFY-001 1: native confirmed subscription followed by reviewed incident publication, later update and resolution -> matching first, later and resolved mail for that subscriber.

PROBE NOTIFY-001 2: native advance maintenance window and four Cron and delivery stages -> one matching provider acceptance per notice, four messages to the selected subscriber, zero new requests when repeating start or completion.

PROBE NOTIFY-001 3: native standing component claim with default and opted-in subscriptions -> default email silence, one opted-in email, selected receiver events and no second send after receipt replay.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The publishing contract suite passed 11 of 11 tests. Typecheck, first-party check and the source lock check passed. The registered subscriber consent test passed locally on the earlier main SHA. Its proof files match the candidate. The public browser proof checked the In progress and Completed permalink at 1440 and 390, with no horizontal overflow. The test count is 112 registered cases and 10 assertion scripts, with zero cases added by this round.

## DONE riders and readiness

| Rider | Result |
| --- | --- |
| 1 | Local PASS. Each outcome is performed through the native routes and captured transports in the acceptance rows. Exact-SHA CI is recorded below. |
| 2 | PASS. Seeded and confirmed subscriptions reproduce valid and mismatched selections, and the journey compares specific notice, delivery and request identities and exact receiver effects. |
| 3 | PASS. Exact-SHA push Verify completed successfully. |
| 4 | PASS. The publishing journey ran against the committed product source and tests before the push. The browser receipt uses the candidate SHA. The component proof files match the full passing consent case and its native provider branch. |
| 5 | PASS. The clause names MAINT-005 and NOTIFY-017. The acceptance evidence gives each inherited obligation its own row. |
| 6 | PASS on builder checks. The generator wrote zero differences and its check passed. The existing PARTIAL judgment, Gap, Evidence and provenance remain the merged main versions. The lander records any promotion. |
| 7 | PASS. The acceptance text and existing assertions are preserved. No registration was added or made conditional. |
| 8 | PASS. The public door confirms both selected subscriptions. The incompatible recipient stays silent. Existing component proof deactivates and erases the recipient and checks replay against the same retained delivery. |
| 9 | PASS for the claimed boundary. Provider acceptance comes from the test network edge. Hosted provider receipt work remains with the clauses that require it. |
| 10 | PASS. No policy default or change to recipient eligibility was introduced. |
| 11 | Pending lander. The published candidate and main are separate. The cloud publication scan was not run, so its completeness, history-scan result and findings are unavailable. Run site on the candidate SHA is pending a main landing. |

The exact product head is recorded in `CHECKS.json`. The report packet contains no configured addresses, credentials, injected environment values or held-out gate material. The prior saved Verify diagnosis is recorded in `PREVIOUS-VERIFY.json`. Its composer shard was cancelled around the configured 45-minute limit and the downstream aggregate failed. The saved SHA's local composer command ended with a missing local Playwright executable in THEME-001. Its public command passed eight tests. The same Theme case on main with cloud Chromium reached the unrelated favicon request-budget failure. The hosted composer had already completed browser installation and emitted no failed assertion in the available archive output. No composer, theme or workflow edits were made.

## Verify and status

[Verify 44284873258](https://github.com/just-every/run-lamp/actions/runs/44284873258) reported `completed` and `success` on the branch push for the exact candidate at 2026-11-18T10:51:47+00:00. The supplemental direct helper exited unsuccessfully. The registered subscriber consent case supplies the existing component proof.

The saved CONTRACT had 60 done, 129 partial and 55 missing. Main and the pushed candidate have 62 done, 127 partial and 55 missing. The two earlier promotions came from main. A NOTIFY-001 promotion would yield 63 done, 126 partial and 55 missing after independent judgment.

Plan row `CLAUSES="NOTIFY-001"` receives the candidate SHA, the Verify run and the maintenance transition proof. No other queue row changes.

CLAIM NOTIFY-001 DONE points=1,2,3 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion; tests/e2e/publishing-contract.test.mjs#Maintenance reminders respect the lead time and skip recent announcements; tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure
