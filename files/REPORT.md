# Lamp deploy-faults linear candidate

Run Edit Run fleet, 2026-11-17 UTC. Task sd-lamp-deploy-faults-2.

No contract clause claimed; these are deploy-fault follow-ups.

## Plan

1. Refresh the task launcher, install the decrypted-bundle Git helper, commit hooks and cloud toolchain, and clone only just-every/run-lamp.
2. Fetch current main and cloud/sd-lamp-deploy-faults-1. Establish ancestry, inspect the refused merge's manual resolutions, and apply the intended net change as an ordinary commit on fresh main.
3. Compare every tracked byte against 14646dbd7d4087885cb776587aeaad2a0722bbb1; preserve current main's release metadata; prove no candidate merge commits. Regenerate sources.lock.json last and check it.
4. Run typecheck, affected tests and the migration-resume public setup proof. Establish whether the earlier theme request-budget failure is part of Verify and diagnose any recurrence without weakening assertions. Capture changed screens at 1440 and 390.
5. Check every candidate author, committer, message and trailer; push only cloud/sd-lamp-deploy-faults-2 through cloud-push.py. Use the bounded REST budget for exact-SHA Verify. Leave any PR to the lane.
6. Publish actual non-secret reports and receipts only to evidence/sd-lamp-deploy-faults-2; retain provenance independently of product custody. Delete the product clone after successful push and evidence transfer.

## Initial findings

- Fresh main: 626388fca54b18499b35b9e9c5f9cbcb51b4125b (Lamp 1.11.20).
- Previous candidate: 14646dbd7d4087885cb776587aeaad2a0722bbb1.
- Main is an ancestor of the previous candidate; their merge base is exactly main.
- Refused merge ace110719656648dfe1bbe2b6844ea0f03fc5a55 manually resolved sources.lock.json, tests/e2e/helpers/hosts.mjs and wrangler.jsonc.
- Applying main-to-candidate's net diff preserves all three files byte for byte and all previous candidate content. No release metadata changes beyond main: package version remains 1.11.20; CHANGELOG.md and RELEASE.json are untouched.
- Product delta: 49 files, 850 additions, 456 deletions. No CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md change.
- Regenerating the source lock with `node scripts/edition-authoring/cli.mjs lock` preserves the previous candidate's exact bytes; its `check` passes. Contract document check also passes.
- Before/after: 101 test registrations plus 10 executable assertion scripts = 111, unchanged. No tests deleted, skipped or weakened.
- Theme request budgets are in tests/e2e/helpers/theme-browser-flow.mjs and theme-owner-journey.mjs, called by publishing-browser.test.mjs, which Verify runs through test:composer in the composer shard. They require at most four distinct same-origin non-document resource paths and zero third-party origins; the owner journey also checks gzip transfer size across four templates at full public component capacity.

Results and terminal custody are recorded below as checks finish. No provider deployment or hosted acceptance is claimed.

## Local results so far

- Frozen dependencies installed at rer 0.2.121. `cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive` completed, and `cloud_run npx -y @runeditrun/rer build` completed with exit 0. Setup-owned descendants exited before the subsequent build.
- `pnpm typecheck`: pass.
- `node --test --test-concurrency=1 tests/auth-adoption/setup-migrations.test.mjs tests/auth-adoption/dependencies.test.mjs tests/demo/owner-claim-status.test.mjs`: 8 passed, 0 failed. This covers native identity, provider-key custody, guarded mail-off owner sign-in and key rotation, custom-prefix rotation refusal, owner-claim verification, page-host routing and stored page settings.
- Fresh-deploy proof: the public `pnpm run setup:cloudflare` fixture simulates a clean early return after 56 of 80 real migrations; the SAME setup command resumes and finishes all 80. No progress stops at 0/80 with no page-settings write; the bounded five-pass case stops at 65/80 with no page-settings write. Only the Cloudflare edge and Wrangler are substituted; the checkout's setup command and migration files are used. No live-provider proof is claimed.
- `node --test --test-concurrency=1 tests/e2e/rer-mail.test.mjs`: 5 passed, 0 failed. Enabled-mail submission/receipt/opt-out behavior, sender readiness, native mail-off defaults/refusals, pending mail-off obligations, and built first-run/Settings journeys all pass.
- The candidate browser proof uses `/usr/bin/chromium` with `--no-sandbox`, asserts at 1440, and captures the changed Overview and public page once at 1440 and 390. Existing setup and Settings proof is retained too. Images show neutral mail-off wording without a failing live status and no unusable email subscription form.
- Theme probe: `node --import=<cloud browser preload> --test --test-concurrency=1 --test-name-pattern=THEME-001 tests/e2e/publishing-browser.test.mjs` fails identically on candidate AND an isolated archive of unchanged main with main's frozen rer 0.2.118 dependency. Both use system Chromium 154.0.8037.57, and report the same five paths: `/assets/status-page.css`, `/assets/theme-header`, `/assets/mark.svg`, `/assets/status-page.js`, `/assets/favicon.svg`. This check IS part of Verify's composer shard; its assertion remains untouched. The reproduction establishes a pre-existing local check failure, not a deploy-fault regression. The request budget was not weakened and no product change was made for it.
- The local Base package's publication scanner was attempted on the exact candidate with full Git history; result INCOMPLETE solely `scan.gitleaks-unavailable`. The cloud brief reserves the authoritative publication scan for the fleet Mac. This result is not presented as a completed publication scan; the landing scan remains required.

## Product custody

