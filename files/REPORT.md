# Lamp timezone release replay

Repository: just-every/run-lamp
Tag: sd-lamp-tz-release-fix-2
Branch: cloud/sd-lamp-tz-release-fix-2
Head: 3de3712ea6362e9d1731cd1cc54dc994386d4fd8
Base: 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0
PR: https://github.com/just-every/run-lamp/pull/380

## Plan and implementation

The complete original plan is PLAN.md. Started from current origin/main and applied only the seven authorized source/contract/test files from bd1615809f016c3d29c0889a4efe77eadc9aaef0 as a patch. Copied RELEASE.json contractChanges.SETUP-002 verbatim from origin/cloud/sd-lamp-tz-release-fix-1, then regenerated sources.lock.json last. The resulting candidate is one linear commit with one parent, no merges in origin/main..HEAD, nine changed files, 40 insertions and 23 deletions. There was one successful product push and no force push, rebase, cherry-pick, merge or default-branch write. Product checkout is clean.

First-run setup and website confirmation now preserve a valid saved owner timezone; an invalid saved zone recovers to a valid browser zone, or UTC. The settings write attributes its audit record to the operator and captures the previous/new timezone in the existing D1 batch transaction. Public timezone labels use the current date's Standard or Daylight name.

SETUP-002 acceptance point 2 deliberately changes meaning. Its release entry has change=changed, summary, was and now; package/release version stays 1.11.15. All clause status, gap and evidence rows remain unchanged. No migrations, new tests, incident/tick/size work or unrelated prose changes were made. Generated ACCEPTANCE.md and docs/CLAIMS.md are byte-identical to origin/main and are absent from the candidate diff.

## Results

- pnpm validate:release: PASS, including vendor catalog 20 sources / 162 native state cases and release 1.11.15 inventory validation.
- pnpm typecheck: PASS.
- node src/base/contract-docs.mjs write: PASS; then pnpm check:contract-docs: PASS (0 prose errors / 0 warnings).
- After restoring origin/main's generated views, pnpm check:contract-docs: expected FAIL solely with `ACCEPTANCE.md: generated content differs; run contract-docs write.` This preserves the required lander-owned views.
- Existing unmodified targeted command `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium cloud_run node --test tests/e2e/website-onboarding.test.mjs`: PASS, 1 test, 0 failures, 61.2 seconds. Assertions are at width 1440. No tests were added.
- node scripts/edition-authoring/cli.mjs lock and pnpm source:check: PASS. Source lock was the last product file generated.
- git diff --check and explicit authorized-file / release-copy / all-clause-judgment / candidate-history checks: PASS.
- Fleet author/committer and every candidate message/trailer checked before push. Both identities are Run Edit Run fleet <fleet@runeditrun.com>, no co-author trailers.
- Frozen dependencies and rer setup completed; fleet hooks reinstalled afterward. Shell toolchain selected Node 24.19.0 / pnpm 10.12.4 using the prescribed shim; repository rer is 0.2.108. The hosted failure log records pinned Node 22.20.0.

Full local rer verify was not run: the assignment specifies the touched checks and the final source view intentionally differs from generated ACCEPTANCE.md. No claim is made that hosted product shards ran.

## Before and after

| Scope | Done before/after | Partial before/after | Missing before/after | Total before/after |
| --- | --- | --- | --- | --- |
| Published | 42 / 42 | 65 / 65 | 0 / 0 | 107 / 107 |
| Target and push further | 18 / 18 | 64 / 64 | 55 / 55 | 137 / 137 |
| All | 60 / 60 | 129 / 129 | 55 / 55 | 244 / 244 |

SETUP-002 stays PARTIAL; points=none. There are no clause status changes.

## Product publication and exact-SHA CI

Product push succeeded on attempt 1 through cloud-push.py. Remote-tracking head equals the terminal product SHA. The requested post-push inspection was `git show origin/cloud/sd-lamp-tz-release-fix-2:RELEASE.json`; it returned this exact entry:

REMOTE_RELEASE contractChanges.SETUP-002={"change":"changed","summary":"First-run setup preserves a valid saved time zone and uses the browser zone or UTC only to recover an invalid saved zone.","was":"First-run setup filled observed website details and the browser time zone, replacing the saved page time zone when the owner confirmed setup.","now":"First-run setup and website confirmation preserve any valid saved time zone. Only an invalid saved zone adopts a valid browser time zone, or UTC when neither zone is valid; website reading still fills only observed page name, tagline, PNG mark, accent and navigation components."}

Exact-SHA push Verify run 43610230533 completed with conclusion failure: https://github.com/just-every/run-lamp/actions/runs/43610230533 . The only root failure was `ACCEPTANCE.md: generated content differs; run contract-docs write.` in build job 132493520489. That preamble exits before build.json is written, so its artifact-upload step failed, all product shards skipped and aggregate verify job 132493606480 failed for missing artifacts (0/9 shards). Both failed jobs' log archives were read once and retained. Release validation was NOT the CI failure; it passed locally.

The explicit cloud instruction counts this generated-contract-view-only failure and its dependent failures/skips as green for READY. READY here uses that exception, not an assertion that the GitHub conclusion is success or that product shards passed. The Mac lander must regenerate the generated views from CONTRACT.md and rerun exact-SHA Verify before landing. No default-branch write or landing was attempted.

At the single discovery snapshot, PR Verify run 43610301511 was queued, and dynamic PR #380 run 43610299663 was in progress. Neither is claimed green. Six of the ten GitHub command budget were used (PR discovery/create, exact-SHA run discovery, completed-run jobs, one archive read for each failed job). No repeated CI polling or waiting occurred.

## Browser proof

Browser proof is complete: setup, Settings and the public page are captured once at 1440 and 390. The existing onboarding test's assertions remain at width 1440. An external in-memory loader captured setup without editing tracked tests. A separate successful manual native-runtime fixture captured Settings and public screens after a 200 settings write to Australia/Sydney; the selected timezone was Australia/Sydney and the visible label was `Times shown in Australian Eastern Daylight Time (Australia/Sydney)` on the current November date. Browsers and owned runtime processes were closed.

Four earlier auxiliary harness attempts completed the product assertions but failed in added proof steps: one ERR_ABORTED navigation and three exact Time zone label locator timeouts, including one incorrectly guessed settings subpath. The fourth attempt also sent the whole settings view instead of declared input fields and received 400 from the strict schema. Their complete actual logs are retained. The final manual script uses only declared input fields, locates the select within its label and completes with exit 0. A separate unmodified targeted test passed; the auxiliary failures are not presented as passing runs or as product assertion failures. All six final screenshot files and both external harness sources are included.

## Custody and remaining work

Product: pushed and PR open at the exact SHA above. READY qualifies only under the explicit generated-view exception. No product blocker remains. The lane retains landing authority and must regenerate views and run its required checks/scans. Evidence publication is a separate report-only ref, never product acceptance, READY or proof of landing.

CLAIM SETUP-002 PARTIAL points=none tests=tests/e2e/website-onboarding.test.mjs#SETUP-002 — a fresh owner gives their website first; Lamp fills in the page from it, or from the status page it already runs, a site it cannot read leaves calm defaults, and the edited result is what customers see
