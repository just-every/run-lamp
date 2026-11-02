import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from '@playwright/test';
import { incidentComposer } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

/** Follow the real reminder actions to the matching saved incident and brief. */
export async function updateDueBrowserFlow({ page, appUrl, api, diagnostic }) {
  const component = (await api('/api/app/components', 'POST', {
    name: 'Synthetic Lamp reminder API', groupId: null, description: '', internal: false, displayOrder: 0, note: '',
  })).component;
  const incident = (await api('/api/app/incidents', 'POST', {
    title: 'Synthetic Lamp reminder interruption',
    components: [{ componentId: component.id, state: 'Partially unavailable', relationship: 'Primary' }],
  })).incident;
  const endpoint = `/api/app/incidents/${incident.id}`;
  const wording = {
    lifecycle: 'Investigating', affectedAudience: 'Synthetic Lamp reminder readers',
    customerImpact: 'Synthetic Lamp reminder requests are delayed.', whatStillWorks: '',
    details: 'The response team is investigating the reminder API.',
  };
  const settings = (await api('/api/app/page-settings')).settings;
  const localTime = iso => new Intl.DateTimeFormat('en-GB', {
    timeZone: settings.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso));
  const screens = async name => {
    if (!process.env.LAMP_SCREENSHOTS) return;
    await mkdir(process.env.LAMP_SCREENSHOTS, { recursive: true });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: join(process.env.LAMP_SCREENSHOTS, `${width}-reminder-${name}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  };
  const errors = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const overdue of [false, true]) {
      wording.customerImpact = overdue ? 'Synthetic Lamp reminder recovery is still underway.' : 'Synthetic Lamp reminder requests are delayed.';
      const commitment = new Date(Date.now() + (overdue ? -60000 : 5 * 60000)).toISOString();
      await api(`${endpoint}/draft`, 'PUT', { ...wording, nextUpdateAt: commitment });
      await api(`${endpoint}/publish`, 'POST', { channels: [] });
      const expectedLabel = overdue ? `Update overdue since ${localTime(commitment)}` : `Update due at ${localTime(commitment)}`;
      for (const path of ['/app', '/app/incidents']) {
        await page.goto(appUrl + path); await operatorHydrated(page);
        const notice = page.getByRole('region', { name: 'Updates due', exact: true }).locator('.update-due-row').filter({ hasText: incident.reference });
        await expect(notice.locator('strong')).toHaveText(expectedLabel);
        await expect(notice).toContainText(incident.title);
        const listRow = page.locator(path === '/app' ? '.record-row' : '.incident-list-row').filter({ hasText: incident.title });
        await expect(listRow.locator('.overdue-note')).toHaveText(expectedLabel);
        await expect(notice.getByRole('link', { name: 'Write the update', exact: true })).toHaveAttribute('href', `/app/incidents/${incident.id}#composer-title`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'reminder screens fit the viewport');
        await screens(`${overdue ? 'overdue' : 'due'}-${path === '/app' ? 'overview' : 'list'}`);
        await notice.getByRole('link', { name: 'Write the update', exact: true }).click();
        await page.waitForURL(url => url.pathname === `/app/incidents/${incident.id}` && url.hash === '#composer-title');
        await operatorHydrated(page);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(incident.title);
        await expect(page.locator('#composer-title')).toBeVisible();
        await expect(incidentComposer(page).impact).toBeEditable();
        await incidentComposer(page).row('Brief');
        const brief = page.getByRole('region', { name: 'Brief', exact: true });
        await expect(brief).toContainText(component.name);
        const publication = brief.locator('li').filter({ hasText: wording.customerImpact });
        await publication.locator('summary').click();
        await expect(publication.getByText(wording.customerImpact, { exact: true })).toBeVisible();
        const savedBrief = (await api(`${endpoint}/brief`)).brief;
        assert.ok(savedBrief.whatWeKnow.updates.some(update => update.customerImpact === wording.customerImpact && update.nextUpdateAt === commitment), 'the opened brief carries this publication commitment');
        if (path === '/app') await screens(overdue ? 'overdue-composer-brief' : 'due-composer-brief');
      }
      diagnostic(`PROBE INCIDENT-010 acceptance-2 ${overdue ? 'overdue' : 'due'}: Overview and incident list show ${expectedLabel}; both Write the update actions open ${incident.reference}, its editable composer and matching published brief; screens at 1440 and 390`);
    }
    await api(`${endpoint}/draft`, 'PUT', { ...wording, lifecycle: 'Resolved', nextUpdateAt: null });
    await api(`${endpoint}/publish`, 'POST', { channels: [] });
    for (const path of ['/app', '/app/incidents']) {
      await page.goto(appUrl + path); await operatorHydrated(page);
      await expect(page.locator('.update-due-row').filter({ hasText: incident.reference })).toHaveCount(0);
    }
    assert.deepEqual(errors, [], 'reminder navigation has no browser errors');
  } finally {
    page.off('pageerror', onError);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
}
