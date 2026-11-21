# Lamp PORT-002 point 2

Prepared by Run Edit Run fleet, 21 November 2026.

## Plan and scope

The sd plan extract's replan-38 PORT-002 row leases acceptance 2. Map the live clause and active delivery journey. Keep the existing receipt success, signature refusal and failure assertions. Match an existing delivered receipt to one synthetic subscriber and erase it through the native operator DELETE. Reconcile the filtered JSON and CSV and the stored receipt against their pre-erasure snapshots. Use the existing database snapshot to check every application table for the former number. Run the touched verification command, typecheck and first-party checks, then publish the candidate and return this packet. The lane can update that one plan row with the outcome below.

The delivery repository, delivery routes and migration 0065 were inspected read-only. The SMS delivery log includes the opaque delivery ID. CSV exposes the destination, publication and receipt fields, so the journey correlates its row using those fields from the live export. The fixture replaced the Twilio HTTP edge with synthetic messages and used the normal signed callback route. Existing product routes, migration, release behavior and visual design were kept intact.

## Claimed proof and held work

| Contract item | Result and evidence |
| --- | --- |
| 1. Base erasure conformance for every named identifier | Held. Released subscriber and operator proof remains in the existing delivery and auth dependency journeys. Full phone and consent, chat installations, API tokens, audience and private-session coverage, and SCIM identifiers are outside the lease. AUD-003, AUD-002 and TEAM-006 remain dependencies. |
| 2. Erasing an SMS subscriber removes the number from every table and retains an anonymous delivery outcome | Native DELETE and filtered JSON in `tests/e2e/helpers/sms-delivery-receipts-flow.mjs:108`. The same delivery ID, update, outcome and timestamps survive. The destination is anonymized and the accepting provider becomes null. Filtered CSV reconciles the publication and receipt at line 129, with an empty accepting-provider cell. Read-only storage checks at line 139 require a null SID and no original phone number in any application table. The other recipients' delivery rows and CSV records compare equal in full. |
| 3. Erasing an audience member ends the private-page session | Held with AUD-003 and AUD-002. |
| Inherited BASE-DATA-003 | Cited in the clause. The point 2 proof covers the released SMS subset above. The complete Base conformance matrix remains held. |

The active registration is the Subscriber consent, selected publication, channel delivery, export and erasure journey at `tests/e2e/delivery-contract.test.mjs:32`. It reaches the new assertions through `tests/e2e/helpers/sms-subscriber-flow.mjs:290`. No registration was added. The test inventory has 116 registered cases and 10 executable assertion scripts.

SUB-013 retains its live Twilio account and opt-in hold. NOTIFY-014 retains its real sender and receipt hold. This task exercised synthetic receipts only. Existing adoption, UIP and release prerequisites still apply.

## DONE riders and pre-handoff self-check

1. Partial. The leased SMS erasure outcome is covered by the named journey. Points 1 and 3 retain their holds.
2. The journey uses three actual fixture subscribers, signed callbacks and unmodified siblings. The existing unsigned and incorrectly signed callback refusals leave both log and storage unchanged at lines 48 to 56. Operator DELETE and the readbacks guard data loss and exposure.
3. The push Verify plan loads the existing registration through the public shard's delivery command. See the run receipt for the candidate's conclusion.
4. See the local receipt for the tested tree and exact candidate binding.
5. Inspected. PORT-002 cites BASE-DATA-003 and names the SMS erasure outcome in point 2.
6. The contract generator and its check passed. Judgment provenance, Status, Gap, Evidence and generated views are inherited from main.
7. Inspected. The accepted clause text and coverage map have no diff.
8. The owner performs native DELETE. Bad signatures cannot alter the delivery, and the erased provider SID and phone are absent. Existing subscriber token revocation proof remains in the parent journey. This slice did not exercise private-page session revocation or post-erasure capture replay.
9. The synthetic receipt and erasure check establishes Lamp's local behavior. Real carrier and sender evidence remains held.
10. No new policy decision was needed.
11. Guarded landing, the exact-head full-history publication scan and main-only Run site are pending with the Mac lander.

The diff preserves the existing assertions. A missing retained receipt, stale phone or provider SID, changed facts, or damage to an unaffected recipient fails the new comparisons. The scoped change touches API assertions with no changed UI screen, so there is no new visual proof. Mechanical checks, the runtime probe and CI state follow.

## Handoff

Product branch `cloud/sd-lamp-c-f180` was advertised at `23e980f419288637f75e5809345bc53c9c994029`. Its parent and the observed main were `bafb632174ace2da2191b88bb186d0364e1415c7`. That main SHA had successful push Verify 44876986189 and Run site 44876986360. The branch push already started its own Verify, so the cloud round used the branch entry point without opening a pull request.

PORT-002 stays PARTIAL. Recorded counts before and after are 66 DONE, 123 PARTIAL and 56 MISSING, 245 total. The two candidate paths are the existing SMS delivery test helper and its regenerated source lock. The plan row to update is PORT-002 in replan-38, with point 2 proof and the held remainders above.

PROBE PORT-002 2: Owner DELETE of the recipient matched to a signed synthetic delivered receipt, then delivery JSON and CSV filtered by SMS, delivered outcome and publication ID -> HTTP 204, original delivered facts retained, anonymous destination, no accepting-provider identity, null stored SID, no original number in the responses or any application table, and the other recipients' delivery facts unchanged.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The full-history publication scan has no cloud receipt for the candidate. Scan completion, history scanned and findings are pending with the guarded Mac lander. Run site is also pending for the candidate. The local diff check found no newly added address-shaped strings or bare repository-shaped slash tokens.

The registered delivery command passed all eight tests on Node 24.19.0. The touched journey's bytes match the pushed candidate. Typecheck and the first-party check also passed on Lamp's pinned Node 22.20.0. An additional standalone invocation of the SMS helper on the pin stalled during local fixture startup and the bounded retry timed out. The registered delivery command supplies the runtime proof.

Push Verify 44880184022 was still in progress on the candidate at the handoff cutoff. The exact-SHA CI receipt records the discovery and each spaced status check. The branch and local checks are complete and the cloud product handoff is PUSHED.
