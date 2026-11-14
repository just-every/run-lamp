# Local check execution

Each helper import below ran from an ordinary temporary .mjs file in the checkout root, through cloud_run node <file>. The launch files were removed after passing. Every shell sourced /tmp/rer-cloud-toolchain.sh, then put the installed project Node 22.20.0 binary first on PATH. The UI build used cloud_run npx -y @runeditrun/rer build. The browser launch set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium and LAMP_BROWSER_EVIDENCE to this packet's browser folder; the existing test adds --no-sandbox. No external provider credential was used for these synthetic fixture journeys.

## csv

```js
import { subscriberCsvFlow } from "./tests/e2e/helpers/subscriber-csv-flow.mjs"; await subscriberCsvFlow();
```

## hundred-row

```js
import { subscriberHundredRowCsvFlow } from "./tests/e2e/helpers/subscriber-csv-flow.mjs"; await subscriberHundredRowCsvFlow();
```

## browser

```js
import { subscriberIntakeBrowserFlow } from "./tests/e2e/helpers/subscriber-intake-browser-flow.mjs"; await subscriberIntakeBrowserFlow({diagnostic:console.log});
```

Typechecking: pnpm run typecheck. Source lock: node scripts/edition-authoring/cli.mjs lock, then node scripts/edition-authoring/cli.mjs check. Contract views: node src/base/contract-docs.mjs check. Count: node scripts/verification/check-plan.mjs. Both edited journey helpers passed node --check. git diff --check passed. The main CSV helper completed all its retained capacity checks; the final hundred-row helper reran after adding mixed name/identifier coverage. The final browser helper reran with the component names/IDs list expanded in the retained review screenshots.
