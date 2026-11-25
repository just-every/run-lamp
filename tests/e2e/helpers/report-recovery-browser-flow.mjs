import assert from 'node:assert/strict';
import { operatorHydrated } from './operator-hydrated.mjs';

export async function reportRecoveryBrowserFlow({ page, appUrl, pageUrl, api, screenshots }) {
  const { component } = await api('/api/app/components', 'POST', {
    name: 'Card payments', groupId: null, description: '', internal: false, displayOrder: 0, note: '',
  });
  const { incident } = await api('/api/app/incidents', 'POST', {
    title: 'Card payment authorizations delayed', components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Primary' }],
  });
  const incidentPath = `/api/app/incidents/${incident.id}`;
  for (const lifecycle of ['Identified', 'Resolved']) {
    await api(`${incidentPath}/draft`, 'PUT', {
      lifecycle, affectedAudience: 'Customers paying by card',
      customerImpact: lifecycle === 'Resolved' ? 'Card payments are processing normally.' : 'Card payments are taking longer than usual.',
      whatStillWorks: 'Invoices can still be paid by bank transfer.', details: '',
      nextUpdateAt: lifecycle === 'Resolved' ? null : new Date(Date.now() + 3_600_000).toISOString(),
    });
    await api(`${incidentPath}/publish`, 'POST', { channels: [] });
  }

  const location = `${appUrl}/app/incidents/${incident.id}#post-incident-report`;
  const publicationPath = `${incidentPath}/report/publication`;
  const status = page.locator('[data-publication-state]');
  const state = value => page.locator(`[data-publication-state="${value}"]`);
  const retry = page.getByRole('button', { name: 'Retry publication', exact: true });
  const summary = 'Card payment latency returned to normal after traffic moved to the standby.';
  let waiting = true, checks = 0;
  const observe = route => {
    if (!waiting || route.request().method() !== 'GET') return route.continue();
    checks++;
    return route.fulfill({ status: 202, json: { state: 'pending' } });
  };
  await page.clock.install();
  await page.route(`**${publicationPath}`, observe);
  try {
    await page.goto(location);
    await operatorHydrated(page);
    for (const [field, value] of Object.entries({
      Summary: summary,
      Timeline: 'Authorization latency increased. Operators routed traffic to the standby and confirmed recovery.',
      Cause: 'The primary authorization pool exhausted its available connections.',
      Remediation: 'The payment team increased pool capacity and added a saturation alert.',
    })) await page.getByRole('textbox', { name: field, exact: true }).fill(value);
    await page.getByRole('button', { name: 'Publish report', exact: true }).click();
    await state('pending').waitFor();
    await screenshots(page, 'report-pending');

    await page.clock.fastForward(6 * 60_000);
    await retry.waitFor();
    assert.match(await status.innerText(), /could not confirm/i);
    const stoppedAt = checks;
    await page.clock.fastForward(60_000);
    assert.equal(checks, stoppedAt, 'the failed status leaves no poll running');
    await screenshots(page, 'report-timed-out');

    const saved = (await api(`${incidentPath}/report`)).report;
    const queued = page.waitForResponse(response => response.url().endsWith(publicationPath) && response.request().method() === 'POST');
    waiting = false;
    await retry.click();
    assert.equal((await queued).status(), 202);
    await state('confirmed').waitFor();
    assert.deepEqual((await api(`${incidentPath}/report`)).report, saved, 'retry preserves the published report identity and text');
    const reader = await page.context().newPage();
    try {
      await reader.goto(`${pageUrl}/incidents/${incident.reference}`);
      await reader.locator('section.report').getByText(summary, { exact: true }).waitFor();
    } finally { await reader.close(); }
    await screenshots(page, 'report-retry-confirmed');
  } finally { await page.unroute(`**${publicationPath}`, observe); }

  let release;
  const held = new Promise(resolve => { release = resolve; });
  const reopen = async route => { await held; await route.continue(); };
  await page.route(`**${publicationPath}`, reopen);
  try {
    await page.reload();
    await state('checking').waitFor();
    assert.equal(await page.getByText(/Publishing…/).count(), 0, 'an existing report has no publishing flicker on open');
  } finally { release(); }
  await state('confirmed').waitFor();
  await page.unroute(`**${publicationPath}`, reopen);
}
