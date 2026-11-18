# Lamp NOTIFY-004 continuation

Run Edit Run fleet, 18 November 2026

Repository: just-every/run-lamp  
Product branch: `cloud/sd-lamp-c-f147-pc1`  
Published product head: `ddb1932d50ffa87a2d48ccaf7411bbb0045b78ee`  
Continued head: `f122201b30a21f033f41563a9fe31feaf03f6734`  
Merged main: `ee4f9e01762dd11ad3df31bb7842b336ce9443a8`

## Plan and disposition

1. Inspect NOTIFY-004 and its Base citation, the native delivery routes, service and repository, provider tracking controls, and the existing Deliveries screen. Reproduce the previous Verify command on the saved SHA.
2. Merge current main forward. It already held the guarded NOTIFY-004 DONE judgment from `5117b50c5a43aeb3c6618d7b661cdb59bdd23aed`. Preserve its contract and evidence. Combine the existing paginated and outcome journeys in one fixture so every outcome filter has a real match in the same inventory.
3. Run the existing registered delivery journeys and the browser proof, regenerate and check contract views and the source lock, and push the exact candidate. Check its Verify and return the receipt packet alongside the product provenance.

The candidate consolidates the overlapping delivery journeys into one populated inventory and strengthens the existing browser journey with the independently read confirmed subscriber, the queue and complaint timestamps, and the downloaded CSV. The existing provider adapter controls and rendered Deliveries and Notifications Settings screens were used directly. The legacy acceptance text and main's status judgments are byte-identical on the candidate.

| Tree | Done | Partial | Missing | Total | NOTIFY-004 |
|---|---:|---:|---:|---:|---|
| Continued branch | 63 | 126 | 55 | 244 | PARTIAL |
| Merged main before candidate | 64 | 125 | 55 | 244 | DONE |
| Published candidate | 64 | 125 | 55 | 244 | DONE |

The published-claims subtotal is 44 done, 63 partial and 0 missing on both main and the candidate. The plan row is NOTIFY-004 only. The existing next-target holds and live-provider qualifications still apply.

## Native acceptance and Base duty

