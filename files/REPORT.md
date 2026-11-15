# Lamp audit record labels carry

Author: Run Edit Run fleet, 2026-11-15.

Result: the original audit-label change is carried as one linear commit, a3ab249f53fc8923fea5215a72d2cd41b4a9c7b6, on cloud/main-lamp-audit-record-labels-1-c1. Both touched journeys, typecheck, build and integrity checks pass; exact-SHA Verify 43680013865 completed successfully. PR: https://github.com/just-every/run-lamp/pull/387. TEAM-007 remains PARTIAL, with points 1 and 2 claimed. Checks remain 103 to 103. No product blockers. Fleet publication scan and landing remain the fleet's gates.

Plan:
1. Read launcher and seed rules, current main and prior audit candidate/resolver.
2. Start cloud/main-lamp-audit-record-labels-1-c1 at current main and squash the original audit-label candidate, preserving all newer main tests, product changes and divergence text.
3. Reproduce the live-label failure with the carried public-door journey on main's audit resolver; then restore the carried resolver and run that journey, the touched subscriber delivery journey and typecheck. Capture changed audit screens at 1440 and 390.
4. Preserve CONTRACT.md and its generated views unchanged; regenerate and check the source lock last. Fetch main and rebase the single unpublished commit before its only product push.
5. Inspect all candidate identities, messages and trailers, push with the fleet guard, open a PR per AGENTS.md and watch exact-SHA Verify by REST at no more than one call per 300 seconds per run.
6. Publish this report and actual non-secret receipts separately on evidence/main-lamp-audit-record-labels-1-c1. The fleet owns the publication scan and landing.

Initial findings:
- Current main is 1936e7f3 (full identity recorded in receipt). Its audit resolver has no subscriber or incident-report resolution, so the original defect is still present.
- Original ed52f740415afc4959285a72afb6d26d28c18edf extends existing tests, adding no registrations.
- Resolver cf00e46d8a3be9c6551d14d5fcd16190fee3aa67 preserves both audit subject labels and visible subscriber CSV component names. This carry retains main's complete CSV decision and newer Sorry notice scope changes.
- Squash conflicts are limited to DIVERGENCE.md and sources.lock.json. Main's divergence entries are retained whole below the carried audit entry. The lock will be regenerated.
- TEAM-007 remains PARTIAL. No Status, Gap or Evidence cell is edited.

Local preparation:
- The carried public-door audit journey fails against main's unmodified resolver at live-subject identity resolution (baseline-audit.log). Static review independently confirms subscriber and incident-report families fall through to the Removed item default.
- Pinned Node 22.20.0 installed for candidate validation. Initial setup and baseline reproduction used the environment's Node 24.19.0 through the supplied toolchain; candidate checks use the pin.
- Typecheck passed. Contract document check passed with 0 errors and 0 warnings. Source lock was generated last and its check passed.
- Test inventory: 93 registered cases + 10 assertion scripts = 103 before and after. No registration added, removed, skipped or weakened.
- One product commit created; no merge commits. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged. Main's newer CSV component-name and Sorry scope source/tests are byte-for-byte retained.

Candidate audit results:
- Existing audit-label browser registration passed (1/1) on Node 22.20.0, using /usr/bin/chromium with --no-sandbox.
- The journey proves active and pending subscriber labels, report incident reference/title, other surviving record labels, true removals, erased-destination absence from JSON/view/CSV, actor/time attribution, complete pagination, time/action/actor selection and CSV parity.
- Browser proof captured and visually reviewed the live audit screen and post-erasure screen once each at 1440 and 390. The substantive assertions run at 1440.
- The carried subscriber privacy assertions preserve storage erasure: current read labels use live records, persisted audit rows never copy destinations, and erased email/phone/webhook contacts remain absent from audit view and CSV.

Custody and remaining gates:
- Before candidate publication, fetched main again: it remains 1936e7f3d407b37c7c97eca193d9052b1fc3cd01. An explicit rebase will run immediately before the guarded push.
- Complete Base publication scan cannot run in this cloud VM; the authorized fleet Mac lander retains that mandatory gate. This report's diff and packet inspection are narrower checks and do not stand in for it.
- No release, deployment or default-branch write is requested or performed. A pull request will be left for the fleet according to Lamp AGENTS.md.

Local completion:
- Selected subscriber consent/delivery/export/erasure registration passed (1/1, 375.454 seconds), including the carried Add, token Add and SMS privacy assertions plus main's newer CSV-name journey.
- Both touched registrations passed, with no skips. Build, typecheck, contract docs and source lock check passed. No full local verifier was run.
- All five carried code/test files match ed52f740415afc4959285a72afb6d26d28c18edf byte for byte. Only the signed divergence carry entry and regenerated lock differ from that original carry.
- Final main fetch and explicit rebase confirmed the single commit was already on current main. Candidate identity/trailer, scope, preserved-main and clean-checkout checks were repeated after rebase and passed.

Product publication:
- Guarded push succeeded on attempt 1 to cloud/main-lamp-audit-record-labels-1-c1. Independently re-read the remote ref and verified a3ab249f53fc8923fea5215a72d2cd41b4a9c7b6.
- There is exactly one product commit above main and no merge commits. Author and committer are Run Edit Run fleet <fleet@runeditrun.com>; commit trailers are absent.
- The first exact-SHA Actions discovery returned no runs because it immediately followed the push. A single watcher waits at least 301 seconds before the next API call; complete actual responses and call timestamps are retained in ci-api-receipt.json.

Final results:
- Exact-SHA Verify completed/success on a3ab249f53fc8923fea5215a72d2cd41b4a9c7b6: https://github.com/just-every/run-lamp/actions/runs/43680013865. No rerun, repair or additional product commit was needed.
- A single watcher used five REST calls, each at least 301 seconds apart, including discovery. One additional REST call created PR https://github.com/just-every/run-lamp/pull/387 for the fleet. Total GitHub API budget used: 6 of 10.
- Product branch remains one commit above its base with no merges. Complete source publication scan and landing remain the fleet Mac's responsibility; this cloud did not write main or deploy.
- No Status, Gap or Evidence cell changed. TEAM-007 stays PARTIAL; acceptance points 1 and 2 are supported by the existing audit-label journey. The remaining audit obligations are not claimed.
- Actual reports, check logs, receipts and four changed-screen images are selected explicitly for report-only publication on evidence/main-lamp-audit-record-labels-1-c1. No credentials, environment dump, held-out gate material or symlinks are selected.

CLAIM TEAM-007 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys
GAP TEAM-007: This carry does not claim the remaining audit obligations; the existing contract status, Gap and Evidence are unchanged.
Author: Run Edit Run fleet, 2026-11-15.

Blockers: none.
