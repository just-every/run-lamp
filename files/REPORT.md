# sd-lamp-c-f200 · MAINT-011

Prepared by Run Edit Run fleet on 2026-11-21 for the sd lane.

## Scope and plan

The planner-return sd-lamp-replan-43 entry for MAINT-011 leased the initial native Scheduled notice in acceptance 2. At main, the maintenance form already scheduled windows, the permalink presented the window and frozen notice wording, and the maintenance delivery journey captured scheduling email. Neither path exercised an unsaved maintenance preview. The clause requires durable wording drafts, Page and Email previews for each notice before scheduling, and parity for the Scheduled, reminder and start notices.

The implementation reuses schedule validation, the native wording renderer, the public window formatter and the email delivery formatter. The Maintenance form shows Page and Email on demand for a public Scheduled notice, refreshes the preview when valid input changes, and sends an authenticated read-only preview request with a non-cacheable response. Recipient-specific links are added only during delivery. Preview uses the existing publishing permissions and appearance. Protected-page-only previews were outside the public permalink and subscriber email lease.

The two existing journeys now check the lease through the built or developing operator page, public permalink and synthetic Resend edge. Assertion width is 1440. The packet contains the Page and Email screen at 1440 and 390. The fixed Brisbane window begins at 04:00 on February 11 while the Chromium context is in Los Angeles. The baseline records a confirmed subscriber and a retained public generation.

## Acceptance and inherited duties

| Item | Observed result | Proof |
| --- | --- | --- |
| Acceptance 1, UPDATE-005 | Held. Durable versioned maintenance drafts and restore remain outstanding. | No new assertion. |
| Acceptance 2, UPDATE-004 Page | The Scheduled state, title, exact customer wording, displayed Brisbane window and UTC instants matched the published permalink. The operator’s unsaved edit appeared in the preview and the later permalink. | `tests/e2e/maintenance-timezone.test.mjs:102–131` and `tests/e2e/helpers/maintenance-notices-flow.mjs:201–213,250–258`. |
| Acceptance 2, UPDATE-004 Email | The actual subject and complete notice text, including start, end, UTC offset and both wording fields, matched the captured scheduling email. | `tests/e2e/helpers/maintenance-notices-flow.mjs:224–235,247–249`, registered at `tests/e2e/publishing-contract.test.mjs:1448`. |
| Acceptance 2, preview has no effects | The window inventory, notice IDs, reserved and served generation, delivery and outbox IDs, provider request count and acceptance count were unchanged. The anonymous request received 401 and the authenticated response was non-cacheable. | `tests/e2e/helpers/maintenance-notices-flow.mjs:174–200,236–237`. |
| Acceptance 2, remaining notices and doors | Held. The lease proves the initial native public Scheduled notice only. | API-002 maintenance creation, imported messages, other notice previews and NOTIFY-016 push are held. |
| Acceptance 3, MAINT-009 wording and window | The initial Scheduled notice matches the preview. The full Scheduled, twenty-four-hour reminder and start parity matrix remains held. | `tests/e2e/helpers/maintenance-notices-flow.mjs:247–258`. The existing reminder journey remains registered at `tests/e2e/publishing-contract.test.mjs:1447`. |

## DONE-RIDERS and pre-ready checks

| Rider | Result |
| --- | --- |
| 1 | Partial. Both customer-facing preview surfaces were reached for the leased Scheduled notice. Full clause outcomes remain held. |
| 2 | Pass for the lease. Tests compare a populated, explicitly scheduled positive control with the unchanged preview-only baseline and an anonymous refusal. |
| 3 | Pass for the lease. Push Verify 44936512278 succeeded on attempt 2 for the exact candidate. The composer and runtime shards run the registered journeys. |
| 4 | Local results and screens are bound to the final candidate SHA. |
| 5 | MAINT-011 names UPDATE-004, UPDATE-005 and the notice duties in its own acceptance points. It derives from MAINT-009. No new Base duty was asserted. |
| 6 | Contract generation and check passed. The builder left the recorded Missing judgment, gap and evidence with the contract owner. |
| 7 | Clause text, acceptance, Status table and source judgments were preserved. |
| 8 | An authenticated publisher can preview and an anonymous request receives 401 before sending or publishing. The route does not issue recipient credentials or operate on erased-person records. |
| 9 | Synthetic Resend capture proves the serialized message and provider acceptance within the fixture. API-002, imported messages and push remain held. |
| 10 | The preview uses existing scheduling authority and has no recipient-address output. No policy default was introduced. |
| 11 | Branch custody only. Full-history publication scan, main equality, guarded landing and main-only Run site belong to the fleet lander. |

