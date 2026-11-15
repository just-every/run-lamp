# gr-mt-lamp-code-15 — sign-in provider domain-rule assertions

Author: Run Edit Run fleet, 2026-11-15 UTC.

## Result and scope

Candidate branch: `cloud/gr-mt-lamp-code-15` in `just-every/run-lamp`.
Candidate SHA: `3b1e54edc2c33fdd2c5ca44bc948bb94579d12a1`.
Base main SHA: `f495b89afd9f6832e4d4807018d91fa4c4670147`.
Candidate tree: `22713a5cd0908ebe6d2120f4f1135d1ff11fa0a5`.

The code correction replaces both CodeQL-flagged substring assertions with exact comparisons of the parsed JSON `domain` field. The local ordered verification gates pass. Publication and exact-SHA CI custody are recorded separately below and in RECEIPT.json; they are not implied by the local result.

Files changed:

- `tests/auth-adoption/sign-in-providers.test.mjs:144` and `:153`: parse domain-rule responses with `json()` and test `rule.domain === 'rules.example.org'` in the existing positive and negative assertions.
- `sources.lock.json`: regenerate the affected test-file content hash with the documented authoring command; no other source identity changes.

The two existing test registrations remain two; no tests or assertions were removed, skipped or added. The two flagged substring checks become zero. Both targeted sites are corrected in code; remote CodeQL alert closure has not been observed and remains subject to its later analysis of the branch/default branch. Product runtime behavior, UI, CONTRACT.md, clause statuses, summary counts, ACCEPTANCE.md and docs/CLAIMS.md are unchanged.

## Boundary investigation and strategy

Alerts 32 and 33 (`js/incomplete-url-substring-sanitization`) refer to checks of a raw JSON response body after creating and then lifting a domain rule. They are not product URL validation or sanitization controls. The response flows from the real Hono app's auth route through `createAuthHandler` to `node:assert` in the test; no redirect, outbound request or authorization sink uses the result.

The API boundary returns a `DomainRule[]` array. The installed pinned module's `modules/operator-auth/routes.mjs:68` returns JSON from `listDomainRules`; `accounts/admin.mjs:143-145` authorizes the list operation; `accounts/store.mjs:238` projects `domain`, `providerId` and `createdAt`. The repository retains corresponding module sources and declarations. Lamp's `src/core/features/sign-in-providers/service.ts:128-145` disconnects through provider unlink before deleting registration; the provider audit path removes rules naming that provider. The existing integration journey exercises these public HTTP doors with real D1 batches and native OIDC logic, substituting only provider network edges.

The invariant is that the exact configured domain rule exists before disconnection and no longer exists afterward. Searching serialized JSON can match a longer domain or an unrelated field. Exact domain-field equality is the narrowest correction at that boundary; parsing a URL here would misrepresent the data being asserted. JSON errors and non-array responses now fail the test rather than being treated as arbitrary text.

Legitimate behavior retained: owner-only and fresh-proof configuration, Google linking/testing/replacement/disconnection, Okta person pairing, deployed provider sign-in including Microsoft, email access, provider session revocation, secret write-only handling, and domain-rule lifting. No exploitable runtime URL boundary was established by these test-only alerts. Their reported high severity is not claimed as an exploitable product vulnerability.

A fresh read-only boundary investigator independently confirmed the API shape and cleanup path before editing. A separate fresh read-only candidate reviewer reconstructed the invariant and found no concrete bypass or regression. Its focused Node probe accepted the exact domain and rejected four domain lookalikes, a match in another field and an empty array. Invalid JSON and non-array responses throw. Neither reviewer edited files, used credentials or made API calls.

## Plan and execution

The complete plan is retained in PLAN.md. Fleet identity and the launcher were installed first; only the declared product repository was cloned. Its local identity and co-author cleanup hooks remain active. The cloned history is full, filtered history, suitable for the publication scanner. Node 22.20.0 and pnpm 10.12.4 were selected for setup and verification. Dependencies were installed frozen, and the local setup completed with the fleet owner email and non-interactive flag; private local setup state is excluded from all reports.

The minimal two-site patch was applied after tracing the API and caller. The source lock was regenerated last. Main was fetched and the committed branch was reconciled using the mandated fleet identity; it was already up to date. The commit has fleet author and committer and no trailers. The candidate's product diff contains only the test and source lock.

## Ordered verification gates

1. Syntax and source hygiene: `node --check tests/auth-adoption/sign-in-providers.test.mjs`, `git diff --check`, and `node scripts/edition-authoring/cli.mjs check` pass. Lock generation used `node scripts/edition-authoring/cli.mjs lock`.
2. Original trigger and alternate class: both raw JSON `.includes('rules.example.org')` expressions are absent from the candidate. The exact comparison rejects longer/prefixed/suffixed domains and unrelated fields in the reviewer's focused probe. This removes the reported incomplete substring pattern without adding a URL parser or suppression.
3. Legitimate control and owning checks: `node --test --test-concurrency=1 tests/auth-adoption/sign-in-providers.test.mjs` passes both native provider journeys, 2 passed / 0 failed / 0 skipped, including real rule creation and lifting. `pnpm typecheck` passes. The touched checks were repeated on the committed candidate. Actual output is retained in `sign-in-providers.tap` and `typecheck.log`.

