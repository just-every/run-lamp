# Plan

Author: Run Edit Run fleet, 2026-11-17.

1. Refresh the authorized launcher, configure bundle-only Git authentication, fleet identity, forwarding commit hooks, and the checkout-pinned toolchain.
2. Clone just-every/run-lamp with full history, work solely on cloud/gr-mt-lamp-dep-6, and read the repository requirements and testing instructions.
3. Inspect Hono and static-route middleware use. Update only the direct Hono pin from 4.13.7 to 4.13.11 with pnpm 10.12.4 and verify frozen installation. Preserve unrelated dependency versions.
4. Prepare the local owner using rer setup. Run the typecheck, production build, and the existing built Worker routing/auth/static-asset journey. No new tests or clause promotions are needed for this dependency maintenance.
5. Regenerate and check sources.lock.json last, commit the scoped dependency and lock changes with fleet identity and no trailers, then scan the exact committed tree with Base's installed publication scanner. Require COMPLETE/PASS and zero findings before publishing.
6. Fetch main, integrate drift without rewriting published history, audit all candidate author/committer identities and trailers, and publish only the named branch through cloud-push.py.
7. Discover and poll exact-SHA Verify via gh api, using the decrypted bundle and at most ten GitHub calls, with at least 300 seconds between checks for a run. Open a contribution PR if repository rules require it; leave landing to the fleet.
8. Record actual results and receipts under the evidence packet; publish only explicitly selected non-secret files through evidence/gr-mt-lamp-dep-6. Write result.json and report exact product/evidence custody, counts, clause changes, CI run IDs, and any blockers.
