# Local check receipt

Product head `839eda0645af8bcb8a9d7d548d60311ed86fd273`  
Main parent `69af4dfce9acc31f4f224589fbde2c1b39fee20b`  
Runtime Node 22.20.0 / pnpm 10.12.4 / rer 0.2.125

## Dependency and source checks

- `pnpm add -D --save-exact --lockfile-only @runeditrun/rer@0.2.125` and `pnpm install --frozen-lockfile` exited 0. The package and pnpm lock moved from 0.2.121 to 0.2.125 and the release tag peeled to the full requested Base SHA.
- `pnpm exec rer refresh-base --ref 965e8d4e105f6f4d281dacb3c099f6a958a886e7 --base <Base checkout>` ended `refresh-base: complete (exit 0)`. It refreshed 258 copy entries.
- `node src/base/contract-docs.mjs write` wrote 0 documents. `node src/base/contract-docs.mjs check` reported current documents and zero prose findings. The main view files were restored to the index before `node scripts/edition-authoring/cli.mjs lock` and `node scripts/edition-authoring/cli.mjs check` (exit 0; 2,471 files).
- `pnpm exec rer check --profile first-party --json` returned `ok: true` for 965 structural checks.
- `LAMP_VERIFY_SHARD=build pnpm run verify:app` passed all nine steps in repository order. The machine receipt is `build.json`. Syntax parsed 494/494 modules. Release validation found 20 vendor catalog sources and 162 native state cases. The site build wrote 38 pages and 63 files.

## Technical archive journey

`pnpm run test:owner-backup` passed 1/1 in the existing HIST-004 / PORT-001 test. The test runs:

    pnpm run migrate:local
    pnpm run export:cloudflare --out <archive> --persist-to <source>
    pnpm run import:cloudflare --from <archive> --persist-to <fresh destination>
    pnpm run export:cloudflare --out <reexport> --persist-to <restored destination>

It exercised owner migration rollback and recovery, idempotent reapply, a populated-destination refusal, the complete re-export comparison, legacy metadata handling, invalid column refusal and a restored owner trigger.

    ok 1 - HIST-004 PORT-001 — owner SQL rolls back a failed upgrade, recovers once, and travels through a clean technical backup and restore
    # tests 1
    # pass 1
    # fail 0
    # cancelled 0
    # skipped 0

The separate native rer CLI and built Worker proof is in `owner-restore-receipt.md`.

## Setup migration gate

`node --test tests/auth-adoption/setup-migrations.test.mjs` timed out at 240 seconds during the initial concurrent run. The same unmodified command passed on retry in 174 seconds. It verified fresh apply, re-deploy, and health-ledger backfill for all 82 migrations, resumed after an early return at 58, and checked safe stops with zero progress, the five-pass budget and a simulated interruption.

    ok 1 - Setup resumes migration apply, backfills the installed-health ledger and stops safely on interruption or without progress
    # tests 1
    # pass 1
    # fail 0
    # cancelled 0
    # skipped 0

## Candidate publication hygiene

Ran Base 0.2.125's `node scripts/publish-check.mjs --repo <Lamp checkout> --ref HEAD --public-base https://github.com/just-every/run-lamp.git#main --timeout-seconds 300`. The scan returned `INCOMPLETE` with `scan.deadline-exceeded`, recorded in the scanner's JSON receipt. Gitleaks 8.30.1 scanned the single unpublished commit's diff with the Base rule set. Its one raw `hex-api-key` match was the copy-record SHA-256 of the checked-in `scripts/edition-authoring/api-source.mjs`. Base's own same-tree checksum classifier matched and accepted it. The fleet owns the landing publication scan.

## Native portability suite

`LAMP_VERIFY_SHARD=portability pnpm run verify:app` completed successfully. All three tests passed, including a rer backup and fresh import of the whole product, page consent data restoration, and a previous-release backup imported with its original history, consent and image bytes.

    ok 3 - HIST-004 — a previous-release backup upgrades through rer import with its original history, consent and image bytes
    1..3
    # tests 3
    # pass 3
    # fail 0
    # cancelled 0
    # skipped 0

## Pinned rer Verify runtime shard

`LAMP_VERIFY_SHARD=runtime pnpm exec rer verify` finished with exit 0. It ran the same runtime and publishing targets selected by the GitHub Verify runtime job, then rer's hosted Worker, hydration and SQL sizing checks. The machine receipt for the two Lamp targets is `runtime.json`. Local browsers used system Chromium.

    test:runtime: 2 passed, 0 failed
    test:publishing: 17 passed, 0 failed
    Hydration check: 35 page(s), 309 load(s)
    Statement size: 548 view and trigger statements checked; largest 7 FROM items, depth 21.
    verify: complete (exit 0)

## Complete scan of the build checkout

A longer Base scan resolved the exact product commit and tree, traversing 1,226 commits, 1,209 trees and 9,419 blobs. It classified 50 findings as pre-existing. The nine blocking findings were all working-tree findings on ignored build or verification output under `dist`, `.seed/installer` and `.wrangler/local-operation`. The committed tree and scanned history had zero blocking findings. A fresh detached worktree at the same commit was used for the clean publication scan.
