import assert from 'node:assert/strict';
import { chromium } from 'playwright';

export const widgetInstallations = [
  { id: 'banner', path: '/widget.js', variant: 'banner', display: 'flex' },
  { id: 'dot', path: '/widget.js', variant: 'dot', display: 'inline-flex' },
  { id: 'floating', path: '/widget.js', variant: 'floating', position: 'top-left', display: 'flex' },
  { id: 'compatibility', path: '/embed/script.js', position: 'bottom-right', display: 'flex' },
];

/** Identify each installation by its own script and the section it inserts. */
export async function installWidget(page, origin, installation, hideOperational = false) {
  const id = `synthetic-lamp-${installation.id}${hideOperational ? '-hide' : ''}`;
  await page.evaluate(({ origin, installation, hideOperational, id }) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = origin + installation.path;
    if (installation.variant) script.dataset.variant = installation.variant;
    if (installation.position) script.dataset.position = installation.position;
    script.dataset.background = '#e4effa';
    script.dataset.color = '#123456';
    script.dataset.hideOperational = String(hideOperational);
    script.onload = resolve;
    script.onerror = reject;
    document.body.append(script);
  }), { origin, installation, hideOperational, id });
  const root = page.locator(`#${id} + section[role=status]`);
  await root.waitFor({ state: 'attached' });
  assert.equal(await root.count(), 1, `${id} installs exactly one status section`);
  return root;
}

/** An ordinary embedding document; script and polling bytes come from Lamp. */
export async function openWidgetHost(context, origin) {
  const page = await context.newPage();
  await page.clock.install();
  await page.route(origin + '/synthetic-lamp-embed', route => route.fulfill({
    contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Synthetic Lamp embed host</title><body><main><h1>Service status</h1></main></body></html>',
  }));
  await page.goto(origin + '/synthetic-lamp-embed');
  return page;
}

/** Execute every public script installation independently, including its poll. */
export async function widgetPrivacyFlow(fixture) {
  const { settings } = await (await fixture.appFetch('/api/app/page-settings')).json();
  const input = { pageName: settings.pageName, tagline: settings.tagline, accentColor: settings.accentColor, timezone: settings.timezone, hostname: settings.hostname, footerCreditEnabled: settings.footerCreditEnabled, mailFromAddress: settings.mailFromAddress, aiToneInstructions: settings.aiToneInstructions, widgetAllowedOrigins: [fixture.pageUrl] };
  assert.equal((await fixture.appFetch('/api/app/page-settings', { method: 'PUT', body: JSON.stringify(input) })).status, 200);
  const browser = await chromium.launch({ headless: true, executablePath: process.env.LAMP_CHROMIUM_PATH, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
  try {
    const snapshot = await (await fixture.fetch('/api/public/status')).json();
    for (const installation of widgetInstallations) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        // Local embedding hosts need browser permission to reach the loopback Worker.
        await context.grantPermissions(['local-network-access']);
        const page = await openWidgetHost(context, fixture.pageUrl);
        const requests = [];
        page.on('request', request => requests.push(request));
        const root = await installWidget(page, fixture.pageUrl, installation);
        assert.equal(await page.locator('section[role=status]').count(), 1, `${installation.id} is independently installed`);
        assert.equal(await root.locator('strong').textContent(), snapshot.overall);
        const polled = page.waitForResponse(response => new URL(response.url()).pathname === '/api/public/status' && response.status() === 200);
        await page.clock.fastForward(30000);
        assert.deepEqual(await (await polled).json(), snapshot, `${installation.id} polls the same public snapshot`);
        assert.deepEqual(requests.map(request => new URL(request.url()).pathname), [installation.path, '/api/public/status'], `${installation.id} loads its artifact then actually polls`);
        for (const request of requests) {
          const url = new URL(request.url());
          assert.equal(url.origin, fixture.pageUrl, `${installation.id} reads stay on the public status origin`);
          assert.equal(url.search, '');
          assert.equal(request.method(), 'GET');
          assert.equal(request.postData(), null);
          assert.equal((await request.allHeaders()).cookie, undefined);
        }
        const denied = await openWidgetHost(context, fixture.appUrl);
        const deniedRequests = [];
        denied.on('request', request => deniedRequests.push(request));
        await denied.evaluate(({ origin, installation }) => new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = origin + installation.path;
          if (installation.variant) script.dataset.variant = installation.variant;
          script.onload = resolve; script.onerror = reject; document.body.append(script);
        }), { origin: fixture.pageUrl, installation });
        await denied.clock.fastForward(60000);
        assert.equal(await denied.locator('section[role=status]').count(), 0, `${installation.id} renders nothing on an unlisted origin`);
        assert.deepEqual(deniedRequests.map(request => new URL(request.url()).pathname), [installation.path], `${installation.id} never starts polling from the denied origin`);
        console.log(`PROBE PAGE-019 3: ${installation.id} allowed installation and own-origin poll reconcile the public snapshot; denied origin renders nothing and never polls`);
      } finally { await context.close(); }
    }
  } finally {
    await browser.close();
    assert.equal((await fixture.appFetch('/api/app/page-settings', { method: 'PUT', body: JSON.stringify({ ...input, widgetAllowedOrigins: settings.widgetAllowedOrigins }) })).status, 200);
  }
}
