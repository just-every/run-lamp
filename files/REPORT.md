# Lamp fault 8: bounded R2 snapshot retention

Run Edit Run fleet, 2026-11-17 (UTC). Tag: sd-lamp-r2-retention-1.
Repository: just-every/run-lamp. Branch: cloud/sd-lamp-r2-retention-1.
Starting main: 7c17a3201ef326a841d91fb4dc26c035a5b1c60a.

No contract clause claimed; this is the fault 8 retention follow-up.
Clause status changes: none. Contract and generated acceptance/claims documents remain unchanged.

## Plan

1. Inspect the publish service, blob adapter, Durable Object, native removal and repository rules; record the actual key scheme and success boundary.
2. Add cleanup only after acknowledged artifact/replica delivery, successful conditional pointer advance, pointer readback, completed bookkeeping and publication event. Keep its exact predecessor. Delete explicit keys only for generations strictly below that predecessor.
3. Bound discovery and deletion, retain sequence metadata during partial deletion, and support published legacy versions using their retained bundle sequence.
4. Exercise real authenticated incident publication against migrated D1, local R2 and the actual SnapshotCache; prove five publishes, failure preservation and draining ten old versions. Exercise provider failures, time exhaustion, oversized versions, superseded builds and overlapping publishers through the existing rebuild fixture.
5. Add one short deployment paragraph; run touched tests and typecheck, recount tests, regenerate and check the source lock last, rebase against fresh main before first publication. Commit with fleet identity/hooks, inspect every candidate identity/trailer, push only the named product branch, and observe exact-SHA Verify within the API budget.
6. Publish the actual selected report and receipts separately to the evidence ref, report product custody and relay the sd inbox line. The Mac fleet runs the publication scan and landing gates; this cloud does not claim those gates.

## Baseline findings

At starting main, src/core/features/public-snapshot/service.ts:17-18 names snapshots/current.json and snapshots/stale.json. Lines 236-246 write archive-context.json, rendered artifacts, optional logo and retained.json under snapshots/<ULID>/<artifact>. The ULID is a version identifier, not a reliable reserved-generation order. Lines 247-259 acknowledge the retained replica, read its generation, conditionally advance current.json, finish the build and read the pointer back. There was no R2 list/delete in that publication path; successive successful versions accumulated without a bound.

src/core/platform/blobs/r2.ts:3-31 maps the BlobStore to bucket get/put/delete; prior to this change there was no list operation. scripts/ops-config.mjs and deployment resource naming bind SNAPSHOTS to the environment's <prefix>-files bucket (the ownership deployment fixtures verify lamp-production-files).

src/core/platform/blobs/snapshot-cache.ts:26-39 runs one SQLite transaction: refuses an equal/older generation, deletes retained_chunks, writes the new bundle chunks and replaces retained_generation. It already keeps one generation and needs no retention change.

Lamp has one page_settings singleton and one public-snapshot namespace per installation, not an independently removable multi-page entity. Removing this page is removal of that installation. scripts/remove-deployment.mjs:28-36 delegates page-Worker-first and then app/data removal to the pinned ownerRemove. node_modules/@runeditrun/rer/modules/deploy-kit/owner-remove.mjs:150-163 walks r2ObjectPages with no snapshot-prefix filter, rechecks bucket creation identity before every object DELETE, then deletes the bucket. r2-objects.mjs:22-34 consumes bounded cursor pages and validates every key. owner-remove.mjs:98-130 reads back Worker, Durable Object namespaces and data-resource absence before dropping ownership records. This already purges current, previous, legacy and partial snapshot objects, plus the rest of that owned bucket. No native removal script or rer pin change is needed. This is source inspection, not live provider erasure proof.

## Implementation and safety

advancePointer now returns the predecessor from the same successful ETag-conditional write. The new generation.json fence is written before any generation artifact. Cleanup starts after pointer readback confirms this publication, and after its event succeeds. Failed or superseded publication never calls cleanup. A cleanup error emits a fixed non-secret warning and leaves the already successful publication intact for a later cleanup attempt.