- Pushed once through `cloud-push.py`, first attempt successful, only to `cloud/sd-lamp-deploy-faults-2`.
- Head: `7c17a3201ef326a841d91fb4dc26c035a5b1c60a`.
- Parent: `626388fca54b18499b35b9e9c5f9cbcb51b4125b`.
- Candidate and previous candidate tree are identical: `a1bc35d462efc25645656a3bb289b0a0211e77c4`.
- `git log --merges origin/main..HEAD`: empty. Exactly one ordinary candidate commit. `git diff 14646dbd HEAD`: empty, so there are no differences requiring an exception.
- Every candidate author and committer is `Run Edit Run fleet <fleet@runeditrun.com>`. Candidate commit has no trailers. Fleet cleanup hooks remain active and preserve repository hooks.
- Verify discovery REST call 1: push run 43996744448, exact candidate SHA, in progress at 2026-11-17T01:35:51Z.
- No PR was manually opened: the brief permits the push door's PR but says to open no other. Any required PR is left to the lane; push Verify is available.

- Additional touched checks: offline `pnpm source:copies` passed; `pnpm check:syntax` parsed 472/472 modules; `pnpm validate:release` validated the unchanged 1.11.20 release schema plus 20 vendor sources and 162 native state cases.
- Native owner setup/sign-in/invitations/sign-out journey passed (89.0s); independent packaged installation/owner claim/publication/restart journey passed (9.5s); built single Worker public-docs, authentication, runtime/navigation and public snapshot after D1 failure journey passed (56.4s).
- The first combined browser invocation finished 3 passed / 1 failed because the separate site output had not been built (`Build the public Lamp site before this journey: pnpm build:site`). That prerequisite was then supplied with `cloud_run npx -y @runeditrun/rer build --site` (exit 0; 38 pages, 63 files). Only that site journey is rerun; no assertion was changed.
- REST call 2 at 2026-11-17T01:46:31Z: Verify run 43996744448 still in progress on the exact candidate SHA.
- Remote ref proof at 2026-11-17T01:47:00Z: product branch advertises the candidate SHA; main still advertises the same original 626388fca54b18499b35b9e9c5f9cbcb51b4125b. No rebase, merge, force push or main write occurred.

## Behavior retained from the previous candidate

The setup command resumes a successful but incomplete migration pass within a bounded five-pass loop, refuses on no progress or budget exhaustion, and writes page settings only after the complete ledger. The public deploy choices include MAIL_PROVIDER and LAMP_RESOURCE_PREFIX in native/packaged/hosted declarations. Mail defaults to off without delivery credentials; conflicting or enabled-provider inputs retain their checks. A custom resource prefix refuses the incompatible deploy owner-claim path before mutating custody; documented environment naming remains the supported choice. Overview reports deliberately disabled mail neutrally, and public pages do not offer unusable email signup. Enabled-mail native fixtures declare their mail selection explicitly. The rer 0.2.121 adoption and its declared retained source copies are preserved exactly.

No status, Gap or Evidence cell changed. No generated view, evidence packet, release metadata beyond current main, version bump, tag or PR was committed. All report text is by Run Edit Run fleet, 2026-11-17 UTC.

- Site browser rerun: 1 passed / 0 failed (43.6s). All directly affected test registrations pass. The only remaining local red is the separately diagnosed pre-existing theme request-budget probe.
- Final source-lock regeneration and check, contract-doc check, unstaged/staged cleanliness and previous-candidate tree comparison all pass without any file change.

## Browser proof files

All screenshots are from synthetic installations, with no live provider, real customer identity, credential or exported browser state. Browser assertions use 1440; the 390 captures are visual proof.

| Screen | 1440 | 390 |
| --- | --- | --- |
| Overview with neutral mail-off status | [image](browser/overview-mail-off-1440.png) | [image](browser/overview-mail-off-390.png) |
| Public page without unusable email signup | [image](browser/public-mail-off-1440.png) | [image](browser/public-mail-off-390.png) |
| Settings with mail off | [image](browser/settings-mail-off-1440.png) | [image](browser/settings-mail-off-390.png) |
| First-run Skip | [image](browser/setup-skip-mail-off-1440.png) | [image](browser/setup-skip-mail-off-390.png) |
| First-run Read website | [image](browser/setup-read-mail-off-1440.png) | [image](browser/setup-read-mail-off-390.png) |

- REST call 3 at 2026-11-17T01:51:41Z: Verify run 43996744448 remains in progress on the exact candidate SHA.

## Final result

At 2026-11-17T01:56:43Z, REST call 4 returned **completed / success** for Verify push run **43996744448** on exact head **7c17a3201ef326a841d91fb4dc26c035a5b1c60a**. URL: https://github.com/just-every/run-lamp/actions/runs/43996744448. No generator-only exception is used. Four GitHub API calls were used in total; no failed-log calls, reruns, dispatches or extra watchers were used.

The intended change was reapplied as one ordinary commit, compared byte for byte, checked locally, pushed once and verified on its exact SHA. Before/after candidate commits: 9 → 1. Candidate merge commits: 1 → 0. Before/after test inventory: 111 → 111. The product delta remains 49 files, 850 additions and 456 deletions. All 17 directly affected registrations pass after building the required separate site artifact. The diagnosed local theme-budget probe fails identically on unchanged main and candidate; CI's full Verify is green. Nothing was weakened or broadened to hide that failure.

No contract clause claimed; these are deploy-fault follow-ups.

Clause status changes: none. PR: none manually created, as directed by the brief. Product blockers: none. Authoritative fleet publication scan and landing remain the fleet's responsibility; the local scan attempt is explicitly INCOMPLETE for unavailable Gitleaks. No deployment, production-provider acceptance, release, tag or landing is claimed.

The evidence transport publishes only this report and explicitly selected actual non-secret receipts, logs and synthetic screenshots to evidence/sd-lamp-deploy-faults-2, separately from product custody. The product clone is deleted after evidence transfer succeeds; all report files remain under the fleet task's packet directory.

Run Edit Run fleet, 2026-11-17 UTC.
