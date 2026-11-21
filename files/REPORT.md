# Lamp MOVE-002 component-history proof

Run Edit Run fleet, 2026-11-21.

- Repository `just-every/run-lamp`, branch `cloud/sd-lamp-c-f166`.
- Base `2939f22d0549be77fcc94315b2747667f8796e66`. Product candidate `edb0ecec0e247e03c1c1d48ef4734c24c44c269f`.
- Contract judgment PARTIAL → PARTIAL. Before and after, 65 done, 124 partial and 56 missing out of 245. The three registrations in the touched test file remain three. Verification inventory remains 116 registered cases and 10 assertion scripts.

## Plan and results

1. Read MOVE-002, INCIDENT-009, the recorded gap, the campaign extract and the DONE riders. Follow the planner's specific lease for the Statuspage component-history slice of acceptance 1.
2. Inspect `src/core/features/statuspage-import/rows.ts` and the native history route. Extend the existing reviewed saved-capture journey with a monitoring change, original publication instants that differ from write times, and a distinctly dated unaffected component. The implementation already preserves this behavior.
3. Resolve saved incident and component identities independently against native incident and component inventories. Check the complete original wording, lifecycle and publication-instant association on the matched incident. Use the native component IDs for the history reads and the native incident ID for the expected cause.
4. Read the full native history at two rows per page. The selected component has three incident transitions and one creation baseline across two pages. The unaffected component has only its own creation baseline. The same test retains reviewed-fingerprint refusal, revoked-session refusal, silent replay, Cutover and scheduled-drain checks.
5. Run the touched file, typecheck and first-party check. Generate and check the contract views, take both view files from main, regenerate the source lock last and verify freshness. Publish the exact product candidate and return this packet through its evidence ref.

## Runtime proof

PROBE MOVE-002 1: reviewed Statuspage capture and native component history at two entries per page -> exact incident transitions at original publication instants, and only the creation baseline for the unaffected control.

The selected component's source creation fact was Operational → Operational at 2026-01-01T00:00:00.000Z. Its matched native incident caused Operational → Partially unavailable at 2026-01-11T08:54:03.201Z, Partially unavailable → Degraded performance at 2026-01-11T10:02:41.302Z and Degraded performance → Operational at 2026-01-11T10:27:19.405Z. The control's only history fact was Operational → Operational at 2026-01-04T12:34:56.789Z, with a standing-claim cause and a null cause ID. The route returned native newest-first order, with no repeated history identities or leftover cursor.

## Acceptance and rider record

| Outcome | Exact-candidate proof or remaining boundary |
| --- | --- |
| Acceptance 1, Statuspage saved capture | `tests/e2e/statuspage-import.test.mjs` lines 27–132 and 236–243. Native saved-message and complete component-history readback passed locally. The remaining provider and source-history matrix remains held. |
| Acceptance 2, past maintenance and notification invariance | Existing notice and notification checks remain at lines 308–327 and 501. The complete maintenance and notification matrix remains held. |
| Acceptance 3, silent preview, apply, resume, job and Cutover | Existing reviewed apply, Cutover, repeat and scheduled tick assertions remain. The complete concurrent resume and mail-silence matrix remains held. |
| Acceptance 4, pending email | No new coverage claimed for the held pending-email matrix or the separate invitation release. |
| INCIDENT-009 inherited duty | Acceptance 1 names the duty directly. The Statuspage history assertions check it on the native read door. The lease does not cover the broader public and uptime proof matrix. |

| Rider | Observation |
| --- | --- |
| 1 | The native journey covers the leased slice. The remaining acceptance outcomes stay held. |
| 2 | A populated target and unaffected control reconcile exact rows, page sizes and original instants. |
| 3 | Push Verify includes the imports shard through `scripts/verification/plan.mjs`. The CI receipt records the exact run. |
| 4 | Local tests passed on the exact candidate. |
| 5 | Acceptance 1 cites the INCIDENT-009 duty. |
| 6 | The generator and freshness check exited zero. The recorded judgment remains PARTIAL. |
| 7 | The acceptance text and other contract cells match main. |
| 8 | The active journey retains revoked-session and altered-fingerprint refusals. |
| 9 | The proof exercises a synthetic saved response in the local Worker. |
| 10 | The work required no policy decision. |
| 11 | Exact-main equality, the full-history publication scan and Run site await the guarded lander. |

The pre-handoff audit found no removed assertion or width-dependent change. The native request covers the changed outcome without changing a screen. Review and repeated-import notification assertions remain active, and the helper is unchanged. Erasure, the held MOVE-004 undo remainder and the held Sorry invitation release stay with their existing scopes.

## Checks

Push Verify completed successfully on the exact candidate. Run 44863297740.

Candidate Run site and the full-history publication scan await guarded landing. The cloud observed main at the recorded base SHA.

The touched test file passed all three registrations on the exact candidate. Typecheck, first-party checks, the contract generator and source-lock freshness all passed. Main at the recorded base had completed successful push Verify 44861397097 and push Run site 44861397172.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Plan row for the lane

MOVE-002 stays PARTIAL. Record completion of acceptance 1's Statuspage component-history slice against the candidate above. Keep the remaining source-history matrix and acceptances 2–4 held. No complete numbered acceptance point is claimed. The supplied plan extract was used without rebuilding the plan.

CLAIM MOVE-002 PARTIAL points=none tests=tests/e2e/statuspage-import.test.mjs#SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes

GAP MOVE-002: Acceptance 1's remaining source-history matrix, acceptance 2's complete maintenance and notification invariance, acceptance 3's complete preview, apply, concurrent resume, job and Cutover silence, and acceptance 4's pending-email matrix remain held.
