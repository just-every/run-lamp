# Lamp UPDATE-014 competing incident claims

Codex, 2026-11-21 UTC. Fleet round sd-lamp-c-f185.

- Product branch cloud/sd-lamp-c-f185 at 7992a90f44de34f4915165a9f5bc9183e9b39131.
- Integrated main f95b99b87f0ab98c8ad15c8e842a77baf30c95b1. Advertised main at receipt f95b99b87f0ab98c8ad15c8e842a77baf30c95b1. Candidate equality false.
- Verify 44890095478, push event, completed with conclusion success. https://github.com/just-every/run-lamp/actions/runs/44890095478
- Starting main had successful exact-SHA Verify runs 44888108728 and 44886865207 and successful Run site 44888108898. Candidate Run site and judgment provenance await guarded landing.
- Contract counts before and after were 66 DONE, 123 PARTIAL, 56 MISSING, 245 total. UPDATE-014 remains PARTIAL. Test registration count is unchanged.

## Plan and results

1. Checked UPDATE-014 and its Status gap against the selected point, the plan extract and DONE-RIDERS. Point 4 lacked a named journey that reached and reconciled both overlap outcomes.
2. Traced src/core/features/incidents/publication-repository.ts:33–78 and src/core/features/components/state-history-repository.ts:5–25. The batch stores the update and applies attachment and claim-event state before it appends aggregate history. The history statement selects the most severe active claim and emits only when the prior aggregate changes. Publication supplies the committed time, incident ID and acting publisher.
3. Extended the existing catalogue journey in tests/e2e/public-contract.test.mjs:699 with the call at line 1445. Used a fresh component for each case. The owner publishes both initial claims and an independently admitted operator publishes the step-down. Both native incident reads, the component aggregate and the full history reconcile. The incident permalink observes the new wording before the public component collection read.
4. Ran the full touched file, typecheck and first-party check. The setup built the application. Verify calls the existing test through the public-pages shard in scripts/verification/plan.mjs:9 and package.json:57. No screen changed.
5. Generated and checked contract views, restored the main copies, regenerated and checked the source lock, checked every candidate commit and pushed the exact branch head. The pre-push main fetch and rebase left the tested tree intact.
6. Plan row update for UPDATE-014. Record native acceptance 4 overlap proof and retain the planner-held remainder. COMP-006 and NOTIFY-017 retain their scoped proof. Adoption, UIP and release prerequisites retain their gates.

PROBE UPDATE-014 4: Native draft and publish with both active competing claims -> Partially unavailable with one fully attributed aggregate transition in the first case and Major outage with complete history unchanged in the second. Operator and public component reads agree.

## Acceptance coverage

| Point | Result on this candidate |
| --- | --- |
| 1 | Held. The full atomic publication matrix remains with UPDATE-008 and this clause. The existing staged-state and committed update controls are at tests/e2e/publishing-contract.test.mjs:175–222. |
| 2 | Held beyond this overlap. Lines 678–688 attribute the point 4 transition to the committed time, primary incident and actual publishing operator. |
| 3 | Held beyond this overlap. Lines 678–682 compare the complete ordered history and require zero new rows while another Major outage claim remains. |
| 4 | Proven at tests/e2e/public-contract.test.mjs:629–695 and call 1445. Partially unavailable yields exactly one Major outage to Partially unavailable row with the committed instant, incident and actor. Major outage retains Major outage and adds zero rows. Both cases preserve all prior rows and independently read both claims and the aggregate. Verify 44890095478, push event, completed with conclusion success. |
| 5 | Held. The existing public surfaces and refresh proof at tests/e2e/public-contract.test.mjs:1271–1326 remains in place. The complete generation switch across surfaces exceeds this point 4 lease. |
| 6 | Held. Existing weighted closed-interval controls at tests/e2e/helpers/public-capacity-journey.mjs:69–117 remain in place. The publication-specific uptime continuation remains held. |
| 7 | Held. Recovery peak readback at tests/e2e/publishing-contract.test.mjs:350–366 and INCIDENT-013 override proof retain their scope. |
| 8 | Held. Historical timestamps and notification silence controls at tests/e2e/publishing-contract.test.mjs:428–472 retain their scope. |

## Inherited duties and boundaries

| Duty | Evidence or owner |
| --- | --- |
| UPDATE-008 atomicity | Explicitly named by acceptance 1. The repository batch was inspected. The broader matrix retains its assignment. |
| INCIDENT-013 override | Explicitly named by acceptance 7. Existing proof is retained. |
| COMP-006 claim aggregation | Existing claimant precedence and lifecycle controls remain in tests/e2e/public-contract.test.mjs:882–982. The new proof is the publication-specific overlap in UPDATE-014. |
| NOTIFY-017 webhook | The publication batch uses committed transition IDs for component notifications. Webhook qualification retains its existing ownership. |
| Remaining publication doors | API-001, API-002, AUTO-001, maintenance and SMS channel contracts retain the write and delivery obligations named by the lease. |

## DONE-RIDERS

| Row | Finding |
| --- | --- |
| 1 | Point 4 passes at lines 629–695. Acceptances 1–3 and 5–8 are held, so the clause remains PARTIAL. |
| 2 | Pass for point 4. Lines 651–694 compare real seeded native claims, exact aggregates and complete history. |
| 3 | Verify 44890095478, push event, completed with conclusion success. The workflow includes the named journey at lines 699 and 1445. |
| 4 | Pass. The touched test and application bytes used locally match the pushed candidate. The advertised product branch SHA matches the receipt. |
| 5 | Pass by inspection for this proof. UPDATE-008 and INCIDENT-013 are named in the acceptance text. |
| 6 | Generated-view write and check passed. Status judgment provenance awaits the lander. |
| 7 | Pass. CONTRACT.md and both generated views match main. |
| 8 | Pass for attribution. Native sign-in establishes the actor and lines 670 and 687 confirm it in the publication and history. |
| 9 | Native fixture proof. Provider and channel qualification retain their assigned contracts. |
| 10 | Pass. No new policy default was needed. |
| 11 | Pending guarded landing. Candidate main equality false. Candidate Run site and full-history publication scan await the lander. |

## Candidate checks

- Touched file passed 8 of 8 tests, including both point 4 outcomes. A separate focused run of the same helper also passed both. Existing assertions were retained. The change adds no authority rules, erasure, replay, UI or migration paths.
- Typecheck, first-party check, added-text hygiene, complete candidate message and identity inspection, generated-view check and source-lock check passed. Added test lines and both selected packet files were checked for email-shaped text.
- Publication scan for 7992a90f44de34f4915165a9f5bc9183e9b39131: complete=unestablished, historyScanned=unestablished, findings=unestablished. The full-history scan is a guarded landing check.
- Branch push is the Verify entry point. The candidate awaits the maintained Mac lander.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node src/base/contract-docs.mjs write then check exit=0; ledger=none exit=0

CLAIM UPDATE-014 PARTIAL points=4 tests=tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
GAP UPDATE-014: Acceptances 1–3 and 5–8 retain full atomic publication, general attributed history and no-op, snapshot switching, weighted uptime, peak or override and retroactive timing and silence proof. Remaining publication doors retain their API-001, API-002, AUTO-001, maintenance and SMS dependencies.
