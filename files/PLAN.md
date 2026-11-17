# sd-lamp-maint-1-c1 plan

1. Refresh the authorized launcher, install fleet Git credentials and commit hooks, and clone only just-every/run-lamp with depth 1 and blob filtering.
2. Confirm the remote source branch is 2b8e632f16dd3ff2006ae72e9c3ff3649c2ce3b9, create cloud/sd-lamp-maint-1-c1 from it, and inspect the release validator, migration schema and predecessor inventory.
3. Reproduce the release failure, then add only the 0082_repeated_maintenance_cancellation.sql migration record with required buyerSteps. Preserve every other RELEASE.json field.
4. Run release validation, source-lock integrity and typecheck; regenerate sources.lock.json last only if required. Run local verification as applicable and report its actual result. Keep contract sources, generated views, versions, changelog, rer pin and tags unchanged.
5. Make exactly one new fleet-authored commit on the confirmed source head, scan every candidate identity and trailer, and push only cloud/sd-lamp-maint-1-c1 with the cloud guard. Leave existing draft PR #406 in place and create no PR.
6. Discover and poll exact-SHA Verify through gh REST, using one watcher with at least 300 seconds between calls for that run and a ten-call task budget. Read each failed job archive at most once if needed. Require exact-SHA success for READY.
7. Save actual non-secret reports and receipts outside the product clone, publish explicitly selected files only to evidence/sd-lamp-maint-1-c1, then delete the product clone after custody is verified. Return provenance, unchanged clause counts, CI IDs and the lane POST line.
