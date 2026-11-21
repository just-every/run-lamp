# Lamp SUB-016 · sd-lamp-c-f194

Codex, 2026-11-21. Product candidate c97c8e17ffce8b565164da5ceb42d7575863f50b. Base main d7dc4bff90e12f86fc4c60dfbd3abe130eab2102. The base passed Verify 44907496586 and Run site 44907496672. The continuation commit 16b904bf9655a0a8a195ab6d2195f2282b464a06 passed Verify 44905605277.

## Plan and outcome

The plan's Next campaign continuation row for SUB-016 advances its acceptance 3 chat-default proof. I carried the previous round's change onto current main and added checks that all three controls are enabled and the browser serializes exactly incidents and maintenance in the untouched form. The existing journey opens the management URLs returned by Slack's native OAuth callback and Teams' explicit native confirmation in fresh browser pages before any edit. It checks the channel label, confirms Incidents and Maintenance are checked and confirms Component status changes is visible and unchecked. The recorded exchanges, delivery controls, revocation and erasure checks are retained. The existing test registration covers this through the delivery shard. Test registrations added: zero.

Slack's default is selected before OAuth in `src/core/features/subscribers/slack-subscriptions.ts`. It travels through the OAuth state to `src/core/features/subscribers/chat.repository.ts`. Teams supplies no selection in the fixture, so the Teams creation path in `src/core/features/subscribers/teams-subscriptions.ts` uses the chat repository's incident and maintenance defaults. The signed-out management page renders stored preferences using `src/core/features/subscribers/preferences.ts`. The test supplies literal expectations for both channels.

Counts before and after: 66 DONE, 123 PARTIAL, 56 MISSING, 245 total. SUB-016 remains PARTIAL. The contract status table, generated views, Base pin and production UI are unchanged. No policy default was adopted.

## Acceptance and existing evidence

| Point | Door and evidence | This round |
| --- | --- | --- |
| 1 | The chat preference delivery controls are in `tests/e2e/helpers/chat-preferences-flow.mjs`. Email and webhook examples are in `tests/e2e/helpers/subscriber-preferences-flow.mjs`. | Complete preference combinations and all channels including audiences remain held. |
| 2 | The impact-threshold email case is in `tests/e2e/helpers/subscriber-preferences-flow.mjs`. SUB-019 is marked done in its own row. | Integration of single-incident following and impact preferences across channels remains held. |
| 3 | The private-channel journey at `tests/e2e/channels-and-presets.test.mjs:240` calls `tests/e2e/helpers/self-serve-chat-flow.mjs:8` after the two consent exchanges at lines 66–68. | Both Slack and Teams defaults proved locally. Other channels' initial defaults remain outside the lease. |
| 4 | The recorded chat journey changes preferences via the native token URLs and checks resulting deliveries in `tests/e2e/helpers/chat-preferences-flow.mjs`. | Complete session-free management for every channel and audience is held. |
| 5 | The existing signed-YES SMS journey at `tests/e2e/helpers/sms-subscriber-flow.mjs:186` includes maintenance-only management and delivery. | The SMS proof is outside this lease. |
| 6 | `tests/e2e/helpers/subscriber-preferences-flow.mjs:124` and the following escalation assertions cover two severity levels at the recorded email edge. | Existing email control is outside this lease. |

## DONE-RIDERS

1. Incomplete for the whole clause. The tested scope is the Slack and Teams initial state. AUD-004 is missing and SMS component status notifications remain unbuilt per the SUB-016 status row.
2. Passed for the leased proof. Fresh native consent yields two distinct channel links. The test reads visible, enabled controls and independently checks their checked state and the form's event submissions.
3. Passed for the leased proof. The delivery shard runs the existing channels-and-presets registration. Exact-SHA push Verify 44909548719 completed successfully.
4. The focused helper and both-width screenshots use the exact candidate checkout. The 1440 viewport is the only assertion width and the 390 viewport is a separate visual capture.
5. No new inherited duty. SUB-019 and AUD-004 remain named in the acceptance text.
6. Contract generator write and check passed. Main's existing status and provenance remain intact pending guarded landing and any future judgment.
7. No change to acceptance points, status, evidence cells or rider wording.
8. Management reads use fresh browser contexts without the operator session. Existing signed Slack revocation and subscriber deletion assertions were retained and ran in the focused helper. No authority change.
9. Slack OAuth and the Teams workflows exchange are synthetic network edges. This packet establishes local native behavior and confers no live-provider or release qualification.
10. No policy decision or default introduced.
11. Publication scan, main equality and Run site for the candidate are guarded landing checks. No candidate publication scan receipt is available from this VM.

PROBE SUB-016 3: Open both management links returned by native consent signed out before editing -> each returns 200, identifies its own channel, and submits Incidents and Maintenance selected. Component status changes is available and starts unchecked.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM SUB-016 PARTIAL points=3 tests=tests/e2e/channels-and-presets.test.mjs#INTEG-002 SUB-014 SUB-015 NOTIFY-011 NOTIFY-012 UPDATE-013 — Private channels deliver the selected publication once with literal text and punctuated links

GAP SUB-016: Other channel defaults in acceptance 3 and the held full-channel and audience preference and management proof for acceptances 1–2 and 4–6 remain open for this round, including SUB-019 integration, AUD-004 and SMS component status notifications.
