import assert from 'node:assert/strict';
import { incidentComposer } from './incident-composer.mjs';
import { operatorHydrated } from './operator-hydrated.mjs';

const settingsPath = '/api/app/page-settings';

function fieldFindings(field, optional) {
  const wrapper = field.locator('..');
  return optional
    ? wrapper.getByRole('status', { name: 'Wording findings', exact: true })
    : wrapper.locator('xpath=following-sibling::*[1]').and(
      field.page().getByRole('status', { name: 'Wording findings', exact: true }),
    );
}

export async function wordingFindingsFlow({ page, browser, appUrl, pageUrl, api, component, nextUpdate, screens, waitForPublicIncident }) {
  const initial = (await api(settingsPath)).settings;
  const blockedTerms = ['Orchid drill'];
  const friendlyLength = 96;
  const saved = () => page.locator('.autosave-status.is-saved').waitFor();
  const settingsSaved = () => page.getByRole('status').filter({ hasText: /^Saved · live$/ }).waitFor();
  let incidentPath;

  try {
    await page.goto(`${appUrl}/app/settings#writing`);
    await operatorHydrated(page);
    const settings = page.getByRole('region', { name: 'Wording checks', exact: true });
    await settings.getByLabel(/^Terms to flag/).fill(blockedTerms[0]);
    await settingsSaved();
    const afterTerms = (await api(settingsPath)).settings;
    assert.deepEqual(afterTerms.wordingBlockedTerms, blockedTerms);
    assert.equal(afterTerms.wordingFriendlyLength, initial.wordingFriendlyLength);

    await settings.getByLabel(/^Preferred field length/).fill(String(friendlyLength));
    await settingsSaved();
    const afterLength = (await api(settingsPath)).settings;
    assert.equal(afterLength.wordingFriendlyLength, friendlyLength);
    assert.deepEqual(afterLength.wordingBlockedTerms, blockedTerms);
    await screens(page, 'wording-settings');

    const { incident } = await api('/api/app/incidents', 'POST', {
      title: 'Synthetic wording advisory journey',
      components: [{ componentId: component.id, state: 'Degraded performance', relationship: 'Primary' }],
    });
    incidentPath = `/api/app/incidents/${incident.id}`;
    await page.goto(`${appUrl}/app/incidents/${incident.id}`);
    await operatorHydrated(page);
    assert.deepEqual((await api(incidentPath)).wordingChecks, { blockedTerms, friendlyLength });

    const composer = incidentComposer(page);
    await composer.option('What still works');
    await composer.option('Details');
    await composer.nextUpdate.fill(nextUpdate);
    const fields = [
      { key: 'customerImpact', label: 'Customer impact', input: composer.impact, marker: 'Impact', addressNumber: 11 },
      { key: 'affectedAudience', label: 'Who is affected', input: composer.audience, marker: 'Audience', addressNumber: 12 },
      { key: 'whatStillWorks', label: 'What still works', input: composer.stillWorks, marker: 'Working', addressNumber: 13, optional: true },
      { key: 'details', label: 'Additional details', input: composer.details, marker: 'Details', addressNumber: 14, optional: true },
    ];
    const allFindings = page.getByRole('status', { name: 'Wording findings', exact: true });
    const cleanWording = 'Next update in 20 minutes. Existing orders remain safe; the ORCHID drills are running as normal.';
    assert.equal(cleanWording.length, friendlyLength);
    for (const { input } of fields) await input.fill(cleanWording);
    await saved();
    assert.equal(await allFindings.count(), 0, 'a next-update commitment and a partial word at the owner limit are clear');

    const wording = {};
    for (const field of fields) {
      const { key, input, marker, addressNumber } = field;
      const promise = 'fixed within 20 minutes';
      const host = `synthetic-lamp-${addressNumber}.internal`;
      const ip = `192.0.2.${addressNumber}`;
      const address = [`synthetic-lamp-${addressNumber}`, 'example.test'].join('@');
      wording[key] = `${marker}: ${promise}. Compare https://${host}/ and https://${ip}/. Contact ${address}. ORCHID DRILL.`;
      await input.fill(wording[key]);
      field.findings = fieldFindings(input, field.optional);
      const expected = [
        ['Resolution-time promise', promise],
        ['Internal hostname', host],
        ['IP address', ip],
        ['Email address', address],
        ['Blocked term', 'ORCHID DRILL'],
        ['Reader-friendly length', wording[key].slice(friendlyLength)],
      ];
      await field.findings.waitFor();
      const rows = field.findings.locator('p');
      assert.equal(await rows.count(), expected.length, `${key} has exactly the six findings`);
      for (const [rule, span] of expected) {
        const row = rows.filter({ hasText: new RegExp(`^${rule}:`) });
        assert.equal(await row.isVisible(), true, `${key} names its ${rule} finding`);
        assert.equal(await row.locator('q').textContent(), span, `${key} quotes the affected wording for ${rule}`);
        const dismiss = row.getByRole('button', { name: new RegExp(`^Dismiss wording check: ${rule}:`) });
        assert.equal(await dismiss.isVisible(), true, `${key} offers dismissal for ${rule}`);
      }
      const length = rows.filter({ hasText: /^Reader-friendly length:/ });
      assert.ok((await length.textContent()).includes(
        `This field has ${wording[key].length} characters; the preferred maximum is ${friendlyLength}.`,
      ));
    }
    await saved();
    assert.equal(await allFindings.count(), fields.length);
    const before = (await api(incidentPath)).incident;
    assert.deepEqual(before.updates, [], 'the warnings appear before any publication');
    for (const { key } of fields) assert.equal(before.draft[key], wording[key], `saved ${key}`);

    const detailsFindings = fields.at(-1).findings;
    const blocked = detailsFindings.locator('p').filter({ hasText: /^Blocked term:/ });
    await blocked.getByRole('button', { name: /^Dismiss wording check: Blocked term:/ }).click();
    await blocked.waitFor({ state: 'hidden' });
    for (const { key, input, findings } of fields) {
      assert.equal(await input.inputValue(), wording[key], `dismissal preserves the composer’s ${key}`);
      assert.equal(await findings.locator('p').count(), key === 'details' ? 5 : 6, `dismissal only removes the chosen finding`);
    }
    assert.deepEqual((await api(incidentPath)).incident.draft, before.draft, 'dismissal leaves the saved draft intact');
    assert.equal(await detailsFindings.getByText(/^Resolution-time promise:/).isVisible(), true);
    assert.equal(await detailsFindings.getByText(/^Internal hostname:/).isVisible(), true);
    assert.equal(await composer.publish.isEnabled(), true, 'the combined findings are advisory');
    await screens(page, 'wording-findings');

    const response = page.waitForResponse(result => result.url() === `${appUrl}${incidentPath}/publish` && result.request().method() === 'POST');
    await composer.publish.click();
    assert.equal((await response).status(), 200);
    await page.locator('.publication-confirmation').waitFor();
    const published = (await api(incidentPath)).incident.updates;
    assert.equal(published.length, 1);
    const [update] = published;
    await waitForPublicIncident(incident.reference, `data-update-id="${update.id}"`);
    for (const { key } of fields) assert.equal(update[key], wording[key], `publication preserves warned ${key}`);

    const publicUrl = `${pageUrl}/incidents/${incident.reference}`;
    const publicContext = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize() });
    try {
      const publicPage = await publicContext.newPage();
      assert.equal((await publicPage.goto(publicUrl)).status(), 200);
      const timeline = publicPage.locator('article.update');
      await timeline.waitFor();
      assert.equal(await timeline.count(), 1);
      assert.equal(await timeline.getAttribute('data-update-id'), update.id);
      assert.equal(await timeline.locator('.update-head time').getAttribute('datetime'), update.publishedAt);
      for (const { key, label } of fields) {
        const row = timeline.locator('dl > div').filter({ has: publicPage.getByText(label, { exact: true }) });
        assert.equal(await row.locator('dd').textContent(), wording[key], `public timeline preserves warned ${key}`);
      }
      await screens(publicPage, 'wording-publication');
    } finally {
      await publicContext.close();
    }
  } finally {
    try {
      if (incidentPath) await api(incidentPath, 'DELETE', { reason: 'Synthetic wording journey cleanup' });
    } finally {
      const { pageName, tagline, accentColor, timezone, hostname, footerCreditEnabled, aiToneInstructions,
        wordingBlockedTerms, wordingFriendlyLength } = initial;
      await api(settingsPath, 'PUT', { pageName, tagline, accentColor, timezone, hostname, footerCreditEnabled,
        aiToneInstructions, wordingBlockedTerms, wordingFriendlyLength });
    }
  }
}
