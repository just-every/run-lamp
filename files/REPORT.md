# Lamp adoption of rer 0.2.126

## Plan

1. Inspect Lamp's previous pin and its prior adoption, then install the exact new pin from the registry with the checked-in pnpm lockfile.
2. Refresh Lamp's recorded Base paths from the full-history blobless Base checkout at 3637852064bf6ddadd15418518964d99d615cc46. Check the resulting record and confirm the patch stays within the adoption lease.
3. Run Lamp's ordered build, ownership and archive checks. Use the pinned CLI for the runtime verifier and the documented setup, local dev, export, empty-destination restore and built preview. Verify local owner entry and health.
4. Regenerate and check the contract views, restore main's view files, write and check the source lock, and rebase the single candidate onto the newest main. Inspect the entire candidate range before pushing the named branch. Check GitHub Verify on the pushed SHA and publish the receipts on the evidence branch.

No contract clause claimed; this is a rer adoption.

## Changes

Lamp pins rer 0.2.126 in package.json and pnpm-lock.yaml. The previous adoption was 1b3578b39a1e0166cbd0714f8d7d463210d7a190. Its recorded Base revision was 965e8d4e105f6f4d281dacb3c099f6a958a886e7. The refresh moved all 258 records to 3637852064bf6ddadd15418518964d99d615cc46. Their file hashes, modes and recorded adaptations matched the prior record. The source lock changed for those three inputs. Lamp's release, contract, migration, workflow and application files matched main.

| Measure | Before | After |
| --- | ---: | ---: |
| Contract Done | 65 | 65 |
| Contract Partial | 124 | 124 |
| Contract Missing | 56 | 56 |
| Contract clauses | 245 | 245 |
| Verification checks | 125 | 125 |
| Base copy records | 258 | 258 |

## Command results

| Command | Result |
| --- | --- |
| `pnpm add -D -E @runeditrun/rer@0.2.126` followed by `pnpm install --frozen-lockfile` | Installed the exact pin and reused the frozen lockfile. |
| `rer refresh-base --ref 3637852064bf6ddadd15418518964d99d615cc46 --base <local Base checkout>` | `refresh-base: complete (exit 0)`. The 258 recorded revisions changed. |
| `LAMP_VERIFY_SHARD=build pnpm run verify:app` | Nine steps passed in order. The run-site build wrote 38 pages and 63 files. |
| `LAMP_VERIFY_SHARD=ownership pnpm run verify:app` | Ownership 23/24 on the first run, owner claim 4/4, owner backup 1/1. The only failed ownership case passed on the separate retry below. |
| `node --test --test-concurrency=1 tests/e2e/auth-adoption-journey.test.mjs` | Two passed on retry with the checkout's Playwright prerequisite available. |
| `LAMP_VERIFY_SHARD=portability pnpm run verify:app` | Three passed, including restore and re-export equality and prior-release import. |
| `LAMP_VERIFY_SHARD=runtime pnpm exec rer verify` | 19 cases passed, followed by hosted-output, hydration and statement checks. `verify: complete (exit 0)`. |
| `rer setup`, `rer dev`, `rer export --output <archive>`, `rer import --input <archive> --yes`, `rer setup`, `rer preview` | Export and import exited 0. Preview reached readiness, and health and original-owner session returned HTTP 200. |
| `pnpm exec rer check --profile first-party` and the contract and source-lock commands in AGENTS.md | All exited 0. The generator reported current views and zero prose errors or warnings. |

### Archive, owner entry and provenance

The technical journey ran `pnpm run export:cloudflare --out <archive> --persist-to <source-state>` and `pnpm run import:cloudflare --from <archive> --persist-to <empty-state>`. It refused a second restore over populated state and re-exported equal owner data. It also verified rollback of failed owner SQL, the corrected migration, and the restored trigger. Its result tail was `tests 1, pass 1, fail 0`.

The README journey used disposable checkouts. Its native archive had 19 parts. Import staged and published all 19 into the empty destination. Setup preserved the existing owner and page. Both the dev server and built preview printed `RER_READY`. Health and the original owner's session each returned HTTP 200 on both servers.

The first setup attempt shared a checkout with a running test and hit its operation lock. A cold browser download also exhausted the owner-entry deadline. The cloud's global Node path selected a different Playwright package than Lamp's lockfile. Clearing that path and installing the checkout's browser prerequisite allowed the owner-entry retry and full README journey to pass with the default deadline. The independent browser assertions used system Chromium.

The documented offline Base-copy check passed. An extra local-Base provenance probe had an empty drift list and found two unrecorded byte matches, `importers.json` and `migrations/core/0076_dependency_keys_sealed.sql`. Both Lamp blobs and both matching Base blobs already had the same object IDs at the previous Base revision. The adoption retained the refresh output.

## Publication

Product branch `cloud/sd-lamp-rer-pin-126-1` was pushed once at `d442dbb58d146eee3589c8880463d94d12b11981`. The single commit was based on `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb` and passed the author, committer and trailer checks. The fleet owns the formal publication scan and landing.

## GitHub Verify

Push Verify 44842658234 completed successfully on `d442dbb58d146eee3589c8880463d94d12b11981`. The final status came from the exact-SHA GitHub Actions run. [44842658234](https://github.com/just-every/run-lamp/actions/runs/44842658234)

Run Edit Run fleet, 2026-11-21T00:31:48Z.
