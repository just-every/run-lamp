# Lamp Verify composer shard split

Built by Run Edit Run fleet on 2026-11-19 UTC for sd-lamp-ci-composer-split-2.

| Item | Value |
| --- | --- |
| Repository | just-every/run-lamp |
| Branch | cloud/sd-lamp-ci-composer-split-2 |
| Product commit | 10521ddf507d798ad271c11b3a160dd72c7c498f |
| Rebased against main | 8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b |
| Published | 2026-11-19T16:07:01Z, one product push |
| Candidate Verify | 44562436254, push, attempt 1 |

No contract clause claimed; this is a CI shard split.

## Plan and changes

1. Inspect the planner, plan check, inventory, runner, aggregate and GitHub Verify workflow. Read timing data for recent successful exact-main runs. Use the established package command boundaries unless timings identify a file that needs separate scheduling.
2. Keep `test:composer` in `composer` and run `test:public` in `public-pages`. The existing `public` shard already runs `test:delivery`. Giving the new shard its own name preserves every other shard and command assignment.
3. Keep the workflow matrix, artifact names, aggregate and plan check driven by the shared plan. The existing static workflow conditions select browser and native runtime setup. Both split suites use the existing browser setup and neither requires the native runtime disk reservation.
4. Compare the full command multiset and verification inventory with main. Check that the aggregate accepts every planned receipt and fails independently if either of the split receipts is absent. Verify the contract renderer, restore its views and regenerate and check the source lock.
5. Publish the commit to the named branch and verify its exact-SHA push run. Publish this report and its receipts on the dedicated evidence ref.

The implementation changes `scripts/verification/plan.mjs` and its hash in `sources.lock.json`. It schedules nine test shards and one shared build. The requested dedicated split with every other shard assignment preserved increases the count from eight test shards to nine, exceeding the general eight-shard target by one.

## Baseline timing evidence

Exact-main Verify runs [44548523701](https://github.com/just-every/run-lamp/actions/runs/44548523701) and [44536998166](https://github.com/just-every/run-lamp/actions/runs/44536998166) completed successfully and skipped their build and shard jobs under the workflow's exact-SHA reuse rule. Their log commands both exited successfully with empty output. A log probe for historical rerun 44266529596 attempt 2 also returned empty output. The actual job rows and archive command outcomes are in `baseline-ci.json`. Historical command and shard timings could not be measured from those responses, so the split follows the brief's default package command boundaries.

## Local results

| Metric | Before | After |
| --- | ---: | ---: |
| Shared build jobs | 1 | 1 |
| Test shards | 8 | 9 |
| Planned package commands | 24 | 24 |
| Routine test files | 36 | 36 |
| Registered cases, including release qualification | 113 | 113 |
| Assertion scripts | 10 | 10 |
| Total verification checks | 123 | 123 |
| Full contract, Done / Partial / Missing | 65 / 124 / 55 | 65 / 124 / 55 |

Both plans passed `scripts/verification/check-plan.mjs`. Commands, files, registrations and assertion scripts matched. The aggregate accepted all ten synthetic completion records and rejected each missing split receipt separately. The pinned Node 22.20.0 and pnpm 10.12.4 build passed all nine steps, including typecheck and the application and site builds. Contract rendering and its check passed, with zero generated document changes. Source-lock verification and `git diff --check` passed. The fleet lander owns the exact-tree Base publication scan. The candidate used the fleet branch handoff.

The local `public-pages` suite passed all nine cases in 8m 00s. The local `composer` run had 12 passes and one failure. The first run's THEME-001 helper could not find Playwright's default browser. A second run with the required system Chromium completed in 8m 15s and reached the theme asset-budget assertion, which observed an extra favicon request. The same suite and assertion are present on main. These local timings are supplemental to the hosted CI measurements.

## Exact-SHA Verify

Verify [44562436254](https://github.com/just-every/run-lamp/actions/runs/44562436254) returned `completed` / `success` for `10521ddf507d798ad271c11b3a160dd72c7c498f`.

Elapsed time from run creation through the aggregate was 15m 21s.

| Shard | Result | Job duration | Verify step |
| --- | --- | ---: | ---: |
| ownership | success | 5m 31s | 5m 01s |
| portability | success | 4m 42s | 4m 11s |
| imports | success | 9m 00s | 8m 24s |
| composer | success | 10m 49s | 10m 10s |
| public-pages | success | 9m 13s | 8m 34s |
| delivery | success | 9m 40s | 8m 59s |
| public | success | 13m 53s | 13m 08s |
| runtime | success | 7m 49s | 7m 06s |
| demo | success | 5m 31s | 4m 56s |

Longest test shard was `public` at 13m 53s.
That was 1.64 times the mean completed shard duration.
The two split jobs differed by 1m 36s.
