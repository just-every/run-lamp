# sd-lamp-c-f127 — TEAM-003 attribution

Result: acceptance 1 proof extended across the four remaining actor families. TEAM-003 stays PARTIAL: acceptance 2 was explicitly omitted by the planner and is not claimed. No policy default was adopted. No product behavior, UI, homepage, documentation site, workflow, migration, dependency, contract clause, Status cell, Gap cell or Evidence cell was changed.

The implementation already attributed these actions correctly. This change closes proof gaps by using the setup operator and a second person independently admitted through invitation and native sign-in. The later actor differs from the creator or draft author. All actions use native HTTP doors; direct database reads independently reconcile durable record identities and audits.

## Plan and actual result

The complete plan is in PLAN.md. The incident journey now compares creator and draft author with the invited reviewer who publishes both the ordinary update and a correction, then reconciles exact publication authors, independent native readback and exact durable audit identities. The catalogue journey distinguishes initial creator history from four non-Operational transitions performed by the other operator, checks the standing claim's operator, and reconciles the release audit. It also checks manual maintenance start and completion by a different person from the scheduler. The maintenance journey checks reschedule, extension, completion and cancellation notice authors and audits without replacing the creator, preserving automatic system attribution. The subscriber journey refuses anonymous deletion, erases native email and webhook subscribers as another operator, checks their exact readable and durable deletion audits, and repeats deletion without replacing the first audit. Its existing full retained-database address-erasure and queued-unsubscribe proof remains.

The active history-correction journey in ./tests/e2e/helpers/uptime-correction-journey.mjs is byte-for-byte unchanged. It asserts correction operator identity in the correction row, appended history fact, native audit view and durable audit row, as well as refused anonymous and empty-reason correction, original-fact preservation and public recomputation.

## Acceptance and inherited-duty rubric

| Item | Outcome | Proof and result |
| --- | --- | --- |
| Acceptance 1: published update | Covered locally | ./tests/e2e/publishing-contract.test.mjs, reviewed incident journey; creator and draft author differ from publisher; assertPublicationActor reconciles response, native readback, persisted author and exact published audit. |
| Acceptance 1: correction publication | Covered locally | The same journey preserves original update values and the exact correction link while checking the actual correction publisher, rather than the draft author. |
| Acceptance 1: component state change | Covered locally | ./tests/e2e/public-contract.test.mjs, complete catalogue journey; initial creator history differs from later state actor; each appended state-history fact and standing-claim operator is checked. Release retains its attributed audit. |
| Acceptance 1: manual maintenance change | Covered locally | Complete catalogue journey checks start and completion. ./tests/e2e/publishing-contract.test.mjs, maintenance journey checks reschedule, extension, completion and cancellation notices, exact audits and unchanged scheduler. |
| Acceptance 1: history correction | Existing proof retained | ./tests/e2e/helpers/uptime-correction-journey.mjs, uptimeCorrectionJourney, loaded by the complete catalogue journey; exact operator identities and refusal controls preserved. |
| Acceptance 1: subscriber deletion | Covered locally | ./tests/e2e/helpers/subscriber-add-flow.mjs, subscriberAddFlow, loaded by the Subscriber consent journey in ./tests/e2e/delivery-contract.test.mjs; independent eraser, exact audits, idempotent deletion, anonymous refusal and retained-address absence. |
| Acceptance 2: operator-app acting names and complete public exclusion | Unproved and omitted by the planner | Not claimed; stays in the clause's unfinished scope. Existing names in the audit response alone do not prove this whole point. |
| BASE-OPS-005 and BASE-AUDIT-001 inherited attribution duty | Native record and audit portion covered | Explicit citations already exist in CONTRACT.md. This round proves actor identity through existing native audit read doors and retained storage. TEAM-007 retains general audit-view ownership; this round makes no new claim for its UI, logo, expiry or search breadth. |

## DONE-RIDERS

| Row | Result for this partial claim | Evidence |
| --- | --- | --- |
| 1 | FAIL for full DONE | Point 1 is covered by the registered journeys; point 2 remains unproved. |
| 2 | PASS for touched outcomes | Nonempty real migrated records, independent admitted actor and creator identities, denied anonymous erasure and existing unsafe-publication and correction controls. |
| 3 | Pending exact-SHA Verify | The existing push Verify plan runs all three touched registered suites through test:publishing, test:public and test:delivery. CI receipt records the actual event and conclusion; local success is not represented as CI success. |
| 4 | PASS by identical relevant bytes | No code or test edit followed the recorded suite runs. The candidate receipt fingerprints the relevant files and checks them against committed bytes. |
| 5 | PASS, INSPECTED | CONTRACT.md already cites BASE-OPS-005 and BASE-AUDIT-001 for TEAM-003. No inheritance text was changed. |
| 6 | PASS for builder mechanics | Generator write then check passes; generated views restored from main and never committed. Authoritative Status, Gap, Evidence and counts are untouched. No DONE provenance is invented. |
| 7 | PASS | No acceptance text or coverage rewrite. |
| 8 | PASS for touched authority paths | Native identity admission, anonymous erasure refusal, existing self-review and unreviewed publication refusal, existing anonymous correction refusal and revoked subscriber authority proof. Other role doors remain with TEAM-004. |
| 9 | PASS, no provider claim | Synthetic network edges only. No mailbox delivery, hosted deployment, real-provider qualification or legal boundary is claimed. |
| 10 | PASS | No new policy default. |
| 11 | Pending lander | Branch custody only. Main equality, full-history publication scan and candidate Run site are not established by this cloud run. |

