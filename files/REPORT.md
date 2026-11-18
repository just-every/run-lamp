# Lamp NOTIFY-004 delivery-log evidence

Run Edit Run fleet (Codex), 18 November 2026.

Candidate branch cloud/sd-lamp-c-f147 at f122201b30a21f033f41563a9fe31feaf03f6734. Main at verification was fd6695e358e5aa67c47c45f05591f2c33e83a930. Main Verify runs 44291956536 and 44286265388 succeeded. Main Run site 44291956510 succeeded. The candidate's run was push Verify 44311222239 in_progress, conclusion pending.

The repository counts before and after this branch are 63 done, 126 partial and 55 missing of 244. NOTIFY-004 remains partial in the source table until guarded landing. One accepted change would result in 64 done, 125 partial and 55 missing. The verification inventory remains 112 registered cases and 10 assertion scripts.

## Plan and result

1. Replay c3d85bd9 and edfa0888 from the refused f137 head onto current main. Publish the first replay as a skipped save. Preserve the intervening main checks and the contract judgments. The save is b6d7b40d1340b6d2eba1d18c6b24547171fdf47f.
2. Extend the existing failure and provider browser journeys to compare independently expected subscriber, destination, channel, update and outcome facts. Bound queue times by publication and final times by the corresponding receipts or dispatch. Read the exact complained delivery after a signed receipt.
3. Inspect the complete Resend-facing HTML document. Compare every link with its intended HTTPS or native subscription destination and reject pixels, remote resources and tracked links. Existing provider tracking-disable checks remain active.
4. Reconcile the same mixed 132-delivery fixture independently across native list filters and CSV. Include all six populated outcomes, email, webhook and SMS, and all populated updates. Exercise the default 100-row limit with 101 separate destinations for one update. Verify each delivery identity once and compare full CSV contents in 41 scopes, including CSV called with the second page's offset.
5. Compare the existing Delivery log on the built application. A real signed synthetic complaint moves the row from queued with provider acceptance to complained. The 1440-pixel browser assertions compare the channel, incident, queue and outcome times, filtering and the actual downloaded CSV. The paired 1440 and 390 screenshots show the same result with synthetic addresses masked. The candidate changes are limited to test proof and the regenerated source lock.

The plan reference is the NOTIFY-004 row in planner return sd-lamp-replan-30, previously f137 and now the f147 candidate. Latest Lamp rulings RL-101 and RL-102 govern other clauses. The existing policy governs all exercised flows.

## Acceptance and inherited duty

| Item | Public-door proof | Exact candidate Verify |
| --- | --- | --- |
| 1. Each record has subscriber, channel, update, queue time, outcome and outcome time | Failure journey registered at ./tests/e2e/delivery-contract.test.mjs:63. Exact recipient and update tuples and action-bounded timestamps in ./tests/e2e/helpers/delivery-log-flow.mjs:12–25, called from ./tests/e2e/helpers/subscriber-failures-flow.mjs:120–153 and :184–243. Browser time display and stable row identity in ./tests/e2e/helpers/mail-settings-browser-flow.mjs:154–197. | push Verify 44311222239 in_progress, conclusion pending |
| 2. The six outcomes are distinct | Real publish, Queue, Cron and signed receipt doors in ./tests/e2e/helpers/subscriber-failures-flow.mjs:183–332. Complaint readback uses its original delivery ID at :218–250. The browser checks the complained result at ./tests/e2e/helpers/mail-settings-browser-flow.mjs:176–190. All six filters have positive and negative controls at ./tests/e2e/helpers/delivery-log-flow.mjs:110–157. | push Verify 44311222239 in_progress, conclusion pending |
| 3. No tracking pixel or tracked link | Captured provider request from the complaint publication at ./tests/e2e/helpers/subscriber-failures-flow.mjs:204–211. Complete HTML, resources, exact rendered links and the unauthenticated management destination at ./tests/e2e/helpers/delivery-log-flow.mjs:27–71. Existing Mailgun and SES tracking controls at ./tests/e2e/helpers/mail-failover-flow.mjs:53 and :63–67. | push Verify 44311222239 in_progress, conclusion pending |
| 4. Channel, outcome and update filters with complete CSV parity | Native authenticated list and export after bulk publication at ./tests/e2e/helpers/subscriber-failures-flow.mjs:339–344, reconciled with exact tuples, pagination flags, identities and all CSV columns in ./tests/e2e/helpers/delivery-log-flow.mjs:75–89 and :110–160. Built-screen CSV download at ./tests/e2e/helpers/mail-settings-browser-flow.mjs:200–214. | push Verify 44311222239 in_progress, conclusion pending |
| BASE-MAIL-001. Provider acceptance stays distinct from delivery | Citation in ./CONTRACT.md:149 and Base duty in ./BASELINE.md:114. Provider acceptance leaves the native email queued at ./tests/e2e/helpers/subscriber-failures-flow.mjs:146–153 and the built screen initially queued at ./tests/e2e/helpers/mail-settings-browser-flow.mjs:154–170. Signed receipts are explicitly synthetic. | push Verify 44311222239 in_progress, conclusion pending |

