import { registerHooks } from 'node:module';
const packet = '/home/agent/rer-consolidation/work/sd-lamp-tz-release-fix-2/packet';
registerHooks({
  load(url, context, nextLoad) {
    const result = nextLoad(url, context);
    if (!url.endsWith('/tests/e2e/website-onboarding.test.mjs')) return result;
    let source = String(result.source);
    source = source.replace('    // Every fact stays editable before opening Lamp: one list per group, one per line.', `
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: '${packet}/setup-' + width + '.png', fullPage: true });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    // Every fact stays editable before opening Lamp: one list per group, one per line.`);
    source = source.replace('  } finally {', `
    console.log('EXISTING_ASSERTIONS_COMPLETE');
    const zoneWrite = await nativeRequest('/api/app/page-settings', { method: 'PUT', cookie, json: { ...settings, timezone: 'Australia/Sydney' } });
    console.log('MANUAL_PROBE Sydney settings write status=' + zoneWrite.status);
    const proofSettings = await context.newPage();
    await proofSettings.goto(origin + '/app/settings#page');
    await proofSettings.getByLabel('Time zone', { exact: true }).waitFor();
    for (const width of [1440, 390]) {
      await proofSettings.setViewportSize({ width, height: 900 });
      await proofSettings.screenshot({ path: '${packet}/settings-' + width + '.png', fullPage: true });
    }
    const proofPublic = await context.newPage();
    await proofPublic.goto(publicOrigin + '/');
    await proofPublic.locator('[data-timezone-label]').waitFor();
    console.log('MANUAL_PROBE public timezone label=' + await proofPublic.locator('[data-timezone-label]').innerText());
    for (const width of [1440, 390]) {
      await proofPublic.setViewportSize({ width, height: 900 });
      await proofPublic.screenshot({ path: '${packet}/public-' + width + '.png', fullPage: true });
    }
    console.log('BROWSER_PROOF setup/settings/public captured at 1440 and 390; existing test assertions remain at 1440');
  } finally {`);
    return { ...result, source };
  }
});
