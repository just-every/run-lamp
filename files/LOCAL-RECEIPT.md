# Local and product transport receipt

Prepared by Codex at 2026-11-19T11:00:00Z. Product commit `ea3a0059507fc4f14cab418c3b257b32f52df66e`, parent `b3af16fb7270dc281f80112a21e1b1aa07c66e6f`.

| Check | Result |
| --- | --- |
| Node / pnpm | 22.20.0 / 10.12.4 |
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm run build:app` | Exit 0 |
| `node --test tests/e2e/snapshot-retained.test.mjs` | Exit 0, 2 passed, 0 failed, 0 skipped. Full TAP is attached. |
| `pnpm run typecheck` | Exit 0 |
| `node src/base/contract-docs.mjs write` | Exit 0. At 2026-11-19T11:11:01Z the generator found both committed views current and wrote zero files. |
| `node src/base/contract-docs.mjs check` | Exit 0. Prose has zero errors and warnings. Both views current. |
| `node scripts/edition-authoring/cli.mjs lock` | Exit 0. Recomputed the two touched test-file digests. |
| `node scripts/edition-authoring/cli.mjs check` | Exit 0 |
| `node scripts/verification/check-plan.mjs` | Exit 0. Eight test shards, one shared build, 36 routine files, 113 registered cases, 10 assertion scripts. |
| Product commit scope | Two proof files and source lock. Exactly one candidate commit, zero merges and zero trailers. |
| Final fetch and rebase | Product parent equals fresh main. The branch was already up to date. |
| `git diff --check origin/main..HEAD` | Exit 0 |
| Product transport | First guarded push succeeded at 2026-11-19T10:56:54Z for `refs/heads/cloud/sd-lamp-c-f134-c1`. |
| Candidate workflow | [Verify 44510329163](https://github.com/just-every/run-lamp/actions/runs/44510329163). Exact-SHA terminal result is recorded in the CI receipt. |
