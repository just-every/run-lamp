# Lamp HIST-004 · sd-lamp-c-f169

Run Edit Run fleet, 2026-11-21.

## Plan and result

The planner's replan-36 HIST-004 row asked for an independent source-to-first-export comparison for the built native Lamp graph. The existing journey opened the first archive for targeted counts and redaction checks and compared it with the post-restore archive. Equal exports could still both omit the same source data.

1. Retain complete rows in one source D1 batch after the existing fixture and setup steps, and independently read each buffered object from the source snapshot bucket while the source is open.
2. Run the ordinary native export command. Open its first archive and compare unordered row sets as full rows, preserving duplicates, identities, relationships, subscriber channel and state, portable settings, and all audit fields. Compare object keys, decode matching chunks in offset order, and compare bytes with the source.
3. Exercise the existing damaged-archive refusal, empty-target import, re-export parity, credential redaction, reconnect and old-authority refusal in the same journey. Check typecheck, first-party structure and contract generation. Relock edition sources and publish the exact candidate for independent gates.

The journey exercises the deployed schema through a migrated disposable installation. It adds distinct update and maintenance-notice rows, a pending webhook alongside the existing active and deactivated subscribers, nondefault automation and social settings, a second original image and a nondefault traffic setting in object storage. It retains the existing registration and reuses its first decoded archive for the clean re-export comparison. No test registration was added or removed.

## Outcome evidence

The journey is **SUB-019 AUTO-001 HIST-004 PORT-001 ACCESS-001 ACCESS-002 INTAKE-009 INTAKE-014 native rer backup restores the whole product without reviving temporary authority**, in `tests/auth-adoption/portability.test.mjs` at line 20. Verify selects it through the portability shard declared in `scripts/verification/plan.mjs` and the package test script.

| Item | Public-door proof |
| --- | --- |
| HIST-004 acceptance 1 | `tests/auth-adoption/portability.test.mjs` lines 77–85 invokes native export after retaining the source. `tests/helpers/archive-history.mjs` lines 8–21 and 24–26 capture the incidents, updates, components, state history, maintenance, notices, subscribers, deliveries, reports and relationships. Lines 51–55 compare every complete row, including the exact subscriber fields and counts. |
| HIST-004 acceptance 2 | The same export and row comparison covers the portable settings and full Lamp and operator-auth audit entries at `tests/helpers/archive-history.mjs` lines 19–26 and 51–55. The traffic settings object is included in the byte comparison at lines 57–65. |
| HIST-004 acceptance 3 | The same export compares the complete object inventory and decoded chunk bytes in `tests/helpers/archive-history.mjs` lines 27–39 and 57–65. The source reads check the two distinct original image buffers before export. |
| BASE-DATA-001 restore | `tests/auth-adoption/portability.test.mjs` lines 118–123 refuses the damaged archive and imports the intact copy into the same empty destination. |
| BASE-DATA-001 equivalent re-export | `tests/auth-adoption/portability.test.mjs` lines 123–125 compares all archived row and object parts after re-export. The normalization for the installation-local session generation remains in the reader. |
| Credential and authority inheritance | `tests/auth-adoption/portability.test.mjs` lines 93–111 retain byte-level redaction and archived null credential fields. Lines 128–157 retain bootstrap and revoked-session/link refusal. Lines 158–185 retain provider reconnect and valid native subscriber management. |

PROBE HIST-004 1: native rer export of the populated Lamp graph -> first archive matched the complete source row sets, including exact subscriber channel and state.

PROBE HIST-004 2: native rer export after retaining settings and audits -> every selected D1 row and the stored traffic setting matched source values.

PROBE HIST-004 3: native rer export with two distinct uploaded images -> matching objects decoded to the original bytes and the complete snapshot-bucket keys matched.

The one-off assertion probes also detected missing and duplicate rows, altered subscriber channel and state, a changed audit payload, an absent object and same-size replacement bytes. The result file records their outcomes.

## Counts and scope

Before and after in the tracked contract: 65 done, 124 partial, 56 missing, 245 total. The gate and lander own status and count changes. A single HIST-004 promotion yields 66 done, 123 partial, 56 missing. The only plan entry advanced by this work is HIST-004 in replan-36.

The contract already cites BASE-DATA-001. Base continues to own restore and equivalent re-export. PORT-001 retains broader new-entity and provider credentials and reconnect duties. Existing installation-local pairing and authority work remains with its owners. This round touched the test, its fixture helper and the generated edition source lock. It has no UI change and adds no migration or policy default.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The documented contract generator accepts no touched-clause argument. Both generated views were taken from main whole after generation, and the edition lock was regenerated last. The tracked contract and its generated views match main.

## Verified custody

- Candidate 2bc6d2739a202864471aefa2493cb822e5cebaa4 on cloud/sd-lamp-c-f169 is the advertised product head.
- Push Verify 44863479233 for the exact candidate completed successfully.
- Main was observed at 820ff8267db256927f5d95bad703f604b07197b5. Base Verify 44861397097 and Run site 44861397172 completed successfully on 2939f22d0549be77fcc94315b2747667f8796e66. Candidate Run site follows guarded main landing.
- The exact candidate publication scan is pending with the guarded lander. No complete status, history-scan value, or finding count was produced in cloud.
- The local test was rerun from a clean checkout of the exact candidate. The edition source lock check passed after rebase.

## DONE-RIDERS and pre-READY checks

| Rider | Result and evidence |
| --- | --- |
| 1. Public outcomes | PASS. The native export journey reaches all three acceptances with a populated graph and two originals. See the outcome rows above. |
| 2. Outcome failures | PASS. Full row comparisons and decoded bytes detect missing, extra or changed data. The journey refuses the damaged import before a valid restore. The one-off comparator probes are in the local receipt. |
| 3. Recorded Verify | PASS. Push Verify 44863479233 completed successfully for 2bc6d2739a202864471aefa2493cb822e5cebaa4. The repeatable journey is in the portability shard. |
| 4. Candidate provenance | PASS. The local rerun passed from the exact candidate, and both receipts name its full SHA. |
| 5. Base duty | PASS. HIST-004 cites BASE-DATA-001. The complete restore and equivalent re-export are exercised at lines 118–125 of the existing journey. |
| 6. Status and generated views | PASS for builder checks. The tracked contract, Gap and Evidence match main. The documented generator and freshness check passed. Judgment provenance is recorded by the lander. |
| 7. Acceptance and coverage | PASS. Acceptance wording, citations and scope match main. |
| 8. Authority | PASS. The current journey preserves damaged-archive rejection, old-session and temporary link refusal, and provider reconnect and retained native subscriber access. No erasure or replay mechanism changed. |
| 9. Provider boundaries | NOT APPLICABLE. No provider account, hosted delivery or legal assertion is claimed. |
| 10. Policy default | NOT APPLICABLE. The test observes existing behavior and changes no policy. |
| 11. Scan and landing | PENDING. The advertised branch head, observed main, base runs and candidate Verify are in the CI receipt. Publication scan, judgment, guarded main landing and Run site on the landed SHA belong to the lander. |

Existing assertions still run. Added source references and email-shaped strings were checked locally. There is no UI change requiring visual proof.

CLAIM HIST-004 DONE points=1,2,3 tests=tests/auth-adoption/portability.test.mjs#SUB-019 AUTO-001 HIST-004 PORT-001 ACCESS-001 ACCESS-002 INTAKE-009 INTAKE-014 native rer backup restores the whole product without reviving temporary authority
