# sd-lamp-c-f118 — NOTIFY-015 reach proof

Product repository: just-every/run-lamp. Branch: cloud/sd-lamp-c-f118.
Candidate: ba40ca5fdd232e8286aba0be8dba448cb07f85f2.
Starting main: 62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b.

NOTIFY-015 remains PARTIAL. Points 1 and 2 are closed by native and existing-screen proof. Point 3's displayed comparison with the complete incident CSV remains held with the HIST-005 campaign, exactly as the lease specifies. No acceptance text, Status, Gap or Evidence cell changed. Counts before and after: 57 done, 132 partial, 55 missing, 244 total. The only plan row advanced is NOTIFY-015's points 1 and 2; its held remainder is unchanged.

## What changed

The existing recipient-management fixture can optionally run the built production Worker and its emitted assets. The default source Worker remains available to its existing callers. A thin fixture wrapper supplies the existing paused-effects boundary and a controlled clock. All business mutations use ordinary authenticated or subscriber-authorized HTTP, migrated D1, native publication, the actual Worker Queue handler, the native scheduler and real mail-event authentication. Only mail and webhook network responses are synthetic.

One coherent registered publication journey creates ten confirmed email recipients and two confirmed webhook recipients. It retains their identities independently, freezes each publication's delivery identities before dispatch and compares the complete delivery readback with stored delivery facts. Exact literal aggregate expectations are checked through both the complete reach response and the single-update query. Every recipient's outcome is checked against its independently assigned role, rather than using aggregate output to construct an expectation.

The first update restores ten committed emails, nine delivered, one bounced, and two committed and delivered webhooks. The second publication is committed while effects are paused; one email recipient and one webhook recipient unsubscribe through their real capabilities. One different email receives a permanent 400 rejection. The webhook receiver returns 400 through normal scheduled retry exhaustion. Retry configuration and product code are unchanged. The third update succeeds, proving multiple successful webhook updates and recipient deduplication. Replayed dispatch and signed receipts preserve all identities and counts; a delivered-event replay cannot reactivate the hard-bounced subscription.

The existing compiled operator publication journey invokes the same scenario and opens the real incident Reach panel. At 1440 it checks every existing displayed count against the independent expectations for each update and the whole incident. It checks accessibility, overflow and hydration. The same populated screen is captured once per stage at 1440 and 390. There are no browser response substitutes and no application, brand, homepage, documentation-site, visual-source or stylesheet changes.

## Independent expected outcomes

| Scope | Channel | Committed sends | Distinct selected | Accepted sends | Delivered sends | Distinct reached | Bounced | Suppressed | Failed |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| First update | email | 10 | 10 | 10 | 9 | 9 | 1 | 0 | 0 |
| First update | webhook | 2 | 2 | 0 | 2 | 2 | 0 | 0 | 0 |
| Second update | email | 9 | 9 | 7 | 7 | 7 | 0 | 1 | 1 |
| Second update | webhook | 2 | 2 | 0 | 0 | 0 | 0 | 1 | 1 |
| Third update | email | 8 | 8 | 8 | 8 | 8 | 0 | 0 | 0 |
| Third update | webhook | 1 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| Whole incident | email | 27 | 10 | 25 | 24 | 9 | 1 | 1 | 1 |
| Whole incident | webhook | 5 | 2 | 0 | 3 | 2 | 0 | 1 | 1 |

Queued and complained counts are exactly zero in each terminal scope. Provider-accepted and delivered figures overlap; they are not added. The native and screen journeys explicitly keep webhook acceptance separate from email-provider acceptance. The incident owns exactly 32 distinct delivery identities across its three updates.

## Acceptance and inherited-duty proof

Native registration: `tests/e2e/publishing-contract.test.mjs` — `NOTIFY-015 — update outcomes and incident reach reconcile retained recipients and deliveries across publication, suppression and failure`.

Screen registration: `tests/e2e/publishing-browser.test.mjs` — `INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey`.

