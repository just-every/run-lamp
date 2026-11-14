# sd-lamp-tz-release-fix-1

Repository: just-every/run-lamp
Product branch: cloud/sd-lamp-tz-release-fix-1
Base: bef5115afc3972d78962fbb899a2a32433f5f3a6
Merged timezone candidate: bd1615809f016c3d29c0889a4efe77eadc9aaef0

## Plan

1. Refresh the fleet launcher, install the decrypted-bundle Git helper and push guard, clone only the declared repository with full history and blob filtering, configure fleet identity and preserved repository hooks, and create the named branch from origin/main.
2. Read repository instructions, contract, relevant acceptance and owner context, the release validator/schema, and the timezone candidate. Merge the specified branch without rewriting its published history. Resolve contract source before generated documents if needed, retaining main's newer judgments.
3. Reproduce the SETUP-002 missing-release-entry failure and add only its contractChanges.changed record, with summary, was and now; preserve version 1.11.15 and all other release metadata.
4. Run validate:release, typecheck, contract document generation/check, and the existing website-onboarding test. Capture the changed setup/public screens at 1440 and 390 with external runtime instrumentation; original assertions stay at 1440. Add no tests.
5. Restore ACCEPTANCE.md and docs/CLAIMS.md from origin/main, regenerate sources.lock.json last and check it. Confirm the scope and unchanged clause judgments, counts, migrations and versions. Commit the merge and release entry together with fleet identity and active hooks.
6. Audit all candidate commit identities and trailers, including the published side parent, then push only the named product branch once using the fleet guard. Open a PR as required by the repository. Record any exact-head CI discovery without waiting, following this brief's explicit instruction to never wait for CI.
7. Publish this actual non-secret packet to the separate evidence ref and return product custody and evidence provenance independently.

## Results

The specified timezone branch merged cleanly into current main. SETUP-002 acceptance point 2 now preserves a valid saved zone and uses a valid browser zone or UTC only when the saved zone is invalid. The merged implementation also attributes settings writes to the operator and audits the previous and next zone in the same batch; public labels use the current date's Standard or Daylight name. No additional implementation edits were needed.

The original validator failure was reproduced exactly: `1.11.15 SETUP-002 changed meaning without a changed release entry.` Adding SETUP-002 with change=changed and summary/was/now makes validate:release pass. No version bump is required. Every other release field is unchanged.

Contract generation writes one view (ACCEPTANCE.md), and check:contract-docs passes immediately afterward with zero prose errors/warnings. Both generated view files are then restored whole from origin/main as required. The restored check fails only with `ACCEPTANCE.md: generated content differs; run contract-docs write.` This is the documented lander-owned generation exception; no generated view is committed.

All Status, Evidence and Gap cells remain byte-for-byte identical to main. SETUP-002 remains PARTIAL, points=none. Counts before and after: Published 42 done / 65 partial / 0 missing / 107 total; Target and push further 18 / 64 / 55 / 137; All 60 / 129 / 55 / 244. No migration, incident 0080/0081/0082 work, tick work or size work is included.

The supplied cloud toolchain selected pnpm 10.12.4 and host Node 24.19.0 (the supplied script preserves a newer Node); pnpm reports the repository's Node 22.20.0 engine warning. The rer setup uses the repository's tooling and completed successfully. No setup output, owner entry links or private environment values are included in this packet.

Detailed command outcomes, product SHA, PR and CI provenance are recorded in receipt.json and the selected actual log files. Browser screenshots are evidence captures from the existing test, using Chromium /usr/bin/chromium and --no-sandbox. No test source is added or altered beyond the already-built candidate's update.

## Publication and CI provenance

Product head: e052f51c3d775c535220d9291d94e3c7aefd7894. The merge has main bef5115afc3972d78962fbb899a2a32433f5f3a6 and timezone candidate bd1615809f016c3d29c0889a4efe77eadc9aaef0 as parents. The release metadata is included in that same first real commit. The complete identity/trailer audit passed for both candidate commits, including the side parent. The guarded product push succeeded on its first attempt; no history rewrite, main push or retry was needed.

PR: https://github.com/just-every/run-lamp/pull/378

A single exact-head REST discovery found push Verify 43606914437 already completed/failure, PR Verify 43606947725 in progress, and dynamic PR #378 run 43606945460 in progress. No polling or waiting was performed. Five GitHub calls were used out of ten, including one archive read for each failed job.

Push Verify 43606914437 fails only at `ACCEPTANCE.md: generated content differs; run contract-docs write.` The build exits before producing build.json, so artifact retention also fails, dependent shards skip and the final aggregate reports missing artifacts. These are consequences of the documented lander-owned view exception, not independent product failures. The actual failed-job archive extracts are included. No completed/success workflow is claimed. This exception is explicitly allowed for READY by the cloud instructions; the lander regenerates the view and requires its own exact-SHA checks before landing.

Requested local checks: validate:release PASS; typecheck PASS; generated contract check PASS (0 errors, 0 warnings); existing website-onboarding test PASS (1/1); source lock/check PASS; scope assertions PASS. Both generated views remain main's bytes and the product working tree is clean. The full local verifier was not run; the brief's named touched checks were run. The source lock was regenerated after all product and contract edits. Browser contexts and the test-owned server were closed by the test and the subreaper command completed.

CLAIM SETUP-002 PARTIAL points=none tests=tests/e2e/website-onboarding.test.mjs#SETUP-002 — a fresh owner gives their website first; Lamp fills in the page from it, or from the status page it already runs, a site it cannot read leaves calm defaults, and the edited result is what customers see

No unresolved product blocker. The evidence packet is published independently to refs/heads/evidence/sd-lamp-tz-release-fix-1; that transport does not establish product acceptance or landing.
