import { chromium } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/node_modules/playwright/index.mjs';
const launch = chromium.launch.bind(chromium);
chromium.launch = options => launch({ ...options, executablePath: '/usr/bin/chromium', args: [...new Set([...(options?.args ?? []), '--no-sandbox'])] });
