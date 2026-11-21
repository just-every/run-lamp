# Lamp NOTIFY-017 standing-claim delivery proof

## Scope and plan

The selected round covers internal standing-claim silence within acceptance 4. The plan was to read the clause and its held dependencies, trace the native history and notification commit, establish a recipient that could catch an internal visibility regression, commit an internal standing claim, and compare every relevant inventory before and after normal dispatch. The final steps were to run the existing delivery registration and touched checks, publish the named product branch, check exact-SHA Verify, and return this packet to the lane.

The planner row to update is NOTIFY-017 in planner round 40. Mark its internal standing-claim proof exercised. The clause remains PARTIAL, with 66 DONE, 123 PARTIAL and 56 MISSING out of 245 before and after. No acceptance text, status cells or policy decisions were edited.

## Results

The journey uses a fresh migrated Worker and its own receiver, separate from the existing strict Statuspage receiver and its inventories. The native subscriber intake returned a pending Lamp webhook. The real confirmation message activated it. The independent operator list returned the same destination and subscriber identity, all-components mode, no narrowed component identities, and exactly the component-change preference.

The visible control committed Operational → Degraded performance. Its native history transition, durable component event, recipient record, completed outbox command and webhook envelope matched. The only receiver request carried the matching delivery ID in both header and body. The test recomputed the HMAC over the exact captured bytes with the configured synthetic signing key.

The internal claim committed Operational → Major outage. The operator history identified one new standing-claim row with the exact old and new state, actor, cause, and committed time. The previous row remained intact. The event, delivery, outbox and receiver inventories were identical to the visible control immediately after the commit with dispatch paused and again after the real scheduled dispatch entrypoint ran with effects enabled.

The component service persists the standing claim and recomputes effective state. The component repository batches the transition and recipient capture. The delivery repository checks component visibility before inserting a notification event and only derives deliveries and outbox entries from captured events. Removing only that visibility predicate from a disposable test bundle caused the pre-dispatch inventory assertion to fail. The source tree retained the original predicate.

## Acceptance map

| Point | Outcome | Round result |
| --- | --- | --- |
| 1 | One delivery for every named claimant, including its states, time, kind and absence of operator identity | Held for the claimant matrix. The visible operator claim serves as the control. |
| 2 | Only committed changes notify, with flap suppression and undo | Held with AUTO-002. |
| 3 | Incident carriers deduplicate and honor the two explicit opt-in cases | Held. Existing assertions were retained. |
| 4a | Internal changes send nothing | Exercised through the native standing-claim and history routes, scheduled Worker and receiver. See the receipt for lines and runs. |
| 4b | Retroactive history sends nothing | Held. |
| 4c | History corrections send nothing | Held for the remaining proof. Existing correction assertion was retained. |
| 5 | Following webhooks receive each prescribed source and unsubscribed email stays silent | Held for the source matrix. Existing email assertions were retained. |
| 6 | The strict Statuspage receiver verifies the complete field and publication matrix | Held for the remaining matrix. Existing strict receiver counts and assertions were retained. |

The inherited BASE-OPS-003 duty is cited in the clause. This journey checks the exact single delivered envelope and the absence of any additional send or persisted work for the internal claim. The inherited BASE-INPUT-002 duty continues to belong to the existing HTML doors. This round adds no HTML input or rendering.

## DONE riders and handoff

1. The leased internal outcome is exercised through native doors. The full clause has held outcomes in the acceptance map.
2. The positive receiver and negative internal branch both run against seeded data. Disabling the visibility guard makes the negative assertion fail.
3. Verify includes the existing delivery registration through the public shard and the delivery test script. The receipt records exact-SHA CI.
4. The receipt identifies the candidate and binds its evidence to the final test bytes.
5. Both Base duties are cited above and remain in the clause.
6. Contract document generation and freshness passed locally. Judgment provenance and the existing Status row remain the lander's custody.
7. Acceptance text and inherited obligations were preserved.
8. The existing operator session supplies the actor. There is no new permission surface. The targeted privacy boundary is checked in both directions.
9. Proof uses the synthetic receiver and makes no live provider qualification claim.
10. No authority, consent or other policy default was needed.
11. Main equality, the publication scan and Run site on the eventual landed SHA remain with the guarded lander. The cloud report has no publication scan result.

No existing assertion was removed or narrowed. The test-only change exercised no modified screen. The existing delivery file still runs its authority, erasure and replay assertions. The source lock was regenerated after the proof changes and the final rebase. The selected packet excludes addresses and credential material.

GAP NOTIFY-017: Acceptance 4 still holds retroactive-history and correction proof, and points 1–3 and 5–6 retain the claimant, flap and undo, incident carrier, and strict receiver matrices with AUTO-001, COMP-008, INTAKE-013, DEP-001 and AUTO-002. UPDATE-014 and UPDATE-015 retain their existing obligations.

Exact-SHA push Verify 44900292147 completed successfully. The receipt includes the local delivery test results, touched mechanical checks and advertised branch provenance.
