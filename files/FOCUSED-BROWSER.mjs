import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const moduleAt = path => import(pathToFileURL(resolve(path)));
const { mailSettingsBrowserFlow } = await moduleAt('tests/e2e/helpers/mail-settings-browser-flow.mjs');
await mailSettingsBrowserFlow({ diagnostic: text => console.log(text) });
console.log('PASS configured provider Settings: active From field, provider choice, guide links, delivery outcomes.');
const { openStatusJourney } = await moduleAt('tests/e2e/helpers/status-journey.mjs');
const { maintenanceBrowserFlow } = await moduleAt('tests/e2e/helpers/maintenance-browser-flow.mjs');
const { chromium } = createRequire(resolve('package.json'))('playwright');
const j = await openStatusJourney({ builtWorker: true, pageHost: 'localhost' });
let browser;
try {
  browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const divider = j.cookie.indexOf('=');
  await context.addCookies([{ name: j.cookie.slice(0, divider), value: j.cookie.slice(divider + 1), url: j.appOrigin }]);
  const page = await context.newPage();
  await maintenanceBrowserFlow({ page, appUrl: j.appOrigin, pageUrl: j.publicOrigin,
    api: (path, method='GET', body) => j.json(path, method, body, path === '/api/app/components' || path === '/api/app/incidents' || path === '/api/app/maintenance' ? method === 'POST' ? 201 : 200 : 200),
    screenshots: async () => {},
  });
  await context.close();
  console.log('PASS built maintenance browser flow: Scheduled and incidents remain separate; saved window and public records agree.');
} finally { await browser?.close(); await j.close(); }