## DONE riders

| Rider | Result and evidence |
| --- | --- |
| 1 | Pending exact-SHA Verify. All four points execute through public doors in the two registrations at ./tests/e2e/delivery-contract.test.mjs:48 and :63. |
| 2 | Pass. Positive and negative controls run on real fixture records. Invalid complaint authentication leaves the subscriber and delivery unchanged at ./tests/e2e/helpers/subscriber-failures-flow.mjs:218–229. |
| 3 | Pending exact-SHA Verify. Verify runs both registrations through the public shard. Browser assertions run at 1440. The 390 capture is supplementary evidence. |
| 4 | Pass. Build, full local public shard and two browser captures bind to the candidate commit in RECEIPT.json and public-shard.json. |
| 5 | Pass. The receiving clause explicitly cites BASE-MAIL-001 at ./CONTRACT.md:149. The acceptance row above names the exercised duty. |
| 6 | Pass for candidate mechanics. Contract write and check succeeded and wrote zero views. The current partial row at ./CONTRACT.md:3323 retains the recorded gap and judgments. Landing owns the new evidence and judgment provenance. |
| 7 | Pass. The full candidate diff for CONTRACT.md and both generated views is empty. No acceptance text or coverage map changed. |
| 8 | Pass. Anonymous list and export receive 401, a bad receipt leaves native data unchanged, duplicate and late receipts preserve the outcome and erased subscriber data stays absent after replay. Assertions in ./tests/e2e/helpers/subscriber-failures-flow.mjs:218–253 and :339–357. |
| 9 | Pass within the clause's native scope. Captures used two simulated provider edges and a controlled webhook receiver. The task makes no live-provider, Twilio account, delivery-rate or hosted-scale claim. |
| 10 | Pass. Existing authority, consent and outcome policy were exercised without an interim default. |
| 11 | Pending guarded landing. Main differs from the candidate. Candidate Run site and full-history publication scanning remain with the Mac lander. |

## Checks, custody and screen comparison

The native assertions cover the listed outcomes and retain the prior delivery, consent and provider assertions. The full touched shard ran under Node 22.20.0 with Chromium. The built screen showed the same complaint, filters and timestamps in a table at 1440 and in stacked records at 390. Text links and labelled buttons provide the controls. The existing rounded mobile cards have a full border. The minimum table-label styles use the existing 13-pixel token. Notification configuration remains under Settings.

Pre-push history checks verified both candidate commits, including their author, committer and trailers. Added fixture text was reviewed for email-shaped values, key prefixes and bare repository-like references. The browser captures in the packet mask every visible destination address. The publication scan fields complete, historyScanned and findings are unestablished for f122201b30a21f033f41563a9fe31feaf03f6734. That scan and Run site are pending guarded landing.

PROBE NOTIFY-004 1: native subscription, incident publish and delivery list -> exact recipient, channel and committed update with queue and terminal times inside their action windows.
PROBE NOTIFY-004 2: signed complaint receipt and exact-delivery readback -> same delivery ID becomes complained, the queue instant survives and a replay or late delivered receipt leaves the outcome unchanged.
PROBE NOTIFY-004 3: captured Resend transport HTML from that publication -> complete message with submitted wording, direct links and native subscription links, with no tracking pixel or tracking resource.
PROBE NOTIFY-004 4: native list scopes and CSV -> 132 exact identity tuples, including 101 distinct destinations in one two-page filtered update, with all expected rows once and full CSV parity in 41 scopes.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM NOTIFY-004 PARTIAL points=1,2,3,4 tests=tests/e2e/delivery-contract.test.mjs#Failing subscriber destinations deactivate with reasons, alert the webhook contact and suppress queued and future notifications; tests/e2e/delivery-contract.test.mjs#NOTIFY-013 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-007 NOTIFY-008 NOTIFY-010 — Owner-selected provider fallback preserves frozen notifications and reconciles delivery receipts
GAP NOTIFY-004: The four local proofs passed. Exact candidate Verify remains outstanding.
