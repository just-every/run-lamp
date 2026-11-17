# Hono security maintenance: gr-mt-lamp-dep-6

Author: Run Edit Run fleet, 2026-11-17.

Repository: just-every/run-lamp. Product branch: cloud/gr-mt-lamp-dep-6.
Candidate: 3ca73da203d56aa88efd9ad85626645337648856.
Base: cb6f9af49f440380caeca1722bac8fb7b7815699.

## Change and reason

The direct Hono dependency was vulnerable at 4.13.7 to GHSA-5r4p-p66f-jhc7. package.json now pins 4.13.11, pnpm-lock.yaml was regenerated with pnpm 10.12.4, and sources.lock.json was regenerated last with the repository's documented source-lock command. Only Hono's importer, package integrity, snapshot and the two changed file hashes differ. No unrelated dependency version changed.

## Static-path review

A source search found no serveStatic use or imports. src/server.ts dispatches app assets to Cloudflare ASSETS only after host/path classification in src/core/app/host-dispatch.ts. Public /assets paths are explicit routes in src/core/features/public-snapshot/routes.ts, serving generated R2 snapshot artifacts. Protected Hono /api/app/* requests use requireOperator in src/core/app/server.ts. The existing built Worker journey exercises native session protection, host dispatch, public assets and genuine missing-route/asset 404s. No application workaround or new test was needed.

## Local results

- pnpm 10.12.4 installed the original and regenerated lockfiles successfully with --frozen-lockfile.
- rer setup --owner-email fleet@runeditrun.com --non-interactive completed successfully. Private settings and one-use owner links are excluded from this packet.
- Node 22.20.0: pnpm typecheck passed.
- node scripts/edition-authoring/cli.mjs lock and check passed.
- cloud_run npx -y @runeditrun/rer build passed for the committed candidate.
- LAMP_CHROMIUM_PATH=/usr/bin/chromium cloud_run node --test --test-concurrency=1 tests/e2e/start-runtime.test.mjs passed: 1 registration, 1 pass, 0 failures or skips; desktop 1440 for the existing browser assertions. No UI changes were made.
- Full local rer verify is intentionally delegated to exact-SHA branch Verify, following the supplied rule to run touched tests and typecheck locally. No assertions were removed or weakened.

## Counts and clauses

Hono versions: 4.13.7 -> 4.13.11. Vulnerable Hono lockfile resolutions: 1 -> 0.
Clause status counts: done 60 -> 60, partial 129 -> 129, missing 52 -> 52.
No clause text, status, gap or evidence cells changed; no clause promotion or new CLAIM is made. Generated ACCEPTANCE.md and docs/CLAIMS.md are untouched. Registered cases remain 102 -> 102 and assertion scripts 10 -> 10, for 112 -> 112 total checks (check-plan.log). Both the source-lock check and contract-document check pass.

## Publication and CI

The first publication scan could not start because Gitleaks was absent. Gitleaks 8.30.1 was installed from its public release and verified against that release's checksum file. The complete scan result is recorded separately in publication-scan.json. The unbased diagnostic scan completed over 2,577 commits but used incorrect destination parameters and omitted the existing public origin baseline. It reported 656 findings, of which the only candidate-scoped item was the invocation-level destination mismatch. The corrected destination validation passes for just-every/lamp and https://github.com/just-every/run-lamp; GitHub confirms this is a public repository with main as its default. The final scan uses that remote main as the native public-history baseline, still scanning the exact tree and full selected/baseline history. All diagnostic reports remain in the packet. Final corrected scan: COMPLETE/PASS, zero new findings and 50 pre-existing findings recorded separately; full selected/public-base history covers 1,166 commits, 1,149 trees and 8,832 blobs. Its exact source tree is 7b28653130c784d493ab047e91caca46f89dee20, matching the candidate. The guarded push succeeded on attempt 1 and the complete candidate identity audit passed. Exact-SHA push Verify 44117942173 is queued: https://github.com/just-every/run-lamp/actions/runs/44117942173. Exact-SHA push Verify 44117942173 completed successfully, confirmed at 2026-11-17T16:00:32Z. Its complete existing verification plan, including the runtime rer verify entry point, passed on the candidate. PR https://github.com/just-every/run-lamp/pull/410 is open against main for the fleet to land. No blockers remain. The product checkout is clean, its remote cloud branch matches the candidate, and no default branch was pushed. CI and PR receipts are included in this packet.

## Plan

The full executed plan is in PLAN.md. Actual command logs and local-receipt.json carry local proof. Product custody and evidence publication are separate; the fleet owns landing and deployment.

## Final custody

Product: READY for fleet landing, cloud/gr-mt-lamp-dep-6 at 3ca73da203d56aa88efd9ad85626645337648856.
Contribution PR: https://github.com/just-every/run-lamp/pull/410.
CI: Verify 44117942173, completed/success on the exact candidate.
Result: done; security maintenance. The matching result.json is also retained at work/maint/gr-mt-lamp-dep-6/result.json outside the clone.
Evidence publication uses only evidence/gr-mt-lamp-dep-6. Temporary scan mirrors have been removed; remaining clone cleanup follows the supplied builder rule after evidence transfer.

The 50 native pre-existing publication findings are retained in publication-scan.json for separate fleet triage; they are not new findings from this upgrade. No unrelated historical cleanup was attempted.
