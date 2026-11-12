// Cloud-only launcher adaptation: use the required system Chromium for helpers
// that do not read PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. No assertion is changed.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require = createRequire(resolve('package.json'));
const { chromium } = require('playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = options => launch({ ...options, executablePath: '/usr/bin/chromium', args: [...(options?.args ?? []), '--no-sandbox'] });
