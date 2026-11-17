# CodeQL tooling maintenance

Run Edit Run fleet, 17 November 2026.

All three reported locations are fixed and pushed to cloud/gr-mt-lamp-code-12 in just-every/run-lamp. Exact-SHA Verify is currently in progress; this report does not claim landing or GitHub alert closure.

Candidate: 8a1b831a8f1d346bafd092350cc74ba35c7f19c6.
Committed tree: 1ed37f0c78b7c0bf8b349f29663c647a176b3b5a.
Base: cb6f9af49f440380caeca1722bac8fb7b7815699.
Verify: https://github.com/just-every/run-lamp/actions/runs/44108731182.
PR: https://github.com/just-every/run-lamp/pull/408.

## Changes

| Alert | File | Result |
| --- | --- | --- |
| 11, js/redos | scripts/delivery/base/native-export.mjs | Repeats complete slash-terminated segments, followed by the final segment. Removes ambiguous repartitioning of character runs; retains root, trailing slash, the 256-character bound, ASCII unreserved characters and dot-segment refusal. |
| 13, js/incomplete-url-substring-sanitization | tests/auth-adoption/dependencies.test.mjs | Selects form-action CSP source tokens and compares parsed URL origins exactly with the provider origin. Provider-looking text in another host, user information or a query cannot satisfy the assertion. |
| 16, js/incomplete-url-substring-sanitization | tests/e2e/helpers/update-link-evidence.mjs | Parses rendered anchor URLs, requires HTTPS, and excludes markup and labelled-link destinations by exact normalized hostname. Keeps literal wording, link text, punctuation, publication timestamp and update identity assertions. |

base-copies.json records the deliberate local native-export adaptation without altering the upstream pin. sources.lock.json was regenerated last and checked. These are the only five product files changed: 28 insertions and 9 deletions.

## Counts and acceptance

Reported locations awaiting a code fix: 3 before, 0 after. This is a code-fix count; GitHub alert closure requires subsequent CodeQL analysis and is not claimed. No new product test registration was added or removed: the touched registered file has four before and after, and the helper has zero. Clause Status, Gap, Evidence and acceptance text changes: zero. Generated acceptance views, homepage and owner UI are unchanged. No ruling or provider account was needed.

PLAN.md contains the full plan. No acceptance status promotion is claimed by this maintenance round.

## Checks

Node 22.20.0 and pnpm 10.12.4 were used. Long-running commands used cloud_run; the browser used /usr/bin/chromium with --no-sandbox.

| Command | Result |
| --- | --- |
| pnpm typecheck | PASS |
| node --test --test-concurrency=1 --test-name-pattern='native identity setup' tests/auth-adoption/dependencies.test.mjs | PASS, one existing registration, including actual native routes/D1/provider approval/invitations/erasure |
| pnpm run build:app | PASS, emitted the actual Worker used below |
| node --test --test-concurrency=1 --test-name-pattern='owner maintains a complete catalogue' tests/e2e/public-contract.test.mjs | PASS, one existing registration, 356.7 seconds; exercises the changed helper through actual status/history/permalink/feed publication |
| node <packet>/security-regressions.mjs | PASS; 19,531 short paths match the previous validator language, explicit boundary/refusal cases pass, and 1,000 maximum-length invalid suffixes terminate promptly; nine prohibited links, three invalid/relative URLs, a punctuation mutation and an incorrect publication instant are rejected |
| pnpm source:copies | PASS; offline local bytes against the recorded Base-copy hashes/adaptation acknowledgements |
| node scripts/edition-authoring/cli.mjs lock | PASS; regenerated last |
| node scripts/edition-authoring/cli.mjs check | PASS |
| node --check scripts/delivery/base/native-export.mjs; node --check tests/auth-adoption/dependencies.test.mjs; node --check tests/e2e/helpers/update-link-evidence.mjs | PASS |
| git diff --check | PASS |
| All-candidate commit author, committer, message and trailer inspection | PASS; one fleet commit, no trailers |

The initial public journey could not start without dist/server/wrangler.json. The Worker was then built and the journey passed; both actual logs are retained. The native-path timing measurement was diagnostic, with no timing threshold assertion. The standalone regression exercise lives only in this evidence packet and adds no product test registration.

Full local rer verify was not run under the task/fleet restriction to touched tests plus typecheck. Exact-SHA branch Verify is the required full wall.

## Publication and preservation

Base 0.2.121 publication inspection passed COMPLETE/PASS with zero blocking findings on the exact candidate commit/tree. It inspected 1,166 commits, 1,149 trees, 8,834 blobs, 1,166 commit messages and 33 tag messages. Its complete report retains 50 findings classified as already public, separately from the empty blocking-findings list. No inherited finding was waived or removed by this task. The implementation identity and all source identities are in publication-scan.json and receipt.json.

Two earlier scan reports are retained: the default 300-second invocation reached its deadline; an extended invocation completed but rejected caller destination arguments (a slug where a full repository URL was required, and omitted project). Base's destination validator accepted the corrected project just-every/lamp and repository https://github.com/just-every/run-lamp, and the complete rerun passed in 348.0 seconds. No product identity was changed to satisfy the scan.

The cloud push guard published only cloud/gr-mt-lamp-code-12, on its first attempt. No default branch, tag or release was written. product-push.log is the sanitized actual transport receipt. A complete Git bundle was independently saved outside the clone and verified; bundle-receipt.json contains its absolute path and SHA-256. A bundle is preservation data, not proof of READY or push.

The actual machine-readable receipt and selected logs accompany this report. Evidence publication, product custody, acceptance and landing are separate. The fleet owns landing and its publication/CI gates.

## Final custody

PUSHED branch=cloud/gr-mt-lamp-code-12 head=8a1b831a8f1d346bafd092350cc74ba35c7f19c6

Verify run 44108731182 remained in_progress with null conclusion at the final 15-minute observation. Four REST observations used one watcher with at least 300 seconds between calls; the actual responses and timestamps are in ci-api-1.json through ci-api-4.json. No failure or success is inferred while the workflow is running, no logs were fetched before completion, and READY is not claimed. No workflow was dispatched or rerun by this task. The remaining API margin was reserved for required publication and possible failure investigation rather than spending it on more status polls.

The code work has no unresolved local failure or missing ruling. Exact-SHA Verify completion remains pending, and the fleet must require its success before landing. PR creation and evidence transfer do not establish product acceptance or landing. The local maintenance result records completed code work with this CI limitation explicitly stated.
