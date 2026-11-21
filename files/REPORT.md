# Lamp SUB-016 continuation

Run sd-lamp-c-f193 · 2026-11-21

## Plan and implementation

Planner return 40 assigns SUB-016. Its lease covers acceptance 3's initial event preferences for Slack and Teams. The plan is to replay the predecessor's browser assertions onto current main, verify the two native management links immediately after consent, and return the tested branch to the lane. The other campaign rows remain held as recorded.

The replay extends the existing private-channel journey. It opens each consent-issued link in a fresh Chromium context and requires HTTP 200, the correct channel, visibly checked Incidents and Maintenance, and a visible unchecked Component status changes. The visit occurs before publication or preference edits. The existing provider exchanges, recipient and maintenance checks, removal, revocation, delivery refusal, and erasure assertions remain in the journey. The patch adds no test registration and retains every existing assertion.

| Acceptance | Coverage and disposition |
| --- | --- |
| 1 | Existing email, webhook and chat preference checks remain. The complete channel and audience matrix is held, including SMS component-only status notifications and AUD-004. |
| 2 | Existing impact controls remain. Single-incident following under SUB-019 and the complete scope and impact-filter matrix are held. |
| 3 | This round adds Slack and Teams initial management-page readback. The other channel defaults are held by the planner. |
| 4 | Existing token-based editing remains in the journey. The complete channel and audience management matrix is held. |
| 5 | Current main cites SMS maintenance-only delivery coverage. This round leaves the SMS point with the planner. |
| 6 | Current main cites recorded email impact escalation coverage. This round leaves the email point with the planner. |

The clause remains PARTIAL. Counts before and after are 66 DONE, 123 PARTIAL, 56 MISSING, 245 total. The plan row receives the scoped evidence and continued hold. The patch changes the existing helper and its lock entry. No policy default was adopted.

## Read-only implementation trace

- `src/core/features/subscribers/preferences.ts` lines 11–24 defines the non-webhook event defaults and renders the given checked states.
- `src/core/features/subscribers/slack-subscriptions.ts` lines 35–40, 64 and 98–109 applies omitted-form defaults at OAuth start, preserves the intent through the recorded callback, and returns the management link.
- `src/core/features/subscribers/teams-subscriptions.ts` lines 37–75 creates the pending subscription, leaves omitted preferences to the chat repository, and returns the management token after consent.
- `src/core/features/subscribers/chat.repository.ts` lines 16–43 persists Incidents and Maintenance when chat input omits preferences and carries Slack's selected values through OAuth state.
- `src/core/features/subscribers/service.ts` lines 138 and 399–400 reads stored preferences and renders the channel and event controls on the management page.

## DONE-RIDERS and handoff

1. Scoped browser assertions are in `tests/e2e/helpers/self-serve-chat-flow.mjs` lines 8–31 and 63–65. The private-channel journey in `tests/e2e/channels-and-presets.test.mjs` registers at line 240 and calls the helper at line 388. The whole clause still has held outcomes.
2. Both channels use their native consent links and enrolled records. Channel, visibility and selection assertions have independent expectations.
3. Push Verify uses the delivery shard's `test:channels` command. The workflow receipt records the exact-head status.
4. Browser and local command provenance is recorded in the receipt.
5. The clause names SUB-019 and AUD-004. The journey uses the existing SUB-007 token-management door.
6. Contract generation and its check passed. The candidate carries main's existing judgment and generated views.
7. Acceptance, coverage and rulings are unchanged.
8. The visit uses an isolated browser without an operator session. The journey retains revocation and erasure controls. The patch adds no authority or mutation path.
9. Slack and Teams use recorded network edges. Live provider qualification remains outside this receipt.
10. No new policy default applies.
11. Main equality, publication scanning and Run site on the landing SHA are guarded-lander checks.

The browser observations show both management pages returning HTTP 200 with zero cookies at 1440 and 390. The preference labels measured 15 px, the document fit both viewports, and the inspected controls had visible labels. The 1440-pixel registration asserts the defaults. The 390-pixel captures record the same pages without adding another test case. The synthetic provider contacts and authorization proof stay in the existing journey.

PROBE SUB-016 3: Open each native consent-issued management link in a fresh signed-out browser before any edit -> HTTP 200, correct channel, Incidents and Maintenance checked, and Component status changes visible and unchecked.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The first exploratory local run found that two existing helpers used Playwright's absent cached browser. It reached six passing tests and failed those two at browser launch. The repeat used the repository's pinned Node and a temporary preload selecting the VM's Chromium for all launches. The preload captured screenshots and preference state and did not change the product tree or skip any assertion. Build, typecheck, first-party check and all eight tests in the touched suite passed. The exact-head workflow status is recorded in the CI receipt.

The predecessor's Verify 44900105475 reached success in attempt 2 on its own SHA. Attempt 1 recorded an imports-shard and aggregate failure. The one job archive query returned passing mail-off output, so it provides no diagnosis of the prior failure. The candidate carries no mail change. The base main SHA had successful Verify 44903552441 and Run site 44903552363.

## Product provenance

Product branch cloud/sd-lamp-c-f193 at 16b904bf9655a0a8a195ab6d2195f2282b464a06.
Base main 33ba19fdf501e4af972ebd8d633f0d48f56e136a.
Predecessor replayed 5a0f235ae252c0d597300eb4569684de919749dc.
Only the existing test helper and its source-lock entry changed. The branch uses push-triggered Verify and is a handoff to the guarded lander.

Verify 44905605277 completed successfully on the exact product SHA on its first push attempt.
At handoff, main advertised 33ba19fdf501e4af972ebd8d633f0d48f56e136a. Run site and the full-history publication scan for this candidate await the guarded landing.
