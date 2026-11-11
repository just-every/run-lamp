# Lamp incident composer custody report

Task: main-lamp-incident-publish-1-c1  
Repository: just-every/run-lamp  
Branch: cloud/main-lamp-incident-publish-1-c1  
Product head: cfea30d03d857dc3e0a13fcc6279c0c6bedc23d4  
Contribution PR: https://github.com/just-every/run-lamp/pull/334

## Result

The original incident-composer commit is now published on the requested continuation branch. Current main at ccc4f7a2f1c18223078b2f5e03440fd413d1575d is already its parent/ancestor. Both required fetch-and-merge attempts reported “Already up to date.” No merge conflict, integration fix, new product commit, source change, history rewrite, or original-branch change was needed. The final candidate contains no CI skip marker.

The carried behavior explains why Publish update is disabled, associates the visible reason with its button, retains the published audience in a later draft, refreshes Brief and Impact after publication, and presents resolved incidents as history and existing actions without a reload. No new feature or unrelated finding was added.

## Plan and execution

The complete plan is PLAN.md. Fleet identity and bundle-only Git authentication, push protection, and commit hooks were installed before product work. Only the declared product repository was cloned, with full history and filtered blobs. The continuation branch starts exactly at the supplied published source head. Lamp's repository instructions, contract, generated acceptance record, divergence record, seed manifest, canonical local-run instructions, and verification workflow were reviewed.

The existing operator publication journey was run without adding any registration. The test fixture's temporary visual edit was restored by its teardown, and the product checkout was clean before publication. Source-lock regeneration was the final source operation and made no tracked change; its check passed. Every candidate author/committer and trailer was inspected. The carried commit uses the owner's permitted identity James Peter <github@zemaj.com> for both author and committer and has no co-author trailer. A private comparison against injected secret values found none in the candidate diff; no values or environment dumps entered this packet.

The named branch was pushed successfully on the first attempt through cloud-push.py. PR #334 remains open against main for the fleet lane; this task did not merge it or push main. Product custody and evidence publication remain separate. Base's full publication scan and landing are deferred to the fleet machine under the explicit cloud adaptation; this report does not claim that scan or a landing.

## Local verification

- `pnpm typecheck`: passed.
- `cloud_run node --test --test-concurrency=1 --test-name-pattern='compiled visual edits and the operator publication journey' tests/e2e/publishing-browser.test.mjs`: passed, 1 selected journey, 0 failed, 0 skipped, 105372 ms overall.
- `node src/base/contract-docs.mjs check`: passed, 0 prose errors and 0 warnings; generated documents current.
- `node scripts/edition-authoring/cli.mjs lock` followed by `node scripts/edition-authoring/cli.mjs check`: passed; regenerated source lock identical to committed lock.
- Browser assertions ran at 1440. The published, missing-audience, and resolved incident screens were each captured and visually reviewed once at 1440 and 390 using /usr/bin/chromium with --no-sandbox. The six screenshots and their hashes are in local-verification-receipt.json. The fixture used synthetic test records, closed its browser, and stopped its own server.

The behavioral checks cover the native publication flow, visible refusal and audience repair, retained peak impact including resolution, updated known facts after publication, an empty next draft, and removal of the live composer after resolution. The same existing journey retains its previous autosave, review, privacy, history and report assertions.

The provided toolchain script selected the VM's Node 24.19.0 and pnpm 10.12.4 for direct local checks; the repository declares Node 22.20.0, which the hosted workflow selects. No toolchain pin was changed. The pinned rer setup completed successfully with the fleet owner and no external provider account.

## Counts and judgments

Before → after: 57 done → 57 done; 132 partial → 132 partial; 55 missing → 55 missing; 244 total → 244 total. Test inventory: 78 registrations plus 10 assertion scripts = 88 checks before and after, below the 200 cap. No tests were added, deleted, skipped, or weakened.

No clause Status, Gap, or Evidence changed, and neither generated view was committed. INCIDENT-001, DRAFT-004 and UPDATE-005 remain partial in the source; INCIDENT-002 retains main's existing done judgment. The requested PARTIAL claim lines below describe only this round's proof scope and do not demote that source judgment. No DONE claim is made by this builder.

CLAIM INCIDENT-001 PARTIAL points=3 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM INCIDENT-002 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM DRAFT-004 PARTIAL points=1 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM UPDATE-005 PARTIAL points=6 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey

## Exact-SHA CI

The original branch Verify 43014887342 is confirmed successful on this same SHA. The new continuation branch push Verify is 43020656858:
https://github.com/just-every/run-lamp/actions/runs/43020656858

Verify 43020656858, push attempt 1, completed with conclusion success on the exact product SHA cfea30d03d857dc3e0a13fcc6279c0c6bedc23d4. No failure, rerun, or repair was needed. Discovery and observations were at least 300 seconds apart with one watcher. Five GitHub calls were used, including the PR creation. Actual discovery, observation, final CI receipt and API-call ledger files are included.

## Evidence and custody

The packet contains the complete plan, this report, baseline counts, local verification receipt, complete sanitized selected-test and typecheck logs, contract-check output, candidate identity audit, successful product push receipt, PR receipt, CI discovery and observations, and the six relevant screenshots. Files are explicitly selected regular files; no credential, environment dump, browser session, or private held-out material is selected.

The evidence publication target is refs/heads/evidence/main-lamp-incident-publish-1-c1 in just-every/run-lamp. The separate transport manifest binds the selected files to this exact product branch and head; the terminal EVIDENCE line carries its returned ref and report-only commit. This report makes no product acceptance or landing claim from evidence transport.

No product blocker remains. The fleet retains its independent publication scan, landing checks, and main-only release authority. No main push or merge was performed here.