retention.ts lists one page of up to 16 namespace entries using a delimiter, then at most four deletion pages of 256 explicit keys. It checks a one-second scheduling deadline before starting each subsequent read/list/delete. An already pending provider call can finish beyond the deadline. Larger versions keep their generation.json and retained.json fence until their final page and resume from their oldest remaining keys. Legacy published snapshots use the generation already stored in retained.json; unknown/unparseable sequence metadata is never guessed old.

Only candidate sequences strictly below the successful CAS predecessor's sequence are eligible. Both named current and predecessor versions are excluded. Future pointer advances are monotonic, so a delayed cleanup cannot delete a concurrent newly current generation or its predecessor, regardless of ULID ordering. No bucket-wide purge is used during publication. Repeating a cleanup or losing a deletion response is safe.

## Verification and counts

Before: 101 registered cases plus 10 assertion scripts = 111 checks, 35 routine test files, 8 test shards. After: 102 registered cases plus the same 10 assertion scripts = 112 checks, with the same routine file and shard counts. One retention behavior registration was added to tests/e2e/snapshot-retained.test.mjs; all existing assertions remain.

Actual command results, exact candidate identity, CI results and custody are recorded in RECEIPT.json and the selected command logs. The real incident-publish route demonstrated five successful publishes with exactly the current and previous versions, and ten seeded old versions draining through total version counts 9, 6, 3, 2. With R2 write failure the actual latest snapshot build was failed, all prior object keys remained and the delete count was unchanged. Additional real R2/DO rebuild probes cover replica and selector failures (no lists/deletes), cleanup failure, deadline exhaustion, a 300-object legacy version, superseded publication and an overlapping newer publisher.

No UI change or browser screenshot proof is needed for this server storage change. No deployment/provider write, refresh-base, Base clone, release metadata change, tag, main push or PR outside the declared repository is performed.

## Product publication

Pushed candidate e7cec74a5c0b10255961cae0c3cebc6e0b8c75dd with cloud-push.py; first attempt succeeded. The candidate contains one commit, with fleet author and committer and no trailers. The complete origin/main..HEAD identity/trailer range was inspected before pushing. A fresh main fetch and fleet-identity rebase found the candidate up to date. The product worktree is clean.

Pull request: https://github.com/just-every/run-lamp/pull/400. Push Verify run: 44007747026, https://github.com/just-every/run-lamp/actions/runs/44007747026, exact head e7cec74a5c0b10255961cae0c3cebc6e0b8c75dd. CI status will be recorded from its actual REST response in CI-STATUS.json and RECEIPT.json. Two GitHub REST calls used so far: exact-SHA workflow discovery and the required main-target PR creation.

Local touched checks passed: typecheck; both tests in snapshot-retained.test.mjs; the existing release-rebuild test in public-contract.test.mjs; source-lock regeneration/check; contract-doc generator check; verification-plan count; diff whitespace validation. The fixed cleanup warning and missing-logo exception in the selected logs are expected fault injections in passing tests.

## Final outcome

Exact-SHA Verify run 44007747026 completed successfully on e7cec74a5c0b10255961cae0c3cebc6e0b8c75dd; actual final REST response retained in CI-STATUS.json (2026-11-17T03:26:31Z). Six of the ten GitHub API calls were used: discovery, PR creation and four properly spaced run-status reads. No workflow rerun or dispatch was requested.

Product custody: READY, branch cloud/sd-lamp-r2-retention-1, head e7cec74a5c0b10255961cae0c3cebc6e0b8c75dd, PR #400. No blockers. No clause status changes. Retention changes generated R2 artifacts only; underlying incident/history records are preserved.

Evidence is selected explicitly for the report-only evidence/sd-lamp-r2-retention-1 ref. It is independent of product readiness and does not replace the fleet's publication scan, final integration checks or landing. The published work clone is removed after report transfer; actual selected packet files remain under the fleet work directory.
