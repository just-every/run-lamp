// Cloud browser adapter: preserve test scenarios while using the VM browser.
const { chromium } = require('/workspace/run-lamp/node_modules/playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = options => launch({ ...options, executablePath: '/usr/bin/chromium', args: [...(options?.args ?? []), '--no-sandbox'] });
