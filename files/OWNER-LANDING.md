# Completed-owner landing

Plan: reproduce local owner entry against a synthetic installation with durable first-run completion; inspect both document and client route entry; enforce the stored completion state at the loader entry that lacks it; preserve fresh-owner setup; extend the existing setup journey; view the resulting admin at 1440 and 390.

Before: a fresh local owner session on a completed synthetic install correctly entered `/app`, and ordinary `GET /setup` correctly redirected to `/app`. However, browser history navigation to `/setup` entered the client route and rendered the Welcome card. This was reproduced with the real dev sign-in door and native development runtime; `owner-reproduction.json` records the observed statuses and `owner-before-1440.png` shows the card.

Cause: `src/server.ts` guarded full document requests, while `loadOperatorSession` accepted the first-run route through its server-function entry without checking the saved `setup_readiness` marker. The first-run route therefore could reopen the Welcome card after setup had already completed.

Change: enforce the same durable first-run state in the shared session loader before returning setup or admin data. An incomplete installation enters `/setup`; a completed one requesting the first-run route returns to `/app`. This keeps the existing document behavior and protects client route changes too. No setup state is inferred from page settings, and no migrations or click-to-set-up behavior changed.

Regression coverage: extend `tests/e2e/website-onboarding.test.mjs`, preserving its existing fresh-owner setup assertions. After completing its existing setup journey, sign the owner out and use a new local owner entry, assert the admin landing and absence of Welcome, assert saved GET/HEAD `/setup` redirects, then enter `/setup` through browser history to exercise the previously unguarded loader.

After smoke: a new owner entry and a client history visit to `/setup` both finish at `/app`; Welcome is absent. `owner-after.json` and `owner-browser-receipt.json` record the result. The resulting admin was viewed at 1440 and 390, with no horizontal overflow; its heading is 40px and 32px respectively. Actual screenshots: `owner-after-1440.png`, `owner-after-390.png`. No UI CSS changed.

Initial full setup journey run: failed on its existing history-import completion wait at line 161, before the added owner regression assertions. This run occurred while import code was being edited; `/tmp/lamp-owner-test.log` retained the actual failure. A second full touched run adds the actual save error to that failure path and is in progress.

Final touched setup journey: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium cloud_run node --test --test-concurrency=1 tests/e2e/website-onboarding.test.mjs` passes (1/1 tests, preserving all existing assertions, including its full synthetic history-import path). Actual output is `owner-touched-test.log`. The test now includes the product's save error when its existing navigation wait fails, improving diagnostics without weakening its check.
