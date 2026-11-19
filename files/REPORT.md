# Lamp durable mail retry recovery

Run Edit Run fleet, 2026-11-19. Task `gr-mt-lamp-issue-1`.

## Scope and plan

1. Recover the published fixture repair and the durable retry replay referenced by PR #289.
2. Apply the replay to current main and reproduce the reported failure with the original fixture.
3. Apply the preserved Worker clock repair, assert that early Cron replay sends nothing, and retain frozen-envelope and provider acceptance assertions.
4. Run the touched journeys and typecheck. Generate and check contract views, restore the inherited view files, then refresh and check the source lock.
5. Scan the exact committed tree, publish the named branch, and verify its exact SHA in CI.

## Provenance and result

- Repository `just-every/run-lamp`, branch `cloud/gr-mt-lamp-issue-1`, main base `b3af16fb7270dc281f80112a21e1b1aa07c66e6f`.
- Product head `26af59286994b5690050cbd6a4fab394b07e81df`, tree `868af4d3a30dfe14c4c61b214896ee8484f600d3`. Custody **PUSHED**. The exact-head Verify result is recorded in the terminal handoff.
- Original failure on Verify run [41427562151](https://github.com/just-every/run-lamp/actions/runs/41427562151) for PR [#289](https://github.com/just-every/run-lamp/pull/289), head `be20f724e5bd71b24a2019c925c5e8c4c74d90d0`.
- Durable retry replay recovered from `b230f541de4a00168670888ce74e1fdad91bb16e`. Preserved fixture repair recovered from `34bfbf8d19419f186726b93be4bb814a20925284`.
- Main lacked the durable retry replay. The candidate carries that replay with the preserved test clock adapted to current main's shared mail-worker build helper and a new early Cron assertion.
- Before the fix, the recovered durable replay plus the original fixture failed `assert.ok(accepted.providerAcceptedAt)` at `tests/e2e/rer-mail.test.mjs:157`. Setting the outbox deadline left the independently persisted subscriber attempt ineligible.
- After the fix, the same journey passed for RER, Resend and SendGrid. The isolated Worker clock advances three minutes after an early Cron invocation proves provider silence. The retry submits the same complete envelope after branding changes and records provider acceptance. The subsequent Cron replay remains silent.
- The first cloud head's broader delivery run found a second fixture that treated Queue redelivery as immediate. The subscriber deactivation fixture now advances to each persisted Queue deadline and preserves the outcome, alert, suppression and deletion assertions. The shared incident-reach fixture also advances to each persisted Cron deadline. Its former fixed increments stopped before the last eligible retry.
- The superseded Verify [44508717546](https://github.com/just-every/run-lamp/actions/runs/44508717546) ran on head `0e4273b150cd7171caf43d24b4541ef7b1f39f2f`. Composer, runtime, public and aggregation failed. The composer archive identifies the shared incident-reach assertion. Both affected fixture paths were reproduced and corrected locally.
- Retry journey measured dispatch offsets of 0, 116129, 348387, 812903, 1741935 and 3600000 ms, and checked terminal failure against the original subscriber and update.

## Local checks

| Command | Result |
| --- | --- |
| `npx -y @runeditrun/rer setup --owner-email <redacted> --non-interactive` | Passed |
| `pnpm install --frozen-lockfile` | Passed |
| `npx -y @runeditrun/rer build` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test:mail` on the first head | 5 passed, 0 failed |
| `pnpm test:delivery` on the first head | 7 passed, 1 failed |
| Focused failing-subscriber journey on the corrected head | 1 passed, 0 failed |
| `pnpm test:delivery` on the final head | 8 passed, 0 failed |
| `node --test --test-concurrency=1 --test-name-pattern='AUTO-003\|Follow-ups' tests/e2e/update-reminders.test.mjs` | 1 passed, 0 failed |
| Incident-reach API journey before and after its clock correction | 1 failed before, 1 passed after |
| Incident-reach browser helper with system Chromium | passed |
| Final-head focused mail recovery and Follow-ups | 2 passed, 0 failed |
| `node src/base/contract-docs.mjs write` then `check` | Passed, zero documents changed |
| `node scripts/edition-authoring/cli.mjs lock` then `check` | Passed |
| `node scripts/verification/check-plan.mjs` and `git diff --check origin/main..HEAD` | Passed |

Node 22.20.0 and pnpm 10.12.4 were used for verification. Browser-backed tests used system Chromium.
The Base publication scan reported **PASS**, complete **true**, with 0 candidate findings.


## Contract and files

The clause totals stayed at 65 done, 124 partial, 55 missing, 244 total. Test inventory rose from 123 to 124 (113 to 114 registered cases and 10 assertion scripts).
NOTIFY-003 remains partial. Its original gap and evidence cells stayed intact. The supplemental replay proof is recorded in the contract prose.

CLAIM NOTIFY-003 PARTIAL points=1,2,3 tests=tests/e2e/delivery-contract.test.mjs#NOTIFY-003 — Durable exponential retry eligibility, exhaustion and replay silence

GAP NOTIFY-003: The inherited judgment still records exponential backoff timing over one hour as unasserted by the old cited evidence. The current replay provides separate timing proof for the judge.

- `CONTRACT.md`
- `sources.lock.json`
- `src/core/app/services.ts`
- `src/core/app/worker-lifecycle.ts`
- `src/core/features/deliveries/repository.ts`
- `src/core/features/deliveries/retry-policy.ts`
- `src/core/features/deliveries/service.ts`
- `tests/e2e/delivery-contract.test.mjs`
- `tests/e2e/helpers/automation-clock-worker.ts`
- `tests/e2e/helpers/clocked-status-journey.worker.ts`
- `tests/e2e/helpers/delivery-retry-flow.mjs`
- `tests/e2e/helpers/follow-ups-flow.mjs`
- `tests/e2e/helpers/follow-ups-queue-flow.mjs`
- `tests/e2e/helpers/mail-failover-flow.mjs`
- `tests/e2e/helpers/subscriber-failures-flow.mjs`
- `tests/e2e/helpers/update-reach-flow.mjs`
- `tests/e2e/rer-mail.test.mjs`
