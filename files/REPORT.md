# Lamp COMP-006 standing claims

Run sd-lamp-c-f158 · Codex · 20 November 2026

Candidate `e5f19b806298f48a4476406deecb59a9a14a5042` on `cloud/sd-lamp-c-f158`. Main at the final fetch was `173e93d259f968daffd0148365c2b9a26c62e3e6`. Main push Verify 44671292824 and Run site 44671292988 completed successfully on that main SHA.

## Plan and result

1. Read the full COMP-006 clause, its Status row, the previous continuation, and the planner's selected POINTS. Continue the f157 test at `9e74c634bfb20b08536ec79de37ed46f265ad075` and retain its route assertions.
2. Check the standing-claim route, component service and repository. The write route permits a nullable state, the repository upserts or deletes the same component's current standing claim and records the event in one batch, and the service recomputes its state and requests a public snapshot rebuild. The public read uses the ordinary snapshot route. The native probe passed with these production paths.
3. Exercise a fresh, visible component through the native operator route and anonymous public collection. Require literal expected values for initial state, set and clear, all by the same component ID. Begin each ten-second budget on receipt of the successful HTTP response, with acknowledgement-body parsing and both independent readbacks inside that budget.
4. Run the focused journey outside Verify on the committed candidate, the touched file, typecheck, the first-party check and the generated-view and source-lock gates. Publish the candidate and report packet on their dedicated refs.

Plan row `CLAUSES="COMP-006"` from planner sd-lamp-replan-34 receives the continuation result. COMP-006 stays PARTIAL. Recorded counts before and after are 65 DONE, 124 PARTIAL and 56 MISSING, 245 total. The seed inventory changes from 115 to 116 registered cases relative to main, with ten assertion scripts in both. The round extends the continuation's existing registration.

The full touched file passed all eight cases. The exact-candidate focused journey, typecheck, first-party check, contract generation and source-lock validation passed on Node 22.20.0. LOCAL-CHECKS-RECEIPT.txt records these commands and results.

## Outcome map

| Acceptance | Outcome | Evidence |
| --- | --- | --- |
| 1 | Claimants and per-component choice | Standing-claim portion exercised. The complete claimant and per-component selection matrix remains held. |
| 2 | Most severe active claim sets state | Existing precedence assertions retained. Complete competing-claim proof remains held. |
| 2 | No active claim yields Operational | PASS. `tests/e2e/public-contract.test.mjs` lines 33–57 require the newly created public component's ID, literal null standing claim, and matching Operational operator and public states. |
| 3 | Resolve incident, complete maintenance, attach or detach | Complete ten-second matrix remains held. Existing assertions retained. |
| 3 | Set a standing claim within ten seconds | PASS. Same journey lines 59–85 accepts Degraded performance and reads the matching operator claim, operator state and public state in 30.0 ms. |
| 3 | Clear a standing claim within ten seconds | PASS. Same journey lines 59–85 accepts null and reads the matching null operator claim and Operational states in 41.8 ms. |

The named journey is “COMP-006 — a visible component reflects standing claim changes within ten seconds”. Push Verify invokes it through the public-pages shard via `scripts/verification/plan.mjs` and `package.json`. The independent exact-candidate run and its actual outputs are in STANDING-CLAIM-RECEIPT.txt.

PROBE COMP-006 2: Create an isolated visible component and GET its ID in the operator and anonymous public inventories -> null standing claim and Operational in both inventories.

PROBE COMP-006 3: PUT Degraded performance, then PUT null, reading the same ID in both inventories after each HTTP 200 -> Degraded performance in 30.0 ms, then null and Operational in 41.8 ms.

## DONE-RIDERS

| Row | Result | Basis |
| --- | --- | --- |
| 1 | Partial | The named journey executes the leased outcomes. The held claimant, precedence and timing outcomes above prevent a full-clause claim. |
| 2 | Pass for the lease | The journey creates a visible component, finds that exact ID independently in both inventories, and checks literal state transitions. |
| 3 | Overall Verify failed | Exact-candidate local timing and push public-pages job 136481688986 passed. The runtime shard failed in HIST-006. |
| 4 | Pass for the lease | The local timing receipt names the exact product candidate and its focused run. |
| 5 | Inapplicable | The leased native standing-claim proof invokes no additional inherited Base duty. |
| 6 | Pass for builder checks | Lander generation and check passed. The inherited Status, Gap, Evidence and judgment remain main's. The packet supplies the new proof. |
| 7 | Pass | Acceptance text and inherited judgments are identical to the fetched main. |
| 8 | Inapplicable | The authenticated write journey follows the existing authority path and changes only proof. |
| 9 | Inapplicable | Disposable native Worker and synthetic fixture. |
| 10 | Inapplicable | Existing policy and semantics. |
| 11 | Blocked | Exact-candidate Verify failed. The candidate remains branch-only. |

## Builder checks

- Existing registered assertions were retained. The new clock boundary includes acknowledgement-body parsing and rejects stale or late operator and public reads. Operator and anonymous reads exercise separate native paths for one identity.
- The product diff consists of the HTTP contract test and source lock. The screen, authority, erasure, replay and migration checks are inapplicable to this test-only change.
- Source lock validation and generated contract checks passed. Status, Gap and Evidence are identical to main. The added fixture introduces no email-shaped text.
- The full-history publication scan on the candidate is pending with the Mac lander. Scan completion, history scanned and findings are unestablished in cloud. Candidate trunk equality and candidate Run site are pending landing.

MECHANICAL lock=`node scripts/edition-authoring/cli.mjs lock` and `node scripts/edition-authoring/cli.mjs check` exit=0; views=`node src/base/contract-docs.mjs write` and `node src/base/contract-docs.mjs check` exit=0; ledger=none.

CLAIM COMP-006 PARTIAL points=none tests=tests/e2e/public-contract.test.mjs#COMP-006 — a visible component reflects standing claim changes within ten seconds

GAP COMP-006: Complete claimant and per-component choice proof, competing-claim precedence, and ten-second timing for incident resolution, maintenance completion, attachment and detachment remain outside this lease.


## Candidate Verify

Push run 44791792937 completed with failure on the candidate. The build and public-pages job 136481688986 succeeded. Runtime job 136481689008 failed in “HIST-006 — independent public readership produces private traffic alerts and recoverable owner actions”. Aggregate job 136488815914 recorded the runtime shard failure.

The assertion “traffic alerts publish no customer-facing incident or content” compared the entire public status payload. The expected generation was `2026-11-20T18:26:41.180Z`. The observed generation was `2026-11-20T18:32:00.000Z`. The status fields in both payloads matched. The fixture selects a minute based on the real hour and advances its Worker clock. Snapshot Cron can independently refresh a five-minute-old generation. Those source and test files are identical on the candidate and its main base.

The prescribed runtime reproduction used `pnpm verify` with `LAMP_VERIFY_SHARD=runtime`, the pinned Node, a local production build and cloud Chromium. It completed with exit 0 on the exact candidate. The targeted main control also exited 0. The round's Verify repair rule stops on a failure that the exact command cannot reproduce. The branch remains pushed and blocked. CI-RECEIPT.json records the Actions failure and both local results.