## Pre-ready self-check

The point-1 journeys compare expected operator ids from native independent sessions with actual saved records and audit ids, so they fail if attribution silently uses a creator or draft author. No existing assertion was deleted, narrowed, skipped or placed behind a width condition. Erasure retains its existing complete-address removal and queued-token replay controls, and now also refuses an anonymous deletion with unchanged subscriber inventory. No screen was changed, so no new screen or icon-control audit is claimed. The source lock is regenerated after staging the new helper and after the final integration step; actual checks and exits are in the receipt. The Mac lander owns publication scanning and candidate Run site. Exact-SHA CI is reported separately and never inferred from main's older green run.

## Counts, scope and custody

TEAM-003: PARTIAL to PARTIAL, acceptance 1 proved, acceptance 2 unproved. Before and after contract totals: 59 done, 130 partial, 55 missing, 244 total. Test inventory before and after: 85 registered cases plus 10 assertion scripts; zero registrations added or removed. No pin or duplicate tests were encountered or deleted in this change. Plan return: update only the TEAM-003 queue note with point-1 completion and the unchanged point-2 remainder; no lane plan file was read or modified.

Main at clone: b6115a1a54e6587bcbb069cfc41538597868a966. Main Verify 43222738144 and Run site 43222738172 were completed success on that exact SHA. The candidate's full SHA, branch, local checks, source fingerprints, push receipt, ancestry and actual CI status are in RECEIPT.json and CI.json. No PR was required to start push Verify. Main was never pushed or changed. Full-history publication scan: NOT RUN in cloud; complete, historyScanned and findings are unestablished until the maintained lander runs it. No READY claim here implies a landed or accepted clause.

PROBE TEAM-003 1 publication: native draft save by setup operator, review and publication by another admitted operator -> exact publisher on committed update and its durable and native audit entry; correction publication independently reconciled.
PROBE TEAM-003 1 state: native standing-claim PUT by an invited operator for a component created by the setup operator -> all changed state-history facts and standing-claim records name the later actor; release audit names that actor.
PROBE TEAM-003 1 maintenance: native manual start, reschedule, extension, completion and cancellation by another admitted operator -> notices and exact audits name the actor and retain the original scheduler.
PROBE TEAM-003 1 correction: native closed-interval correction -> correction row, appended history and native and durable audits retain the actual operator; anonymous and empty-reason requests refuse without changes.
PROBE TEAM-003 1 erasure: native DELETE for existing email and webhook subscribers by another admitted operator -> anonymized records, exact deletion audits and unchanged first attribution on replay; anonymous request returns 401 without changing subscriber inventory; retained addresses are absent.
PROBE TEAM-003 2: none, private display-name coverage and complete public acting-name exclusion were explicitly omitted by the planner.

GAP TEAM-003: Acceptance 2's acting-name display in the operator app and exclusion from every public surface remain unproved and outside the selected point-1 work.

## Source evidence locations

- publication: ./tests/e2e/publishing-contract.test.mjs:128.
- correction publication: ./tests/e2e/publishing-contract.test.mjs:241.
- state history: ./tests/e2e/public-contract.test.mjs:331.
- manual start: ./tests/e2e/public-contract.test.mjs:375.
- manual maintenance edits: ./tests/e2e/publishing-contract.test.mjs:638.
- history correction: ./tests/e2e/helpers/uptime-correction-journey.mjs:184.
- erasure: ./tests/e2e/helpers/subscriber-add-flow.mjs:171.
- exact audits: ./tests/e2e/helpers/operator-attribution.mjs:24.
- independent admission: ./tests/e2e/helpers/operator-attribution.mjs:5.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node src/base/contract-docs.mjs write then check, restored from origin/main exit=0; ledger=none exit=0.

## Exact candidate result

Product branch: cloud/sd-lamp-c-f127. Full candidate SHA: 7f1dbcec21df69ffa113e40f33c9ab6e2b1c0d00. Product push succeeded on its first attempt. Final fetch and rebase found main unchanged. All relevant committed source and test bytes match the successful local runs. Local results: publishing 5 of 5, public 6 of 6, delivery 7 of 7; zero failures, cancellations or skips. Source lock check after integration exited 0. The local test receipts are bound by committed file hashes rather than falsely claiming they were launched from a post-commit checkout.

CI Verify run=43226152365 event=push head=7f1dbcec21df69ffa113e40f33c9ab6e2b1c0d00 status=in_progress conclusion=None.

The cloud handoff follows the supplied no-wait route: the maintained lander must require exact-SHA successful Verify and a COMPLETE publication scan before landing. No queued or running result is called green.