| Rubric item | Clause sentence or inherited duty | Proof and result |
| --- | --- | --- |
| R1 | Point 1: committed recipients by channel | `tests/e2e/helpers/update-reach-flow.mjs:57` and `:77` — Native creation, confirmation and paused publication retain the exact intended recipient identities; complete and update-filtered reach reads match literal counts. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R2 | Point 1: delivered and bounced counts by channel | `tests/e2e/helpers/update-reach-flow.mjs:43` and `:128` — Real provider acceptance plus signed delivered and hard-bounce receipts restore the ten-email and two-webhook baseline; the receiver acknowledges the exact webhook delivery. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R3 | Point 1: suppressed counts by channel | `tests/e2e/helpers/update-reach-flow.mjs:138` and `:159` — Both recipients unsubscribe after commitment and before dispatch. Each retained delivery becomes suppressed and neither destination sees another request. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R4 | Point 1: failed counts by channel | `tests/e2e/helpers/update-reach-flow.mjs:17`, `:152` and `:166` — Permanent email 400 and repeated webhook 400 become the exact failed deliveries through unchanged retry machinery. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R5 | Point 1: displayed counts | `tests/e2e/publishing-browser.test.mjs:561`, loading `tests/e2e/helpers/update-reach-browser-flow.mjs:34` — Existing Reach panel reconciles every displayed value for each of the three update identities at 1440, with actual same-screen captures at 1440 and 390. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R6 | Point 2: incident totals deduplicate recipients across updates and match delivery facts | `tests/e2e/helpers/update-reach-flow.mjs:98`, `:172` and `:183` — Exact whole-incident totals, 27 email sends for ten selected and nine reached identities, five webhook sends for two selected and two reached identities; complete stored delivery readbacks and replay invariance. PASS locally.  Verify event=push, run=43198230462, conclusion=success on the exact candidate. |
| R7 | Point 3: displayed baseline figures match CSV | HELD, not claimed: complete incident CSV field and channel parity belongs to HIST-005 under this lease. |
| R8 | BASE-MAIL-001 citation | `CONTRACT.md:2055` — Citation remains in the receiving clause. Real serializers and authenticated synthetic receipts exercise native acceptance and delivery distinction; live provider qualification is not claimed. INSPECTED for inheritance; native boundary proof passes. |

Exact line references and commit-bound local receipts are recorded in RECEIPTS.json and proof-lines.txt. Verify is invoked by the existing push workflow: the native registration runs through test:publishing in the runtime shard, and the screen registration runs through test:composer in the composer shard. Exact-SHA event and conclusion are recorded in candidate-ci.json when available; green from another SHA is never substituted.

## DONE-RIDERS

A full DONE is not claimed; the scoped progress remains PARTIAL.

| Rider | Result | Evidence or retained boundary |
| --- | --- | --- |
| 1 | PASS locally for points 1 and 2; point 3 HELD | R1 to R6 native and existing-screen journeys perform all leased outcomes. Exact-SHA push Verify 43198230462 completed success; point 3 remains held. |
| 2 | PASS | Populated recipient and delivery sets, independent literal expectations, native signed receipts, both suppression channels, permanent rejection and unchanged identity sets. |
| 3 | PASS | Both registrations run in push Verify 43198230462, completed success on ba40ca5fdd232e8286aba0be8dba448cb07f85f2. |
| 4 | PASS locally | Final scoped proof reruns on the committed candidate; production and UI source bytes are unchanged from the built main artifact. |
| 5 | PASS, INSPECTED | NOTIFY-015 explicitly cites BASE-MAIL-001; no inherited duty was added or moved. |
| 6 | PASS mechanical; status updates reserved for lander | Contract write and check pass. Generated views are restored from main and excluded from product commits. No status or gap cell is edited. |
| 7 | PASS, INSPECTED | Acceptance text and coverage are unchanged; no ruling or rewrite is required. |
| 8 | NOT APPLICABLE to this proof-only delta | No authority verb or permission implementation changed. Existing publication, review and authenticated read assertions remain. |
| 9 | PASS boundary retained | Only controlled network-edge proof is claimed. No mailbox, hosted capacity or real-provider qualification is claimed. |
| 10 | PASS, no policy default | The work introduces no custody, consent, authority or spending decision. Existing unsubscribe and provider policies are reused. |
| 11 | PENDING guarded lander | Candidate stays branch-only. Main equality, full-history publication scan, exact-SHA Verify and resulting Run site belong to the Mac lander. |

## Pre-ready checks

1. All leased outcomes have populated native and existing-screen assertions. An incorrect suppression or failure count, deduplication error or wrong displayed figure fails these assertions. Exact-SHA Verify is recorded separately.
2. No existing assertion was deleted, narrowed, skipped or moved behind a width or branch condition. One new coherent registration was added; the existing screen journey was extended. Test inventory is 85 registered cases plus ten assertion scripts, 95 checks, up from 84 plus ten, 94.
3. No authority, erasure or replay implementation changed. Replayed Queue dispatch and signed receipts change no delivery identity or count and cannot reactivate the bounced subscriber. Existing erasure and revocation coverage remains intact.
4. The existing Reach panel contains named disclosure controls and a text-labelled CSV action, with no icon-only control inside this touched proof surface. No font or border style was changed. Desktop axe, overflow and hydration checks pass; both viewport captures are retained.
5. Source lock, generated-view checks, exact candidate CI and publication custody are reported independently. No cloud publication scan is claimed. New fixture files contain no email-shaped literals or provider-shaped credentials; synthetic mail addresses are composed from a local part and the reserved test domain.