`pnpm install --frozen-lockfile` and `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive` completed successfully. The dependency install log is retained. Long-lived setup/test commands used the requested `cloud_run` subreaper. No development server or browser was started. UI proof is not applicable to these test-only changes. No full local verifier was run, following the brief's touched-check limit; the exact-SHA branch Verify is the full wall.

## Publication, CI and evidence custody

The final publication scan is COMPLETE / PASS with zero findings on the exact committed SHA/tree. History and injected-environment matching both completed. Fifty pre-existing history findings are classified separately by the scanner and do not become newly public findings. The scan output is retained without modification. Earlier observed refusals are also retained:

- `publication-scan-initial-timeout.json`: the initial 300-second attempt returned INCOMPLETE / exit 2 for `scan.deadline-exceeded`.
- `publication-scan-local-artifacts.json`: a complete scan of the development working directory returned FAIL / exit 1 with 18 findings. Its working-tree coverage included ignored setup secrets, local runtime databases and generated build artifacts. The destination arguments were also incorrect. These local files are outside the committed product tree and are excluded from the report packet; the value-free report records paths and rules only.
- `publication-scan-incorrect-project.json`: isolated raw committed source with full mirrored history returned COMPLETE / FAIL with only `destination.invalid`. The invocation supplied the repository identity as the project identity. The committed project ID is `just-every/lamp`, distinct from repository `just-every/run-lamp`; no source identity was renamed.
- Standalone destination checks using their default all-local-ref history encountered an unavailable blob from unrelated mirrored refs, including after a full main fetch. The precheck was rerun using the same explicit selected-and-public-base history scope as the full publication gate, and passed. Its actual result is `destination-precheck.json`.
- The final full scanner invocation uses the isolated exact committed tree, the remote public main baseline, `--project just-every/lamp`, `--repository https://github.com/just-every/run-lamp`, the injected environment file for safe in-memory value matching, and the supported 1200-second bound. Its actual output is `publication-scan.json`.

No credential values, environment dump, local setup state or private gate inputs are retained in this packet. Earlier refusals were not suppressed or edited into passing reports. The full scanner's observed PASS authorizes this product publication step. The cloud push guard succeeded on attempt 1, after all candidate commit identities and trailers were inspected. The pushed head is exactly `3b1e54edc2c33fdd2c5ca44bc948bb94579d12a1`. Exact-SHA Verify run `43745352347` was still in progress after the final scheduled poll: https://github.com/just-every/run-lamp/actions/runs/43745352347. There is one REST watcher and no repeat poll before 300 seconds.

No contract clause status changes are proposed. The affected journeys carry ACCESS-002 and TEAM-003 tags, but this maintenance round does not assert a new whole-clause judgment or promote acceptance status. No owner ruling was needed. Provider sandbox delivery and real installation acceptance remain outside this test-only scope.

## Terminal product custody

Outcome: locally fixed; product PUSHED, with CI pending. PR: https://github.com/just-every/run-lamp/pull/394 (open against main; head matches the published candidate). The remote product ref was verified by Git after PR creation. The product worktree and index are clean.

Exact-SHA Verify: https://github.com/just-every/run-lamp/actions/runs/43745352347 — last observed `in_progress`, conclusion null, head `3b1e54edc2c33fdd2c5ca44bc948bb94579d12a1`. Six explicit REST discovery/poll calls were made, each more than 300 seconds after the previous run query; one additional REST request created the PR. The publication tool also performed its own reference visibility checks. Remaining API budget was reserved for the required PR rather than further CI queries. No completed failure was observed, so failed-job logs were not requested. The PR event may start another Verify; it was not queried. No workflow was dispatched, retried or claimed green from another SHA.

Before/after: flagged raw JSON substring checks 2 -> 0; existing authentication journey registrations 2 -> 2; clause status changes 0 -> 0. CodeQL alert closure is unverified until later analysis; the reported source patterns are corrected. There is no code blocker or missing owner ruling. The remaining gate is completed/success Verify on the exact candidate before guarded landing. This result does not authorize landing or deployment and makes no provider sandbox or whole-clause acceptance claim.

All report and receipt files are outside the product branch. The evidence transport publishes only explicitly selected regular, non-secret packet files to `refs/heads/evidence/gr-mt-lamp-code-15`, with a manifest binding their hashes to this product head. Product code, contract and generated view files are not changed by evidence publication. Actual result.json and the packet are retained for fleet retrieval.

The first evidence publication was remotely verified, and product HEAD/branch/index/status remained unchanged. Its actual transfer receipt is retained in TRANSFER-RECEIPT.json. The final complete packet appends this receipt through the same evidence-only ref; the terminal EVIDENCE line identifies that final head.

PUSHED branch=cloud/gr-mt-lamp-code-15 head=3b1e54edc2c33fdd2c5ca44bc948bb94579d12a1
