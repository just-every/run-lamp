# Exact candidate checks

Product HEAD `d59fcf780c2764aad927417b9dfa2d11af9582b0`, branch `cloud/sd-lamp-c-f172`.

| Check | Result |
|---|---|
| `node src/base/contract-docs.mjs write` | Exit 0. Wrote 0 documents. |
| `node src/base/contract-docs.mjs check` | Exit 0. Contract prose had 0 errors and 0 warnings. Contract documents current. |
| `git checkout origin/main -- ACCEPTANCE.md docs/CLAIMS.md` | Exit 0. Generated files match main. |
| `node scripts/edition-authoring/cli.mjs lock` | Exit 0. Regenerated the test hash. |
| `node scripts/edition-authoring/cli.mjs check` | Exit 0. Returned ok=true after commit. |
| `npx -y @runeditrun/rer build` | Exit 0. Application built. |
| `pnpm typecheck` | Exit 0. TypeScript no-emit check. |
| `pnpm exec rer check --profile first-party` | Exit 0. |
| `git diff origin/main...HEAD --check` | Exit 0. |
| Candidate identity and messages | One candidate commit. Author and committer matched fleet identity. No trailers. |
| Guarded product push | Exit 0 on attempt 1. Remote advertised `d59fcf780c2764aad927417b9dfa2d11af9582b0` on the named branch. |
| Exact-SHA Verify 44866280564 | in_progress, conclusion pending, push event. https://github.com/just-every/run-lamp/actions/runs/44866280564 |

Browser executable Chromium 154.0.8037.57, Node 22.20.0 and pnpm 10.12.4. Both runs used `node --test --test-concurrency=1 tests/e2e/website-onboarding.test.mjs` with the 1,200-second hard limit and system Chromium. The 1440-pixel run used the default. The 390-pixel run set `LAMP_SETUP_VIEWPORT_WIDTH=390`. Both exited 0. Actual TAP receipts and the reviewed 1440- and 390-pixel setup images are attached.

No migration ledger check was applicable because no migrations changed.