| Point | Exact product proof | Observed result |
|---|---|---|
| 1. Subscriber, channel, update, queue and outcome facts | `tests/e2e/helpers/delivery-log-flow.mjs` lines 12–25 and 143–153, driven by `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 34–53 and 120–148 and `tests/e2e/helpers/mail-settings-browser-flow.mjs` lines 114–134 and 158–203 | Native operator reads reconcile the exact independently seeded subscriber, channel and committed update. Queue time is inside the publish request, queued rows have a null outcome time, and completed outcomes have a timestamp inside the request or dispatch window. |
| 2. Six outcomes | `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 184–252 and 254–325 and `tests/e2e/helpers/mail-settings-browser-flow.mjs` lines 158–207 | Queued, delivered, bounced, complained, suppressed and failed all have positive controls. The signed complaint changes the original row from queued to complained while preserving its ID and queue time. The browser shows the same outcome, channel, update title and UTC times. |
| 3. Complete untracked notification | `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 205–211 and `tests/e2e/helpers/delivery-log-flow.mjs` lines 27–70 | The provider-edge capture contains one complete HTML document for the intended recipient with the published wording. The full DOM has no tracking or embedded resource. Every link matches the independently supplied HTTPS URL or native management or unsubscribe URL, and the management link opens for an anonymous subscriber. |
| 4. Complete filters and CSV | `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 340–344, `tests/e2e/helpers/delivery-log-flow.mjs` lines 81–166 and `tests/e2e/helpers/mail-settings-browser-flow.mjs` lines 209–226 | The native API reconciles 132 distinct delivery IDs in 41 complete CSV scopes. One update has 101 distinct email recipients across pages. Each outcome filter is nonempty, and channel, update and combined controls have exact all-and-only identities. Later-page export contains the complete ordered filter result, with each identity once. The browser downloads and parses its filtered file. |
| BASE-MAIL-001. Truthful mail outcomes | `CONTRACT.md` line 149, `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 139–148 and `tests/e2e/helpers/mail-settings-browser-flow.mjs` lines 122–134 and 158–203 | Synthetic provider acceptance stays queued until a matching completion receipt. Deliveries shows what the provider accepted and what the signed receipt recorded. Existing secondary provider and tracking-disable checks run through the registered provider journey. |

Both journeys are registered in `tests/e2e/delivery-contract.test.mjs` at lines 48 and 63. Verify's public shard runs that file through `test:delivery` at `scripts/verification/plan.mjs` line 10.

PROBE NOTIFY-004 1: Native publish and authenticated delivery read for independently confirmed recipients -> exact subscriber, channel and update identities with the publication-window queue time and receipt-window outcome time.

PROBE NOTIFY-004 2: Native Queue, scheduled and signed receipt doors -> queued, delivered, bounced, complained, suppressed and failed rows; the exact complained delivery retains its queue timestamp and identity.

PROBE NOTIFY-004 3: Provider-edge capture after native publish -> one complete HTML notification with original wording, no tracking resource and only the expected direct URLs.

PROBE NOTIFY-004 4: Native log and CSV for channel, outcome, update and combined filters -> 132 deliveries reconciled in 41 complete scopes, with 101 distinct destinations across pages of one update.

## DONE riders

| Rider | Result | Basis |
|---|---|---|
| 1 | Pass | Both registered journeys exercise all four native outcomes. See the acceptance map and the exact-head Verify status below. |
| 2 | Pass | The populated independently identified log and the valid, invalid and replayed receipt cases in `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 198–252 and 340–357 exercise the visible outcomes and refusals. |
| 3 | Pass | The push Verify plan invokes both journeys. The candidate's 1440 assertions ran with 390 screen capture from the same production Worker session. |
| 4 | Pass | The focused runtime command and all four browser images were produced from the exact published product checkout. |
| 5 | Pass | `CONTRACT.md` line 149 cites BASE-MAIL-001 and the truthful queued-to-complained transition is asserted. |
| 6 | Pass on the inherited judgment | The source, generated views, DONE row, empty Gap and counts match main. The generator write and check passed. |
| 7 | Pass | The merged main acceptance wording and rider citation are byte-identical on the candidate. |
| 8 | Pass | An invalidly signed complaint is refused with subscriber and delivery facts intact. A signed complaint applies, replay preserves the first result, erased destination data stays absent and both operator log doors refuse anonymous access. See `tests/e2e/helpers/subscriber-failures-flow.mjs` lines 219–252 and 342–357. |
| 9 | Pass at the native boundary | Synthetic provider edges exercise current email, webhook and SMS paths. The scope of this proof is Lamp's native outcomes and provider requests. |
| 10 | Pass | The existing consent, access, suppression and tracking policies apply. |
| 11 | Guarded landing pending | The product head is advertised on the named branch. Main, publication scan and the main-only Run site deployment are listed below. |

The two journeys use existing screen and transport controls and retain the assertions for provider acceptance, receipt authenticity, notification suppression and erasure. The test inventory is 112 registered cases and 10 assertion scripts. The 1440 browser checks for horizontal overflow, serious or critical axe violations, and hydration errors passed. The 390 images show the same filtered complaint and Settings state as a responsive comparison. The published images mask fixture addresses and the Settings support-contact placeholder.

## Verification

The former push Verify 44311222239 had a cancelled composer job 134826392808, with the Verify step stopping at the 45-minute job limit, and failed aggregate job 134853348508. The archived failed-log invocations returned exit 0 and supplied no assertion output. The same local composer shard command on the saved head exited 1 because the theme helper expected the bundled Chromium executable. Its public tests passed all eight cases. The same missing executable reproduced on the merged main. With system Chromium available at the expected path, the candidate retry passed twelve of thirteen composer browser cases and all eight public cases. The existing theme asset-budget case saw a fifth request for the favicon on both the candidate and a detached main checkout on the same runner. The hosted cancellation supplied no failing assertion, so these results establish a local runner difference, while hosted Verify is reported separately.

The first local delivery run on merge commit `2c271f507015218f1769fdd9dbe491f551d4c0a1` passed six of seven cases and exposed an unsupported channel parameter on the browser fixture's subscriber-list query. The final commit reads the actual list and matches the confirmed recipient by destination and channel. Both touched journeys then passed on the exact product SHA. The full production Worker build, TypeScript check, first-party check and verification plan check passed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The full delivery shard then passed all seven cases on the exact product head. Exact-head push Verify 44402120293 was completed with conclusion success. [44402120293](https://github.com/just-every/run-lamp/actions/runs/44402120293)

Publication scan on `ddb1932d50ffa87a2d48ccaf7411bbb0045b78ee`: complete unknown, historyScanned unknown, findings unknown. The guarded Mac lander runs the publication scan and evaluates main equality and Run site on the landed SHA. The cloud tag created no PR.
