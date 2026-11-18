# Lamp PAGE-001 maintenance proof

Run Edit Run fleet, 18 November 2026. Task `sd-lamp-c-f141-pc1` for `just-every/run-lamp`.

- Candidate branch `cloud/sd-lamp-c-f141-pc1` at `f6138a6eb6cbe223968819b0f8a426997d97cb41`.
- The first parent is the saved `a0aa52ef4b8c3e76cd560a1fc2286b9ed80fad03`. The second parent is main at integration, `4e97e8985ac870576ccaf3cf3a54332140c7e7d7`. The push advanced only the named branch and used no PR.
- Clause accounting against integrated main stayed at 62 done, 127 partial, 55 missing, 244 total. PAGE-001 stayed PARTIAL with acceptance 3 proven by this round. Test inventory moved from 112 to 113 registered cases and kept 10 assertion scripts, for 123 checks on the candidate.
- Plan row `CLAUSES="PAGE-001"` in the planner's replan 31 gains initial HTML and permalink proof for acceptance 3. The complete outcomes in acceptances 1, 2 and 4 remain held. PAGE-005 retains rebuild triggering. No policy default was needed.

## Plan and result

1. Read the PAGE-001 clause and Gap, the planner's point selection and DONE-RIDERS, and the public snapshot renderer. In `src/core/features/public-snapshot/renderer.ts` lines 190–191, the root filters in-progress windows and scheduled starts up to and including generation time plus fourteen days. Line 274 renders native permalinks for the full maintenance collection independently of the root filter.
2. Resume the existing public-door journey. Publish five independently specified windows via the operator maintenance API in a disposable Worker using `tests/e2e/helpers/automation-clock-worker.ts`. Start two through the native action and advance the Worker clock one minute between publication generations. Confirm that the three future windows have no links on the earlier response. Reconcile the complete native record inventory and match the resulting raw anonymous root HTML to the fixture. Require exactly four entries with their own lifecycle, start and end times, named component, submitted impact and native link. The start one millisecond beyond the horizon is absent from the root and still readable by permalink.
3. Open all five native permalink responses anonymously and match the exact generation header, title, lifecycle, times, component and submitted impact. Capture the root and click the boundary window's link with scripts disabled at 1440 and 390 pixels. The four images in the packet correspond to those two pages at both widths.
4. Preserve the existing refresh response check in `tests/e2e/public-contract.test.mjs` lines 839–850. It publishes and starts a separate window and reconciles the in-progress record and the refresh field set from the public status API. The final tree updates the public test and source lock. Its contract source, generated views, public renderer and visual files match integrated main.

## Acceptance evidence

| Point | Result | Evidence on the candidate |
| --- | --- | --- |
| 1 | Held | Complete visible component names, current states and exact notes are outside this lease. Existing catalogue assertions remain in the public test. |
| 2 | Held | Complete unresolved incident inventory, five most recent updates in order and each permanent timeline remain outside this lease. |
| 3 | Pass | `tests/e2e/public-contract.test.mjs` lines 41–147 drives the native APIs. Lines 49–99 prove the two actual snapshot generations and exact five-window inventory. Lines 100–147 reconcile raw HTML and all native permalink targets. Lines 839–850 retain the public refresh proof. |
| 4 | Held | Complete per-visible-component uptime figures and daily records are outside this lease. |

PROBE PAGE-001 3: Anonymous GET of the initial page at the 2031-02-10T16:00:00.000Z generation -> both in-progress windows and starts at fourteen days minus one millisecond and exactly fourteen days appeared. The next millisecond was absent. All five native permalinks resolved with the expected window and wording.

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Pass for point 3 | Native writes, initial HTML and permalinks at public test lines 41–147. Points 1, 2 and 4 remain held. |
| 2 | Pass for point 3 | Names, window times and impact come from submitted fixture values. The journey compares complete record and link sets and exercises both sides of the cutoff. |
| 3 | Pass | `test:public` is registered in the composer shard of `scripts/verification/plan.mjs`. Verify 44284726458 (push) completed with success on the exact candidate SHA |
| 4 | Pass for point 3 | Focused runtime and browser proof began 2026-11-18T10:21:50Z on the exact committed candidate. The committed public-contract file passed all 7 tests. |
| 5 | Pass for point 3 | PAGE-001 acceptance 3 names the maintenance inclusion duty directly. |
| 6 | Pass for builder mechanics | Generated contract documents checked successfully before restoration and again on the committed tree. The existing PARTIAL judgment, Gap and Evidence remain from integrated main. |
| 7 | Pass | Acceptance text and status cells are identical to integrated main. |
| 8 | Outside scope | The added public proof uses read-only anonymous access after permitted native fixture writes. It changes no permissions. |
| 9 | Outside scope | Local Worker, database and snapshots exercise the public door with no provider or legal claim. |
| 10 | Outside scope | No policy decision or interim default. |
| 11 | Pending guarded landing | The candidate is advertised on the cloud branch. Main equality, full-history publication scan and Run site on the resulting main commit are the lander's gates. |

## Local and CI checks

- Pinned Node 22.20.0 and pnpm 10.12.4 ran the build, typecheck, first-party check and contract and source-lock checks. The focused case passed with four script-disabled screenshot captures. The committed public-contract file passed all 7 tests.
- The initial push Verify `44252464395` completed cancelled on the saved SHA. Job `134626709777` was cancelled and the aggregate job `134645288642` failed. The requested workflow log archive commands for those jobs returned exit 0 with empty output.
- Local replay of the original composer command exited 1. The system Chromium fetched an additional favicon in the existing THEME-001 transfer-budget case. The same case failed with the same five paths on unmodified main `20780c29021042daea1b98f34c60d6caf3188f89` on this VM. The local replay's public group passed all nine tests, including the saved PAGE-001 proof. Verify `44279625303` then completed success on that same saved product SHA through the continuation branch.
- Candidate Verify 44284726458 (push) completed with success on the exact candidate SHA. The changed lines contain zero email-shaped strings and zero bare two-segment slash references. The candidate diff retains existing assertions and scopes the new evidence to page listings and permalinks. The exact product publication scan awaits the Mac gate. Run site runs on main.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM PAGE-001 PARTIAL points=3 tests=tests/e2e/public-contract.test.mjs#PAGE-001 — initial HTML lists all active maintenance and includes the fourteen-day boundary

GAP PAGE-001: Acceptances 1, 2 and 4 still need the complete visible component, state and note inventory, unresolved incident and five-update timeline inventory, and each component's uptime figure and daily records.
