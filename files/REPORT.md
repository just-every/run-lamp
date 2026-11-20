# Lamp HIST-007 pending email expiry

Run Edit Run fleet (Codex), 20 November 2026. Campaign item sd-lamp-c-f156.

Branch `cloud/sd-lamp-c-f156`. Candidate `2d49a4617e43cc910a99ec7ab3d1074684b62f58`. Base `173e93d259f968daffd0148365c2b9a26c62e3e6`.

## Plan and execution

1. Read the seven HIST-007 acceptance points and the existing PARTIAL judgment. The campaign extract limits this round to the pending email expiry facts in point 5. Read the subscriber reporting repository and service and the SMS subscription migration to identify the database UTC clock. The native scheduled handler uses the controlled Worker instant for expiry. The supplied Lamp rulings cover other clauses.
2. Extend the existing expiry helper in the registered delivery journey. Before each deadline and immediately after each native scheduled tick, read a native JSON report and independently read the complete native subscriber list. Check that each expiry adds exactly one anonymous email leave on an observed database UTC day and reduces eligible inventory by one. Check that neither a repeated tick nor the revoked confirmation changes the result. The confirmed email survives both expiries.
3. Run the focused native check, the registered delivery suite, typecheck, first-party checks and the documented generation and lock checks. Push the test and regenerated source lock on the named branch and bind receipts to its exact SHA.

## Findings by acceptance point

| Point | Result |
| --- | --- |
| 1 | Held. The expiry fixture checks its own email inventory. Complete mixed-channel and state reconciliation remains in the campaign. |
| 2 | Held. Complete component counts and deactivation-reason counts remain in the campaign. |
| 3 | Held. AUD-004 and I18N-001 retain audience and language duties. |
| 4 | Held. Full daily opening and closing inventory and confirmation reconciliation remain in the campaign. |
| 5 | Pending email expiry covered. Public subscription and confirmation at helper lines 21–32 and 55–65, independent inventory at lines 34–43, anonymous report at lines 67–79, first post-expiry leave and eligible-count checks at lines 81–109, erasure and replay at lines 45–49 and 111–115. Imports, moves, undo and erasure as separate growth-ledger operations remain held. |
| 6 | Held. Complete CSV parity and anonymity remain in the campaign. |
| 7 | Held. Complete archive facts and the restore baseline remain in the campaign. |

The registered journey begins at `tests/e2e/delivery-contract.test.mjs:31` and invokes `subscriberExpiryFlow` at line 33. The helper is `tests/e2e/helpers/subscriber-expiry-flow.mjs`. Verify runs `test:delivery` in the public shard from `scripts/verification/plan.mjs`.

## DONE riders

| Row | Result |
| --- | --- |
| 1 | Pass for the leased outcome. Fail for a whole-clause DONE claim while the points above remain held. |
| 2 | Pass for this expiry slice. Both sides of each deadline are exercised with separate pending identities, one confirmed control and complete native list readback. Helper lines 34–49 and 81–115. |
| 3 | Pass. Push Verify 44783192337 completed successfully on the candidate. It runs the registered delivery journey in the public shard. |
| 4 | Pass. The focused probe exercised the helper bytes in this candidate and the source lock records them. CHECKS.md records the runtime verification. |
| 5 | Pass for the slice. HIST-007 names the AUD-004 and I18N-001 obligations. SUB-003 still owns the expiry guarantee, exercised by the same journey. |
| 6 | Mechanical check passed. No clause judgment changed. The existing PARTIAL judgment and its held gaps still apply. |
| 7 | Pass. The acceptance source matches the base. |
| 8 | Pass for the slice. The operator reads through existing auth, and the expired confirmation gets a 404 without restoring the erased address. Helper lines 45–49 and 84–87. |
| 9 | No provider or legal proof is claimed. The synthetic email edge only supplies confirmation links. |
| 10 | No new policy default. Existing expiry and reporting rules were tested. |
| 11 | Pending lander. Candidate main equality, Run site and full-history publication scan are outstanding. The branch and main heads were observed independently. |

## Handoff

Plan row HIST-007 is PARTIAL. Expiry evidence is ready for its slice, with the remaining plan points held. Recorded totals are 65 DONE, 124 PARTIAL, 56 MISSING and 245 total before and after. The first post-expiry report checks the accounting effect before token replay or a repeated tick. Existing expiry, persisted address removal and replay assertions remain in the journey. This patch adds no registrations and changes no surfaces at either browser width. No added email-shaped string or bare owner and repository token occurred in the patch.

CLAIM HIST-007 PARTIAL points=none tests=tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure

GAP HIST-007: Point 5 has expiry proof only. Import, channel moves, undo and erasure growth facts, points 1–4 and 6–7, and their named dependent work remain held.

PROBE HIST-007 5: Public subscribe and confirm, two native 72-hour scheduled ticks and two replays, with the operator report and independent subscriber list before and after each tick -> eligible inventory 3 → 2 → 1, cumulative anonymous email leaves 0 → 1 → 2 on the database UTC observation day, no increase on replay, confirmed control preserved and each old confirmation refused with 404.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0
