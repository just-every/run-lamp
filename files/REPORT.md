# Lamp technical archive restore

Run Edit Run fleet · 2026-11-19T05:05:30Z

Product branch `cloud/sd-lamp-s5-import-portability-1` at `b1e4f00aada502de1d4ca246292ef903f25c0765`, based on main `579466148ad2fa1e6cea795c1e8331d2fc8da984`.

## Plan and reproduction

1. Start a local Lamp installation on a fresh depth-one blobless clone of main. Use `rer dev` and check `/health`. Stop the local process before taking the backup. Run the native `rer export` once to initialize the runtime's actual portability tables in that state.
2. Export the local state with `pnpm run export:cloudflare --out ../main-archive --persist-to .wrangler/state`. Save the unmodified archive and run `pnpm run import:cloudflare --from ../main-archive --persist-to ../baseline-empty`. The export included 216 tables and 49 objects. Import exited 1 with the following message.

   > Restore stopped before completion: Unknown archived columns in _rer_portability_migrations: name, sha256, state. Keep the source archive and restore into a new empty database and bucket. Do not route traffic to this partial destination.

3. Use one bookkeeping table predicate in technical export, archive reading and destination inspection. The old archive also held ten tables under `rer_portability_`, so both that namespace and `_rer_` are excluded. Legacy archives still undergo checksum, structure and migration validation. The existing managed-ledger and unknown Lamp column checks continue to apply.
4. Repeat technical export and import on the candidate into one empty destination. Import the unmodified main archive into a second empty destination. Read each SQLite database directly for per-table counts and a spot row, then re-export both destinations and compare the complete entities files and R2 object hashes.
5. Regenerate and check the contract views and source lock, then commit. On that commit, run the amended archive test and standalone typecheck before the declared build steps. Fetch and rebase on current main, then repeat generation and confirm the tested SHA still matches before publishing. Poll Verify using that SHA.

## Results

| Check | Result |
| --- | --- |
| New technical archive | 205 application tables and 49 R2 objects |
| New archive restore | 205 application tables and 49 R2 objects |
| Unmodified main archive restore | 205 application tables and 49 R2 objects after dropping 11 archived bookkeeping tables |
| Database equality | 34 rows across 205 tables with identical per-table counts and byte-identical re-exported entities |
| Spot row | `page_settings` record `default` with `page_name = Status` in all three databases |
| R2 equality | All 49 keys, sizes and SHA-256 digests match after both imports |
| Existing archive test | Pass. It covers the older archive shape, preserves a destination-specific runtime ledger and still rejects unknown owner columns. |
| Standalone typecheck | Pass |
| Build plan | All steps passed in order. `check:contract-docs`, `source:copies`, `source:check`, `typecheck`, `check:syntax`, `validate:release`, `verify:visual:source`, `build:app`, `build:site`. |
| Generated contract views and source lock | Contract generator write and check passed. Zero view edits. Regenerated source lock passed its check. |

Verify run [44460447195](https://github.com/just-every/run-lamp/actions/runs/44460447195) reported `completed` with conclusion `success` for `b1e4f00aada502de1d4ca246292ef903f25c0765`.

## Contract and counts

`PORT-001` acceptance point 2 has partial evidence for local restore of implemented Lamp data. `HIST-004` describes export contents and inherits Base restore and equivalent re-export. The clause Status, Gap and Evidence cells were left as published. The full target remains 65 done, 124 partial and 55 missing before and after. The seed inventory remains 112 registered cases plus 10 assertion scripts before and after.

CLAIM PORT-001 PARTIAL points=2 tests=tests/e2e/export-import.test.mjs#HIST-004 PORT-001 — owner SQL rolls back a failed upgrade, recovers once, and travels through a clean technical backup and restore — a Lamp archive restores into a local state without stopping at rer's own tables

GAP PORT-001: The complete target-entity inventory and credential exclusion and reconnection guarantees remain unproved, including the existing Slack and Teams ciphertext gap.

The Mac fleet owns the formal publication scan and landing.
