# Lamp first-install fixes

Run Edit Run fleet, 2026-11-18 UTC. Round sd-lamp-install-faults-1, repository just-every/run-lamp.

No contract clause claimed; these are install faults found by a company's first install (main-pack-nonseed2-1).

## Changes and evidence

- **Dev startup.** `scripts/installer/local.mjs` gives Lamp's dev target 15 minutes, matching the pinned rer shared operator target. A 70-second delay in a disposable copy of Lamp's actual startup failed on main after 79.3 seconds total, with a readiness deadline and HTTP 404. The candidate reached HTTP 200 after 189.3 seconds total. A target that continued to return 404 hit the real 15-minute readiness deadline after 954.8 seconds total, including startup preparation.
- **Owner migration ledger.** `migrations/core/0083_owner_migration_ledger_text.sql` changes the declared type to TEXT and preserves each existing ID, migration name, and timestamp in one Wrangler migration. `scripts/owner-migrations.mjs`, `scripts/export.mjs`, and `scripts/platform-ledger.mjs` share the ledger name and keep it out of the hosted technical archive inventory. The release validator required the new inventory entry in `RELEASE.json`. The extended native portability journey exercises the ledger through the public CLI.
- **Export and restore.** The pinned `rer export` failed with `row_type` before the update and produced a 295,863-byte archive after the update. `rer import` restored the data-only owner migration's record and original ledger entry into an empty checkout. A later migration run succeeded in the original and restored installations with the same ledger entry and one copy of the owner record. The previous-release native restore and the schema-changing technical backup/restore journeys also passed.
- **Schema-changing owner SQL.** A second real `rer export` succeeded after the update on an installation whose owner migration created a table and trigger. Native `rer import` refused that archive with `schema_mismatch` on a fresh same-source checkout. The pinned native restore builds its replay from the primary Wrangler migration directory. The optional container proof stopped at Lamp's existing HTMLRewriter boundary. The checked-in technical backup/restore journey covered schema-changing owner SQL through Lamp's technical format.
- **Disposable runtimes.** `tests/e2e/helpers/follow-ups-runtime.mjs` and `scripts/sorry-receipt/runtime.mjs` apply sorted owner SQL after core migrations and before fixture setup. An owner trigger depending on the core page-settings table was absent from both HTTP reads at baseline and observable through both on the candidate. The existing assertions passed in all nine Sorry cases and all six public-contract cases. The local catalogue journey and vendor case completed in individual invocations after the grouped public run reached its hard wall-clock limit.

## Verification and gate

The nine ordered build commands passed, including contract docs, Base copies, source integrity, typecheck, syntax, release validation, visual source, application build and site build. The contract generator wrote zero documents. Both product commits use the fleet identity and carry zero trailers. The source lock was regenerated after the last change. The fleet owns the full publication scan and the independent migration gate for 0083.

Contract totals before and after are 60 done, 129 partial and 55 missing, for 244 clauses. The native regression extends an existing registration. See PLAN.md and RECEIPTS.json for the full check sequence and command results.

## GitHub Verify

The pushed product branch is `cloud/sd-lamp-install-faults-1` at `aa9af0f0cbac513772dd12670985e1a705871d7b`. The most recent exact-SHA REST observation showed Verify 44247850522 in progress. The lane retains PR custody. [https://github.com/just-every/run-lamp/actions/runs/44247850522](https://github.com/just-every/run-lamp/actions/runs/44247850522)
