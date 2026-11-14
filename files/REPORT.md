# gr-mt-lamp-code-13

Repository: just-every/run-lamp
Branch: cloud/gr-mt-lamp-code-13
Candidate: 6a3fe92809524f6463f98454cd72af0cd8724100

## Plan

1. Initialize fleet identity, launcher credentials, Git helper and preserving commit hooks.
2. Read the edition instructions and the status-feed conversion and call sites.
3. Reproduce malformed nested tag leakage through the public status-feed read function with only the network boundary controlled.
4. Make tag removal converge, preserving ordinary message formatting and decoding encoded literals after removal.
5. Run touched tests and typecheck on the pinned Node/pnpm toolchain, compare retained real-feed output, regenerate/check the source lock, then commit.
6. Run Base's publication scanner against the exact committed tree and full history. If complete/pass, publish the named product branch using the guard and open its required PR. Read exact-SHA Verify via the constrained REST watcher.
7. Preserve actual reports/receipts outside the product tree and publish an explicit file selection to the separate evidence ref. Return branch, SHA, CI outcome and remaining limitations for fleet landing.

## Product change

- `src/core/platform/status-feeds/xml.ts`: remove innermost tags repeatedly until stable; each successful pass shortens the string. Decode entities afterwards so encoded angle brackets remain literal message text. Existing whitespace, line-break and paragraph conversion is retained.
- `tests/e2e/site-reader-security.test.mjs`: one registration exercises public `readStatusFeeds()` with malformed nesting, ordinary markup, quoted attribute angle brackets, line and paragraph breaks, and encoded literals through a synthetic Instatus transport.
- `sources.lock.json`: regenerate the two touched source/test identities using the documented authoring command.

The new regression failed on the original implementation: `ipt>Service restoredipt>.` instead of `Service restored.` It passes on the committed fix. Every one of the 16 captured Instatus entry conversions remains byte-for-byte equal to main's previous output.

## Local results

Node 22.20.0; pnpm 10.12.4. Frozen dependency installation passed. The supplied toolchain initially selected the VM's newer Node 24; Node 22.20.0 was installed explicitly and all final touched checks were repeated with it.

- `node --experimental-strip-types --test --test-concurrency=1 tests/e2e/site-reader-security.test.mjs`: 2 passed, 0 failed.
- `pnpm typecheck`: passed.
- Retained Instatus feed conversion comparison: 16 entries matched main.
- `node scripts/edition-authoring/cli.mjs lock`: passed.
- `node scripts/edition-authoring/cli.mjs check`: passed.
- `git diff --check`: passed.

Focused test registrations: 1 before, 2 after. Regression failure count: 1 before the fix, 0 after. No tests deleted, skipped or weakened. No UI change or browser proof required. No contract clauses, statuses, gaps, evidence cells or generated views changed; clause status changes: 0. No CLAUSE claim is made by this maintenance fix.

## Limitations

The integration cannot read code-scanning alert 17: `gh api repos/just-every/run-lamp/code-scanning/alerts/17` returns `Resource not accessible by integration (HTTP 403)`. Bounded retries refresh and reread only the injected bundle. Alert closure must be checked by the fleet with code-scanning permission after the new analysis; this report does not claim that CodeQL has closed it.

Publication, product custody, PR and CI results are recorded in the accompanying actual receipts and the final outcome appended below. No main/default branch is pushed or landed by this task.

## Publication scan retry

The pinned Base scanner is present in `@runeditrun/rer@0.2.108`; its required Gitleaks 8.30.1 was installed in a temporary tool directory. The first exact-tree/full-history scan hit its documented 300-second default and returned INCOMPLETE with `scan.deadline-exceeded`; the actual envelope is retained as `publication-scan-initial.json`. The same unchanged candidate is being scanned with the supported 1200-second timeout. No incomplete scan authorizes a product push.

The longer scan of the first unpublished commit was explicitly interrupted when a valid quoted-attribute case was added to the fix and regression table. That superseded scan's INCOMPLETE envelope is retained separately. The final candidate retains quoted angle brackets within tags and is rescanned from its own SHA. No published history was rewritten.

Alert access used one initial request and five bounded follow-up requests, all denied with the same HTTP 403 despite launcher refresh and bundle reread. No alternate credentials were sought. Six of the task's ten direct GitHub calls were spent on this access check; remaining direct calls are reserved for the required PR and exact-SHA CI outcome.

## Publication result

The final exact candidate returned COMPLETE/PASS, zero blocking findings, 50 pre-existing findings, zero warnings. The scanner inspected 1120 commits, 1103 trees and 8524 blobs against the public main baseline. Full history was scanned; no environment file was selected and visual recognition was not performed. Actual scanner envelope and compact receipt are retained separately.

Contract clause headings remain 244 before and after. Contract status-table counts remain unchanged: {'partial': 129, 'done': 60, 'missing': 55}.

## Product custody

The guarded first push succeeded on attempt 1 to `cloud/gr-mt-lamp-code-13` at `6a3fe92809524f6463f98454cd72af0cd8724100`. The complete candidate range has fleet author/committer identities and no trailers. Exact-SHA push Verify run: 43557108547, https://github.com/just-every/run-lamp/actions/runs/43557108547. One REST watcher polls at most every 300 seconds; its actual responses are retained in `ci-runs.json`. The PR will be opened after the push check settles so the existing reuse contract can avoid repeating green verification.

The recovery bundle is outside the product clone at `/home/agent/rer-consolidation/work/gr-mt-lamp-code-13/gr-mt-lamp-code-13.bundle`, verified, SHA-256 `9b49bd520b49e7d58af732c87319d41f17572f66748ff362ae82e12f58dc905c`. It is recovery data and is not a READY claim. A compact receipt is selected for report transport; the bundle itself is not placed on the evidence ref.

## Final outcome

PUSHED branch=cloud/gr-mt-lamp-code-13 head=6a3fe92809524f6463f98454cd72af0cd8724100

PR: https://github.com/just-every/run-lamp/pull/372
Exact-SHA Verify run 43557108547 remained `in_progress` with no conclusion at the discovery, five-minute and ten-minute reads. The single watcher has finished. All ten direct task GitHub calls are used (six alert-access requests, three CI requests, one PR creation). No workflow was rerun or dispatched. No red check was observed; pending verification is not a green result. The fleet must read the eventual exact-SHA result before landing. No READY, acceptance or main landing is claimed.

Product work is complete locally and pushed. Code-scanning alert closure remains unverified because the integration lacks access. No clause status change is claimed. The full report, local receipts, actual CI responses, PR receipt and value-free publication scanner envelopes are selected explicitly for the separate report-only evidence ref. Credentials, raw bundle contents, environment values and private held-out material are excluded.
