# gr-mt-lamp-code-11

Repository: just-every/run-lamp
Branch: cloud/gr-mt-lamp-code-11
Candidate: 4271d1caa8f044a0265eb287c660e1777bd5b942
Base inspected: 5dd84e13f6b0478edc2fc5e759d513f5eccf6d57

## Findings and implementation

- Code scanning #15, js/redos: fixed. `src/core/platform/site-reader/index.ts` now consumes optional XML, repeated comments and optional SVG doctype with forward delimiter searches, keeping the existing 2 KiB sniff limit. The old nested comment expression could retry earlier comment endings exponentially when no SVG root followed. The regression runs the public `readSite` operation with a fake network edge in a separate process, enforcing a three-second deadline even if synchronous parsing stalls. It covers 200 comments with a failing suffix, an unfinished comment, supported SVG prefixes, a misleading SVG-like tag, and PNG dimensions. The exact regression fails with ETIMEDOUT against origin/main and passes with the fix in about 126 ms.
- Code scanning #14, js/xss-through-dom: **no-change** in the product UI. On the inspected current main, `source-help.tsx` already uses React text children for provider page names, addresses and IDs, with no DOM HTML reinterpretation or HTML sink. The cited line 60 contains static saved-response guidance and a local documentation link whose fragment comes from the fixed provider union. The extended existing Cutover browser journey supplies raw executable markup, entity-encoded markup and a javascript: address to all three provider page pickers. It proves exact literal text, no inserted image/SVG/script/link elements, no script side effect, and preservation of the chosen page ID. Source help remains unchanged. This establishes current-default safety; it does not claim that GitHub closed the alert or that the original historical analysis was false.

The code-scanning API returned HTTP 403, Resource not accessible by integration. The run made no alert dismissals or security-state changes. A person can compare alert #14 with the current source and the attached browser regression when deciding whether to dismiss its historical instance.

## Files

- `src/core/platform/site-reader/index.ts`: bounded icon prefix parser.
- `src/core/platform/site-reader/README.md`: records the icon parsing safety property.
- `tests/e2e/site-reader-security.test.mjs`: public-reader timeout and image behavior regression.
- `tests/e2e/cutover-browser.test.mjs`: extends the existing owner import journey with hostile provider text.
- `package.json`: schedules the new regression in the existing site test command and imports CI shard.
- `sources.lock.json`: generated last with the documented lock command, after staging the added file; source check passes.

No contract clauses, clause judgments, generated acceptance/claim views, homepage or owner-screen design changed.

## Local validation

Pinned Node 22.20.0 and pnpm 10.12.4. Chromium: /usr/bin/chromium, headless with --no-sandbox. Long-lived setup/browser commands run through cloud_run; browsers and test-owned runtime processes close through their fixtures.

