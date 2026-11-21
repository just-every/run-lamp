# Lamp UPDATE-005 stale-save proof

Run Edit Run fleet · 2026-11-21 · sd-lamp-c-f160

Branch **cloud/sd-lamp-c-f160**, candidate **268e93422a0ff044c720273e05da0eb74090a108**, base **3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb**.

## Plan and result

1. Use the UPDATE-005 row from the supplied next-campaign extract. Read all seven acceptance points and the current Status, Gap and Evidence. Limit this round to the planner's stale-save-after-publication outcome in point 4.
2. Inspect the native incident draft route, service and repository. The route validates the acknowledged version and JSON and maps a rejected write to 409. The service forwards the exact version. The repository's single guarded upsert requires both the draft ID and committed update count to match. Publication consumes the matching draft in its own database batch. The regression passes with the existing implementation.
3. Extend the existing reviewed-incident journey. Retain the Monitoring draft ID and update count immediately before publication. Assert that the draft ID becomes the committed update ID. Reuse the previously accepted customer wording and the same next-update commitment in a native PUT sent by the original draft author. Send the exact stale If-Match. Check 409, independently read the absent draft, and compare the full native update array and the ordered persisted rows with the captured inventories.
4. Run the touched journey file, typecheck, first-party check, contract generation and source lock freshness. Push only the named product ref, look up push Verify on the candidate SHA, and return the report and receipts through the named evidence ref for guarded landing.

**Status and counts.** UPDATE-005 stays PARTIAL. The contract table is unchanged at 65 DONE, 124 PARTIAL and 56 MISSING of 245, before and after. Record this proof under point 4 in the existing UPDATE-005 plan row. The shipped plan and contract judgments stay as recorded.

## Acceptance coverage for this round

| Point | Evidence or held scope |
| --- | --- |
| 1 | Held. Complete public-surface draft privacy. |
| 2 | Held. Two-second autosave and unchanged reload across all draft wording and lifecycle fields. |
| 3 | Held. The native test sees draft consumption, while empty fresh composer fields and lifecycle prompts remain outside this slice. |
| 4 | Native stale-save path verified in the reviewed-incident journey, ./tests/e2e/publishing-contract.test.mjs lines 197–217 and 226–241. Line 204 captures the consumed ID, line 205 captures the prepublication count, and lines 236–240 assert the refusal and full post-rejection state. The existing stale-publish assertion at lines 226–228 remains. The existing newer-draft browser control at ./tests/e2e/publishing-browser.test.mjs lines 806–816 is preserved and falls outside the lease. |
| 5 | Held. Complete acknowledged-version requirements across writes, template application, scheduling and publication. |
| 6 | Held. Fresh composer acknowledgement and its complete-draft Publish requirement. |
| 7 | Held. Identifying the attempted write when acknowledgement is lost and preserving later workflow changes. |

PROBE UPDATE-005 4: native PUT /api/app/incidents/:incidentId/draft, prior Monitoring wording and the consumed draft ID plus prepublication update count as If-Match -> HTTP 409, native draft null, both committed updates unchanged in the API and in every persisted field.

GAP UPDATE-005: Complete draft privacy, autosave and reload, fresh-composer and lifecycle-prompt proof, remaining newer-draft judgment, all versioned write doors, acknowledgement and lost-acknowledgement reconciliation stay held.

## DONE riders and landing checks

1. Partial. Point 4's assigned outcome is executed and asserted in the local reviewed-incident journey. The other named outcomes stay held as shown above.
2. Pass for the slice. The approved Monitoring publication succeeds on populated data and the stale save is refused, leaving both complete committed records equal.
3. Verify runs the native journey through the runtime shard's test:publishing command. Candidate workflow provenance follows below.
4. Pass. Local results are bound to the committed candidate SHA above.
5. No inherited duty added by this test-only change. The existing UPDATE-005 contract remains authoritative.
6. The contract document write and check pass with zero errors and warnings. Status, Gap, Evidence and judgment provenance remain under the lander's custody.
7. Acceptance text and existing assertions are preserved. No new test registration was added.
8. The original draft author is allowed to save the fixture before publication and refused when sending the obsolete version. This task changes neither actor permissions nor erasure behavior.
9. No provider or legal boundary is claimed.
10. No policy default or scope ruling is introduced.
11. Guarded landing is pending. The cloud has no publication-scan result on this candidate. Main equality, publication scan completeness and findings, and the resulting main SHA's Run site are the lander's checks.

The added test exercises the replay through an authenticated native route, detects a wrong status, a revived draft or any change to either sorted stored update, and preserves both stale-publish and newer-draft controls. The diff touches a test and its regenerated lock. Visual proof at 1440 and 390 is outside this nonvisual lease. The 1440 maintenance case in the same file still runs as part of the local touched suite. No migration or new fixture was introduced.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

Baseline main Verify and Run site completed successfully in runs 44839596494 and 44839596465 respectively, on the base SHA listed above. A second successful Verify on that SHA was run 44837432042.

CLAIM UPDATE-005 PARTIAL points=4 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion

## Exact candidate Verify

GitHub push Verify 44842161187 was in progress at 2026-11-21T00:17:45Z on the candidate SHA. It had no conclusion at the end of the cloud CI observation window. The product handoff is PUSHED. The guarded lander's exact-SHA Verify, publication scan and Run site checks remain pending. [44842161187](https://github.com/just-every/run-lamp/actions/runs/44842161187)
