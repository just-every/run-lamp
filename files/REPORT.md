# Lamp NOTIFY-019 acceptance 5

Run sd-lamp-c-f183, 21 November 2026. Repository just-every/run-lamp. Product branch cloud/sd-lamp-c-f183. Product commit 18fced5578d603b7791e31ec81beb6fd7d6098ff. Base main f95b99b87f0ab98c8ad15c8e842a77baf30c95b1.

## Plan and result

1. Read the full NOTIFY-019 clause and Status row, the supplied Next campaign and DONE-RIDERS, and the email-branding component and renderer. The signed-in operator can already save plain-text wording with postal guidance and the preview and transport share that rendering. The leased gap was end-to-end proof of this address line.
2. Extend the existing operator journey to inspect the guidance on the footer field, wait for the save acknowledgement for its input, then compare a separate Settings read and the field after reload. Open the saved incident's Email preview and check the exact visible paragraph in the message frame.
3. Extend the existing built-Worker provider-edge journey with the same line and a separate committed update after the change. Reconcile the delivery against the update and active subscriber, then check the exact recipient, update wording and footer in captured text and HTML on managed relay, Resend and SendGrid. Preserve the frozen-envelope replay, receipt, opt-out and cleared-footer controls.
4. Run the touched journeys, build, first-party check, typecheck, document generation and source-lock commands. Record focused browser views at 1440 and 390 pixels and publish evidence on the separate evidence branch.
5. Plan row for the SD lane. NOTIFY-019 remains PARTIAL with acceptance 5 evidenced on 18fced5578d603b7791e31ec81beb6fd7d6098ff. Hold acceptances 1–4 with the existing managed-relay and audience-page boundaries. The next campaign row retains its place in the supplied order.

Recorded totals before and after are 66 DONE, 123 PARTIAL and 56 MISSING, 245 total. The verification inventory remains 116 registered cases and 10 assertion scripts, 126 checks. The change consists of two test files and their generated source lock.

## Acceptance and inherited obligations

| Item | Result on 18fced5578d603b7791e31ec81beb6fd7d6098ff |
| --- | --- |
| 1. Brand identity, prefix and plain-text wording, preview and clearing | Held as a full point. Existing settings, preview and provider clearing controls still run. |
| 2. Same-host logo, page-name alternative text and text fallback | Held. |
| 3. Complete branded update and authenticated sender | Held as a full point. The new capture proves the address in both parts. Live provider qualification and authenticated sender proof retain their own gates. |
| 4. Per-audience-page branding | Held pending AUD-001. |
| 5. Settings guidance and owner-supplied postal line | Local browser proof at tests/e2e/publishing-browser.test.mjs lines 727–745 and 882–899. Provider proof at tests/e2e/rer-mail.test.mjs lines 195–204 and 248–287. Both compare the same synthetic postal line. Push Verify 44890625227 completed successfully on the exact candidate SHA. |
| BASE-MAIL-001, truthful mail outcomes | Cited in the clause. The provider journey distinguishes transport acceptance from delivery and retains signed receipt checks and a replay control. Recorded provider-edge responses were synthetic. |
| BASE-PUBLIC-001, privacy | Cited in the clause. The postal value is synthetic. The new envelope requires exactly the confirmed subscriber as recipient and the existing opt-out remains asserted. |
| NOTIFY-008 and NOTIFY-010, authenticated sender | Existing sender ownership and verification gates continue. |
| NOTIFY-022, mandatory links | The existing matched clear and mandatory-link assertions remain active in the mail journey. |

## DONE-RIDERS

| Row | Result |
| --- | --- |
| 1 | PARTIAL. Point 5 reaches Settings, native readback, reload, Email preview, committed publication and provider transport. Points 1–4 remain held. |
| 2 | PASS for point 5. The browser and provider tests compare separately read values and captured content to the original synthetic address. The exact single-recipient check uses the previously confirmed reader fixture. |
| 3 | PASS. Push Verify 44890625227 completed successfully on the exact candidate SHA. |
| 4 | PASS. The touched journeys and browser views were exercised on 18fced5578d603b7791e31ec81beb6fd7d6098ff with the pinned Node and pnpm. |
| 5 | PASS. CONTRACT.md cites BASE-MAIL-001 and BASE-PUBLIC-001. |
| 6 | PASS for generated document consistency. The generator check passed. The existing Status cells and judgment provenance remain for the lander. |
| 7 | PASS. Contract acceptance text, generated views, Status rows and scope are identical to the base. |
| 8 | Existing sign-in, active subscriber, replay and opt-out checks still run. Point 5 introduces no authority change. |
| 9 | Held. The network edge proves the submitted envelope. Live receipt, hosted adoption, UIP and release qualification retain their existing gates. |
| 10 | PASS for this lease. Existing authority and managed-relay policy continue. The full-clause ruling remains with ct. |
| 11 | Pending guarded landing. Candidate main equality, a complete full-history publication scan and candidate Run site have no cloud receipt. |

## Runtime probe and checks

PROBE NOTIFY-019 5: Settings → Notifications → Email footer with 482 Synthetic Lantern Way, Suite 19, Example City, ZZ 00000 -> visible postal guidance, the exact line in a separate Settings read and after reload, the exact paragraph in the draft Email preview, and the exact line and paragraph in the matching fresh envelope to the confirmed reader at all three synthetic provider edges.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The change preserves prior browser assertions and the provider freeze, clearing, receipt and revocation controls. The assertions cover guidance, save acknowledgement, persistence, preview, exact envelope recipient and both rendered mail parts. Browser assertions run on the 1440-pixel owner journey. The proof images focus on the settings and preview regions from 1440- and 390-pixel viewports and mask the reply address.

The postal-address browser journey passed with the system Chromium, and the independent provider file passed all five cases. The whole browser file passed seven of eight cases. The unrelated THEME-001 case exceeded its four-request budget because system Chromium also requested the favicon. The same assertion and five paths reproduced on base main with the same Chromium. The test and product theme remain identical to base. The fixture's default Playwright executable path was linked to the system Chromium in the VM. The loopback launch probe passed and the stock data-URL probe hit the browser's administrator policy. All candidate checks in the receipt use pinned Node 22.20.0.

Base main Verify 44888108728 and Run site 44888108898 both completed successfully. Push Verify 44890625227 completed successfully on the exact candidate SHA. Candidate Run site is main-only for push and awaits guarded landing. Remote main at handoff was bae6596ccf21e8c6a905b0e708c9a76c4f85c4db. Publication scan for 18fced5578d603b7791e31ec81beb6fd7d6098ff had complete=unestablished, historyScanned=unestablished and findings=unestablished. The cloud used a full-history clone and checked all candidate commit identities and messages, new email-shaped values and bare slash tokens. The fleet's independent lander owns the full scan.

CLAIM NOTIFY-019 PARTIAL points=5 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey; tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out

DEFAULT NOTIFY-019: Keep managed relay ownership of From and Reply-To and retain the AUD-001 boundary for audience-page settings pending the full-clause ruling.

GAP NOTIFY-019: Acceptances 1–4 remain held. Owner branding and clearing, same-host logo and text fallback, full branded and authenticated envelope, and audience-page customization retain their complete proof requirements. Provider receipt, adoption, UIP and release prerequisites continue to apply.
