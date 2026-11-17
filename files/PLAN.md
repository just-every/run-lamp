# Plan — sd-lamp-health-ledger-1

Run Edit Run fleet, 2026-11-17 UTC.

No contract clause claimed; this is the installed-health ledger follow-up.

1. Trace native `rer deploy` → Lamp deploy hook → scripts/deploy.mjs → scripts/setup.mjs. Compare the actual apply ledger and the health observer, including rer's deploy-kit and managed-install readers.
2. Maintain the native installed-health ledger from D1-confirmed core migration names after every apply pass, including partial failures. Hash exact shipped file bytes with SHA-256; create precisely name TEXT PRIMARY KEY and sha256 TEXT NOT NULL; INSERT OR IGNORE. Backfill existing applied files on every setup/deploy, and never write platform interim identities.
3. Extend the existing setup-resume integration test and health proof helpers, using the fake Cloudflare HTTP edge with real local D1 and public /health. Recompute expected inventory independently from migration bytes. Exercise fresh apply, repeated setup, missing/empty/subset backfill, exhausted/no-progress resume, nonzero interrupted apply and successful recovery. Preserve existing assertions and registrations.
4. Check consumers of rer_migrations so adding a native ledger does not make archive tooling mistake native installs for managed installs. Preserve the managed prefixed inventory and ownership policy. Extend the existing technical archive journey to prove that a native ledger is excluded from owner data and does not prevent export/restore.
5. Add a short owner paragraph in docs/deploy.md and OPERATIONS.md. No contract status, generated views, release metadata, dependency pins, resource identities or migration history edits.
6. Run touched tests and typecheck. Fetch fresh main and rebase only while unpublished; regenerate sources.lock.json last and check it. Inspect every candidate identity/trailer; use the fleet push guard for cloud/sd-lamp-health-ledger-1. Observe exact-SHA Verify via REST with ≤10 API calls and ≥300 seconds per run observation. Open a PR only as repository landing rules require.
7. Keep complete non-secret reports and receipts outside the product clone; publish the selected packet only to evidence/sd-lamp-health-ledger-1. The Mac lander independently runs publication and landing gates. Retain recovery data if any push remains rejected.
