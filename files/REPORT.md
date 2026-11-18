# Lamp NOTIFY-004 delivery log proof

Run Edit Run fleet, 2026-11-18. Candidate edfa0888d8aaddc36bfb6bfa376e34006ce4cccc on cloud/sd-lamp-c-f137.

Exact-SHA push Verify 44247579944 was completed with conclusion success. The cloud branch was confirmed at edfa0888d8aaddc36bfb6bfa376e34006ce4cccc. Main was observed at 177378a989a7496a2e3dc00ac9a43947efd7c031.

## Plan and result

1. Read the current NOTIFY-004 clause, status gap, delivery routes, repository, service, and Delivery log screen. The active journeys already exercised queueing, provider acceptance, delivered mail, retry, and terminal suppression. They left gaps in exact delivery identities and times, direct complaint readback, complete HTML inspection, and paginated export reconciliation.
2. Extend the existing subscriber-failure journey. Read each delivery fact from the authenticated log. Bound the queue time by the successful publication request and each terminal time by the action that recorded the outcome. Check that a rejected signature, a replayed complaint, and a later delivered callback preserve the appropriate facts.
3. Inspect the complete notification HTML that reached the synthetic Resend edge. Check every element and attribute for tracking loads, and reconcile every link against direct native subscription URLs and the exact published HTTPS links. Exercise the management URL anonymously, then verify erasure removes the destination from the log and CSV and replay cannot restore the URL.
4. Reconcile the complete log and CSV across two native publications. Subscribe and confirm 101 email destinations and one webhook, and activate one SMS destination via a signed YES against the synthetic Twilio edge. The 103 deliveries occupy two log pages at the actual page size of 100. Compare all and only expected identities through 14 export scopes, including all three channels, all six outcomes, both updates, and combined filters. Check positive bounced, complained, suppressed, and failed rows in the subscriber-failure journey.
5. Extend the built-browser journey. Preserve the provider-acceptance and Settings assertions, then submit a signed complaint against the actual captured email. Filter the existing log at 1440px and download its CSV from the real export link. Record the existing screen once at 1440px and once at 390px against both the main and candidate builds. The product source needed no correction.

## Acceptance evidence

| Point | Door, input, and observed result | Candidate assertions |
| --- | --- | --- |
| 1 | Publish selected updates and read the authenticated delivery log. Exact subscriber, destination, channel, update, queue time and terminal time reconcile. A queued row has no terminal time, including after provider acceptance. | tests/e2e/helpers/delivery-log-flow.mjs:11 and :151; tests/e2e/helpers/subscriber-failures-flow.mjs:98 and :223 |
| 2 | Read the log before and after queue dispatch and signed provider events. Read the same complained identity after receipt, an exact replay and a later delivery callback. Observe queued, delivered, bounced, complained, suppressed and failed. | tests/e2e/helpers/subscriber-failures-flow.mjs:151, :171, :222 and :238; tests/e2e/helpers/mail-settings-browser-flow.mjs:147 |
| 3 | Capture the complete provider-facing HTML for a confirmed recipient. It contains the published wording, intended controls, and the five exact direct links. The document contains no embedded resource, pixel, link wrapper or tracking attribute. | tests/e2e/helpers/delivery-log-flow.mjs:26; tests/e2e/helpers/subscriber-failures-flow.mjs:158 |
| 4 | Page and export the mixed-channel inventory. All 103 expected delivery identities appear exactly once. Each filtered CSV matches all its pages and every exported fact, even with a later-page offset in the export query. The browser downloads the same complained record selected by the log controls. | tests/e2e/helpers/delivery-log-flow.mjs:79 and :193; tests/e2e/helpers/subscriber-failures-flow.mjs:154 and :181; tests/e2e/helpers/mail-settings-browser-flow.mjs:160 |
| BASE-MAIL-001 | An accepted provider submission stays queued with no outcome time. Signed receipts and receiver acknowledgements record terminal delivery facts separately. Existing mail fallback and tracking-disable controls are exercised by the same delivery suite. | CONTRACT.md:149 and :815; tests/e2e/helpers/subscriber-failures-flow.mjs:112; tests/e2e/delivery-contract.test.mjs:46 |

PROBE NOTIFY-004 1: Native publish followed by authenticated delivery readback -> exact subscriber, channel and update identity, bounded queue and terminal times, and null terminal time for queued deliveries.

PROBE NOTIFY-004 2: Signed complaint for the accepted provider message followed by a read of its original delivery ID -> complained; invalid signature refused, replay and a late delivery callback retain the same fact.

PROBE NOTIFY-004 3: Captured provider HTML with two submitted HTTPS URLs -> complete document with exact direct public and subscription links and zero embedded resources.

