# Lamp Playwright route teardown

Task sd-lamp-route-fulfill-1 · 2026-11-21 UTC · Run Edit Run fleet

No contract clause claimed; this is test-infrastructure maintenance.

## Plan and implementation

1. Audit the four Playwright route completion methods across Lamp e2e, starting with the two mail handlers. Follow separately declared callbacks and identify calls reached after an asynchronous operation.
2. Use one shared completion guard for the eight affected fulfill calls and two affected continue calls. The guard handles duplicate completion and closed page, context or browser errors. Response-body reads and pre-completion assertions stay outside the guard, and unexpected completion errors propagate.
3. Build and run the six affected e2e entry points and the typecheck. Validate the generated contract documents and the regenerated source lock. Exercise duplicate route completion in Chromium.
4. Rebase on fresh main, inspect every candidate commit, push the named branch, and check its exact-SHA Verify. Publish this packet on the evidence ref.

## Scope and counts

- 33 route completion call sites audited. Guarded calls went from 0 to 10. No abort or fallback call followed an earlier await.
- 25 e2e test files and 82 directly written test registrations before and after. Existing assertions and worker-startup port logic were preserved.
- Full contract target before and after (done, partial, missing, total) was 66, 123, 56, 245. Generated views and contract source match main.
- No product code or UI changed. The source lock was regenerated for the e2e source changes.
- The full publication scan is owned by the Mac lander.

## Rebase and local verification

The initial six-file run executed 38 tests. 37 passed, including every journey that uses a guarded call. The existing THEME-001 resource budget check counted favicon.svg as a fifth request with system Chromium 154.0.8037.57. An isolated retry of that journey on the original unmodified main reproduced the same failure. The test and product were left intact. The first environment probe also found a missing Playwright default browser executable. A temporary Playwright browser directory pointed the default launch at the required system Chromium, without modifying Lamp.

Main advanced during the initial tests. The route change was replayed as one linear commit on 885d3d981556cdc99fa3656225fbd89d714e2058. The publishing test's new main import and assertions were retained. The contract source matched main, its views regenerated and checked successfully, and the views were restored from main. The source lock was regenerated after the test conflict was resolved.

On the rebased candidate, the production build and the typecheck were rerun with pinned Node 22.20.0. The complete mail file and the journeys that exercise the other eight guarded calls were rerun using system Chromium.

All 11 selected journeys passed on the final SHA, counting the successful retries of the mail-off and composer journeys after their earlier timed-out runs. The other four mail tests, three delivery/import tests, and two operations tests passed on their first attempts after rebase. A fresh-main comparison also passed the composer journey.

The product branch was pushed once at 7fc7fecdc331a1078f7480999ade305561259ab7. The fleet Git credential helper and URL cleanup were installed before cloning. The push guard was installed before publication.

## Exact-SHA Verify

Run 44927255258, attempt 1, completed with conclusion success on 7fc7fecdc331a1078f7480999ade305561259ab7. https://github.com/just-every/run-lamp/actions/runs/44927255258
