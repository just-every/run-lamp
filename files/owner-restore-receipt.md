# Lamp owner migration restore receipt

Product head `839eda0645af8bcb8a9d7d548d60311ed86fd273`. Installed rer `0.2.125`, Node `22.20.0`, pnpm `10.12.4`. All data in this run was synthetic and all state was disposable.

## Native rer archive and the built Lamp Worker

Copied the candidate into isolated source and destination installations using Lamp's existing native transfer helper. Ran `pnpm run migrate:local` on the source for all shipped core migrations, added one synthetic migration through Lamp's declared `migrations/ext` directory, then ran `pnpm run migrate:local` again. The seed's owner migration command maintained `lamp_ext_migrations`. Inserted a synthetic owner row and one Lamp page settings row. The owner trigger wrote a matching audit row.

Ran `rer export --output owner.rer`, then `rer import --input owner.rer --yes` in the fresh destination using the checkout's pinned CLI. The archive recorded 82 core migrations, then `ext-0001_owner_receipt.sql`, with the native ledger excluded from the product data payload. Both transactions reported 130 product tables, 22 rows and zero R2 objects. The archive was 307,292 bytes. Queried fresh D1 for the exact restored owner record, its audit row and the owner migration entry. Inserted a second synthetic owner record and verified the restored trigger wrote its audit record.

```text
Local database migrations are up to date.
Archive manifest records 82 core migrations then one owner migration and one synthetic owner row.
RESTORE PASS: Fresh native state retains owner migration, owner data, and working owner trigger.
```

Opened the imported state with the candidate's built production Worker, `dist/server/index.js`, using Lamp's existing release runtime harness. The Worker answered `GET /health` with HTTP 200 and `status: ok`. Its D1 binding read both owner assertions, and SQLite stored the owner ledger's `TIMESTAMP` value as `text`. The mail fixture recorded zero sends.

```text
BUILT WORKER PASS: GET /health returned HTTP 200; its D1 binding read restored owner data and the owner-trigger audit; no mail sent.
```

## Interleaved history through rer’s Workerd portability handler

Ran Lamp's `pnpm run migrate:local` with the first 81 core files, then one owner migration, then the last shipped core migration and finally a second owner migration. The second owner migration creates an index on the column introduced by that last core migration. `rer export --output interleaved.rer` recorded the merged chronological ledger. Used Lamp's actual archive policy and declarations with the installed rer `0.2.125` Worker portability handler and bundled migration evidence. This supplemental Workerd fixture exercised the library API. Lamp’s deployed Worker uses its existing technical restore CLI.

The first fixture’s finalize returned HTTP 409 `target_not_empty` with rows seeded by migrations. In the successful run the scratch destination kept the authentic schema and both ledgers, and cleared seed rows in ten product tables to exercise the handler’s empty-destination contract. Temporarily changing the relative owner and core order caused a 409 before a restore job existed. Restoring that chronology then allowed the archive to publish the owner record with both ledgers intact.

```text
Archive ledger suffix: ext-0001_owner_receipt.sql -> 0083_sorry_template_metadata.sql -> ext-0002_owner_schema_index.sql
Fresh Worker fixture: 10 tables with migration-seeded rows emptied before restore; migration ledgers retained.
Different applied owner order: HTTP 409 schema_mismatch:owner_migration_history, zero restore jobs.
WORKER RESTORE PASS: HTTP 201 create, 200 part upload, 200 complete. Native core and owner ledgers are unchanged; the synthetic Lamp owner row is restored.
```

Recorded 2026-11-19T16:53:15Z.