PROBE NOTIFY-004 4: Authenticated channel, outcome and update queries and CSV exports -> 103 distinct destinations across pages of 100 and 3, every expected identity once, and complete CSV parity across all 14 query scopes.

## Contract and scope

The planner row is the NOTIFY-004 entry in sd-lamp-replan-30. The requested post-landing transition is PARTIAL to DONE. The candidate retains the recorded count of 60 done, 129 partial and 55 missing across 244 clauses. An accepted landing would yield 61 done, 128 partial and 55 missing. The delivery suite retains seven registrations and its previous assertions.

The delivery API and existing screen already support the asserted native behavior. The change adds proof and refreshes the edition source lock. The existing retry and provider controls are accounted for by their own journeys. This round used synthetic Resend and Twilio network edges and a synthetic webhook acknowledgement. Live-provider receipts and hosted scale retain their own existing clause assignments.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node src/base/contract-docs.mjs write then check exit=0; ledger=none exit=0

The fresh contract views generated zero changes. The candidate diff contains no Status, Gap or Evidence edit. The branch carries only the product tests and regenerated source lock. The evidence commit carries the report and exact-build receipts.

## Browser comparison

The desktop and phone captures show the same Email and Complained selections, the same delivery fields, and the same export and pagination controls. The captures differ in the displayed fixture timestamps. The built Subscribers route asset has the same SHA-256 on main and the candidate. The candidate 1440px browser assertion exercised filtered CSV download, provider-acceptance text, no horizontal overflow, no serious or critical axe findings, and no page errors. The 390px capture gives a separate visual comparison of the stacked records on the existing phone layout.

The read-only CSS review found a 13px minimum token for captions, filter labels, and status pills. Data rows and inputs use 14px. The rounded controls and cards have full borders, and the visible log controls all have text labels. Provider configuration stays in Settings. See src/core/app/client/ui/tokens.css:40, src/core/app/client/ui/records.css:30, and src/core/features/deliveries/ui/deliveries-page.tsx:104.

## DONE riders

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | PASS | All four native outcomes in the registered failure and browser journeys. See the acceptance rows and exact-head Verify. |
| 2 | PASS | 103 independently expected recipients, nonempty disjoint filters, and refused unauthenticated reads. See delivery-log-flow.mjs:193. |
| 3 | PASS | Push Verify 44247579944 at the candidate SHA. The public shard invokes test:delivery from scripts/verification/plan.mjs:10. |
| 4 | PASS | Candidate build, seven passing delivery registrations, and 1440px and 390px screenshots bound to this candidate. |
| 5 | PASS | The receiving clause cites BASE-MAIL-001 and separates a queued accepted submission from receipt outcomes. See CONTRACT.md:149 and :815. |
| 6 | PASS, LANDER STATUS UPDATE PENDING | Contract generator write and check passed. The lander records the claim, new provenance, and cleared gap. |
| 7 | PASS | The candidate has no acceptance, Status, Gap or Evidence delta. |
| 8 | PASS | Anonymous reads receive HTTP 401. The invalid complaint preserves the delivery. Erasure revokes the prior link, and replay leaves the address absent from log and CSV. See subscriber-failures-flow.mjs:171 and :287. |
| 9 | PASS | Synthetic Resend, Twilio, and webhook edge only. Provider and hosted dependencies stay with their own clauses. |
| 10 | PASS | The test exercises existing consent, privacy and authority semantics. |
| 11 | PENDING GUARDED LANDING | The branch head matches the candidate. Main equality, exact-main Run site, and full-history publication scanning are lander gates. |

## Check receipts

The delivery suite passed all seven registrations on the exact candidate with Node 22.20.0 and system Chromium. Typecheck, the first-party profile, production build, contract generation and check, and source lock generation and check passed. The commit identity check covered the save and candidate commits. The candidate carries no generated view or contract delta.

Publication scan for edfa0888d8aaddc36bfb6bfa376e34006ce4cccc is pending with the Mac lander. The complete, historyScanned and findings fields are unestablished. The candidate Run site run is pending the guarded main update.

Main baseline runs at the start of this round were push Verify 44242051847 and Run site 44242052319, both successful.

CLAIM NOTIFY-004 DONE points=1,2,3,4 tests=tests/e2e/delivery-contract.test.mjs#Failing subscriber destinations deactivate with reasons, alert the webhook contact and suppress queued and future notifications; tests/e2e/delivery-contract.test.mjs#NOTIFY-013 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-007 NOTIFY-008 NOTIFY-010 — Owner-selected provider fallback preserves frozen notifications and reconciles delivery receipts
