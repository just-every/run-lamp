Hono 4.13.7 is vulnerable to GHSA-5r4p-p66f-jhc7. Pin Hono to 4.13.11, regenerate its pnpm lock entries with pnpm 10.12.4, and refresh the source lock. No unrelated dependency changes.

Lamp does not use Hono serveStatic; app assets use Cloudflare ASSETS and public assets use explicit snapshot routes.

Validation: frozen installation, TypeScript check, source-lock and contract-document checks, production rer build, and the existing built Worker routing/auth/static-asset journey pass (1 test). Exact-SHA Verify passed: https://github.com/just-every/run-lamp/actions/runs/44117942173 (3ca73da203d56aa88efd9ad85626645337648856). Base publication scan is COMPLETE/PASS with zero new findings. No clause status changes.

Run Edit Run fleet, 17 November 2026.
