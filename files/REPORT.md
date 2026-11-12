# Connected-tool guides publication-clean replay

Repository: just-every/run-lamp
Branch: cloud/main-lamp-connect-guides-1-c1
Head: 796e6766e7415a5db261b47acf453973bc397b7f
Main parent: 2ce5da92774ad519d843362dc2d721ddfb0e03fa
PR: https://github.com/just-every/run-lamp/pull/349

## Plan and implementation

The full work plan is in PLAN.md. The launcher was refreshed, fleet Git authentication and identity configured, and the publication co-author cleanup hook installed while preserving repository hooks. Only the declared product repository was cloned, with full history.

The new branch starts at current main and contains exactly one non-merge product commit. It squashes the connected-tool round's net change from 31698ca375d783a470c1485b10e448ce6c2b3d16 against 7bfb459185882497098b4fed00155f248874ce81. DIVERGENCE.md preserves all main text, including the notification-provider entry, and adds the connected-tool entry once. Shared source-lock conflicts were discarded in favor of main and the lock was regenerated using the documented command after product edits.

Settings → Connected tools → Chat links now links to the Slack/Teams setup guide and explains when to create the private code. Every Social accounts provider choice links to its corresponding guide section. The docs index includes both guides. Detailed provider setup remains on the guides instead of everyday screens. The Slack manifest includes its slash command, interactivity endpoint and commands scope.

The X helper response variable is grant, and both result reads use grant. Python parsing and AST comparison prove that the only helper behavior change is this variable rename. The callback validation, PKCE, authorization code exchange and expiry output remain identical. The five remaining product files match the source round byte-for-byte.

CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are byte-identical to origin/main. No clause Status, Gap or Evidence was edited. No DONE claim is made.

## Results and counts

- Product commits ahead of main: 0 → 1, with one parent and no merge commit.
- Changed product files: 8; net diff: 339 additions, 21 deletions.
- Source-round offending response assignment: 1 → 0. The requested staged added-line SEC-3 candidate grep returns no matches. See SEC3-CANDIDATES.txt.
- Settings setup-guide choices: 0 → 4 (chat plus three social providers).
- Connected-tool guides in docs index: 1 → 2.
- Registered test cases: 89 → 89; assertion scripts: 10 → 10; total checks: 99 → 99. No tests were added, deleted, skipped or weakened.
- Clause statuses: 60 done, 129 partial and 55 missing before and after; status changes: none.

## Validation

- pnpm run typecheck: passed, including on pinned Node 22.20.0 / pnpm 10.12.4.
- node src/base/contract-docs.mjs check: passed, with zero prose errors or warnings.
- node scripts/edition-authoring/cli.mjs lock and check: passed; the generated lock was the last product edit.
- pnpm verify:plan: passed, reporting eight test shards, 34 routine files and 99 checks.
- npx -y @runeditrun/rer build --site through cloud_run: passed; 38 pages and 63 files.
- Existing tests/lamp-site/browser.test.mjs documentation journey: 1 passed, 0 failed.
- Candidate browser probe: passed on the exact reported SHA. At 1440 it follows the Settings links, exercises all social provider choices, follows both docs-index cards, validates all local links and manifests in the guides, and checks no horizontal overflow, serious/critical accessibility violation or page/hydration error.
- Candidate screenshots: Chat links, Social accounts, chat guide, social guide and docs index captured once at 1440 and 390. The Settings screenshots were visually reviewed at both widths; the phone controls remain readable and fit the viewport. Ten screenshots and BROWSER-RECEIPT.json are included.
- Initial probe correction: its docs index selector also matched navigation links. The probe was narrowed to actual index cards and rerun successfully. No product change resulted; the actual initial diagnostic is BROWSER-PROBE-INITIAL.txt.
- Author/committer and all candidate trailers were inspected before the product push. The one commit uses Run Edit Run fleet <fleet@runeditrun.com> for both identities and has no trailers.
- Product push succeeded on the first guard attempt. PRODUCT-PUSH.txt records the actual custody result. The branch has no skip marker.

## Boundaries and remaining gates

This replay changes guidance and links only. Source review confirms the named Lamp settings controls and Slack/Teams environment bindings exist. No provider account, OAuth grant, social post, Slack workspace or Teams tenant was accessed or claimed as live acceptance. The guides retain their provider approval, hosting and account requirements.

The full-history publication scan belongs to the fleet Mac lander under this cloud brief; it cannot run in this VM. The staged SEC-3 review is complete. Exact-SHA branch Verify is recorded separately in CI-RECEIPT.json. Landing, main publication and deployment remain with the fleet. Evidence publication is a separate report-only transfer and never a product READY claim.

## Evidence

PRODUCT-RECEIPT.json contains source provenance, before/after counts, untouched contract bytes, identity and local check results. BROWSER-RECEIPT.json contains exact-SHA proof and the screenshot list. CI-DISCOVERY.json and CI-POLL files are actual REST responses; GITHUB-CALLS.json records the bounded API calls. PR.json and PRODUCT-PUSH.txt record product custody. PLAN.md contains the complete plan. No fleet evidence is committed on the product branch.

## Initial Verify failure and bounded retry

Verify 43299323663 on 796e6766e7415a5db261b47acf453973bc397b7f initially failed only in runtime job 131466708301, step "Verify this product shard", and consequently aggregate job 131475051296. Build and all seven other shards succeeded. The failed assertion is HIST-006's public traffic-alert snapshot equality in tests/e2e/helpers/traffic-alerts-flow.mjs:111, registered by tests/e2e/update-reminders.test.mjs:157. Actual and expected snapshots differ only in generatedAt; both retain overall Operational and null maintenance/incident.

Both test files are byte-identical to current main, and this replay changes no traffic-alert or public snapshot behavior. Following the brief, failed jobs were rerun once on the same SHA. No assertion was edited or weakened. The failed runtime archive was read once with the prescribed gh run view command. CI-RUNTIME-FAILURE-EXCERPT.txt contains the actual failed assertion. The raw archive output is retained locally outside this public packet because its workflow preamble includes environment metadata.

CI-RERUN-RECEIPT.json records the actual rerun request. Nine GitHub calls were used through diagnostics and rerun, leaving one final exact-SHA REST status call. That final call is scheduled ten minutes after the retry to allow it to finish without short polling.

## Final outcome

The reserved final REST call confirms Verify 43299323663 completed successfully on the exact product SHA 796e6766e7415a5db261b47acf453973bc397b7f after the one failed-job retry. All ten permitted GitHub calls have been used. CI-RECEIPT.json and CI-FINAL-RESPONSE.json contain the actual green response.

The product is READY on cloud/main-lamp-connect-guides-1-c1, with PR #349 open for the lane. There are no remaining builder blockers. Main landing, the full publication scan and release remain the fleet's responsibility. The complete explicitly selected packet is published separately to evidence/main-lamp-connect-guides-1-c1; the task's final EVIDENCE line identifies its exact report head. The clone is eligible for deletion after both remote refs are verified.
