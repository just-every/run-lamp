# SD-IV-2 implementation plan

1. Inspect Lamp's health service, DB binding, ledger consumer and Platform's actual migration marker writer through read-only API access.
2. Add compiled package version and a focused bounded SELECT-only observation of DB.rer_migrations. Preserve liveness status, no-store, and nullable deployment provenance. No source-inferred expectations or schema writes.
3. Extend the existing health public-door flow with real local D1 ledger states, full inventory digest, ordinal ordering, partial exclusion, bounded overflow, malformed data and sanitized failure proof. Keep fixtures test-only and test counts stable by extending an existing journey.
4. Run touched health proof, typecheck and source-lock check; merge/rebase current main as appropriate, regenerate the source lock last. Preserve pending Settings version repair.
5. Scan the full-history candidate with Base's publication entrypoint, check every candidate identity/trailer, commit and push only cloud/sd-lamp-schema-observation-1 with fleet guards. Open the required PR and inspect exact-SHA Verify within the ten-call API budget.
6. Publish complete non-secret report and actual receipts to the separate evidence ref, report the partial BASE-OPS-001 claim, and leave landing/deployment/acceptance to the fleet.
