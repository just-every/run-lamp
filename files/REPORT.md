# Lamp adoption of rer 0.2.125

Task `sd-lamp-rer-pin-125-1`  
Repository `just-every/run-lamp`  
Product branch `cloud/sd-lamp-rer-pin-125-1`  
Author Run Edit Run fleet

No contract clause claimed; this is a rer adoption.

## Plan and implementation

1. Start from a fresh full-history blobless clone of Lamp main. Inspect the previous pin in `7c17a3201ef326a841d91fb4dc26c035a5b1c60a` and use the same exact dev-dependency and pnpm lock format. Install with the frozen lock.
2. Check out Base release commit `965e8d4e105f6f4d281dacb3c099f6a958a886e7` in a separate read-only blobless clone. Confirm the release tag peels to that commit. Run `pnpm exec rer refresh-base --ref 965e8d4e105f6f4d281dacb3c099f6a958a886e7 --base <Base checkout>` and use its recorded bytes.
3. Validate the Base copy record, render and check the contract views, restore the main view files, and generate and check the source lock after staging the new copy files. Run Lamp's ordered build, its native and technical archive journeys and migration checks, and pinned rer verification.
4. Compare with current main, check the candidate's complete commit range and publish the single linear product commit. Observe the exact-SHA Verify and attach this packet to the advertised product head on the evidence ref.

The refresh updated the record to the release commit and added eight vendored files. It surfaced Lamp's recorded `src/base/run-site.ts` adaptation for the installer PATH instructions. The upstream delta is a single sentence in a paragraph Lamp already replaces with its shell command and recovery link. I kept the recorded Lamp adaptation. The refresh also reported Base's React 19.3.1 compared with Lamp's React 19.2.8 for the unchanged hydration unit. I evaluated the retained dependency through the build and runtime checks within the adoption lease. The seed-owned Verify workflow was preserved by the refresh tool.

The offline copy verification passed. The optional checkout-backed copy inventory reported no drift and found two unrecorded byte-identical files, `importers.json` and `migrations/core/0076_dependency_keys_sealed.sql`. Both match Base at the previous and new release commits and match Lamp main. The adoption leaves these existing copies outside the refresh inventory.

## Before and after

| Measure | Before | After |
| --- | ---: | ---: |
| rer pin | 0.2.121 | 0.2.125 |
| Base copy entries | 258 | 258 |
| Source-lock files | 2,463 | 2,471 |
| Published clauses done / partial / missing | 45 / 62 / 0 | 45 / 62 / 0 |
| Target clauses done / partial / missing | 20 / 62 / 55 | 20 / 62 / 55 |
| All clauses done / partial / missing | 65 / 124 / 55 | 65 / 124 / 55 |
| Registered cases including release qualification | 113 | 113 |
| Verification assertion scripts | 10 | 10 |
| Total verification checks | 123 | 123 |

The generator reported zero documents to write, zero prose errors and zero warnings. `CONTRACT.md`, `ACCEPTANCE.md` and `docs/CLAIMS.md` have zero candidate diff.

## Product custody and GitHub Verify

The fresh main parent was `69af4dfce9acc31f4f224589fbde2c1b39fee20b`. The final rebase was a no-op. The product range has one commit and zero merges. The fleet author and committer checks passed for the full range and the commit has zero trailers. The guarded product push succeeded on attempt one at 2026-11-19T16:54:00Z. GitHub advertised product commit `839eda0645af8bcb8a9d7d548d60311ed86fd273` on the requested branch.

Exact-SHA Verify run 44571255306 completed successfully. Four REST calls observed discovery and two in-progress statuses before the terminal success at 2026-11-19T17:09:37Z. The branch Verify provides the product result. The lane owns landing. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44571255306)

Local gates and archive result tails are in `local-gates.md` and `owner-restore-receipt.md`. The native CLI restored owner data, the owner migration and its live trigger from a `TIMESTAMP` ledger into fresh state. The built Lamp Worker returned HTTP 200 against that state. The separate rer Workerd portability check restored the recorded interleaved core and owner order and returned HTTP 409 `schema_mismatch:owner_migration_history` for an altered order.

## Publication hygiene

Base's scan of a clean worktree at the exact product SHA passed with zero blocking findings. It covered 1228 commits, 1211 trees and 9436 blobs. 50 findings were classified as pre-existing. The earlier scan of the build checkout flagged only ignored build and verification artifacts. The fleet still runs its landing scan.

Recorded 2026-11-19T17:12:21Z.
