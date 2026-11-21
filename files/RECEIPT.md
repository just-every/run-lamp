# Lamp verification receipt

Candidate `3ff1d402e05d64271a976199de1d4a1c82563961` on `cloud/sd-lamp-port-race-1-c3`.

## Build, static checks and transport

- Frozen dependencies installed. Typecheck passed on Node 22.20.0 and pnpm 10.12.4.
- Source lock regenerated and its check passed. Contract document check passed with 0 errors and 0 warnings. Candidate diff passed the whitespace check.
- An occupied-loopback probe supplied the Vite collision diagnostic and verified that the fixture retried once on a different port and reached HTTP health.
- Production Worker artifact built successfully from an archive of the clean candidate for the local tests that depend on it.
- On 2026-11-21 at 13:10:19 UTC, the guarded product push completed on its first attempt. The sole candidate commit passed the author, committer and trailer audit. The published branch advertises the full candidate SHA above.
- Exact-SHA Verify run 44907516461 was in progress on attempt 1 when discovered at 13:12:10 UTC.

## Touched browser suites

- `pnpm run test:composer` ran the three directly edited test files, with 10 passes and 3 failures in 13 registrations. The maintenance, unsaved-work, and 390-wide owner smoke cases passed.
- The other two publishing failures on the first run needed the production Worker artifact. After building it, the isolated rerun of the permissions and publication journeys passed both tests, for 12 of the 13 touched cases passing across the two runs.
- The remaining `THEME-001` failure counted five requests in system Chromium 154 where the suite allows four. An unchanged main archive running the same system browser reproduced the same five paths, including `/assets/favicon.svg`. The four-request assertion and the existing theme behavior were preserved.
- An additional run of the three test files importing the shared dev-ingress helper initially hit a missing Playwright executable and a missing production Worker artifact. The private-channels case passed after the default Playwright executable path was directed to the installed system Chromium. The connect-monitors case reached its production Worker prerequisite after its native-runtime checks.
- The additional ingress, cutover and website-onboarding run had 8 passes in 10 registrations on its first run. The private-channels and artifact-backed connect-monitors retries both passed, for 10 of 10 confirmed cases across the runs.

## Final GitHub Verify

On 2026-11-21 at 13:27:22 UTC, GitHub REST returned completed/success for run 44907516461, attempt 1, on the exact candidate SHA. No CI rerun was needed. The actual API result is included as `verify-result.json`.

https://github.com/just-every/run-lamp/actions/runs/44907516461
