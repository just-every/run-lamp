import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { nativeRequest, openNativeRuntime, origin, publicOrigin } from '../dev-ingress/runtime.mjs';
import { devKey } from '../helpers/dev-key.mjs';
import { signInAs } from '@runeditrun/rer/internal/modules/operator-auth/dev/sign-in-as.mjs';
import { notificationActivity, assertNoNewNotifications, moveInDoor } from '../helpers/import-notifications.mjs';
import { reservePort } from './worker-startup.mjs';

// One owner migration through the actual wizard and Cutover documents. The source
// table changes the saved export, not the behavior or the viewport under test.
test('MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover', { timeout: 600_000 }, async () => {
  const runtime = await openNativeRuntime(); let browser;
  try {
    await runtime.start(); await runtime.seedOperator();
    browser = await chromium.launch({ executablePath: process.env.LAMP_CHROMIUM_PATH, headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.grantPermissions(['local-network-access'], { origin });
    await context.route(url => url.pathname.startsWith('/@fs/'), route => route.continue({ headers: { ...route.request().headers(), 'x-rer-dev-key': devKey } }));
    const entered = await signInAs({ origin, key: devKey });
    await context.addCookies(entered.cookies.map(cookie => ({ ...cookie, url: origin })));
    const page = await context.newPage(); await page.goto(origin + entered.location); await page.waitForURL('**/app');
    await fetch(publicOrigin + '/');
    const evidence = process.env.LAMP_CUTOVER_EVIDENCE;
    if (evidence) await mkdir(evidence, { recursive: true });
    const capture = async name => {
      if (evidence) for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: join(evidence, `${name}-${width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    const moveIn = moveInDoor(async (path, body, headers) => {
      const response = await nativeRequest(path, { cookie: entered.header, ...(body === undefined ? {} : { method: 'POST', json: body }), headers });
      return { status: response.status, body: await response.json() };
    });
    const assertStatuspageGuide = async () => {
      const readers = page.getByRole('heading', { name: 'Feeds and other readers', exact: true }).locator('..');
      const text = await readers.innerText();
      for (const served of [/RSS is available at \/feed\.rss and \/history\.rss/, /\/history\.atom answers with Lamp’s Atom feed after import, also available at \/feed\.atom/, /Statuspage \/api\/v2\/ read endpoints.*are served/, /\/embed\/script\.js tags serve Lamp’s floating notice on the moved hostname/, /Allow the website that embeds it in Settings/]) assert.match(text, served);
      for (const unavailable of [/Per-window switches and Verifying are unavailable/, /Webhook body compatibility and component automation email addresses remain unavailable/]) assert.match(text, unavailable);
      const guide = page.getByRole('heading', { name: 'Operating Lamp after Statuspage', exact: true }).locator('..');
      const notes = await guide.getByRole('listitem').allTextContents();
      assert.equal(notes.length, 3);
      assert.match(notes[0], /A published update is never edited in place.*correction update that names it.*publish it with no channels selected when nobody should be notified again.*Both updates stay on the timeline/);
      assert.match(notes[1], /Component states change with each update.*set each affected component's state in the update you publish.*publishing applies the states and the update together/);
      assert.match(notes[2], /Components set to show only while degraded keep that behaviour after import/);
    };
    const openWizard = async () => {
      const hydrated = page.waitForResponse(response => response.url() === origin + '/api/app/statuspage-import/jobs' && response.request().method() === 'GET' && response.status() === 200);
      await page.goto(origin + '/app/move-in'); await hydrated;
    };
    for (const source of ['statuspage', 'betterstack', 'instatus', 'sorry']) {
      const quiet = await notificationActivity(runtime);
      await openWizard();
      await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption(source);
      if (source !== 'statuspage') {
        // Provider-controlled names, addresses and IDs stay literal text, even
        // when they contain executable markup or entity-encoded markup.
        const hostile = '<img src=x onerror="window.importXss=true">&lt;svg onload="window.importXss=true"&gt;';
        const pagesRoute = '**/api/app/statuspage-import/pages';
        await context.route(pagesRoute, route => route.fulfill({ json: { pages: [{ id: hostile, name: hostile, address: 'javascript:alert(1)' }] } }));
        await page.getByLabel(source === 'instatus' ? 'API key' : 'API token', { exact: true }).fill('synthetic-lamp-source-token');
        await page.getByRole('button', { name: 'Find my pages', exact: true }).click();
        const pages = page.getByRole('list', { name: 'Your status pages', exact: true });
        await pages.waitFor();
        assert.equal(await pages.locator('strong').textContent(), hostile);
        assert.ok((await pages.innerText()).includes('javascript:alert(1)'));
        assert.equal(await pages.locator('img, svg, script, a').count(), 0);
        assert.equal(await page.evaluate(() => window.importXss), undefined);
        await pages.getByRole('button', { name: 'Use this page', exact: true }).click();
        assert.equal(await page.getByLabel(source === 'instatus' ? 'Instatus page ID' : source === 'sorry' ? 'Sorry page ID' : 'Better Stack page ID', { exact: true }).inputValue(), hostile);
        if (source === 'betterstack') await capture('source-page-text');
        await page.getByLabel(source === 'instatus' ? 'API key' : 'API token', { exact: true }).fill('');
        await page.getByLabel(source === 'instatus' ? 'Instatus page ID' : source === 'sorry' ? 'Sorry page ID' : 'Better Stack page ID', { exact: true }).fill('');
        await context.unroute(pagesRoute);
      }
      const directory = resolve('tests/fixtures', source, source === 'sorry' ? 'public' : 'small');
      const files = await Promise.all((await readdir(directory)).map(async name => {
        if (source !== 'statuspage') return join(directory, name);
        const buffer = await readFile(join(directory, name));
        if (name !== 'incidents.json') return { name, mimeType: 'application/json', buffer };
        const incidents = JSON.parse(buffer.toString('utf8'));
        // A real unresolved imported story makes an empty or hidden notice fail.
        incidents[0].status = 'investigating'; incidents[0].resolved_at = null;
        incidents[0].incident_updates = incidents[0].incident_updates.slice(0, 1);
        return { name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(incidents)) };
      }));
      const review = async () => {
        await page.getByLabel('Saved responses', { exact: true }).setInputFiles(files);
        if (source === 'instatus') await page.getByLabel('Instatus page ID', { exact: true }).fill('synthpage01');
        if (source === 'sorry') await page.getByLabel('Sorry page ID', { exact: true }).fill('synthpage01');
        if (source !== 'statuspage') await page.getByLabel(source === 'sorry' ? /This Sorry page and supplied history/ : source === 'instatus' ? /This Instatus page and its history/ : /This Better Stack page is public/).check();
        const reviewing = page.waitForResponse(response => response.url() === origin + '/api/operator/import/plan');
        await page.getByRole('button', { name: 'Run dry run', exact: true }).click();
        const reviewed = await reviewing; assert.equal(reviewed.status(), 200, await reviewed.text());
        await page.getByRole('heading', { name: 'Dry run', exact: true }).waitFor();
      };
      await review();
      // A different source invalidates the reviewed upload before the owner can apply it.
      await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption(source === 'statuspage' ? 'instatus' : 'statuspage');
      assert.equal(await page.getByRole('button', { name: 'Import', exact: true }).count(), 0);
      await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption(source); await review();
      await page.getByRole('link', { name: 'Read the Cutover preview', exact: true }).click();
      await page.getByRole('heading', { name: 'Old public addresses', exact: true }).waitFor();
      if (source === 'statuspage') await assertStatuspageGuide();
      assert.equal(await page.getByRole('button', { name: 'Send invitations', exact: true }).isDisabled(), true);
      await openWizard(); await page.getByRole('combobox', { name: 'Source', exact: true }).selectOption(source); await review();
      await page.getByLabel('I reviewed what changes, is skipped or is refused.').check();
      const approvedAfter = Date.now();
      const applying = page.waitForResponse(response => /\/api\/app\/statuspage-import\/jobs\/[^/]+$/.test(new URL(response.url()).pathname) && response.request().method() === 'GET');
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      const result = await (await applying).json(); assert.equal(result.job.state, 'completed');
      if (source === 'sorry') {
        await page.getByRole('heading', { name: 'Imported', exact: true }).waitFor();
        await capture('sorry-imported');
        const read = async path => (await nativeRequest(path, { cookie: entered.header })).json();
        const inventory = await read('/api/app/components');
        assert.equal(inventory.components.filter(row => row.name === 'Customer services').length, 0, 'Sorry parent is a group only');
        const group = inventory.groups.find(row => row.name === 'Customer services');
        assert.ok(group && inventory.components.some(row => row.name === 'Billing API' && row.groupId === group.id));
        for (const [kind, rows] of Object.entries({ group: inventory.groups, component: inventory.components, incident: (await read('/api/app/incidents')).incidents, maintenance: (await read('/api/app/maintenance')).maintenance })) assert.equal(result.report.counts[kind].imported, rows.length, `${kind} created count matches Lamp`);
        await openWizard();
        const history = page.getByRole('heading', { name: 'Your imports', exact: true }).locator('..');
        const job = history.getByRole('listitem').filter({ hasText: result.job.id.slice(0, 12) });
        await job.getByRole('button', { name: 'Undo', exact: true }).waitFor();
        assert.match(await job.innerText(), /approved by operator@ingress.example.test at /);
        const approval = (await read('/api/app/statuspage-import/jobs')).jobs.find(row => row.id === result.job.id);
        assert.ok(Date.parse(approval.approvedAt) >= approvedAfter);
        const audit = (await read(`/api/app/audit-log?from=${encodeURIComponent(new Date(approvedAfter).toISOString())}&limit=100`)).entries;
        assert.ok(audit.some(row => row.action === 'import-approved' && row.entityName === 'Sorry import'));
        const changes = audit.filter(row => row.action === 'state-changed' && row.entityId === inventory.components.find(row => row.name === 'Billing API').id);
        assert.ok(changes.length && changes.every(row => row.entityName === 'Billing API' && Date.parse(row.createdAt) >= Date.parse(approval.approvedAt)), 'import audit names the component and records its write after approval');
        await capture('sorry-history');
        await page.goto(origin + '/app/components');
        await page.getByRole('heading', { name: 'Components', exact: true }).waitFor();
        await capture('sorry-components');
        await page.goto(origin + '/app/settings#audit');
        await page.getByRole('button', { name: 'Open audit log', exact: true }).click();
        await page.getByRole('region', { name: 'Audit entries', exact: true }).waitFor();
        assert.ok((await page.getByRole('region', { name: 'Audit entries', exact: true }).innerText()).includes('Billing API'));
        await capture('sorry-audit');
      }
      await page.goto(origin + `/app/cutover?job=${result.job.id}`);
      await page.getByRole('heading', { name: 'Old public addresses', exact: true }).waitFor();
      if (source === 'statuspage') {
        await assertStatuspageGuide();
        const settings = await (await nativeRequest('/api/app/page-settings', { cookie: entered.header })).json();
        const current = settings.settings;
        // A separate origin on the local public site keeps this browser request
        // inside the dev gateway's same-site boundary, without a private key.
        const website = new URL(publicOrigin); website.port = String(await reservePort());
        const websiteOrigin = website.origin;
        const allowed = await nativeRequest('/api/app/page-settings', { cookie: entered.header, method: 'PUT', json: {
          pageName: current.pageName, tagline: current.tagline, accentColor: current.accentColor,
          timezone: current.timezone, hostname: current.hostname, mailFromAddress: current.mailFromAddress,
          footerCreditEnabled: current.footerCreditEnabled,
          widgetAllowedOrigins: [websiteOrigin],
        } });
        assert.equal(allowed.status, 200, await allowed.text());
        const imported = (await (await nativeRequest('/api/app/incidents', { cookie: entered.header })).json()).incidents.find(row => row.title === 'Elevated API errors');
        assert.equal(imported.lifecycle, 'Investigating');
        await context.grantPermissions(['local-network-access'], { origin: websiteOrigin });
        const noticePage = await context.newPage();
        try {
          const errors = [];
          noticePage.on('pageerror', error => errors.push(error.message));
          noticePage.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
          noticePage.on('requestfailed', request => errors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`));
          // The owner website supplies an old tag without Lamp variant options.
          await noticePage.route(websiteOrigin + '/synthetic-lamp-embed', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><title>Synthetic Lamp embedding website</title><body><main>Customer website</main><script src="${publicOrigin}/embed/script.js"></script></body></html>` }));
          const scriptRead = noticePage.waitForResponse(publicOrigin + '/embed/script.js');
          await noticePage.goto(websiteOrigin + '/synthetic-lamp-embed');
          const scriptResponse = await scriptRead.catch(error => { throw new Error(`${error.message}; browser errors: ${JSON.stringify(errors)}`); });
          assert.equal(scriptResponse.status(), 200);
          const snapshot = await (await fetch(publicOrigin + '/api/public/status')).json();
          assert.equal(snapshot.incident?.reference, imported.reference, 'the public generation contains the unresolved imported story');
          assert.ok((await scriptResponse.text()).includes(websiteOrigin), 'the compatibility script carries the saved website allowlist');
          assert.deepEqual(errors, [], 'the old tag executes without browser errors');
          const notice = noticePage.getByRole('status');
          await notice.waitFor({ state: 'visible' });
          assert.equal(await notice.count(), 1, 'the old tag creates one visible notice');
          assert.deepEqual(await notice.evaluate(element => ({ position: getComputedStyle(element).position, bottom: getComputedStyle(element).bottom, right: getComputedStyle(element).right })), { position: 'fixed', bottom: '16px', right: '16px' }, 'the compatibility tag selects the floating notice by default');
          assert.equal(await notice.locator('strong').innerText(), 'Partially unavailable', 'the notice reflects the imported partial-outage claim');
          const content = await notice.innerText();
          for (const value of [imported.reference, 'Elevated API errors', 'Status: Investigating', 'We are investigating elevated error rates on the API.']) assert.ok(content.includes(value), `the old tag renders the imported incident content: ${value}`);
          if (evidence) for (const width of [1440, 390]) {
            await noticePage.setViewportSize({ width, height: 1000 });
            await noticePage.screenshot({ path: join(evidence, `statuspage-old-embed-${width}.png`), fullPage: true });
          }
        } finally { await noticePage.close(); }
        console.log('PROBE MOVE-009 1: old embed tag after import and owner origin opt-in -> one visible fixed floating notice with imported reference, title, lifecycle and customer wording');
        console.log('PROBE MOVE-009 3: dry-run and completed Cutover documents -> full correction, no-channel, atomic publication-state and degraded-only guidance visible');
      }
      await page.getByLabel('Public address', { exact: true }).fill(publicOrigin);
      await page.getByRole('button', { name: 'Use this address for checks' }).click();
      const checks = page.getByRole('button', { name: 'Check opens', exact: true });
      assert.ok(await checks.count(), 'imported bookmarks have an explicit open check');
      for (const button of await checks.all()) {
        await button.click(); await button.locator('..').getByRole('status').filter({ hasText: /^Opens$/ }).waitFor();
      }
      assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations.filter(row => ['serious', 'critical'].includes(row.impact)), []);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      if (evidence) {
        await page.screenshot({ path: join(evidence, `${source}-cutover-1440.png`), fullPage: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: join(evidence, `${source}-cutover-390.png`), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await assertNoNewNotifications(runtime, quiet, 'navigation, checks and history reads remain silent');
      if (source === 'sorry') {
        await openWizard();
        await page.getByRole('listitem').filter({ hasText: result.job.id.slice(0, 12) }).getByRole('button', { name: 'Undo', exact: true }).click();
        await page.getByRole('heading', { name: 'Undone', exact: true }).waitFor();
        assert.equal((await moveIn.read(result.job.id)).body.job.state, 'undone');
        await capture('sorry-undone');
        continue;
      }
      await page.getByLabel('Public address', { exact: true }).fill(`http://127.0.0.1:${await reservePort()}`);
      await page.getByRole('button', { name: 'Use this address for checks' }).click();
      const first = page.getByRole('button', { name: 'Check opens', exact: true }).first(); await first.click();
      await first.locator('..').getByRole('status').filter({ hasText: 'Could not verify' }).waitFor();
      const sending = page.waitForResponse(response => response.url().endsWith('/send-invitations'));
      await page.getByRole('button', { name: 'Send invitations', exact: true }).click();
      const sent = await sending; assert.equal(sent.status(), 200, await sent.text());
      assert.equal((await sent.json()).report.cutover.invitations.eligible, 0);
      assert.equal(await page.getByRole('button', { name: 'Send invitations', exact: true }).isDisabled(), true);
      await page.reload(); await page.getByRole('heading', { name: 'Old public addresses', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Send invitations', exact: true }).isDisabled(), true);
      const repeated = await moveIn.read(result.job.id); assert.equal(repeated.body.report.cutover.invitations.eligible, 0);
      const undone = await moveIn.undo(result.door); assert.equal(undone.status, 200, JSON.stringify(undone.body));
      assert.equal(undone.body.job.state, 'undone');
      for (const row of result.report.cutover.rows) assert.equal((await fetch(publicOrigin + row.path)).status, 404);
    }
    await context.close();
  } finally { await browser?.close(); await runtime.close(); }
});
