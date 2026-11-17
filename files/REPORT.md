# gr-mt-lamp-code-10 — demo label sanitization review

Run Edit Run fleet, 17 November 2026.

Result: **no-change**. The reported dynamic-code pattern is already absent from current main. No product commit, product push, PR, contract edit or alert dismissal was made.

Repository: just-every/run-lamp. Local branch: `cloud/gr-mt-lamp-code-10`. Inspected HEAD and freshly fetched main: `cb6f9af49f440380caeca1722bac8fb7b7815699`. The clone is clean at `/home/agent/rer-consolidation/work/maint/gr-mt-lamp-code-10/repo`. The required local maintenance result is `/home/agent/rer-consolidation/work/maint/gr-mt-lamp-code-10/result.json`; its identical packet copy is `result.json`.

## Plan and outcome

1. Initialize fleet identity, launcher, credential helper and hook forwarding; clone only the declared product repository and read its instructions, requirements and testing guidance. Completed. No secrets enter this packet.
2. Inspect `modules/demo/label.mjs`, its callers, CSP helpers, navigation metadata handling and Git history. Determine whether a code fix remains necessary. Completed: current source already avoids dynamic JavaScript generation from label values.
3. Exercise the actual `decorateLabel` Response boundary in Chromium with ordinary and hostile values; run the touched-module syntax check and TypeScript check with pinned Node/pnpm. Completed: final focused probe, syntax and typecheck pass.
4. Retain the no-change maintenance result and full non-secret report/receipt packet, then publish reports only to `evidence/gr-mt-lamp-code-10`. No product branch publication or landing claim is appropriate because there are no new product commits.

## Investigation

`modules/demo/label.mjs:10` defines the title observer as constant JavaScript. `decorateLabel` selects only the literal `Demo` or `Dev`; other mode input becomes `Dev`. The suffix reaches the observer through a `data-rer-label` attribute, not executable interpolation. The observer writes `document.title`, a text sink. Its suffix-removal regex is display formatting, not a security sanitizer and not a source passed to eval or another code interpreter.

For demo exits, `exit.name` and `exit.url` are HTML-attribute escaped by encoding all ampersands, angle brackets and quotes. Navigation code is also constant. It reads metadata through `dataset`; product text reaches `textContent` and DOM attributes. The label function grants the exact generated script and style hashes in CSP without enabling unsafe-inline.

History independently shows the transition from script interpolation to the constant script in `0e6cbfe073cd3fd799ce7d810dfd56664905282a` (16 October 2026), retained in `c640a4c2e7cba77a67cfc51a97864e8f66ddb92b` and current main. This supports an already-remediated source conclusion. It does not assert GitHub has marked alert 8 fixed.

The alert endpoint `gh api repos/just-every/run-lamp/code-scanning/alerts/8` returned HTTP 403, `Resource not accessible by integration`, on all five bounded attempts, with launcher refresh and bundle re-read between retries and backoffs of 15, 45, 90 and 150 seconds. Actual response and attempt receipts are `alert.json` and `alert-access.json`. No alternative credential was sought. Six GitHub API calls were used in total: five alert attempts and one exact-SHA CI discovery.

## Validation

- `pnpm install --frozen-lockfile`: exit 0; no tracked dependency files changed.
- `node --check modules/demo/label.mjs`: exit 0 on Node 22.20.0.
- `pnpm typecheck`: exit 0, recorded in `typecheck.txt`; pnpm 10.12.4.
- `LAMP_CHECKOUT=<clone> LAMP_PROBE_EVIDENCE=<packet> node --test --test-concurrency=1 <packet>/label-probe.test.mjs`: exit 0, 1 test passed. The actual reproducible probe and TAP output are included. Four data cases exercise Demo with hostile metadata, Demo with different metadata, Dev, and a hostile mode string. Assertions run at 1440 pixels and verify script count, no attack sentinel execution, literal metadata, unchanged host text, CSS suffix, constant executable bytes across metadata changes, matching CSP hashes, route-title changes, empty titles, idempotent decoration and non-HTML passthrough. Browser and contexts are closed in the probe.
- `label-1440.png` and `label-390.png` show the synthetic Response fixture at both widths. They are fixture evidence, not a claim about a deployed product screen.
- The initial probe timed out because it waited for visibility of a deliberately concealed demo-exit anchor in the minimal fixture. Only that probe wait was corrected to attachment; no product source changed and no security assertion was weakened. The original failed receipt is retained as `label-probe-initial.tap`.
- Existing exact-SHA main Verify run **44081744764** is completed/success for `cb6f9af49f440380caeca1722bac8fb7b7815699`: https://github.com/just-every/run-lamp/actions/runs/44081744764 . CI discovery is retained as `ci-runs.json`; another Verify, 44077792584, and Run site 44081744670 also succeeded on that SHA. No workflow was dispatched or rerun.
- Fresh `git fetch origin main` retained the inspected SHA; `git merge-base --is-ancestor 0e6cbfe073cd3fd799ce7d810dfd56664905282a origin/main` passed; working tree and diff against main are empty.

## Counts, clauses and publication

Product files changed: **0 → 0**. Product commits created: **0**. Product test registrations added: **0 → 0**. Standalone evidence probe registrations: **1**, passing, with four data cases. Full-target generated clause counts remain **60 done / 129 partial / 55 missing / 244 total**. No clause status, gap, evidence or acceptance text changed; no CLAIM line is made for this maintenance review. Generated views and source lock remain untouched.

No product public push was attempted, so no product publication scan, branch Verify request or READY/PUSHED claim is made. Only the explicitly selected report packet is transferred through the supplied evidence entrypoint. Report publication is separate from product custody and does not signal landing.

## Remaining action and default

There is no code blocker on the inspected tree. The integration cannot inspect or dismiss the code-scanning alert. Default: retain `no-change` based on source history and the passing hostile-input probe; a maintainer with security-alert access can review alert 8 and dismiss a stale finding if appropriate. No new product branch or PR is required for this result. All processes started by this task have completed or were closed by the probe; no dev server was started.
