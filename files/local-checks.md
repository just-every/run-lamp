# Local check receipt

Candidate 3db51500377b756a4d5a06f7b7b076f00e2e7b0c

Node v22.20.0, pnpm 10.12.4, system Chromium.

| Command | Exit | Outcome |
| --- | --- | --- |
| `pnpm run build:app` | 0 | Built the production Worker required by the existing journey. |
| `node --test --test-concurrency=1 tests/e2e/auth-adoption-journey.test.mjs` | 0 | Both tests passed against the candidate tree. |
| Focused missing-secret test on the committed SHA, with a synthetic value set only in the parent environment | 0 | One test passed. The child still refused the missing variable. |
| `pnpm typecheck` | 0 | TypeScript passed. |
| `pnpm exec rer check --profile first-party` | 0 | First-party check passed. |
| `node src/base/contract-docs.mjs write` and `node src/base/contract-docs.mjs check` | 0 | Zero generated documents changed. The check also passed on the commit. |
| `node scripts/edition-authoring/cli.mjs lock` and `node scripts/edition-authoring/cli.mjs check` | 0 | Regenerated the touched test hash. The check also passed on the commit. |
| `git diff --check` and staged diff review | 0 | Only the test and the matching source hash changed. |

Changed-file test output

```text
ok 1 - remote terminal sign-in refuses a missing environment secret before invoking Wrangler
ok 2 - SETUP-002 ACCESS-001 TEAM-002 native rer setup, owner sign-in, invitations and deliberate sign-out
# tests 2
# pass 2
# fail 0
# duration_ms 165510.942395
```

The initial full-file attempts reached the new refusal test and failed at the existing setup journey because a shared production build was absent. After building the Worker and placing the test scratch directory on the workspace volume, the entire changed file passed.
