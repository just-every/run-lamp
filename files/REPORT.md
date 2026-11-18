# Lamp PAGE-001 maintenance horizon

Run **sd-lamp-c-f141**. Product branch `cloud/sd-lamp-c-f141`, commit `a0aa52ef4b8c3e76cd560a1fc2286b9ed80fad03`, based on `177378a989a7496a2e3dc00ac9a43947efd7c031`. The remote advertised this exact candidate and base after the product push.

The plan's PAGE-001 row from sd-lamp-replan-31 is the only row addressed. Acceptance 3 is proven locally and the clause stays **PARTIAL**. Contract counts before and after are **60 done, 129 partial, 55 missing (244 total)**. Test inventory is **111 to 112 registered cases**, with **10 assertion scripts** throughout. No assertions were deleted, narrowed or moved behind a condition.

## Plan and results

1. Mapped the four acceptance points and the status gap against the current journeys. Applied the planner's acceptance-3 lease and retained the existing refresh and publication assertions.
2. Inspected the public renderer's existing active and upcoming filters at `src/core/features/public-snapshot/renderer.ts:190`. Used the existing controlled Worker and native maintenance create, start and collection routes to publish a five-window fixture. The fixture supplies expected titles, states, start and end times and listing membership independently of the renderer.
3. Advanced the actual Worker clock for the last native start. Reconciled the root's snapshot header and raw HTML timestamp, every maintenance article and link, and each anonymous permalink in the same generation. The outside window was absent from the root and present at its own permalink. Captured the root and boundary permalink with scripting disabled at widths 1440 and 390 on the exact candidate.
4. Ran contract document generation and its check, restored the generated views from main, refreshed and checked the source lock, ran the TypeScript and first-party checks and pushed through the fleet guard.

| Acceptance | Result | Door and evidence |
| --- | --- | --- |
| 1 | Partial, held | The aggregate public catalogue journey checks an overall status and representative markup. Exact reconciliation of every visible component's name, state and note remains outside the lease. |
| 2 | Partial, held | The aggregate journey follows a representative native incident link. Complete unresolved-incident inventory, five newest-first updates per incident and all permanent timelines remain outside the lease. |
| 3 | Local pass | `tests/e2e/public-contract.test.mjs:41–117` seeds and reads all five windows through native HTTP. Lines 78–104 reconcile the generation, complete raw maintenance article and link inventories, and the outside exclusion. Lines 106–115 open all five permanent pages and reconcile title, status, times and submitted customer impact. |
| 4 | Partial, held | The aggregate journey and existing uptime journeys have representative figures. The full daily and uptime records for every visible component in the initial response remain outside the lease. |

The scheduled starts in the fixture are 2031-02-24T15:59:59.999Z, 2031-02-24T16:00:00.000Z and 2031-02-24T16:00:00.001Z. The root includes the first two and both active windows. The two active windows started at 15:00 and 15:30 UTC on February 10.

The existing refresh response proof remains at `tests/e2e/public-contract.test.mjs:807–828`. It separately confirms the single in-progress maintenance item returned by the refresh endpoint. PAGE-005 still owns rebuild triggering. PAGE-002 still owns script-free presentation, and the implementation, documentation site, brand, adoption and release remain in their existing lanes.

## DONE-RIDERS

| Rider | Result | Evidence |
| --- | --- | --- |
| 1 | Partial | Acceptance 3 passes through anonymous native routes at lines 78–115. Full outcomes for points 1, 2 and 4 remain held. |
| 2 | Pass for point 3 | Five independently specified records are saved and read back at lines 50–76. Exact entry and link sets at lines 97–104 fail on omission, duplication or inclusion outside the horizon. Lines 106–115 catch mismatched permalink targets. |
| 3 | See CI result below | Verify runs the test through the composer shard and `test:public`. Browser capture is optional. The public assertions always run. |
| 4 | Pass for point 3 | The focused receipt and all four browser captures were generated after committing the candidate. |
| 5 | Inapplicable to this proof | PAGE-001 states the maintenance listing duty directly. The proof makes no inherited Base claim. |
| 6 | Mechanical pass, judgment pending | The documented generator and check passed. This lease leaves the Status table to the lander, so the prior gap and judgment provenance are still recorded in the candidate. |
| 7 | Pass | The candidate changes the test and source lock only. |
| 8 | Inapplicable | The existing owner writes create public synthetic maintenance. There is no change to permissions, customer data, erasure or replay. |
| 9 | Inapplicable | All proof uses the local Worker and native public HTTP. There is no provider or legal claim. |
| 10 | Inapplicable | The two Lamp rulings apply to NOTIFY-013 and SUB-018. This test adopts no policy default. |
| 11 | Pending lander | The candidate is on its cloud branch. Main remains at the base SHA. The full-history publication scan, exact-main confirmation and Run site are Mac landing gates. |

## Probe and mechanical checks

PROBE PAGE-001 3: anonymous GET of the root generated at 2031-02-10T16:00:00.000Z -> exactly two in-progress entries and two scheduled entries at fourteen days minus one millisecond and at fourteen days. The entry at fourteen days plus one millisecond is absent. All five native permalink responses match the fixture and generation.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

All seven tests in the touched file passed, including the existing aggregate journey with the refresh assertions. The focused test and typecheck also passed on the repository-pinned Node 22.20.0.

Identity and trailer checks found one fleet-authored, fleet-committed candidate with no trailers. No candidate email-shaped fixture strings were added. The publication scan receipt for this cloud branch is unavailable here (commit a0aa52ef4b8c3e76cd560a1fc2286b9ed80fad03, complete unestablished, historyScanned unestablished, findings unestablished). No product markup or controls were edited. The proof images show the public root and the boundary permalink during the same native journey.

CLAIM PAGE-001 PARTIAL points=3 tests=tests/e2e/public-contract.test.mjs#PAGE-001 — initial HTML lists all active maintenance and includes the fourteen-day boundary

GAP PAGE-001: The full visible component, state and note inventory (1), unresolved incident, five-update and permanent timeline inventory (2), and per-component uptime figures and daily records (4) remain held.

## Exact-SHA CI and custody

Verify run 44252464395 was triggered by the product push. It was still in progress on a0aa52ef4b8c3e76cd560a1fc2286b9ed80fad03 after 35 minutes of five-minute polling. Eight API observations were used, preserving the last two calls for required job identification and log retrieval if a failure had completed. Rider 3 is pending. The exact candidate is pushed, with local checks green. Run site and full-history publication scanning remain pending landing. There is no PR for this push-triggered candidate.

[Verify run 44252464395](https://github.com/just-every/run-lamp/actions/runs/44252464395)
