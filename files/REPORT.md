# Lamp mail-off canonical setup continuation

Author: Run Edit Run fleet (Codex), 2026-11-15.
Repository: just-every/run-lamp. Branch: cloud/main-lamp-mail-off-1-c1.

## Plan

1. Set fleet Git identity, refresh the launcher, install bundle-only Git authentication, the required push guard, evidence entrypoint and clone-local forwarding commit hooks. Read the launcher and Lamp instructions and inline RULES.md.
2. Clone Lamp with full commit/tree history and partial blobs. Fetch the original mail-off round and start the continuation from 46fa4e5275960b72f895611b9cacab3539839c62. Compare main with f495b89afd9f6832e4d4807018d91fa4c4670147 and preserve any newer main work before publication.
3. Serialize rer-setup.json using JSON.stringify(manifest, null, 2) plus one newline, preserving parsed content. Review the other four touched manifests and their loaders for equivalent byte requirements; change only what the documented rule or failing checks require.
4. Install frozen dependencies and run local rer setup and production build through cloud_run. Run independent-release.test.mjs, rer-mail.test.mjs, dependencies.test.mjs and the native typecheck. Capture the carried mail-off sign-in screen at 1440 and 390 through its existing browser journey. Do not run full local rer verify, deploy, send mail or use a provider account.
5. Fetch current main before publication, integrate only if needed, regenerate the source lock last and check it. Commit the canonical bytes and source lock, with no generated contract views, evidence, release bump, CHANGELOG, VPAT or release-history files. Inspect every candidate identity and trailer, then push the named branch through the guard.
6. Open the repository-required draft PR for the lane. Make the first exact-SHA Verify REST discovery at least 15 minutes after the product push; subsequent reads are at least 300 seconds apart. Keep two of ten calls for a failed job log and diagnose within scope. Leave the required Opus gate and publication scan to the fleet.
7. Write complete actual non-secret results and receipts here, publish selected packet files exclusively to evidence/main-lamp-mail-off-1-c1, verify product custody and remove the pushed clean clone at task end. Report the exact product SHA, CI run, claims, remaining gap and lane POST line.

## Initial findings

Main remains f495b89afd9f6832e4d4807018d91fa4c4670147 at initial fetch. The original round has three commits, all authored and committed by Run Edit Run fleet. It did not change CONTRACT.md or generated contract views. The setup loader rejects noncanonical rer-setup.json bytes explicitly. Its three JSON-escaped en dashes differ from JavaScript JSON.stringify output; serialization preserves the parsed document exactly.

The original round report was recovered read-only from evidence/main-lamp-mail-off-1 at 1bd4f29c1d82822dea93cbc177ffbe5f1a72a309. Its claims and limits are retained, with fresh checks to be recorded for this candidate. No prior red Verify is treated as current success.

## Manifest review and counts

The continuation changes only three byte spellings in rer-setup.json: escaped en dashes become their literal Unicode characters under JavaScript serialization. A deep comparison against the original head confirms identical parsed content in all five reviewed manifests. deploy.json, hosted-check.json and hosted-check-managed.json already use canonical bytes. seed.json has noncanonical formatting but its loader has no equivalent canonical-byte requirement; it is deliberately left unchanged within this brief. MANIFEST-RECEIPT.json records the comparison.

No tests were added, removed, skipped or weakened. Current inventory is 101 registrations plus 10 assertion scripts, 111 checks before and after this continuation. Relative to main, the carried original round is 98 → 101 registrations and 108 → 111 total checks. Clause status counts stay 60 done, 129 partial and 55 missing (244 total). CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain unchanged. COUNTS-RECEIPT.json records the inventory.

Local setup and production build succeeded. The contract-doc generator check passed without needing regeneration: no contract source was changed. Node v24.19.0 and pinned pnpm 10.12.4 ran the local checks under the required toolchain shim. Setup uses disposable local data only. No live provider or mail proof is claimed.

## Local results and product custody

All 10 tests across the three requested files passed, with zero failures or skips. The previously failing packaged-installation journey now builds its delivery artifact and completes owner claim, publication, persistence, restart and preview protection. The carried mail-off and dependency journeys also pass. Native TypeScript checking passed. The existing browser test asserts the sign-in behavior at 1440 and records its screen once at 1440 and 390; both actual PNGs are in this packet. Browser contexts and Worker runtimes closed normally.

