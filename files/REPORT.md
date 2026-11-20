# Lamp COMP-006 standing-claim verification

Run sd-lamp-c-f157, 2026-11-20. Repository https://github.com/just-every/run-lamp. Product branch cloud/sd-lamp-c-f157 at 9e74c634bfb20b08536ec79de37ed46f265ad075. Base main at 173e93d259f968daffd0148365c2b9a26c62e3e6.

## Plan and result

1. Read the COMP-006 clause and its main Status row, the Lamp ruling extract, and the DONE-RIDERS. Map the existing mixed-claim assertions in the public catalogue journey and the maintenance journey. The scoped outcomes to add are the claim-free baseline and the bounded native standing-claim set and clear.
2. Review the existing native route, component service and repository. The route accepts a nullable state and returns the selected component after the write (src/core/features/components/routes.ts:89). The service awaits recomputation and the public snapshot rebuild (src/core/features/components/service.ts:167). The repository upserts a non-null claim, deletes a cleared claim, and batches the claim and event writes (src/core/features/components/repository.ts:352). The existing behavior passed all scoped probes.
3. Use a fresh migrated Worker and a newly created visible component with no incident, maintenance or dependency attachments. Read the operator catalogue and the public component collection independently, matching the exact component ID across both. Set Degraded performance and then clear with a null state. Observe both readbacks against one monotonic ten-second deadline per successful write.
4. Run the touched file, typecheck and first-party check. Regenerate and verify the contract views, restore them from main, and regenerate and verify the source lock. Commit the journey and lock. Run the focused journey on the exact committed SHA outside push Verify and retain the TAP receipt.
5. Verify every candidate commit identity and message, push the named branch, check the advertised head and observe exact-SHA Verify. Return this report and the timing receipt through the dedicated evidence ref.

The candidate adds one test registration. The inventory went from 115 registered cases and 10 assertion scripts (125 checks) to 116 registered cases and 10 assertion scripts (126 checks). Existing assertions and the Verify entry point are intact. The test is in the public-pages shard via the existing test:public command. No product runtime correction was necessary.

The COMP-006 campaign row should record the new claim-free baseline and standing-claim timing proof. Before and after, COMP-006 remains PARTIAL. Recorded totals before and after are 65 DONE, 124 PARTIAL and 56 MISSING (245). The contract source and its status, gap and evidence cells retain main's judgments.

## Acceptance coverage

| Acceptance | Outcome | Evidence on the candidate |
| --- | --- | --- |
| 1 | An unresolved incident, in-progress maintenance and a standing claim can contribute their chosen state. Incident and maintenance attachments independently choose states per component. | Standing contribution observed in the new journey at tests/e2e/public-contract.test.mjs:56. The complete claimant and choice matrix is held. Existing mixed-claim and maintenance controls are at tests/e2e/public-contract.test.mjs:726 and tests/e2e/publishing-contract.test.mjs:822. |
| 2 | The most severe active claim wins. | Existing assertions at tests/e2e/public-contract.test.mjs:776 and :795 remain in place. Competing-claim adjudication is held by the planner. |
| 2 | A component without an active claim is Operational. | PASS. Fresh visible component in tests/e2e/public-contract.test.mjs:36 and :53. The operator read shows a null standing claim and Operational effective state. The public read shows Operational for the same ID. |
| 3 | Incident resolution, maintenance completion, attachment and detachment each recompute within ten seconds. | Held. Existing mixed-claim journey reads resolution and completion outcomes at tests/e2e/public-contract.test.mjs:783 and :814. These outcomes do not receive new timing credit. |
| 3 | A standing claim set and clear each recompute within ten seconds. | PASS. tests/e2e/public-contract.test.mjs:56 checks successful PUT acknowledgement and the same ID in both GETs. Exact-SHA external timing receipt recorded 21 ms for set and 19 ms for clear. |

CLAIM COMP-006 PARTIAL points=none tests=tests/e2e/public-contract.test.mjs#COMP-006 — a visible component reflects standing claim changes within ten seconds

GAP COMP-006: Complete claimant and per-component choice proof, competing-claim precedence adjudication, and ten-second timing for incident resolution, maintenance completion, attachment and detachment remain outside this lease.

## Runtime probes

PROBE COMP-006 2: Create an isolated visible component through POST /api/app/components, then GET /api/app/components and GET /api/public/v1/components -> the same ID has a null operator standing claim and Operational operator and public state.

PROBE COMP-006 3: PUT /api/app/components/:componentId/standing-claim with Degraded performance, then state null -> the operator standing claim and same-ID public state agree as Degraded performance after 21 ms and null with Operational after 19 ms on the candidate.

## DONE-RIDERS

1. Partial. The leased outcomes run through authenticated native and anonymous public reads. Full acceptance coverage remains held as listed above.
2. Pass for the lease. The new journey creates a real record and uses the exact ID with independent operator and reader requests at tests/e2e/public-contract.test.mjs:36. The baseline and set-to-clear sequence detect missing records, stale states and expiry.
3. Pass for the lease. Push Verify 44782942259 completed successfully on the exact candidate SHA. The local timing receipt was collected outside Verify on the same commit.
4. Pass. The timing receipt records 9e74c634bfb20b08536ec79de37ed46f265ad075.
5. Inspected. COMP-006 defines the native duty in its three acceptance points. The change asserts those native doors and takes on no additional Base duty.
6. Views passed local generation and check. Main's partial judgment and provenance are carried forward for the lander.
7. Pass. No acceptance text, rider, status cell or generated view is in the candidate diff.
8. Inspected. The test uses the existing authenticated operator write and anonymous read paths. The candidate adds no authority, erasure, replay or credential behavior.
9. Inspected. Verification uses the disposable seeded Worker with the existing synthetic mail edge for sign-in. The scope has no live provider or legal receipt requirement.
10. Pass. The change adopts no policy default.
11. Pending guarded landing. Main and the candidate are different SHAs. Candidate publication scan, main equality and Run site belong to the lander.

No screen or visual behavior was changed. No email-shaped value or bare owner and repository token was added to candidate text. No migration changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The publication scan is pending on the Mac lander. Candidate scan provenance: commit 9e74c634bfb20b08536ec79de37ed46f265ad075, complete unestablished, historyScanned unestablished, findings unestablished. The clone contains full commit history.

## Check receipts

- Exact candidate timing: see standing-claim-timing.tap. One test passed on Node 22.20.0.
- pnpm run typecheck: exit 0 on Node 22.20.0.
- pnpm exec rer check --profile first-party: exit 0.
- node scripts/verification/check-plan.mjs: exit 0, same CI wiring with one additional registered journey.
- Base main push Verify 44671292824 and Run site 44671292988 completed successfully on 173e93d259f968daffd0148365c2b9a26c62e3e6.
- Touched test file: 8 passed, exit 0. See public-contract-check.txt.

- Candidate Verify: push run 44782942259, completed with success on the advertised product SHA. See verify.json.
