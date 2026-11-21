import assert from 'node:assert/strict';
import { newIncidentForm } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

async function openPublishedPage(screen, url, content) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await screen.goto(url, { waitUntil: 'domcontentloaded' });
    if (response?.ok() && (await screen.locator('body').innerText()).includes(content)) return;
    await new Promise(resolve => setTimeout(resolve, 125));
  }
  assert.fail(`The selected status page did not show ${content}.`);
}

export async function audiencePagesBrowserFlow({ page, browser, appUrl, pageUrl, api, localInput, screenshots, diagnostic }) {
  assert.equal(page.viewportSize().width, 1440);
  async function component(name, internal = false) {
    return (await api('/api/app/components', 'POST', { name, internal, groupId: null, description: '', displayOrder: 0, note: '' })).component;
  }
  const shared = await component('Dispatch customer API');
  const staffConsole = await component('Staff dispatch console', true);
  const partnerQueue = await component('Partner pickup queue');
  const staff = {
    path: 'staff-browser', kind: 'staff', pageName: 'Staff operations', tagline: 'Dispatch and internal tools',
    accentColor: '#315887', componentIds: [shared.id, staffConsole.id], components: [shared.name, staffConsole.name],
  };
  const audience = {
    path: 'partners-browser', kind: 'audience', pageName: 'Partner operations', tagline: 'Pickup updates for partners',
    accentColor: '#70502E', componentIds: [partnerQueue.id], components: [partnerQueue.name],
  };
  await page.goto(`${appUrl}/app/settings#page`);
  await operatorHydrated(page);
  const statusPages = page.getByRole('region', { name: 'Status pages', exact: true });
  const addPage = statusPages.getByRole('button', { name: 'Add status page' });
  await addPage.waitFor();
  assert.equal(await statusPages.getByRole('link', { name: 'Open public page' }).getAttribute('href'), new URL('/', pageUrl).href);
  for (const entry of [staff, audience]) {
    await addPage.click();
    const editor = statusPages.getByRole('form', { name: 'New status page' });
    await editor.getByRole('combobox', { name: /^Access/ }).selectOption(entry.kind);
    await editor.getByRole('textbox', { name: /^Page path/ }).fill(entry.path);
    await editor.getByRole('textbox', { name: 'Page name', exact: true }).fill(entry.pageName);
    await editor.getByRole('textbox', { name: 'Tagline', exact: true }).fill(entry.tagline);
    await editor.getByRole('textbox', { name: 'Accent colour', exact: true }).fill(entry.accentColor);
    const zone = editor.getByRole('combobox', { name: 'Time zone', exact: true });
    await zone.fill('UTC');
    await editor.getByRole('option', { name: 'Universal time', exact: true }).click();
    for (const name of entry.components) await editor.getByRole('checkbox', { name, exact: true }).check();
    await editor.getByRole('button', { name: 'Save status page' }).click();
    await statusPages.getByRole('status').filter({ hasText: `${entry.pageName} saved.` }).waitFor();
  }
  await statusPages.getByRole('button', { name: `Edit ${audience.pageName}` }).click();
  const editor = statusPages.getByRole('form', { name: 'Edit status page' });
  const audienceUrl = new URL(`/status-pages/${audience.path}/`, appUrl).href;
  assert.equal(await editor.getByRole('textbox', { name: /^Page path/ }).isDisabled(), true);
  assert.equal(await editor.getByRole('textbox', { name: /^Page path/ }).inputValue(), audience.path);
  assert.equal(await editor.getByRole('checkbox', { name: partnerQueue.name }).isChecked(), true);
  await editor.getByRole('textbox', { name: 'Tagline', exact: true }).fill('Pickup and dispatch updates for partners');
  await editor.getByRole('checkbox', { name: 'Show the Powered by Lamp footer credit' }).uncheck();
  await editor.getByLabel('Logo', { exact: true }).setInputFiles({
    name: 'synthetic-lamp-mark.svg', mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="128"><rect width="512" height="128" fill="#70502E"/></svg>'),
  });
  await statusPages.getByRole('status').filter({ hasText: 'Logo saved.' }).waitFor();
  await editor.getByRole('img', { name: 'Your logo' }).waitFor();
  await screenshots(page, 'audience-page-settings');
  await editor.getByRole('button', { name: 'Save status page' }).click();
  await statusPages.getByRole('status').filter({ hasText: `${audience.pageName} saved.` }).waitFor();
  const pages = (await api('/api/app/status-pages')).pages;
  for (const entry of [staff, audience]) {
    const stored = pages.find(candidate => candidate.path === entry.path);
    assert.deepEqual(new Set(stored.componentIds), new Set(entry.componentIds));
    assert.equal(stored.accentColor.toUpperCase(), entry.accentColor);
    assert.equal(stored.timezone, 'UTC');
  }
  assert.equal(await statusPages.getByRole('link', { name: `Open ${audience.pageName}` }).getAttribute('href'), audienceUrl);

  const anonymous = await browser.newContext({ viewport: page.viewportSize() });
  const assignedPage = await page.context().newPage();
  const customerPage = await anonymous.newPage();
  try {
    await openPublishedPage(assignedPage, audienceUrl, 'Pickup and dispatch updates for partners');
    await assignedPage.getByText(partnerQueue.name, { exact: true }).first().waitFor();
    assert.equal(await assignedPage.locator('img.brand-logo').evaluate(async logo => { await logo.decode(); return logo.naturalWidth > 0; }), true);
    assert.ok(!(await assignedPage.locator('footer').innerText()).includes('Powered by Lamp'));
    assert.equal(await assignedPage.getByText(staffConsole.name, { exact: true }).count(), 0);
    await screenshots(assignedPage, 'audience-page-reader');
    const denied = await customerPage.goto(audienceUrl);
    assert.ok([401, 403, 404].includes(denied.status()) || new URL(customerPage.url()).pathname === '/signin');
    assert.ok(!(await customerPage.locator('body').innerText()).includes(partnerQueue.name));

    const sharedTitle = 'Dispatch requests are delayed';
    const staffTitle = 'Staff console cannot accept dispatch';
    for (const { title, staffOnly } of [{ title: sharedTitle, staffOnly: false }, { title: staffTitle, staffOnly: true }]) {
      await page.goto(`${appUrl}/app/incidents/new`);
      await operatorHydrated(page);
      const newIncident = newIncidentForm(page);
      await newIncident.title.fill(title);
      await newIncident.impact.fill(staffOnly ? 'Staff are switching to the backup dispatch console.' : 'Dispatch requests still queue normally.');
      await newIncident.audience.fill(staffOnly ? 'Dispatch staff' : 'Customers sending dispatch requests');
      const options = page.getByRole('button', { name: 'Update options', exact: true });
      if (staffOnly) {
        const tooltip = options.locator('.option-tooltip');
        await options.hover();
        await tooltip.waitFor({ state: 'visible' });
        // Pressing Tab from the last editor control moves to the icon through
        // the browser's keyboard navigation and removes the hover delay.
        await options.blur();
        await page.mouse.move(0, 0);
        await options.focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        assert.equal(await options.evaluate(button => button === document.activeElement), true);
        assert.equal(await tooltip.evaluate(element => getComputedStyle(element).transitionDelay), '0s');
      }
      await newIncident.option('Status pages');
      const pageChoice = page.getByRole('region', { name: 'Status pages', exact: true });
      await pageChoice.getByRole('checkbox', { name: staff.pageName }).check();
      if (staffOnly) await pageChoice.getByRole('checkbox', { name: 'Public', exact: true }).uncheck();
      await newIncident.addComponent(staffOnly ? staffConsole.name : shared.name);
      await newIncident.componentState(staffOnly ? staffConsole.name : shared.name, 'Degraded performance');
      await newIncident.nextUpdate.fill(await localInput(3_600_000));
      if (staffOnly) await screenshots(page, 'audience-incident-composer');
      await pageChoice.getByRole('button', { name: 'Done', exact: true }).click();
      await newIncident.publish.click();
      await page.waitForURL(url => /^\/app\/incidents\/[0-9A-Z]{26}$/.test(url.pathname));
      const { incident } = await api(`/api/app/incidents/${new URL(page.url()).pathname.split('/').at(-1)}`);
      assert.equal(incident.updates.length, 1);
      assert.deepEqual(new Set(incident.pagePaths), new Set(staffOnly ? [staff.path] : ['public', staff.path]));
      const confirmation = page.locator('.publication-confirmation');
      const protectedLink = confirmation.getByRole('link', { name: `View ${staff.pageName}` });
      await protectedLink.waitFor();
      assert.equal(await confirmation.getByRole('link', { name: 'View public page' }).count(), staffOnly ? 0 : 1);
    }

    const staffUrl = new URL(`/status-pages/${staff.path}/`, appUrl).href;
    await openPublishedPage(assignedPage, staffUrl, staffTitle);
    await assignedPage.getByText(sharedTitle, { exact: true }).first().waitFor();
    await openPublishedPage(customerPage, pageUrl, sharedTitle);
    assert.ok(!(await customerPage.locator('body').innerText()).includes(staffTitle));

    const maintenanceTitle = 'Reset partner pickup rotation';
    await page.goto(`${appUrl}/app/maintenance`);
    await operatorHydrated(page);
    const schedule = page.locator('#schedule-maintenance');
    const pageChoice = schedule.getByRole('group', { name: 'Publish on' });
    await pageChoice.getByRole('checkbox', { name: audience.pageName }).check();
    await pageChoice.getByRole('checkbox', { name: 'Public', exact: true }).uncheck();
    await schedule.getByRole('checkbox', { name: partnerQueue.name }).check();
    await schedule.getByRole('textbox', { name: 'Title', exact: true }).fill(maintenanceTitle);
    await schedule.getByRole('textbox', { name: 'Affected audience', exact: true }).fill('Pickup partners');
    await schedule.getByRole('textbox', { name: 'Customer impact', exact: true }).fill('Pickup processing may pause.');
    await schedule.getByLabel('Starts', { exact: true }).fill(await localInput(3_600_000));
    await schedule.getByLabel('Ends', { exact: true }).fill(await localInput(7_200_000));
    await screenshots(page, 'audience-maintenance-scheduler');
    await schedule.getByRole('button', { name: 'Schedule window' }).click();
    await page.getByRole('heading', { name: maintenanceTitle }).waitFor();
    const row = (await api('/api/app/maintenance')).maintenance.find(window => window.title === maintenanceTitle);
    assert.deepEqual(row.pagePaths, [audience.path]);
    await openPublishedPage(assignedPage, audienceUrl, maintenanceTitle);
    assert.ok(!(await assignedPage.locator('body').innerText()).includes(staffTitle));
    await customerPage.reload({ waitUntil: 'domcontentloaded' });
    assert.ok(!(await customerPage.locator('body').innerText()).includes(maintenanceTitle));
    await openPublishedPage(assignedPage, staffUrl, staffTitle);
    await screenshots(assignedPage, 'audience-staff-reader');
    await screenshots(customerPage, 'audience-public-reader');
    await page.goto(`${appUrl}/app/settings#page`);
    await operatorHydrated(page);
    await statusPages.getByRole('button', { name: `Edit ${audience.pageName}` }).click();
    await editor.getByRole('button', { name: 'Remove logo' }).click();
    await statusPages.getByRole('status').filter({ hasText: 'Logo removed.' }).waitFor();
    await openPublishedPage(assignedPage, audienceUrl, maintenanceTitle);
    assert.equal(await assignedPage.locator('img.brand-logo').count(), 0);
    diagnostic('The 1440-wide owner journey configured Staff and named audience branding and components, then used native incident and maintenance editors to publish to the selected pages. Public and signed-in browsers reconciled the resulting pages.');
  } finally {
    await assignedPage.close();
    await anonymous.close();
  }
}