Publication scan: commit=ba40ca5fdd232e8286aba0be8dba448cb07f85f2; complete=NOT_RUN_IN_CLOUD; historyScanned=NOT_RUN_IN_CLOUD; findings=NOT_RUN_IN_CLOUD. The cloud adaptation explicitly reserves the complete full-history scan for the maintained Mac lander. A verified Git bundle is recovery data, not a scan or landing receipt.

Main equality: NOT LANDED. Starting main Verify 43083760988 and Run site 43083760843 are completed success on 62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b; those runs establish the starting baseline only.

## Plan and results

The complete original scoped plan is retained in PLAN.md. The work closed all three leased outcome groups. No product correction was necessary: inspection and the runtime journeys confirm the existing repository aggregation already reduces attempts per delivery and counts distinct subscriber identities at incident scope.

The initial unpinned npx first-party invocation exited 1 without diagnostics. The repository-pinned `pnpm exec rer check --profile first-party` then exited 0. Final verification receipts distinguish that successful pinned check from the initial transport invocation. Setup used the requested owner identity and noninteractive flag; build and browser processes were bounded and run through cloud_run. Actual test and command outputs are retained as explicitly selected non-secret packet files.

No product blocker remains for this scoped candidate. No DONE count changes. The held point 3 and real-provider qualification boundaries remain named. Complete product custody, PR, CI and evidence transport details are in RECEIPTS.json.

Final committed-candidate local results: six publication contract cases passed and the complete existing compiled operator publication journey passed. Both command exits and the combined cloud wrapper exit are zero. Typecheck, the requested npx first-party check and production build also report explicit command exit zero. Source lock, generated-view check and verification inventory pass after the browser restores its visual probe. The product candidate was pushed through the fleet guard after a fresh main fetch and merge check.

## Terminal product custody

Pushed exact head: ba40ca5fdd232e8286aba0be8dba448cb07f85f2 on cloud/sd-lamp-c-f118. Remote readback matches it; main remains 62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b. Draft PR: https://github.com/just-every/run-lamp/pull/337.

Exact-SHA push Verify: 43198230462, in_progress at discovery, conclusion null. The PR's dynamic run 43198282861 is queued at discovery. No green CI is claimed for the candidate; the starting-main green runs are not reused as candidate proof. The cloud handoff leaves the branch-only candidate for the maintained lander's exact-SHA Verify, complete publication scan and Run site checks. Three GitHub API calls were used: initial main runs, draft PR creation and exact candidate runs. No dispatch, workflow rerun or short-interval poll was used.

CLAIM NOTIFY-015 PARTIAL points=1,2 tests=tests/e2e/publishing-contract.test.mjs#NOTIFY-015 — update outcomes and incident reach reconcile retained recipients and deliveries across publication, suppression and failure
GAP NOTIFY-015: Point 3 complete incident CSV field and channel parity remains with the existing HIST-005 campaign under the lease; live provider qualification is unchanged.

PROBE NOTIFY-015 1: ordinary native publication, signed receipts, queued unsubscribe and rejected transport -> ten-email and two-webhook baseline, one bounced email, exact suppressed=1 and failed=1 on each channel, unchanged retained delivery identities.
PROBE NOTIFY-015 2: three native updates and replayed dispatch -> 27 email sends, ten selected and nine reached identities; five webhook sends, two selected and two reached identities, three delivered, one suppressed and one failed.
MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0.

DONE-RIDERS rows 1 and 2 pass locally for scoped points, row 3 passes exact-SHA push Verify 43198230462 success, row 4 passes exact-candidate local proof, row 5 is inspected unchanged, rows 6 and 7 pass mechanical inspection, row 8 is inapplicable to this proof-only delta, rows 9 and 10 retain the provider and policy boundaries, and row 11 awaits guarded landing. The clause remains PARTIAL and no counts change.

## Final exact-SHA CI receipt

Push Verify 43198230462 completed success on ba40ca5fdd232e8286aba0be8dba448cb07f85f2: https://github.com/just-every/run-lamp/actions/runs/43198230462. The four retained polling receipts show the same full SHA throughout and the final completed/success response. Seven GitHub calls were used. Polls were at least 300 seconds apart; no dispatch or rerun was needed.

The candidate is READY for the maintained Mac lander. NOTIFY-015 is still claimed PARTIAL points=1,2, with no status or count change. The publication scan and resulting main equality and Run site remain the lander's duties; the green candidate Verify is not a claim of landing. Draft PR 337 remains open. The scratch clone is removed after the final evidence transfer and remote-ref verification, as requested; the complete actual packet remains outside it.
