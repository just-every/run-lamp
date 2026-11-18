# Lamp first-install fault replay

Run Edit Run fleet, 2026-11-18T08:49:41Z. Task sd-lamp-install-faults-2, repository just-every/run-lamp.

No contract clause claimed; these are install faults found by a company's first install (main-pack-nonseed2-1).

## Replay and verification

Reapplied the prior two-commit round from aa9af0f0cbac513772dd12670985e1a705871d7b onto fresh main 71ab9b43f5069cd612bf998d3a2bf8a32691393b. Main's 0083 Sorry metadata migration already occupied that slot. 0084 and 0085 were reserved for the other Sorry round. The next available number was 0086. Lamp's release validator required the 0086 inventory entry in RELEASE.json. The named branch `cloud/sd-lamp-install-faults-2` was pushed at `48ff8882f647a16328fa7b5c97c3c2d2edc2f321` after the first save `3ca99d6b0b940c8fa8305468d5edcfb2a865dccb`. The candidate has two ordinary fleet-authored and fleet-committed commits with no trailers.

- **Dev startup** fixed in `scripts/installer/local.mjs`. Vane and Oncall delegate to the shared operator dev target. Lamp’s pinned rer gives that target a 900,000 ms deadline. With the same 70-second delay injected into Lamp's dev entrypoint, main failed after 69.1 seconds total with HTTP 404 and a readiness deadline. The candidate answered HTTP 200 after 118.3 seconds. A persistent 404 on the candidate reached its real deadline after 908.4 seconds total and exited 1.
- **Owner migration ledger** fixed in `migrations/core/0086_owner_migration_ledger_text.sql`, `scripts/owner-migrations.mjs`, `scripts/export.mjs` and `scripts/platform-ledger.mjs`. Pinned rer enforces numeric values for TIMESTAMP affinity and strings for TEXT. On a stopped 0083 installation with one real owner migration, `rer export` exited 1 with `row_type`. The same installation exported 296,725 bytes after 0086. A clean `rer import` restored the migrated ledger and owner record. The upgrade and restore preserved the 0083 Sorry metadata row and the exact migration ID, name and timestamp. Running the migrator again left a single owner record and the original ledger entry. Re-export worked on the restored copy. The technical backup test also covered schema-changing owner SQL.
- **Disposable migrations** fixed in `tests/e2e/helpers/follow-ups-runtime.mjs` and `scripts/sorry-receipt/runtime.mjs`. An owner trigger depending on the core page-settings table failed to affect either HTTP read on main. After the fix, both runtimes served the owner-trigger result. All nine Sorry cases and six public-contract cases passed with their existing assertions.

**Separate gap.** Native `rer export` succeeded for a schema-changing owner migration, but a clean same-source native `rer import` still exited 4 with `schema_mismatch`. Native restore replays the primary Wrangler migration directory.

## Checks and custody

All nine ordered build steps passed on the exact candidate with Node 22.20.0. The portability group initially saw a native `ERR_ASSERTION` during re-export after restore. The same native journey passed on an isolated rerun at the same SHA. The grouped consent and prior-release cases passed on the first run, and the independent technical backup and restore test passed. Contract counts before and after were 60 done, 129 partial and 55 missing out of 244. The regression extends an existing test registration. The contract generator wrote zero views and the source lock was regenerated last.

Exact-SHA push Verify 44266529596 was in_progress. Fleet retains PR and landing custody, including the public publication scan and independent migration gate. [Verify run 44266529596](https://github.com/just-every/run-lamp/actions/runs/44266529596)

The read-only platform playbook path returned HTTP 404 in cloud. The shipped builder rules and Lamp AGENTS.md governed this replay. See PLAN.md and RECEIPTS.json for the plan, exact check results and synthetic data readbacks.
