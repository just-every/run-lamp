# Lamp maintenance migration metadata correction

Date: 2026-11-17 UTC. Tag: sd-lamp-maint-1-c1. Repository: just-every/run-lamp.

## Result and provenance

Product branch cloud/sd-lamp-maint-1-c1 is pushed at 77afda40065ed1a462bdbd069b0cb6ab417929af, exactly one new commit on 2b8e632f16dd3ff2006ae72e9c3ff3649c2ce3b9. The source remote head matched the brief. Existing draft PR #406 remains open at its original cloud/sd-lamp-maint-1 head: https://github.com/just-every/run-lamp/pull/406. No new PR was created or existing PR changed. No main update, merge, rebase, tag or release was performed.

## Plan

The full executed plan is PLAN.md. Inspect the source head and validator; reproduce the missing migration assertion; add the single authorized migration record and its schema-required buyerSteps; run release validation, typecheck and source-lock integrity; regenerate the lock last; make one fleet commit; scan all candidate commit identities and messages; push through the cloud guard; require exact-SHA Verify; publish reports only on the evidence ref; remove the depth-1 blobless product clone after verified custody.

## Changes and validation

RELEASE.json migrations changed from zero entries to one entry, 0082_repeated_maintenance_cancellation.sql. Its buyerSteps describe backup, ordinary ordered deployment after 0081, retained maintenance/notice history and testing repeated cancellation after reinstatement. Every other RELEASE.json field is byte-for-byte preserved by a targeted replacement, including the authorized unchanged version, historical notes and agent instructions. Those existing notes still describe the original released version as having no migrations; the lease authorizes only this migration entry, so those unrelated fields remain intact.

scripts/release-metadata.mjs coreMigrationIds sorts SQL filenames. assertReleaseMigrationInventory walks the complete retained predecessor chain, requires its migration IDs as an ordered prefix and compares the current list with the remaining migration suffix. The actual expected suffix is only 0082_repeated_maintenance_cancellation.sql. schema/RELEASE.schema.json requires migration objects with id and buyerSteps. The predecessor releases cover 0081 and earlier.

Before correction, node scripts/validate-release.mjs exited 1 with the exact missing-0082 assertion from the brief. After correction it exited 0 and validated version 1.11.22. The vendor catalog also validated 20 sources and 162 native state cases. pnpm typecheck exited 0 (TypeScript --noEmit). The supplied toolchain selected pnpm 10.12.4 and used VM Node 24.19.0, which differs from the checkout Node 22.20.0 pin; its engine warning is retained in typecheck.log.

The source-lock check passed on the unmodified parent, then failed as expected after RELEASE.json changed. The documented node scripts/edition-authoring/cli.mjs lock was run last and check passed. sources.lock.json differs only in the RELEASE.json SHA-256, with no toolchain or source-origin changes. git diff --check passed. The product commit contains only RELEASE.json and sources.lock.json, seven insertions and two deletions. No application, migration SQL, contract, generated view, CHANGELOG, package manifest or rer pin changes were made by c1.

All candidate commits, including the inherited source commit, have Run Edit Run fleet author and committer with fleet@runeditrun.com and no co-author trailers. Hooks remained active. Product push succeeded on the first attempt. Actual local and push receipts are local-receipt.json and push-receipt.json; the exact patch and candidate messages are product.patch and candidate-identity.txt.

## Clauses and counts

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

There are no clause-status changes. Core remains 60 done / 129 partial / 50 missing (239); Agent surface remains 0 done / 0 partial / 5 missing (5); Later remains 0 / 0 / 0 (0); full target remains 60 done / 129 partial / 55 missing (244). CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain unchanged.

## Exact-SHA CI

Verify push run 44095306243 was discovered on exact head 77afda40065ed1a462bdbd069b0cb6ab417929af at 2026-11-17T13:41:59Z, initially queued: https://github.com/just-every/run-lamp/actions/runs/44095306243. Polling uses gh api, no fleet watcher, no alternate credentials, and at least 300 seconds between calls for the run. Final status and local full-verifier outcome will be appended after completion.

At 2026-11-17T13:45:20.782563+00:00, the broader local verifier completed all build steps successfully (contract docs, source copies, source lock, typecheck, syntax, release validation, visual source checks, application build and site build) and entered owner-journey tests. No local failure has been observed at this point.

Verify 44095306243 completed with failure on the exact product SHA. Plan, build and seven test shards passed; runtime failed, which caused the final aggregate check to fail. The failed runtime job is 134081537475. The archive command `gh run view 44095306243 --repo just-every/run-lamp --job 134081537475 --log-failed` succeeded once. It records a real ERR_ASSERTION in the AUTO-003 NOTIFY-006 follow-up journey: tests/e2e/helpers/follow-ups-flow.mjs:112 received undefined where 2026-11-17T12:48:20.283Z was expected. See runtime-failure.txt and ci-jobs.json. This is not a generated-contract-view failure or a provider transport failure. No failed-job rerun is authorized for a real assertion. The c1 lease permits only RELEASE.json migrations and the necessary lock digest, so a product/test change is outside this task's authorization. Successful exact-SHA Verify remains a real blocker; no READY claim is made.

Read-only diagnosis: follow-ups-flow.mjs creates the future maintenance with a start 23 hours from now, then line 112 requires a reminder due 24 hours before that start. The inherited maintenance follow-up query now excludes reminders covered by an announcement published within 24 hours of the start. The freshly created maintenance therefore has no reminder row, producing the observed undefined value. The correction needs a separately authorized code/test decision, for example a fixture with an older announcement when testing an actually owed reminder, while preserving the owner’s recent-announcement suppression. No test was changed or rerun to conceal the assertion.

The broader local verifier was deliberately interrupted with SIGINT at 2026-11-17T14:09:37Z after the exact-SHA CI assertion had been diagnosed as outside the lease. Exit 130; its own supervisor confirmed that all owned children were stopped. The build, ownership and portability shards completed successfully; imports was in progress (eight tests passed and one was cancelled). No full-local-verifier success is claimed. local-verifier-shards.json preserves the actual completed-step receipts. There are no remaining task-started server or browser processes.

The final aggregate job 134089642381 was also read once using gh run view --log-failed; it reports the runtime shard as unsuccessful. Both failed-job archive reads succeeded. Eight GitHub calls were used in total (one PR read, one exact-SHA discovery, three run polls, one jobs read and two failed-job log reads); no rerun or additional polling was performed.

Final disposition: BLOCKED branch=cloud/sd-lamp-maint-1-c1 head=77afda40065ed1a462bdbd069b0cb6ab417929af prerequisite="Successful exact-SHA Verify". The single authorized correction remains pushed and recoverable. Evidence publication is report-only and does not establish product READY, acceptance or landing.
