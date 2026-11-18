# Lamp first-install faults

Run Edit Run fleet, 2026-11-18 UTC. Round sd-lamp-install-faults-1, repository just-every/run-lamp.

1. Compare the Lamp dev target with the pinned rer readiness contract. Reproduce the original deadline using a bounded 70-second delay in a disposable copy of Lamp's own dev entrypoint. Retry with the candidate, read HTTP 200 from /health, and exercise a persistent HTTP 404 under the candidate's real deadline.
2. Run an owner migration with the pre-update source to obtain a real Wrangler ledger, then run the pinned rer export through the public CLI. Apply a new, transactional core migration that preserves the ledger IDs, migration names, and original timestamps while declaring the timestamp column as TEXT. Retry export in place, restore into a fresh copy using rer import, and confirm the owner's migration does not replay on the next migration run. Test old archives and Lamp's technical backup path separately.
3. Add ordered extension SQL to the shared status-journey and Sorry receipt runtimes. Use an owner trigger that depends on a core table, then read the resulting page setting through both runtime HTTP doors before and after. Rerun the existing Sorry and public-contract assertions.
4. Keep contract judgments unchanged. Regenerate and check the views, restore the tracked views, and regenerate the source lock last. Run the ordered build checks and touched tests, publish the named branch, and observe Verify on the candidate SHA. Publish the non-secret packet on the evidence ref.
