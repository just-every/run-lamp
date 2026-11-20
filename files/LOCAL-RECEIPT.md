# Browser and local verification receipt

Candidate: `a16d8b260b0fa9e6c0b90aab306d9dbcd2878718`

Node 22.20.0, pnpm 10.12.4, system Chromium for the operator journeys. Browser command: `node --test --test-concurrency=1 tests/e2e/publishing-browser.test.mjs` with a 20-minute process limit.

Browser proof run: both leased journeys passed and captured the Timeline once per width. The file initially returned 1 because its separate THEME-001 helper could not find the Playwright Chromium headless shell. Installed the pinned browser with `pnpm exec playwright install chromium`. The operator proof screenshots were inspected before publication.

PROBE PAGE-002 3: 1440-wide Brisbane browser Timeline update 01M7WZKCFZ9BCJXRQ5NY6F7TFM at 2026-11-20T17:21:13.342Z -> displays Nov 20, 2026, 09:21 Los Angeles time
PROBE PAGE-002 3: 390-wide Brisbane browser Timeline update 01M7WZN0VAZKPMFJD368V86D4K at 2026-11-20T17:22:07.393Z -> displays Nov 20, 2026, 09:22 Los Angeles time

Screenshots: `1440-operator-publication-time.png` and `390-operator-publication-time.png`.

Typecheck and first-party check both exited 0. Contract validation reported zero errors and warnings. Source lock generation and its freshness check exited 0. No migration was touched.

After installing Playwright Chromium, the full file with the system Chromium 154 override passed seven registrations, including both publication journeys. The existing THEME-001 request-budget check observed five requests because the system browser also requested the favicon. Verify uses Playwright's pinned Chromium. The existing four-request assertion was retained.

Isolated THEME-001 rerun on the same SHA with the repository Chromium 153 and the system override cleared exited 0. The four layouts each made four own-origin requests. No test assertion or source changed between browser runs.

- default: 200 public components with the saved palette, uploaded font, banner and links: 31176 bytes gzipped, 4 own-origin requests
- calm: 200 public components with the saved palette, uploaded font, banner and links: 29986 bytes gzipped, 4 own-origin requests
- uptime: 200 public components with the saved palette, uploaded font, banner and links: 37224 bytes gzipped, 4 own-origin requests
- regions: 200 public components with the saved palette, uploaded font, banner and links: 34295 bytes gzipped, 4 own-origin requests

The full file and the pinned browser follow-up together cover all eight registrations on the same candidate SHA.

The browser-local date and time differ from the observed page-zone value at both widths.

- 1440 pixels: the same instant falls at Nov 21, 2026, 03:21 in Brisbane.
- 390 pixels: the same instant falls at Nov 21, 2026, 03:22 in Brisbane.