After the final main fetch (still f495b89afd9f6832e4d4807018d91fa4c4670147), the source lock was regenerated last and checked successfully. The continuation commit changes only rer-setup.json and its one source-lock hash. No content, policy, contract status, test, version or release metadata changed in the continuation. It carries all three original round commits without rewriting published history.

Candidate: 5e532d8ccf7bd122e74edbef4e803379d48d20e9. Commit: Canonicalize Lamp setup manifest bytes. All four candidate commits, including their complete messages and all parents outside main, passed fleet author/committer/trailer review. The final message has no skip marker. Product push succeeded on the guard's first attempt to cloud/main-lamp-mail-off-1-c1. No main push, merge or deployment was performed.

CLAIM ACCESS-001 PARTIAL points=3 tests=tests/auth-adoption/dependencies.test.mjs#ACCESS-002 mail-off rer signin follows native deployment custody and rer deploy --rotate-secret INSTALLATION_KEY preserves access while retiring the old key
DEFAULT ACCESS-001: Explicit none uses Base's guarded owner-only rer signin with deploying credentials and recorded deployment ownership; missing/deferred provider selection never disables email.
GAP ACCESS-001: Only overlapping point 3 is claimed; the existing session-secret terminal-flow obligations and remaining clause proof are unchanged. Local synthetic edge proof establishes no live deployment or provider acceptance.

The required Opus gate and fleet publication scan remain landing work; this cloud cannot run the Mac publication scan. No additional scope is proposed. The original report is included as historical context; its old blocked result is superseded only by the actual current candidate CI result recorded separately.

Draft PR: https://github.com/just-every/run-lamp/pull/392, targeting main with exact product head 5e532d8ccf7bd122e74edbef4e803379d48d20e9. Original draft #391 is left unchanged. A Git ref probe confirmed the named remote branch at the product SHA after the guarded push.

The original management report, management typecheck, synthetic dry-run and product/check/CI/PR receipts are copied under original/ as historical actual records. They identify their original product SHAs and are not substituted for current exact-SHA CI. Fresh current receipts and logs live at the packet root.

## Exact-SHA CI and final result

At 2026-11-15T16:52:00Z, push Verify 43736477796 completed successfully on 5e532d8ccf7bd122e74edbef4e803379d48d20e9:
https://github.com/just-every/run-lamp/actions/runs/43736477796

The first discovery ran 15 minutes after the product push. It returned completed/success immediately; no further status call, failed-job log, workflow rerun or second product push was necessary. Two of ten GitHub calls were used: draft PR creation and exact-SHA Verify discovery. CI-RECEIPT.json records the terminal result and CI-DISCOVERY.json retains the actual REST response. No result from the original red run or a different SHA is used for this READY claim.

The reported packaged-installation blocker is resolved by canonical JSON bytes, with unchanged parsed manifest content. All requested local tests and typecheck passed, as did setup, build, contract-doc and source-lock checks. Full local rer verify was not run; the exact-SHA branch Verify provides the full wall. Product blockers: none. Required Opus gate, publication scan, main landing and subsequent release work remain with the fleet; no gate is waived, and no clause status was promoted here.

The full relevant packet is published separately to evidence/main-lamp-mail-off-1-c1 through the required report-only entrypoint. It includes this complete plan/results report, actual current receipts/logs, 1440/390 browser proof and selected original shared records. Evidence publication conveys reports only. The product branch remains cloud/main-lamp-mail-off-1-c1 at 5e532d8ccf7bd122e74edbef4e803379d48d20e9. After evidence transfer and remote custody are verified, the clean product clone is removed as instructed; reports remain outside it.

POST lanes/main/INBOX.md: main-lamp-mail-off-1-c1 canonicalized rer-setup.json without content changes and regenerated its source lock; original mail-off round retained; no clause-status changes (60 done/129 partial/55 missing); SHA 5e532d8ccf7bd122e74edbef4e803379d48d20e9; Verify 43736477796 success; draft PR https://github.com/just-every/run-lamp/pull/392; required Opus gate and publication scan remain with the fleet.

READY branch=cloud/main-lamp-mail-off-1-c1 head=5e532d8ccf7bd122e74edbef4e803379d48d20e9
