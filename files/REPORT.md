# Lamp connected-tool guide replay

Repository: just-every/run-lamp
Branch: cloud/main-lamp-connect-guides-1-c2
Candidate: 3b430ac6e0f2997fe85957f54fb1d03dc4506602
Base main: 87907d8b20d3ae5e8d3f5505de60ffdf1ebb7ccd
PR: https://github.com/just-every/run-lamp/pull/351
Finished source commit: 796e6766e7415a5db261b47acf453973bc397b7f, parent 2ce5da92774ad519d843362dc2d721ddfb0e03fa

## Plan and implementation
The complete execution plan is PLAN.md. The task cloned full history, installed the fleet Git helper, push guard and message cleanup hook, and replayed only the finished source change. The replay has exactly one commit, no merge commits, and a fleet author and committer with no co-author trailer or skip marker.

Only DIVERGENCE.md and sources.lock.json conflicted. The divergence resolution retains every current-main byte in order and inserts the original seven-line guide entry once. The source lock was restored to main and regenerated using the documented command after all source changes. Six guide/UI files are byte-identical to the finished source commit. The replay needed no additional product fix.

The change adds detailed installation steps for separate Slack and Teams apps, a Slack manifest with the commands scope, the social account guide for X/Bluesky/Mastodon, docs-index entries and links beside Chat links and the selected social credential field. It does not alter connection, linking or posting behavior.

The X helper retains grant = json.load(response), grant["access_token"] and grant.get("expires_in", ...). Its response variable has none of the forbidden name components. The exact c1 item 3 grep on the added staged diff returned zero candidates. No credentials were added.

## Checks and boundaries
Typecheck, production setup build, the docs builder's complete link/anchor validation, contract-doc generator check and source-lock check passed. The docs builder validated all 33 pages. No test source was touched and no test registration was added, removed, skipped or weakened. The full local suite was not run, in accordance with the touched-check instruction; branch Verify is the full wall.

CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are byte-identical to base main. Clause statuses, gaps, evidence and summary counts are unchanged. No DONE claim is made.

Before/after: 241 clauses in both trees; done 60→60, partial 129→129, missing 52→52. Docs pages 32→33. Test registrations +0/−0. Product diff: 8 files, 339 insertions, 21 deletions. DIVERGENCE guide entry count 0→1.

Provider console controls were checked against the supplied guide and retained implementation; no live provider account, Slack workspace, Teams tenant or X grant was exercised. These are setup instructions, not a provider-delivery receipt. The full-history publication scan belongs to the fleet lander as specified by the brief.

## Publication and CI
The task inspected all candidate identities and trailers and used the fleet cloud push guard. The branch push succeeded on its first attempt. product-push.log records custody. PR #351 is open according to the repository's contribution rule.

Exact-SHA push Verify: 43352296174, https://github.com/just-every/run-lamp/actions/runs/43352296174 . The current status and observed timestamps are recorded in ci-status.json; no result from another SHA is used. The task uses one REST watcher with at least 300 seconds between reads and a total ten-call budget.

Final browser, CI, evidence transfer and cleanup outcomes are recorded below before publication.

## Browser proof
browser-receipt.json and four explicitly selected PNGs record the two changed Settings panels at viewport widths 1440 and 390 on the exact candidate. The task used the production rer preview and its local native owner entry. It completed the optional first-run setup via Skip and Open Lamp without reading an external website.

At 1440 the harness asserted the Slack/Teams guide link, the exact section links for X, Bluesky and Mastodon, both guide links on the docs index, successful navigation to both published guides, no horizontal overflow and no page errors. At both widths it captured and visually inspected Chat links and Social accounts once. Guide links remain visible; observed text is at least 13px; fields use single borders and the controls fit. Browser contexts were closed.

Initial harness attempts stopped at the key handoff or the fresh installation's /setup route; the successful harness waited for the handoff and completed the real setup form. No product change was necessary for these local harness issues.

## Initial Verify failure and authorized rerun
Attempt 1 of Verify 43352296174 completed with failure. Only composer and the dependent aggregate verdict failed. The composer log was read once using gh run view 43352296174 --repo just-every/run-lamp --job 131646502252 --log-failed.

THEME-001 — owner publishes branded themes and layouts within the page budget timed out after 5000ms waiting for the exact Theme heading, at tests/e2e/helpers/theme-browser-flow.mjs:197, registered in tests/e2e/publishing-browser.test.mjs:898. Diagnostics said shellHydrated=true, settingsInert=false and no client diagnostics. This guide replay touches neither that test nor Theme. Per the brief, failed jobs were rerun once, without a product change. ci-rerun.json records that request and the ten-call budget; ci-composer-failed.log retains the sanitized failure log. The initial red result is not treated as green.

## Terminal result
PUSHED branch=cloud/main-lamp-connect-guides-1-c2 head=3b430ac6e0f2997fe85957f54fb1d03dc4506602

At 2026-11-13T02:54:29.751432+00:00, the last permitted REST read still showed Verify 43352296174 in progress on this exact SHA after the authorized failed-jobs rerun. The ten-call budget is exhausted: PR creation, run discovery, three initial status reads, failed-job discovery, one composer log invocation, one rerun request and two rerun status reads. No green result is claimed. The remaining prerequisite is the rerun's completed/success verdict; the initial Theme assertion failure is retained above and in the log. No product blocker or missing account was identified.

All touched local checks and the candidate browser proof passed. No clause status changed and no extra product fix was required. The product checkout remains one commit above base main, with a clean worktree. The evidence publisher will send these 32 explicitly selected regular files only to refs/heads/evidence/main-lamp-connect-guides-1-c2 and verify the product head/branch/worktree are preserved. Browser contexts and both task-owned servers are stopped, the app port is closed, and temporary private runtime logs are removed. Per the brief, deletion of the pushed product clone follows successful evidence publication. The durable packet remains at $HOME/rer-consolidation/work/main-lamp-connect-guides-1-c2/packet/.

POST lanes/main/INBOX.md: main-lamp-connect-guides-1-c2 replay pushed as 3b430ac6e0f2997fe85957f54fb1d03dc4506602 on cloud/main-lamp-connect-guides-1-c2; PR https://github.com/just-every/run-lamp/pull/351; clause changes none (60 done/129 partial/52 missing unchanged), docs 32→33, tests +0/−0; local checks and 1440/390 proof pass. Verify 43352296174 initially failed unchanged THEME-001 missing Theme heading (composer job 131646502252), failed jobs rerun once and still in progress at final permitted read; ten-call budget exhausted. Await exact-SHA success; full plan/results/receipts on the evidence ref.
