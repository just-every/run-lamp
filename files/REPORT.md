# Lamp PAGE-006 acceptance 2 repair

Task sd-lamp-c-f134-c1. Prepared by Codex at 2026-11-19T11:00:00Z.

- Repository: just-every/run-lamp
- Product branch: `cloud/sd-lamp-c-f134-c1`
- Product commit: `ea3a0059507fc4f14cab418c3b257b32f52df66e`
- Main at pre-push fetch: `b3af16fb7270dc281f80112a21e1b1aa07c66e6f`
- Replayed proof: `3a169770de1123dfc4aa2881f805bb07c0f137be`
- Prior failed Verify: [44504197898](https://github.com/just-every/run-lamp/actions/runs/44504197898), composer shard, retained-snapshot headline assertion.

## Plan and result

1. Fetch main and the rejected proof. Trace the rendered headline through the public snapshot renderer, the shared component label map, public-page documentation, Git pickaxe history, and the public contract tests.
2. Replay the two proof files on fresh main and correct the headline expectation. Regenerate the source lock as the final edit and check its integrity. Compare the replay with the rejected proof.
3. Build the application and run the retained-snapshot suite and typecheck. Confirm the contract documents are current and check the registration count. Refresh main immediately before publication and verify single-commit ancestry and candidate identity.
4. Push the one-commit candidate and wait for exact-SHA Verify. Publish this report and the actual receipts under the evidence ref after the product push.

`src/core/features/public-snapshot/renderer.ts` renders `#overall-status` through `componentStateLabel(overall)`. Commit [9d59bb5e663662fc900d2928dc9f4f725ea0d89b](https://github.com/just-every/run-lamp/commit/9d59bb5e663662fc900d2928dc9f4f725ea0d89b) introduced the shared `Major outage` → `Down` display mapping. `docs/public-page.md` uses the underlying outage state in uptime calculations. Main's `tests/e2e/public-contract.test.mjs` separately expects the API state `Major outage`, the badge display text `Down`, and the public headline `Down`.

The one assertion correction is at `tests/e2e/snapshot-retained.test.mjs:198`. The test still verifies the original fixture, the published generation metadata, the Atom incident and the widget payload. The worker is byte-identical to the prior proof. The regenerated lock changes the two test-file digests relative to main. The branch contains one linear commit, with exactly the test and worker plus the generated lock. This test-only change has no new screen to capture.

The existing journey passed. Before publication the page, Atom feed and widget return 503 with empty object storage, no retained replica, and no cached status. After the first publication, all three return 200 with generation 1's version and generation time. The page presents `Down`. The Atom and widget assertions verify the known outage. The retention journey also passed. See `SNAPSHOT-RETAINED.tap` for the complete local test output.

## Counts and clause

- Seed total before and after: 113 registered cases including release qualification, plus 10 assertion scripts, for 123 checks.
- Touched suite before and after: two registered cases.
- Contract before and after: 65 done, 124 partial, and 55 missing out of 244. The core tier is 65 done, 124 partial, and 50 missing out of 239.
- PAGE-006 remains partial. Acceptance 2 is proposed as proven. Acceptances 1 and 3 remain held, including acceptance 1's one-hour PAGE-007 origin-cache proof. The contract and both generated views are byte-identical to main.

CLAIM PAGE-006 PARTIAL points=2 tests=tests/e2e/snapshot-retained.test.mjs#THEME-001 PAGE-005 PAGE-006 PAGE-007 PAGE-018 — a published status survives storage, database and queue failures, cold restart and an independent heartbeat silence alarm

GAP PAGE-006: Acceptances 1 and 3 remain held, including acceptance 1's one-hour PAGE-007 origin-cache proof.
