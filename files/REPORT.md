# Lamp NOTIFY-022 acceptance 2

Run Edit Run fleet, 2026-11-21

## Scope and plan

Continue the NOTIFY-022 row from sd-lamp-c-f178 at `093f6bef6fee83f52b213f3d5eb6f86c0c11466f`, rebased onto current main. The planner leased acceptance 2 only. Keep the recorded PARTIAL judgment, run the existing mail journey against a built Lamp installation, clear the saved footer from the Notifications pane, and verify the next committed publication at each recorded provider edge. Preserve the earlier footer baseline, provider identity, retry, replay, unsubscribe, and erasure checks. Record proof and hand off to the guarded lander. The campaign extract needs only this row's local proof annotation.

The campaign counts are 66 DONE, 123 PARTIAL, and 56 MISSING out of 245 both before and after this round. The test file still registers five tests. Product source and the acceptance text, judgments, and generated views are byte-identical to main. The product diff contains the existing mail journey and its regenerated source lock.

## Outcome mapping

| Acceptance | Public door and observation | Evidence |
| --- | --- | --- |
| 1 | The shipped notification path appends matching links and list headers independently of footer wording in the tested Settings journey. The complete matrix of edits and doors stays held. | PARTIAL coverage in the existing mail journey, lines 317–347. |
| 2, clearing succeeds | The hydrated Notification email section loads a distinctive saved footer. The operator clears the textarea and waits for the autosave acknowledgment. A separate native GET reads the complete branding object with the empty footer. | PASS locally. Mail journey, lines 55–82 and 267–275. |
| 2, fresh update and recipient | A new committed update has one captured provider request. The native delivery list ties that update to the previously confirmed subscriber, and the provider request matches the recipient and the delivery's message identity. | PASS locally. Mail journey, lines 141–168 and 277–310. |
| 2, wording and destinations | The populated message contains the distinctive footer in both parts. The fresh message contains its own update wording. Comparing complete parts removes only the footer and accounts for the new update wording. Status, management, and unsubscribe URLs match in both parts. The management page independently supplies the same unsubscribe path. | PASS locally. Mail journey, lines 249–275 and 311–329. |
| 2, list headers | Managed relay preserves its exact mapped fields for unsubscribe, one-click, list identity, archive, and help. Resend and SendGrid preserve the corresponding exact headers. The same links are actionable through the public routes, and the captured unsubscribe authorization is exercised. | PASS locally. Mail journey, lines 317–366. |
| 3 | Managed relay identity refusal remains covered. Complete named missing-link refusals through Settings, templates, page-data restore, and API overrides stay held. | Scope held. |

The journey is registered in `tests/e2e/rer-mail.test.mjs` at line 87. The verification plan loads `test:mail` in the imports shard. Chromium exercised the Settings autosave at 1440 pixels for each fixture. The attached browser images show the saved blank footer at 1440 and 390 pixels in the managed-mail installation.

`src/core/shared/email-branding.ts` lines 23–36 make the optional plain-text footer part of editable wording and generate navigation independently. `src/core/features/deliveries/service.ts` lines 187–225 append the text destinations and headers when constructing a new envelope, then persist the envelope for replay. Those files were traced read-only.

PROBE NOTIFY-022 2: cleared the populated footer in Settings → independent GET returned an empty footer; a newly published update yielded one matching envelope for the confirmed reader at each recorded provider edge with the required destinations and list headers intact.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## DONE-RIDERS and pre-READY checks

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | PARTIAL | Acceptance 2 passed through the native Settings, delivery and subscriber doors in the mail journey. The complete door matrices for 1 and 3 are held. |
| 2 | PASS in lease | Populated and cleared controls in lines 249–347 verify the exact user-visible outcome. The existing unauthorized sign-in, unconfirmed recipient, opt-out, erasure and replay checks still run. |
| 3 | See Verify receipt | Imports shard invokes the touched mail suite in branch push Verify on the product SHA below. |
| 4 | PASS locally | Mail suite and browser images were captured at the candidate tree. The main update immediately before commit changed the Statuspage import test and its source lock. |
| 5 | PASS for the leased duty | The clause names required links and mandatory headers directly. NOTIFY-019 retains the provider and audience-specific branding boundary. |
| 6 | PASS for generation; judgment pending | The documented write and check pass. Status, Gap, Evidence and judgment provenance remain the lander's responsibility. The planner's held outcomes are recorded below. |
| 7 | PASS | Acceptance text and scope are identical to main. |
| 8 | PASS in lease | Native session is obtained through the sign-in route, then the authenticated operator uses Settings. The existing managed identity refusal, signed receipt refusal, opt-out, erasure, and replay exercises remain active. |
| 9 | HOLD | Managed relay, Resend, and SendGrid are synthetic network edges. Live receipt, adoption, UIP, and release prerequisites remain with their existing gates. |
| 10 | PASS | The managed sender and Reply-To follow the existing contract. |
| 11 | PENDING LANDING | Candidate publication scanning, main equality with the candidate, and main's Run site receipt belong to the guarded lander. |

The retry preserves the original envelope after Settings changes, including the Resend idempotency key. Early Cron replay and post-acceptance replay stay silent. The test checks the original and edited sender identities for owner-supplied providers, refusal of managed-relay identity overrides, and unchanged configured identity across the footer clear. The active authority controls remain exercised, including reader opt-out and erasure before later sends. The test change preserves existing assertions and adds zero test registrations. The Settings UI ran unchanged. The candidate test diff contains zero new email-shaped literals.

GAP NOTIFY-022: Acceptances 1 and 3 retain their full link-survival and named missing-link refusal matrices. Audience-specific settings await AUD-001. Managed relay controls From and Reply-To, and live provider receipt, adoption, UIP and release qualification remain held.

## Product provenance

Product branch `cloud/sd-lamp-c-f182` at `6102465816baeab9e5a9d76ed8d5ba883b5044e4`. Latest main before push `b1b29dd0b0dcaf6db7c8507d1d6b579469a96b70`. The exact product SHA is advertised on the product branch. See `receipt.json` for local checks and candidate CI.

<!-- terminal provenance -->

Verify push run 44882823132 reported completed with conclusion success for the exact product SHA. [Verify](https://github.com/just-every/run-lamp/actions/runs/44882823132)

CLAIM NOTIFY-022 PARTIAL points=2 tests=tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out
