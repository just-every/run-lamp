# Lamp Vite fixture port retry

Fleet round sd-lamp-port-race-1-c3, 21 November 2026 UTC.

No contract clause claimed; this is test-infrastructure maintenance.

The c3 ref was absent at the initial remote probe. The c2 ref advertised source commit `553d1cdf26c3f491e23334727c250717881b9f56`. Fresh main advertised `33ba19fdf501e4af972ebd8d633f0d48f56e136a`.

## Plan and replay

1. Fetch main and the c2 ref, and create only `cloud/sd-lamp-port-race-1-c3` as a local branch from main.
2. Replay the specified fix as one linear commit. Regenerate the source lock from fresh main because its lock changed after the source commit's parent.
3. Run the touched browser tests, typecheck and source-lock check. Check the candidate identity and push only the named product ref.
4. Read Verify for the exact product commit, then publish this report and the actual check receipt on the dedicated evidence ref for fleet handoff.

The product candidate is `3ff1d402e05d64271a976199de1d4a1c82563961`. The replay applied without content conflicts. All five test source files in the candidate diff match the carrier commit byte for byte. The regenerated lock changed only the five corresponding file digests. The retry keeps strict port binding and reserves a fresh loopback port for each retry, with at most three startup attempts.

| Contract tier | Before and after, Done / Partial / Missing / Total |
| --- | --- |
| Core | 66 / 123 / 51 / 240 |
| Agent surface | 0 / 0 / 5 / 5 |
| Later | 0 / 0 / 0 / 0 |
| Full target | 66 / 123 / 56 / 245 |

Test registrations added or removed: zero. No product UI changed. The fleet performs the complete publication scan and landing.