- `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: PASS, including production build and local migrations. Setup initially used the VM's newer Node; all final checks and browser journeys use pinned Node 22.20.0.
- `node --test --test-concurrency=1 tests/e2e/site-reader-security.test.mjs`: PASS, 1/1.
- `node --test --test-concurrency=1 tests/e2e/cutover-browser.test.mjs`: PASS, 1/1, approximately 94 seconds. An initial attempt retained the deliberately hostile page ID into the subsequent import and correctly received a length-validation refusal; the probe now clears its own synthetic input before continuing the pre-existing journey. No existing assertions were removed or weakened.
- `node --test --test-concurrency=1 tests/e2e/website-onboarding.test.mjs`: PASS, 1/1, approximately 53 seconds, exercising the real local Worker and supported website icon.
- `pnpm typecheck`: PASS.
- `node scripts/verification/check-plan.mjs`: PASS.
- `node src/base/contract-docs.mjs check`: PASS, zero errors/warnings; generated documents current.
- `node scripts/edition-authoring/cli.mjs lock`, then `node scripts/edition-authoring/cli.mjs check`: PASS.
- `git diff --check`: PASS.
- Old-detector mutation control in an isolated temporary source tree: expected failure, ETIMEDOUT at three seconds. The product checkout was not modified by that control.

The fleet rule limits local work to touched checks and typecheck; full rer verify is delegated to exact-SHA branch Verify. No full local suite was run.

Assertions run at 1440. The relevant source-picker browser proof is captured once at 1440 and 390; both show hostile input as literal text. Those two screenshots are retained in the packet. Additional unmodified journey screenshots remain local but are not selected for publication.

## Counts and clause status

Before: 91 registered cases + 10 assertion scripts = 101 checks across 34 routine test files.
After: 92 registered cases + 10 assertion scripts = 102 checks across 35 routine test files.
The existing import registration is extended; the only added registration covers bounded icon detection. This remains below the fleet cap of 200.

Listed alerts: 2 investigated -> 1 fixed in code, 1 no-change on current main, 0 unresolved code findings. GitHub alert open/closed counts are unavailable because of API permissions.
Clause status changes: none. SETUP-002 and MOVE-* judgments remain as main records them; this maintenance round makes no broader DONE claim.

## Plan and custody

The complete original plan is PLAN.md. Product custody and evidence transport are separate. The initial exact-tree publication scan refused missing historical blobs in the partial clone. A full no-filter fetch hydrated the source repository; `git rev-list --objects --all --missing=print` then reported zero missing objects. The final scanner result and publication/CI receipt are attached separately.

Publication scan, PR and CI outcome are recorded in receipt.json and the terminal custody section appended below. No default-branch push, force push, landing, deployment or real provider request was made.

The hydrated full-history scan exceeded its default 300-second deadline. It was restarted without changing its checks, using its supported 1800-second bound. Initial and timeout reports are retained as separate actual files.

The first completed scan was COMPLETE/FAIL solely because the caller supplied a repository slug to a parameter requiring its HTTPS GitHub URL. The unchanged committed identity manifests agree with the corrected URL; the scanner’s own destination validator passes. The full scan was rerun with that corrected invocation. The failed invocation report is retained; the product identity was not changed to satisfy tooling.

## Final custody

PUSHED: `cloud/gr-mt-lamp-code-11` at `4271d1caa8f044a0265eb287c660e1777bd5b942`.

- Publication: COMPLETE/PASS with zero findings on that exact commit and tree `8ba27b9145f499cff6aeba1ee29ac16c436a3c9d`. The selected-and-public-base scan inspected 1,116 commits, 8,504 blobs, 1,116 commit messages and 27 tag messages. Its final duration was about five minutes. The checkout has 2,373 commits across all refs; the public-base scanner selects its documented scope.
- Product push: the cloud guard succeeded on its first attempt. All outgoing author/committer identities are fleet identities, with no trailers. No main push, force push, landing or deployment occurred.
- PR: https://github.com/just-every/run-lamp/pull/361, open for the lane.
- Exact-SHA Verify: run **43528397305**, https://github.com/just-every/run-lamp/actions/runs/43528397305. At 2026-11-13T23:46:56Z its status was **in_progress**, conclusion null, and its head exactly matched the pushed commit. This is pending proof, not a green claim. No READY line is claimed.
- API custody: all five code-scanning requests returned HTTP 403 after the required refreshed-credential backoff. Eight direct calls covered source/tool discovery and that recovery; PR creation was the ninth. The single Verify discovery read, delayed ten minutes after publication, used the tenth. The stated budget is exhausted; no further polling or workflow rerun was attempted.
- Local result: done; all touched checks pass. The fleet can continue watching the existing Verify run and apply its independent publication and landing gates. No product defect or red workflow is currently observed; pending Verify is the remaining acceptance limitation.
- Clause status changes: none. Before/after test counts: 101 -> 102 (91 -> 92 registered cases plus 10 assertion scripts).

The initial 30-file report packet was independently fetched at `7d5d6640066fc946341907c308da46be86a9ad15`; its manifest and every file hash verified. The final packet adds the actual CI receipt and supersedes that report head without changing the product branch. All test-owned browsers and Workers are stopped. Complete plan: PLAN.md; machine-readable local outcome: result.json; final publication/PR/CI custody: receipt.json.
