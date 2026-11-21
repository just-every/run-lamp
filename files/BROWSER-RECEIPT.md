# AUD-001 operator browser receipt

- Exact candidate head 68d0a2f086c58c21ca8aae71615cc4461c73c94e ran from a clean checkout.
- The command was `node --test --test-concurrency=1 --test-name-pattern='^AUD-001' tests/e2e/publishing-browser.test.mjs`, bounded at 20 minutes.
- The run used Node 22.20.0, pnpm 10.12.4 and headless system Chromium with the suite's no-sandbox option.
- One test passed. The command exited with code 0 after 123.2 seconds.
- The registered test is in `tests/e2e/publishing-browser.test.mjs` — AUD-001 — an operator configures status pages and publishes to the selected pages.
- The browser journey is in `tests/e2e/helpers/audience-pages-browser.mjs`.
- Assertions run at 1440. Browser captures record the same tested states at 1440 and 390.
- The operator used Settings to create Staff and a named audience, then edited the named audience at its stable address. Page names, tagline, accent, time zone, component inventory, footer-credit choice and scoped logo upload/removal were observed. The reader loaded the named audience's actual logo and omitted its footer credit. An unauthenticated visit disclosed no audience component.
- The operator used native incident forms to publish one update to both Public and Staff and a separate update to Staff alone. The public reader saw the first update, the Staff reader saw both, and the operator acknowledgement linked to the selected pages.
- The operator used native Maintenance to schedule one window only for the named audience. The audience reader saw that window. The public reader remained free of it.
- The incident composer tooltip appeared on hover and used an immediate zero-delay state on keyboard focus.

| File | Captured pixels | SHA-256 |
| --- | --- | --- |
| browser/1440-audience-incident-composer.png | 1440 × 1058 | ef8c4171026f4faa42563a436d5784facd9ee578ba5d2b0d88e5f44962791a65 |
| browser/1440-audience-maintenance-scheduler.png | 1440 × 1525 | bb051f4841e1d229432e766f6479d66d65f0b1678a905abfe385dbba57b67192 |
| browser/1440-audience-page-reader.png | 1440 × 1000 | 3582bce5631aaf041223201a3c369d31b76f3bb1777393de6b4ce5fa27b4e147 |
| browser/1440-audience-page-settings.png | 1440 × 3229 | 6de910fb1f227b3be9a9c0f1b664e9b16fbf9c54c0f0f89cc51712b772175d22 |
| browser/1440-audience-public-reader.png | 1440 × 1773 | 2464e2908293966259fbfb75e581299fa0424d47d7d1634c9f44e90931844376 |
| browser/1440-audience-staff-reader.png | 1440 × 1818 | f22234ba299fb085e4418f6f03a58d05e6ad49cacf8bc55415187a374798420c |
| browser/390-audience-incident-composer.png | 390 × 1747 | 8873fb4bf109553d9ed7d54d2d7142b5941804aeba9b16058a502a7c606a88db |
| browser/390-audience-maintenance-scheduler.png | 390 × 1689 | d66d1af41e919df1fe3b89584423513ebdccc5c3ba8dac2a32bf9617b104c068 |
| browser/390-audience-page-reader.png | 390 × 1000 | 2458fc9f1cb87187e217e2bca7346d9113df3ae45d060534a46d9f9bdfbd8621 |
| browser/390-audience-page-settings.png | 390 × 3945 | 0d89730bad8fc1377f3fc440182a579b0cabf32237597c30b6bd2639ad29dd1e |
| browser/390-audience-public-reader.png | 390 × 2028 | 1779af215e878bdf7a48e43d3193aaed7e2022256ac807ba4cec33667b4de77e |
| browser/390-audience-staff-reader.png | 390 × 2054 | a21abfafb59677785bfbec122ed9349463a2291c0e539d2c0cabe89912761aae |
