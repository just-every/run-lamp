import { AxeBuilder } from '@axe-core/playwright';

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** The email is deliberately script-disabled. Axe's cross-frame messaging cannot
 * finish there, so inspect the outer page and the actual customer document
 * separately, preserving the same accessibility rules for both surfaces. */
export async function inspectEmailPreviewAccessibility(page) {
  const result = await new AxeBuilder({ page }).withTags(tags).setLegacyMode(true).options({ iframes: false }).analyze();
  const previews = page.locator('iframe[title="Notification email message"]');
  for (const preview of await previews.all()) {
    if (!await preview.isVisible()) continue;
    const document = await preview.getAttribute('srcdoc');
    if (!document) throw new Error('The notification preview has no customer document.');
    const email = await page.context().newPage();
    try {
      const bounds = await preview.boundingBox();
      await email.setViewportSize({ width: Math.round(bounds.width), height: page.viewportSize().height });
      // Inspect the exact document without navigating or fetching external content.
      await email.route('**/*', route => route.abort());
      await email.setContent(document, { waitUntil: 'domcontentloaded' });
      const customer = await new AxeBuilder({ page: email }).withTags(tags).analyze();
      result.violations.push(...customer.violations);
    } finally { await email.close(); }
  }
  return result;
}
