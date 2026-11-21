# Lamp local verification receipt

Candidate: 553d1cdf26c3f491e23334727c250717881b9f56  
Initial local test commit: c38e792061971836a0e6bf4faa0f315fef169931

The rebase changed the source lock and the separate incident-brief test from main. The product, test helpers, and three directly edited browser suites were byte-identical.

| Check | Result |
| --- | --- |
| Frozen dependency install | Passed |
| TypeScript, Node 22.20.0 and pnpm 10.12.4 | Passed |
| Production Worker build, Node 22.20.0 | Passed |
| Contract document check | Passed with zero errors and zero warnings |
| Stable fixture patch ID | Source and replay both f5d3c28b0ad12feadd4d0726a52e24a3172931fc |
| Forced local Vite port collision, Node 22.20.0 | Two attempts. The first hit the occupied port and was stopped. The second served on a fresh port while the original listener stayed active. |
| Maintenance timezone browser suite | 3 passed |
| Unsaved work browser suite | 2 passed |
| Publishing browser suite, initial run | 5 passed. Operator roles hit a loopback fetch failure, the compiled publication journey needed a built Worker, and the theme journey needed the fallback Playwright browser executable. |
| Shared ingress fixture, initial supplemental run | The monitor evidence journey passed. Two other cases failed under the initial Node 24/proxy setup. The expanded invocation was stopped before it duplicated the scoped tests. |

After the production build, the operator-role and compiled publication journeys passed on retry. The system Chromium fallback made an extra favicon request in the theme test. That existing helper uses Playwright’s default executable, so its final retry uses the CI-pinned headless shell.

The local full publishing-suite retry used the Playwright-pinned Chromium headless shell because full system Chromium added a favicon request to the theme request-budget assertion. Theme passed with the pinned shell. Seven of eight cases passed in that full invocation. The operator-role case showed the same loopback fetch error in the combined suite and passed in the targeted retry.

Both supplemental ingress cases passed on retry with Node 22.20.0, a built Worker, and Chromium configured. The earlier monitor evidence case also passed.

After rebasing the unpublished commit, contract generation wrote zero view files. The contract and source lock checks, typecheck and real Vite collision check passed on the rebased checkout.

The isolated operator-role retry also passed on candidate 553d1cdf26c3f491e23334727c250717881b9f56 with the pinned headless shell. Every case in all three directly changed browser suites has a passing local execution across the runs.

The maintenance-timezone and unsaved-work suites were also repeated on the published candidate. All five cases passed in that invocation.
