# Lamp NOTIFY-022 · sd-lamp-c-f178

The leased work proves acceptance 2 through native Settings, incident publication, the delivery log and captured provider requests. The existing mail journey runs the same flow with the Managed relay, Resend and SendGrid network-edge fixtures.

## Plan and results

1. Map the three acceptance points and keep the lease on point 2. The existing journey already exercised a filled footer, a deep comparison of a frozen retry, provider identity and signed receipts. It did not clear the footer and verify a fresh notification.
2. Trace the mail path read-only. `src/core/shared/email-branding.ts` renders optional wording. `src/core/features/deliveries/service.ts` appends the subscriber destinations and list headers outside the editable footer and freezes the original envelope before retry. The transports expose Managed relay list fields and owner-provider headers in their respective wire formats.
3. Extend the existing journey. Save a distinctive footer and prove it appeared in both bodies, clear it through native Settings and independently read back the complete branding object. Publish fresh wording, match the returned update to the only active subscriber's delivery, and match that delivery ID and recipient to the captured envelope. Compare both bodies to the populated control after accounting for the fresh update wording and removing the footer. Check the exact public destinations and provider list fields against the earlier recipient links.
4. Run the mail suite, typecheck and first-party check. Run the contract generator and its check, restore both generated views from main, regenerate the source lock, and check it. Publish the product branch and return this packet on its separate evidence ref.

Plan return for `sd-lamp-replan-38` — NOTIFY-022 stays PARTIAL with acceptance 2 proven locally. Points 1 and 3 retain the full link-survival and missing-link refusal matrices for Settings, templates, page-data restore and API overrides. Audience-specific settings depend on AUD-001. Managed relay owns sender identity and refuses From and Reply-To overrides. Live provider receipt qualification, adoption and release prerequisites remain in their owning work. The native Settings route and delivery behavior already support the leased outcome. No policy change was needed.

Contract counts before and after — 66 DONE, 123 PARTIAL, 56 MISSING (245 total). NOTIFY-022 stays PARTIAL. Lamp's verification plan reports 116 registered cases and 10 assertion scripts. This extension adds no test registration and removes no existing assertion.

## Acceptance and inherited duties

| Item | Result | Evidence in `tests/e2e/rer-mail.test.mjs` |
|---|---|---|
| Acceptance 1, protected links through footer edits | Held | Lines 267–289 exercise one pair of footer states. The full matrix remains outstanding. |
| Acceptance 2, clear succeeds and persists | Local pass | Lines 168–170 and 220–228 save and verify the populated control, clear through Settings, and independently GET the saved branding. |
| Acceptance 2, only wording goes away | Local pass | Lines 212–221 and 230–265 check the prior bodies, identify the fresh notification and compare the full text and HTML after removing the saved wording. |
| Acceptance 2, exact status, management and unsubscribe destinations and required list fields | Local pass | Lines 267–289 verify the three body destinations and the five list fields for each transport. The management URL opens through the public route. Lines 305–313 exercise one-click opt-out and suppression. |
| Acceptance 3, each editing door refuses a missing destination with its reason | Held | The complete refusal matrix remains outstanding. |
| NOTIFY-019, sender custody and immutable retry | Retained and exercised | Lines 143–149 and 168–211 retain the Managed relay refusal, Resend and SendGrid identity controls, frozen retry comparison and authenticated provider receipts. Lines 254–260 check sender preservation on the post-clear owner-provider envelope. |
| Truthful mail outcome and recipient authority | Retained and exercised | Lines 177–211 distinguish provider acceptance from delivery and exercise receipt replay. Lines 305–316 retain opt-out, suppression and erasure proof. |

## DONE riders on this candidate

| Rider | Result |
|---|---|
| 1 | Partial. The public Settings, publication and provider doors prove acceptance 2. Points 1 and 3 require the held matrices. |
| 2 | Local pass for the lease. A confirmed recipient and a pending control exercise real subscription state. The earlier populated message, separate GET, fresh update, matching delivery row and captured recipient distinguish clearing from stale settings or stale mail. |
| 3 | The Verify imports shard invokes the mail suite through the existing verification plan. See the exact-SHA run below. |
| 4 | The tested mail file and built source match the candidate. The exact-SHA focused run is recorded in the packet. |
| 5 | The receiving clause names mandatory destinations and list headers in its own acceptance points and refers to NOTIFY-019. The sender boundary remains in the existing clause and was exercised with the network fixtures. |
| 6 | Generator and freshness checks passed. The Status row and provenance remain with the contract owner and guarded lander. |
| 7 | No acceptance text, riders, coverage map or Status cell changes. |
| 8 | Managed identity overrides are refused and signing and replay controls remain exercised. This round changes no authority policy. |
| 9 | The capture proves provider request contents. Live inbox receipt, relay wire emission after acceptance, and provider or adoption qualification remain separate. |
| 10 | No new policy default or scope decision was required. |
| 11 | Guarded main landing, the full-history publication scan and candidate Run site are pending. |

The test extension introduces no UI or layout change. The pre-push diff contained no new email-shaped fixture values, no bare prose tokens resembling repository identifiers and no removed assertions. Existing controls for reused sign-in tokens, pending recipients, retry envelopes, receipt replay, opt-out and erasure still pass. The first local full-file run encountered a transient Playwright route error in the untouched hosted mail-off browser case. That case passed in isolation using the main test source and passed on the full candidate rerun.

GAP NOTIFY-022: Acceptances 1 and 3 still need the complete link-survival and missing-link refusal matrices. Audience-specific settings await AUD-001. Managed relay sender limits and live qualification remain in force.

PROBE NOTIFY-022 2: Native Settings PUT with an empty footer, independent GET, and fresh incident publication to one confirmed and one pending recipient -> persisted empty footer; one matching active-recipient envelope with only the prior footer wording removed and all required destinations and list fields intact across three provider fixtures.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock && node scripts/edition-authoring/cli.mjs check exit=0; views=node src/base/contract-docs.mjs write && node src/base/contract-docs.mjs check exit=0; ledger=none exit=0


## Candidate custody and CI

- Product branch `cloud/sd-lamp-c-f178` advertises `093f6bef6fee83f52b213f3d5eb6f86c0c11466f`. Its parent and sampled remote main are `bafb632174ace2da2191b88bb186d0364e1415c7`.
- Candidate Verify 44880140659, push event on `093f6bef6fee83f52b213f3d5eb6f86c0c11466f`, observed in_progress, conclusion pending. https://github.com/just-every/run-lamp/actions/runs/44880140659
- Base main Verify 44876986189 and Run site 44876986360 both completed successfully on `bafb632174ace2da2191b88bb186d0364e1415c7`. Candidate Run site follows guarded landing.
- Candidate public scan awaits the guarded lander. commit=093f6bef6fee83f52b213f3d5eb6f86c0c11466f, complete=unestablished, historyScanned=unestablished, findings=unestablished.
- The production build, mail suite retry, exact-candidate mail probe, typecheck, first-party check, contract document check and source-lock check passed locally.

CLAIM NOTIFY-022 PARTIAL points=2 tests=tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out
