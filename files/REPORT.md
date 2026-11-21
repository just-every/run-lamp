# Lamp SUB-016 initial chat preferences

Fleet run sd-lamp-c-f189 · Codex · 2026-11-21

Line to update in the Lamp Next campaign plan

- SUB-016 remains PARTIAL. Acceptance 3 now has signed-out initial preference coverage for Slack and Teams after native consent. Keep the rest held under the planner's existing scope.

## Scope and execution

1. Read the current clause and Status row and review the existing subscriber and delivery journeys.
2. Trace the Slack and Teams defaults from public consent through persistence to token management. Extend the existing registered private-channels journey with one pre-edit browser check for each channel.
3. Exercise both management links with the recorded provider exchanges, preserve the delivery controls, and capture both screens at 1440 and 390.
4. Run the touched suite, typecheck, contract view regeneration and check, source lock refresh and check, and first-party profile check. Push the branch and hand publication scanning and landing to the guarded lander.

Lamp has 66 DONE, 123 PARTIAL and 56 MISSING clauses out of 245 before and after this round. SUB-016 remains PARTIAL. Acceptance text and status records are byte-identical to the base. The channels suite still contains eight registrations.

## Acceptance coverage

| Point | Existing evidence and result for this lease |
| --- | --- |
| 1 | The subscriber preference and chat delivery journeys exercise selection and delivery for existing channels. Full combinations and audience coverage are held. AUD-004 is MISSING on the base. |
| 2 | The email journey exercises the impact threshold. Cross-channel filtering and the connection to the single-incident scope are held. SUB-019 itself is DONE on the base. |
| 3 | The webhook component delivery journey asserts the webhook default. The registered private-channels journey now opens each captured management link in its own fresh browser context and checks its channel and initial event preferences. Other channel defaults remain held. |
| 4 | The existing chat preferences journey saves maintenance-only selections through the token-authorized page and checks delivery and exclusion. The complete channel and audience management matrix remains held. |
| 5 | The existing SMS subscriber journey exercises maintenance-only delivery and incident suppression. Its full scope and SMS component status delivery remain held. |
| 6 | The existing email preference journey checks degraded-incident silence and escalation delivery. Further proof is outside this lease. |

The existing private-channels test is registered in `tests/e2e/channels-and-presets.test.mjs` at line 240 and runs `selfServeChatFlow` at line 388. The added checks in `tests/e2e/helpers/self-serve-chat-flow.mjs` at lines 8–30 and 63–65 run before the original incident publication and the preference edits at line 80. The existing Teams confirmation preview and explicit POST, Slack OAuth exchange, provider delivery assertions, preference edits, revocation, archive suppression, failure deactivation and erasure all remain in that journey.

In `src/core/features/subscribers/preferences.ts`, Slack's omitted fields choose the non-webhook defaults. `src/core/features/subscribers/slack-subscriptions.ts` saves those settings with OAuth state and passes them to persistence after the callback. `src/core/features/subscribers/teams-subscriptions.ts` passes omitted preferences into `src/core/features/subscribers/chat.repository.ts`, which persists incidents and maintenance as the fallback. Teams explicit confirmation activates that row and supplies its management capability. The public GET in `src/core/features/subscribers/routes.ts` loads the token's subscriber and `src/core/features/subscribers/service.ts` renders the channel and the persisted preferences. These source files were traced without edits.

## DONE riders

| Rider | Result |
| --- | --- |
| 1 | The 1440 journey reaches both leased default states through the native consent and signed-out management doors. The full clause is PARTIAL for the held outcomes above. |
| 2 | The browser asserts two real seeded subscriptions with literal channel names and checkbox states. A missing or incorrect control fails. |
| 3 | The delivery shard loads the registered journey via `test:channels`. Exact candidate CI is recorded in the receipt. |
| 4 | The local probe and browser captures are bound to the helper bytes on the candidate. |
| 5 | This proof adds no Base duty or citation. |
| 6 | Contract documents regenerate and check successfully. The existing PARTIAL judgment remains in the contract. |
| 7 | This round edits neither acceptance text nor any Status table row. |
| 8 | The test opens each capability in a fresh signed-out context. The existing revocation and erasure controls remain. Product permissions were outside the code change. |
| 9 | The journey uses synthetic provider responses for OAuth and Workflows. Live provider qualification remains held. |
| 10 | No policy default or ruling was needed for this proof-only change. |
| 11 | Exact main equality, candidate publication scan and candidate Run site await guarded landing. |

PROBE SUB-016 3: Open the Slack OAuth callback and the Teams confirmation management URLs signed out before any edit -> each returned 200 with its own channel shown, Incidents and Maintenance checked, and Component status changes visible and unchecked.

GAP SUB-016: The balance of acceptance 3 and acceptances 1–2 and 4–6 remain held, including complete channel and audience preferences, single-incident scope, impact filtering, and SMS component and maintenance-only delivery proof.

## Candidate and local checks

The product branch is `cloud/sd-lamp-c-f189` at `5a0f235ae252c0d597300eb4569684de919749dc`. Its base is `9ea011e0fe99033bc4e3d09fd6b6f96252c55324`, with main Verify 44899481148 and Run site 44899481252 both completed successfully. Branch Verify 44900105475 was triggered by the candidate push. The receipt records the latest exact-SHA status.

The focused self-serve chat journey and the registered private-channels test passed with Node 22.20.0 and system Chromium. The local browser launcher selected the system binary for existing helpers that expect Playwright's downloaded binary. The initial unpinned attempt lacked that default binary and was superseded. The rebase changed only the unrelated publishing test and the base lock. The browser proof's added helper bytes match the candidate.

Two supplemental negative controls changed only the browser response inside a local probe. Removing Slack's Component status changes control failed the visibility assertion. Checking the Teams control failed the initial-selection assertion. Neither negative control entered the test suite or product tree.

Typecheck, first-party profile, exact-candidate views and source integrity checks passed. The diff retains all existing assertions and adds no test registration, app UI or migration. The four captures use synthetic fixture data and contain no management links or image text metadata. The candidate publication scan and main Run site remain with the guarded lander.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The complete touched channels suite passed all eight tests.

## Exact candidate Verify

Push Verify 44900105475 completed with failure. The delivery job 136834307621 passed on the candidate and exercised the changed journey. The build job 136834035597 also passed. The imports job 136834307634 failed in the existing hosted mail-off setup test at `tests/e2e/rer-mail.test.mjs` line 677 with `route.fulfill: Route is already handled!`. Aggregate job 136837518608 failed because imports did not succeed. Both failed-job log archives were read once. The candidate's source diff does not touch the failing test, its application source, the verification workflow or package pins.

The local exact-candidate rerun of the GitHub imports command, `pnpm run verify:app` with `LAMP_VERIFY_SHARD=imports`, exited 0. All 13 import tests, five mail tests and four site tests passed. `pnpm run test:mail` on the exact base commit also exited 0 with five passing tests. Both reruns passed the hosted mail-off case. They used pinned Node and system Chromium 154 on Debian 13. GitHub's hosted workflow uses Playwright's installed Chromium on Ubuntu 24.04.

The recorded remote failure remains unreproduced and blocks a READY handoff under the Verify repair rule. No repair commit or CI rerun was made. The branch preserves the locally proven SUB-016 slice and the successful delivery shard on the exact candidate.

CLAIM SUB-016 PARTIAL points=3 tests=tests/e2e/channels-and-presets.test.mjs#INTEG-002 SUB-014 SUB-015 NOTIFY-011 NOTIFY-012 UPDATE-013 — Private channels deliver the selected publication once with literal text and punctuated links