Existing assertions remain in their journeys. No new test registration was added. Preview text uses the existing 13 px minimum and both switches have text labels. The changed surface adds no icon-only control. Preview calls are read-only and can be repeated without committing a notice or creating a recipient token.

PROBE MAINT-011 2: The authenticated Maintenance form opened Page and Email before scheduling a future Brisbane window. Both previews matched the shipped permalink and captured email after explicit scheduling. Before scheduling, the window, notice, generation, delivery, outbox and send inventories were unchanged.

CLAIM MAINT-011 PARTIAL points=none tests=tests/e2e/maintenance-timezone.test.mjs#MAINT-009 PAGE-020 — operator schedules, reschedules and publishes maintenance in its configured zone, then a customer subscribes by keyboard; tests/e2e/publishing-contract.test.mjs#Maintenance cancellation is reviewed and the same window can be reinstated for its subscribers

GAP MAINT-011: Point 1’s durable versioned drafts, point 2’s remaining notice previews, and point 3’s complete Scheduled, reminder and start parity matrix remain held, along with API-002 maintenance creation, imported messages and NOTIFY-016 push.

## Mechanical checks

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0.

Before and after contract count is 66 Done, 123 Partial, 56 Missing, 245 total. No Status, Gap or Evidence cell changed. The generated views were restored to main. No migration changed.

## Product custody and local verification

Repository is just-every/run-lamp. Branch is cloud/sd-lamp-c-f200. Exact pushed HEAD is `262f3fed8f3c40024fb7582b2e91565245ff94c2`. Main advertised `9d35f872ac5d654f1cfcd1cc41698e7363254b0c` when the candidate was checked. The push created the cloud branch, and Git independently verified its advertised SHA.

The production build, Node 22.20.0 typecheck, first-party rer check, contract generator and source lock passed. All three maintenance timezone tests and both selected publishing journeys passed on the exact candidate. Both modified journeys run in push Verify. Browser proof was recorded for both preview views at 1440 and 390 and was inspected for readable content.

The preview used the existing scheduling role boundary and public page configuration. The test reused a refreshed owner session after pinning the clock so the browser exercised the same authority as the API. No deployment or live inbox receipt was claimed.

[Page at 1440](scheduled-page-1440.png) · [Page at 390](scheduled-page-390.png) · [Email at 1440](scheduled-email-1440.png) · [Email at 390](scheduled-email-390.png)

## Verify first attempt

Push Verify 44936512278 completed with a startup flake in runtime job 136944509009. NOTIFY-006 reported `MiniflareCoreError [ERR_ADDRESS_IN_USE]` with “Address already in use (127.0.0.1:41465)” before the test could assert behavior. Composer job 136944509039 passed and aggregate job 136948053555 failed after the runtime shard.

The permitted failed-job rerun was submitted once on the same run and SHA. The named NOTIFY-006 test passed when run separately on both the candidate and its main base in this cloud VM with pinned Node. The GitHub-hosted runner was ephemeral. No product change was made for the port collision. [Verify run 44936512278](https://github.com/just-every/run-lamp/actions/runs/44936512278)

## Verify final result

Push Verify 44936512278 completed successfully on attempt 2 for `262f3fed8f3c40024fb7582b2e91565245ff94c2`. The product branch still advertises that exact SHA. Main advertises `a72f4668621d5d8a43c3e312bb1d24f4b9067831` at handoff. The guarded lander owns the full-history publication scan, main equality and main-only Run site. The UI and release gates remain with the lane. [Verify attempt 2](https://github.com/just-every/run-lamp/actions/runs/44936512278/attempts/2)
