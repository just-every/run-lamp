# Lamp Vite fixture startup recovery

Task sd-lamp-port-race-1. Repository just-every/run-lamp. Product branch cloud/sd-lamp-port-race-1.

Verify run 44877694086 failed in imports on port 45061. Verify run 44888360296 failed in composer on port 46313. The reservation releases its listener before Vite can bind, so the number can become occupied before startup.

## Plan and implementation

1. Trace the reservations in the end-to-end fixtures and the dev-ingress runtime used by Cutover. Keep the low-level loopback port reservation intact.
2. Use one startup helper for publishing, maintenance timezone, unsaved work and the shared dev-ingress runtime. Retry early Vite exit or an occupied-port diagnostic, for at most three total launches. Stop the failed attempt's detached group before allocating a distinct loopback port. Keep strict-port binding and the existing readiness checks. An ordinary readiness timeout remains fatal.
3. Rebind app and public origins, port-dependent auth options and publishing's isolated Wrangler config for the selected port. Subsequent calls and dev-ingress restarts reuse the working port. Successful recovery logs the first failed port and the working port on a single line.
4. Occupy a loopback port deliberately and force the first attempt onto it. Exercise the touched composer files and Cutover, run typecheck and check the source lock. Use the branch's exact-SHA Verify for the full suite.

The shared dev-ingress startup file is under tests/dev-ingress and is used directly by the Cutover end-to-end test. Wrangler, Miniflare, Base-managed installations and the separately scoped landing-page suite keep their existing startup paths.

No contract clause claimed; this is test-infrastructure maintenance.

The full-target clause totals are 66 done, 123 partial and 56 missing, for 245 total, before and after. The verification inventory stays at 116 registered cases plus 10 assertion scripts, for 126 checks.

See CHECKS.txt for the concrete local results and exact-SHA CI provenance.

Verify 44892622721 passed imports and composer on the exact product head. The public shard separately hit a Miniflare/workerd bind collision in the subscriber consent journey. That path falls outside the Vite startup change, and the failed aggregate keeps the published branch from READY.
