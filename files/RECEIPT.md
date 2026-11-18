# UPDATE-011 execution receipt

Product branch `cloud/sd-lamp-c-f135` and head `ab2220b826a95332655ed162450d592c917d4963`.

The guarded Git push succeeded on attempt 1. The candidate identity and trailer check covered every commit reachable from the branch beyond main. The clone has full history. These refs were independently read back.

```text
ab2220b826a95332655ed162450d592c917d4963	refs/heads/cloud/sd-lamp-c-f135
177378a989a7496a2e3dc00ac9a43947efd7c031	refs/heads/main
```

The 1440 assertion run passed on Node 22.20.0, pnpm 10.12.4 and system Chromium. It ran against the same test bytes as the candidate. The final commit added only the regenerated lock after this run.

```text
node --test --test-concurrency=1 --test-name-pattern='compiled visual edits and the operator publication journey' tests/e2e/publishing-browser.test.mjs
ok 1 - INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
# tests 1
# pass 1
# fail 0
# duration_ms 425054.520828
557ee6d557305190d10ca09b1f48c2224540ff57307b13b40662f0185b7e1a16  tests/e2e/publishing-browser.test.mjs
c9bb421762b07f85b0b9e73c3569b229a8dc624a32a07d70feea15efb33e231e  tests/e2e/helpers/wording-findings-flow.mjs
```

The images are browser captures from that run. Widths are 1440 and 390 for each screen.

- Writing settings [1440](1440-wording-settings.png) and [390](390-wording-settings.png)
- Composer findings after dismissal [1440](1440-wording-findings.png) and [390](390-wording-findings.png)
- Published incident timeline [1440](1440-wording-publication.png) and [390](390-wording-publication.png)

```text
node src/base/contract-docs.mjs write exit=0
node src/base/contract-docs.mjs check exit=0
pnpm exec rer check --profile first-party exit=0
node scripts/edition-authoring/cli.mjs lock exit=0
node scripts/edition-authoring/cli.mjs check exit=0
pnpm typecheck exit=0
npx -y @runeditrun/rer build exit=0
Contract prose: 0 errors, 0 warnings.
Contract documents are current.
```

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Full-file local baseline comparison

The pre-commit full-file run and a freshly built worktree at `177378a989a7496a2e3dc00ac9a43947efd7c031` each ran the same seven-test file with Node 22.20.0 and system Chromium. Each had six passes and one existing THEME-001 failure. The current candidate’s focused UPDATE-011 registration passed with the final helper bytes.

```text
node --test --test-concurrency=1 tests/e2e/publishing-browser.test.mjs
Candidate full-file comparison
    Theme assets stay in the four-request budget: /assets/status-page.css,/assets/theme-header,/assets/mark.svg,/assets/status-page.js,/assets/favicon.svg
# tests 7
# pass 6
# fail 1
Main full-file comparison
    Theme assets stay in the four-request budget: /assets/status-page.css,/assets/theme-header,/assets/mark.svg,/assets/status-page.js,/assets/favicon.svg
# tests 7
# pass 6
# fail 1
```

## GitHub verification

Verify run 44246831525 completed successfully from the push for the exact product head. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44246831525)

```json
{
  "id": 44246831525,
  "event": "push",
  "conclusion": "success",
  "head_sha": "ab2220b826a95332655ed162450d592c917d4963",
  "html_url": "https://github.com/just-every/run-lamp/actions/runs/44246831525",
  "status": "completed"
}
```

The starting main SHA was `177378a989a7496a2e3dc00ac9a43947efd7c031`. Its observed Verify and Run site successes were 44242051847 and 44242052319 respectively. A candidate-specific Run site is pending a main push by the guarded lander.
