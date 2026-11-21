# PAGE-020 keyboard subscription proof

Prepared by Codex on 21 November 2026 for the Lamp seed lane.

## Scope and result

Planner row for sd-lamp-replan-41: PAGE-020 remains PARTIAL. This round covers the keyboard-only public email subscription and management journey at 390 px within acceptance 3. It keeps the 1440 px journey, public-surface audits, and dated VPAT. The other plan rows, contract judgments, work on private pages under AUD-002, and the adoption, UIP and release prerequisites stay with their existing owners.

The existing composer test seeds two named public components through the native operator API. Each width creates its own signed-out browser context and uses a distinct synthetic address. Tab reaches the email field and submit button with a visible, in-viewport focus indication. Enter submits the native form and receives HTTP 202. The isolated fixture reconstructs the issued confirmation and management links at the existing synthetic mail boundary. The management link returns 404 while pending. Opening the subscriber's confirmation link returns 200, shows confirmation and enables the management page. Space clears one named component, Tab visibly focuses the other checkbox and then reaches save, and Enter posts the selection with HTTP 200. A fresh signed-out management GET returns 200 with exactly the independently known ID of the other component selected. The original unchecked-first-component assertion remains and is now paired with an exact-set assertion. No permanent test registration was added.

The screenshots show visible email-field and component-checkbox focus at 1440 and 390 px. The subscribe frame is captured before text entry. All exercised actions use visible labels. The changes are confined to the journey and its source lock.

## Acceptance and inherited duties

| Row | Candidate evidence | Result |
| --- | --- | --- |
| 1. Component and incident states have text as well as color | Existing catalogue journey in `tests/e2e/public-contract.test.mjs:699`, with textual overall-state and incident display around lines 1038 and 1167. The browser screenshots also show two textual component states. | Existing evidence inspected. Full point held. |
| 2. Persistent status announcements, silent unchanged refresh, clocks outside and internal IDs absent | Existing catalogue journey in `tests/e2e/public-contract.test.mjs:1054` and around line 1159 checks a persistent polite region and updated customer text. | Existing evidence inspected. Full point held. |
| 3. Public, history, incident, maintenance and management Base accessibility and keyboard subscribe and manage | `tests/e2e/maintenance-timezone.test.mjs:58` loads `tests/e2e/helpers/accessibility-subscription-flow.mjs:90`. Lines 112–173 check the interaction and native outcomes. Lines 58–78 retain desktop audits and footer navigation. | 390 and 1440 keyboard runs passed locally. Remaining Base keyboard and accessibility-tree coverage held. |
| 4. Dated VPAT content and release-validation refusals | Preserved `docs/accessibility/vpat.md` and `scripts/validate-release.mjs:28`. Existing app-host report assertion is in `tests/e2e/start-runtime.test.mjs:408`. | Existing report and release checks inspected. Full point held. |
| 5. Public footer opens the same app-host report | `tests/e2e/helpers/accessibility-subscription-flow.mjs:36` follows the existing footer link and waits for the app-host VPAT. | Existing desktop check passed in the touched test. Remaining point obligations held by the lease. |
| BASE-ACCESSIBILITY-001 | `CONTRACT.md:1299` cites it. The touched subscription controls expose accessible role and names to action locators, have visible focus and pass the subscribed, confirmed, management and saved page axe checks. | Local pass for this slice. Whole-product keyboard, accessibility-tree and manual coverage remain held. |
| BASE-PUBLIC-003 | `CONTRACT.md:1299` cites it. `tests/e2e/accessibility.test.mjs` retains its baseline audit. | Existing baseline inspected. Candidate subscription slice passed locally. |
| BASE-DOCS-001 | `CONTRACT.md:1299` cites it. Desktop app-host VPAT rendering and footer link passed in the touched journey. | Existing slice exercised. Documentation-site edits require a separate ruling. |
| AUD-002 | Private-page accessibility follows AUD-002. | Held by clause ownership. |
| R-1 | Human screen-reader pass across operator, public, subscriber and email journeys. | Awaiting manual proof. |
| R-2 | Criterion-complete ITI VPAT 2.5 Rev 508 evaluation for the released product. | Awaiting criterion proof. |

## DONE-RIDERS and handoff

1. Partial. The public keyboard subscribe and manage outcomes passed. Other named outcomes remain held.
2. Pass for the lease. Real nonempty seeded choices, a pending refusal, an active save and an independent exact-set native GET are asserted.
3. The unchanged Verify composer path loads the touched test. Candidate CI is recorded below.
4. Pass. Browser receipt and screenshots were captured from the committed candidate at both widths.
5. Pass. PAGE-020 names the three Base duties in its meta line.
6. Contract generation and check passed. Existing PARTIAL status, Gap, Evidence and judged provenance are retained pending the lander.
7. Pass. Acceptance wording and scope are unchanged.
8. Pass for the touched authority transition. Signed-out pending management is refused and only the actual subscriber confirmation activates management. Erasure and replay behavior fall outside this change.
9. Partial. The dated VPAT retains its limited evaluation and no whole-product conformance claim is made. Real-assistive-technology and criterion proofs remain outstanding.
10. Pass. The test uses the native consent behavior and adopts no policy default.
11. Pending guarded landing. Main equality, a COMPLETE full-history publication scan with zero findings and candidate Run site are lander gates. Cloud did not run the publication scanner.

PROBE PAGE-020 3: at 390 px in a signed-out browser, Tab, type, Tab and Enter in the public subscribe form → native 202, pending management 404, confirmation 200 and active management 200; Space clears the first seeded component, then Tab and Enter save → native 200 and a fresh signed-out GET selects exactly the other seeded component. The equivalent 1440 px path also passed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0.

Plan row to carry forward: PAGE-020 PARTIAL with the 390 px keyboard subscription and component-choice persistence work recorded. Counts before and after are 66 DONE, 123 PARTIAL, 56 MISSING, 245 total.

CLAIM PAGE-020 PARTIAL points=none tests=tests/e2e/maintenance-timezone.test.mjs#MAINT-009 PAGE-020 — operator schedules, reschedules and publishes maintenance in its configured zone, then a customer subscribes by keyboard

GAP PAGE-020: Acceptance 3 still needs the rest of the Base keyboard and accessibility-tree scope, private-page coverage under AUD-002, and actual R-1 and R-2 assistive-technology and criterion proof. Acceptances 1–2 and 4–5 retain their planner-held obligations.

## Candidate and execution records

- Product branch `cloud/sd-lamp-c-f195` advertises `83820924a89a6333a62141586eb264f47bf3e33a`.
- Candidate Verify run 44912812883 is bound to that exact SHA. Event `push`, status `completed`, conclusion `success`, observed 2026-11-21T14:34:01+00:00. [44912812883](https://github.com/just-every/run-lamp/actions/runs/44912812883)
- Main was `00eaed1983515aa829036376d7fabeea8337f13b` when the product ref was checked and `00eaed1983515aa829036376d7fabeea8337f13b` at handoff. Main's checked base passed Verify 44912276262 and Run site 44912276281. Candidate Run site and the full-history publication scan await the guarded lander.
- All three tests in the touched file passed on the candidate with Node 22.20.0, pnpm 10.12.4 and system Chromium. Typecheck, first-party check, contract generation, generated document check and source lock passed. The retained TAP and five browser images are named and hashed in the receipt.
