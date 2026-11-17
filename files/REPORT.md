# sd-lamp-import-sorry-1-c1 — release metadata repair

No contract clause claimed; this is release metadata.

## Authorized scope and plan

The declared write repository is just-every/run-lamp. The task repairs the release inventory assertion for MOVE-001's already-implemented Sorry field accounting. PLAN.md contains the complete execution plan. No PR, tag, release, version bump, CHANGELOG change, rer pin change, product-code change or test change is authorized.

## Provenance

The source ref cloud/sd-lamp-import-sorry-1-rebase-7e89344cf612377ddb821c707de47158e78a2820 was fetched and confirmed at 7e89344cf612377ddb821c707de47158e78a2820. main was a6df8fc6b186b28e1f9ac142f79c0081abdfdb8c. Main is its ancestor, with exactly two intervening commits and zero merge commits. The new named branch starts at that exact source; main was never merged. See provenance-receipt.json.

## Validator finding and change

scripts/validate-release.mjs calls assertReleaseContractInventory in scripts/release-metadata.mjs. That function compares the current CONTRACT.md with the complete retained predecessor chain and requires a `changed` entry for a published clause whose meaning differs. RELEASE.json is the current 1.11.22 delta, previousVersion 1.11.21; it has no separate unreleased section. schema/RELEASE.schema.json requires change, summary, was and now for a changed clause.

The original assertion was reproduced locally; release-before.log records the exact failure: `1.11.22 MOVE-001 changed meaning without a changed release entry`. One MOVE-001 entry now records `change: changed`, a summary of the Sorry field accounting, and the complete old/new clause meanings normalized from release-history/1.11.21.CONTRACT.md and CONTRACT.md. release-after.log records standalone validation success. The validator demanded no version bump or CHANGELOG change. Release-entry count changes from 0 to 1; MOVE-001 changes from absent to the `changed` marker. All other top-level release fields are byte-for-byte unchanged in value (release-scope-receipt.json).

The first ordered build pass found the expected stale source lock after the metadata edit. The documented lock command was run last after the release edit, and its check passed. Only the RELEASE.json file hash changed in sources.lock.json. See source-changes.json and source-lock-receipt.json. Existing release prose and every other release field were preserved under the narrow lease.

## Clause assessment and counts

MOVE-001 remains partial. No clause status, acceptance text, gap or evidence judgment changed in this repair. CONTRACT.md and generated ACCEPTANCE.md/docs/CLAIMS.md are unchanged relative to the required source candidate. Full-target counts before and after are 60 done, 129 partial, 55 missing, 244 total. Core is 60 done, 129 partial, 50 missing, 239 total; Agent surface is 0 done, 0 partial, 5 missing. See counts-receipt.json.

## Local verification

Frozen dependencies were installed and the checkout's rer setup completed with fleet@runeditrun.com, non-interactively, using cloud_run. The final ordered build used pinned Node 22.20.0, pnpm 10.12.4 and rer 0.2.121. Clone-local fleet hooks were installed after cloning and reinstalled after setup, preserving repository hooks. No browser or development server was started for this metadata-only change.

The initial ordered build ran all nine steps; source:check alone failed before the required lock refresh. build-before-lock.log and build-before-lock.json preserve that actual run. All nine steps passed in the final ordered run: check:contract-docs, source:copies, source:check, typecheck, check:syntax, validate:release, verify:visual:source, build:app and build:site. The final build command sequence and receipt are recorded in build.log and build-receipts/build.json. Scope and whitespace checks accompany the terminal receipt. Exact-SHA CI supplies the full product/browser verification; local execution is limited to the brief's complete build step list.

## Publication and terminal result

One new commit, e00d7bc55372c053a2423fcd01c29958b897c0a8, was made on the required source and pushed once to cloud/sd-lamp-import-sorry-1-c1; the guard succeeded on attempt 1. Every one of the three candidate commits, including all parents, has the fleet author and committer, with no trailers. The remote branch head was independently confirmed with Git. The product worktree is clean. No PR was created.

All nine final ordered local build steps passed. The initial source-lock failure is fixed and retained honestly in the before-lock receipts. No generated-view exception was needed. Exact-SHA Verify run 44126537925 was discovered in progress. Verify completed successfully on exactly e00d7bc55372c053a2423fcd01c29958b897c0a8, observed at 2026-11-17T16:51:32.398671+00:00. See ci-status.json and ci-polls.json. Run: https://github.com/just-every/run-lamp/actions/runs/44126537925. Five GitHub calls were used; no rerun, failed-job log request or generated-view exception was required.

Terminal product custody: READY branch=cloud/sd-lamp-import-sorry-1-c1 head=e00d7bc55372c053a2423fcd01c29958b897c0a8. There are no blockers. Product changes are exactly the MOVE-001 release entry and its source-lock identity; no contract clause is claimed. The clone is scheduled for deletion after this packet is published and independently fetched with manifest and file-hash verification. The actual packet remains outside the clone. Product custody and report-only evidence custody are separate. The fleet's publication scan and landing occur outside this cloud task.
