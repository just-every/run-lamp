# Lamp SUB-016 initial chat preferences

Codex · 2026-11-21 · sd-lamp-c-f196

- Repository just-every/run-lamp. Product branch `cloud/sd-lamp-c-f196`. Candidate `41f4f47ebae0c194ad8a5a2c9b79d6824404dbcb`.
- Candidate parent `00eaed1983515aa829036376d7fabeea8337f13b`. Started at the requested predecessor `c97c8e17ffce8b565164da5ceb42d7575863f50b` and reconciled the rebase with main, which had gained the initial checkbox assertions. Kept those assertions and carried forward the predecessor's enabled controls and default form payload checks. Added the label-to-event mapping check for every checkbox, including the initially unchecked component option.
- Plan extract row `SUB-016`, continuation 3 of 3. Prove only the Slack and Teams initial defaults in acceptance 3 through the existing consent and delivery journey. Retain the recorded provider exchanges and delivery controls. Evaluate the rest of the clause against the planner's held scope.
- SUB-016 stays PARTIAL. Recorded status counts before and after are 66 DONE, 123 PARTIAL, 56 MISSING of 245. Contract wording and Status, Gap and Evidence cells have no diff. The candidate changes one test helper and the generated source lock. It adds no test registration.

## Public-door proof

| Channel | Native consent and management link | Initial page observation |
| --- | --- | --- |
| Slack | Public subscription form and recorded OAuth exchange. The callback supplies the management link. | Signed-out HTTP 200 with Slack identified. Incidents and Maintenance are checked. Component status changes is enabled and unchecked. |
| Teams | Public Workflows subscription, captured verification card and explicit confirmation. The confirmation supplies the management link. | Signed-out HTTP 200 with Teams identified. Incidents and Maintenance are checked. Component status changes is enabled and unchecked. |

The helper opens each actual link in a fresh Playwright context before any edit. It checks visibility, enabled state, submitted value and checked state for each option. Form data contains exactly `incidents` and `maintenance`. The assertions are at 1440 pixels in `tests/e2e/helpers/self-serve-chat-flow.mjs` lines 15–34, invoked at lines 70–73 and registered by `tests/e2e/channels-and-presets.test.mjs` lines 240 and 388. The browser observations and screenshots cover both channels at 1440 and 390 pixels. Mobile preference text measured 15 pixels. Both mobile pages fit the viewport, and the management screens have no icon-only buttons.

The read-only source trace starts with Slack parsing omitted preferences to `defaultPreferences("slack")` and carrying them through the single-use OAuth state into the stored subscription. Teams passes absent preferences through its native subscribe route, so the shared chat repository stores incidents and maintenance when creating the pending subscription. Explicit Teams confirmation activates that record before it issues the manage capability. The common management service reads the stored event kinds and renders the corresponding checkboxes. See `src/core/features/subscribers/preferences.ts` lines 11–26, `src/core/features/subscribers/chat.repository.ts` lines 17–44, `src/core/features/subscribers/slack-subscriptions.ts` lines 35–72 and 98–109, `src/core/features/subscribers/teams-subscriptions.ts` lines 37–75 and `src/core/features/subscribers/service.ts` lines 138 and 399–400.

PROBE SUB-016 3: Open the management links issued by native Slack OAuth and confirmed Teams Workflows in fresh signed-out Chromium contexts before edits -> both identify the correct channel and expose enabled Incidents and Maintenance checked and Component status changes unchecked. The default form submits only incidents and maintenance.

## Clause scope and DONE riders

| Row | Result on the candidate |
| --- | --- |
| 1 | Scoped Slack and Teams outcomes passed locally at helper lines 15–34 and 70–73. Acceptance 3 beyond Slack and Teams, and acceptances 1–2 and 4–6 as complete matrices, are outside this lease. |
| 2 | Passed for the scoped outcomes. Both native flows issued real management links on new seeded records. Each asserted checkbox would fail if absent, disabled, miswired or set to the wrong state. |
| 3 | The delivery Verify shard already runs the registration at line 240 through `pnpm test:channels`. See the exact-SHA run result below. |
| 4 | The journey and screenshots use the candidate SHA and its source. |
| 5 | SUB-016 names the AUD-004 and SUB-019 duties in its own acceptance text. AUD-004 remains missing. The SUB-016 integration with single-incident following remains held under this lease. |
| 6 | Contract write and check passed. Main's Status, Gap and Evidence text was taken whole. Candidate judgment provenance is for the lander. |
| 7 | Acceptance text has no diff. |
| 8 | Existing recorded refusal, revocation, delivery suppression and erasure assertions remain in the same journey. The change uses an already-issued token to read subscriber preferences in a fresh context. |
| 9 | Recorded provider exchanges only. Live Slack installation, Teams provider and release qualification remain outside this proof. |
| 10 | No new policy default was needed. |
| 11 | Candidate publication scan, main equality, and post-landing Run site are owned by the guarded lander. |

The existing assertions still cover Slack delivery, uninstall, token revocation, archive rejection and erasure, as well as Teams confirmation, delivery and failure deactivation. The same test still exercises maintenance-only preference changes and incident suppression after the initial read. No assertions were removed or narrowed. No application or visual source was changed. The candidate diff passed its local identity, trailer, whitespace and changed-text hygiene checks. Full-history publication scan receipt for the candidate remains pending at the lander. Its `complete`, `historyScanned` and `findings` fields are unestablished in cloud.

CLAIM SUB-016 PARTIAL points=3 tests=tests/e2e/channels-and-presets.test.mjs#INTEG-002 SUB-014 SUB-015 NOTIFY-011 NOTIFY-012 UPDATE-013 — Private channels deliver the selected publication once with literal text and punctuated links

GAP SUB-016: Acceptance 3's other channel defaults and the full proof for acceptances 1–2 and 4–6 remain held, including SUB-019 single-incident integration, AUD-004 audience subscriptions, the channel preference and impact matrix, and SMS component status changes and maintenance-only delivery proof.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Verification and custody

Local build, all eight cases in the touched test file, TypeScript, the first-party profile, contract generation and source lock checks passed. The journey ran on Node 22.20.0 with system Chromium. The browser preload saved the four screenshots after the committed assertions ran and recorded the checkboxes without the management links. See `RECEIPT.json` and `browser-observations.jsonl`.

The rebased main parent had successful push Verify 44912276262 and Run site 44912276281. The product was pushed only to its named branch. Run site triggers on main and awaits guarded landing.

Exact candidate push Verify 44912867737 remained in progress at handoff. Candidate main equality, publication scan, and Run site remain pending. [Verify 44912867737](https://github.com/just-every/run-lamp/actions/runs/44912867737)
