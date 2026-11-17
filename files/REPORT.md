# gr-mt-lamp-code-6: exception text response review

Author: Run Edit Run fleet (Codex), 17 November 2026.

## Outcome

**no-change**. The reported exception-to-HTTP response sink was already removed from the current default branch. This is an already-resolved source finding, not a claim that the historical CodeQL alert was a false positive. No product file, clause, test, source lock or generated view was changed.

Repository: just-every/run-lamp.
Local branch: cloud/gr-mt-lamp-code-6.
Reviewed main and local HEAD: cb6f9af49f440380caeca1722bac8fb7b7815699.
Product commits: none. Product push: none. PR: none. CI run IDs: none requested or claimed.

## Full plan and results

1. Configure fleet identity, refresh the declared launcher and install the decrypted-bundle Git helper and cloud push guard. Completed. Read launcher AGENTS.md, repository AGENTS.md, CLAUDE.md, TESTING.md, the inline RULES.md and relevant contract/source context. Created only the declared product clone and the prescribed local cloud branch.
2. Inspect tests/e2e/helpers/snapshot-proxy.mjs and trace its exception response and callers. The path is absent on current main. Historical inspection confirmed that the removed helper ended its HTTP error response with `response.writeHead(502); response.end(error.message);`, the sink named by alert 7.
3. Establish whether the issue is already resolved rather than recreate obsolete infrastructure. Completed: commit 97ff3d82bd155d372fa75141275fca2ab648088a, dated 28 October 2026, deleted the entire helper and its sole importer, tests/e2e/helpers/public-freshness-flow.mjs. The deletion commit is an ancestor of the reviewed main. Git tree checks confirm both paths are absent. A search of the exact current tracked tree found no snapshotProxy/snapshot-proxy references, original disconnect diagnostic, or original exception-response sink. Current retained-snapshot coverage uses the native Worker/status journey; its HTTP monitor returns a fixed `ok` body and does not forward exception text.
4. Apply a minimal fix only if a live vulnerable path remains. No edit was warranted. The brief explicitly allows status no-change after verifying the item is already fixed on the current default branch. No empty commit, product branch push, PR or workflow dispatch was created.
5. Verify and retain provenance. Thirteen source/history/tree checks passed, including a live Git main-ref probe matching HEAD, ancestor proof, expected missing-file checks, expected no-match searches, a clean checkout, an empty diff against origin/main and an empty candidate identity/trailer log. Full command outputs and exit codes are in source-review-receipt.json. Runtime tests, typecheck, dependency setup and browser proof were not run because this disposition changes no source and the affected helper and caller no longer exist. No UI was changed.
6. Attempt to corroborate GitHub alert state through the admitted credential. The initial request returned HTTP 403, `Resource not accessible by integration`. The required five-attempt bounded recovery re-reads refreshed injected credentials after 15, 45, 90 and 150 second backoffs; its actual final outcomes are recorded in codeql-api-receipt.json. All five reads returned HTTP 403, `Resource not accessible by integration`. This limits the ability to report GitHub's current alert status, and does not invalidate the directly verified source removal. No alert was dismissed or otherwise changed.
7. Write the required maintenance result.json and separate public evidence packet, review selected files for secrets, publish only evidence/gr-mt-lamp-code-6 using cloud_evidence.py, and report the resulting exact evidence ref/head. The terminal EVIDENCE line is the transfer receipt. Evidence publication is independent of product custody and does not signal READY, acceptance or landing.

## Counts and clauses

Current-main vulnerable helper occurrences: 0 before / 0 after this run.
Current-main symbol/caller references: 0 before / 0 after this run.
Historical vulnerable helper occurrences: 1 before the 28 October removal / 0 after it.
Changed product files: 0. New product commits: 0. Tests added/deleted: 0/0.
Clause status changes: none. No CLAIM is submitted for this maintenance disposition.
Existing generated target counts remain 60 DONE, 129 PARTIAL, 55 MISSING, 244 total; this run makes no new acceptance judgment.

## Commands and actual receipts

- `git rev-parse HEAD` and `git ls-remote origin refs/heads/main`: same full SHA above.
- `git cat-file -e <HEAD>:tests/e2e/helpers/snapshot-proxy.mjs`: expected exit 128, path absent.
- `git merge-base --is-ancestor 97ff3d82bd155d372fa75141275fca2ab648088a <HEAD>`: exit 0.
- `git show 97ff3d82bd155d372fa75141275fca2ab648088a -- tests/e2e/helpers/snapshot-proxy.mjs`: confirms full removal, including the vulnerable catch handler.
- `git grep` of the removal parent: identifies the sole old importer. The importer's current tree path is also absent (expected exit 128).
- `git grep` of the exact current tree for the helper, diagnostic and original sink: expected exit 1 (no matches).
- `git status --porcelain=v1`, `git diff --exit-code origin/main...HEAD` and the required `git log origin/main..HEAD --format="%an <%ae>%n%cn <%ce>%n%(trailers:only,unfold)"`: empty clean outputs, exit 0.
- `gh api repos/just-every/run-lamp/code-scanning/alerts/7 ...`: admitted credential only, no secret output; HTTP 403 outcomes in codeql-api-receipt.json. The API limitation is reported without claiming that the alert is closed.

Actual selected packet files: REPORT.md, result.json, source-review-receipt.json and codeql-api-receipt.json. The required local maintenance result is also saved at work/maint/gr-mt-lamp-code-6/result.json. The source clone remains available for the fleet's maintenance review. No server or browser was started.

## Remaining work and defaults

No product blocker remains for this alert's named source location. Default: accept the already-resolved no-change outcome; an authorized person can inspect alert 7 on GitHub if its displayed state needs reconciliation. Do not recreate or patch the deleted helper, make an empty commit, or claim a new exact-SHA Verify. No public product publication scanner was run because no product commit or push exists; the explicit report-only evidence transport publishes only selected report bytes.
