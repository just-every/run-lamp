import { operatorHydrated } from "./operator-hydrated.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as pause } from "node:timers/promises";
import { chromium, expect } from "@playwright/test";

const paletteLabels = { background: "Background", surface: "Surface", text: "Text", link: "Links", operational: "Working", degraded: "Slow", partial: "Partly down", major: "Down", maintenance: "Maintenance" };
const paletteField = (page, key) => page.getByRole("textbox", { name: paletteLabels[key] + " hex colour", exact: true });

async function fillPalette(page, palette) {
  for (const [key, colour] of Object.entries(palette)) await paletteField(page, key).fill(colour);
}

function rgbFromHex(hex) {
  return "rgb(" + hex.slice(1).match(/../g).map(channel => Number.parseInt(channel, 16)).join(", ") + ")";
}

function relativeLuminance(colour) {
  const rgb = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(colour);
  assert.ok(rgb, "expected an opaque computed sRGB colour: " + colour);
  const [red, green, blue] = rgb.slice(1).map(channel => {
    const srgb = Number(channel) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(text, background) {
  const [dark, light] = [relativeLuminance(text), relativeLuminance(background)].sort((a, b) => a - b);
  return (light + 0.05) / (dark + 0.05);
}

export async function statusCardContrastBrowserFlow({ appUrl, pageUrl, browser, browserContext, currentSettings, palette, diagnostic }) {
  const directory = "./test-results/theme-004";
  const viewports = [{ width: 1440, height: 1000 }, { width: 390, height: 844 }];
  await mkdir(directory, { recursive: true });
  const settings = await browserContext.newPage();
  const colours = settings.getByText("Colours", { exact: true });
  const settingsPath = new URL("/api/app/page-settings", appUrl).href;

  // Use a fresh signed-out context for each readback so the retained page and stylesheet are fetched again.
  const readCard = async (viewport, capture = false) => {
    const context = await browser.newContext({ viewport });
    try {
      const page = await context.newPage();
      assert.equal((await page.goto(pageUrl)).status(), 200);
      const card = page.locator(".status-banner.operational #status-live");
      const update = card.locator(".status-live-update");
      await expect(update).toBeVisible();
      await expect(update).toHaveText(/\S/);
      const text = await update.evaluate(element => getComputedStyle(element).color);
      const surface = await card.evaluate(element => getComputedStyle(element).backgroundColor);
      const background = await page.locator("body").evaluate(element => getComputedStyle(element).backgroundColor);
      if (capture) await page.screenshot({ path: directory + "/public-" + viewport.width + ".png" });
      return { text, surface, background };
    } finally { await context.close(); }
  };

  try {
    await settings.goto(appUrl + "/app/settings#look");
    await operatorHydrated(settings);
    await colours.click();
    await settings.getByLabel("Use a custom colour palette").check();
    await fillPalette(settings, palette);
    await expect(settings.getByRole("status").filter({ hasText: /^Saved · live$/ })).toBeVisible({ timeout: 60_000 });
    const saved = await currentSettings();
    assert.deepEqual(saved.theme.palette, palette);

    const served = [];
    const rejectedText = "#a2a2a2";
    for (const viewport of viewports) {
      await settings.setViewportSize(viewport);
      await paletteField(settings, "text").scrollIntoViewIfNeeded();
      await settings.screenshot({ path: directory + "/settings-" + viewport.width + ".png" });
      const actual = await readCard(viewport, true);
      assert.deepEqual(actual, { text: rgbFromHex(palette.text), surface: rgbFromHex(palette.surface), background: rgbFromHex(palette.background) });
      const acceptedRatio = contrast(actual.text, actual.surface);
      const pageRatio = contrast(rgbFromHex(rejectedText), actual.background);
      const cardRatio = contrast(rgbFromHex(rejectedText), actual.surface);
      assert.ok(acceptedRatio >= 4.5, "saved update text must meet AA against its actual card");
      assert.ok(pageRatio >= 4.5 && cardRatio < 4.5, "the proposed text only fails against the card");
      served.push(actual);
      diagnostic("THEME-004 at " + viewport.width + " px: computed " + JSON.stringify(actual) +
        "; saved text on card " + acceptedRatio.toFixed(4) + ":1; proposed text on page " + pageRatio.toFixed(4) +
        ":1 and on card " + cardRatio.toFixed(4) + ":1");
    }

    await settings.setViewportSize(viewports[0]);
    const refusal = settings.waitForResponse(response => {
      const request = response.request();
      return response.url() === settingsPath && request.method() === "PUT" && request.postDataJSON().theme?.palette?.text === rejectedText;
    }, { timeout: 60_000 });
    await paletteField(settings, "text").fill(rejectedText);
    const response = await refusal;
    assert.deepEqual(response.request().postDataJSON().theme.palette, { ...palette, text: rejectedText });
    assert.equal(response.status(), 400);
    await expect(settings.getByRole("alert").filter({ hasText: "Palette text against surface contrast" })).toBeVisible();
    await expect(paletteField(settings, "text")).toHaveValue(rejectedText);
    const retained = await currentSettings();
    assert.deepEqual(retained.theme, saved.theme);
    assert.equal(retained.template, saved.template);
    await settings.reload();
    await operatorHydrated(settings);
    await colours.click();
    for (const [key, colour] of Object.entries(palette)) await expect(paletteField(settings, key)).toHaveValue(colour);
    for (const [index, viewport] of viewports.entries()) assert.deepEqual(await readCard(viewport), served[index]);
    diagnostic("THEME-004: native Settings refused the edit with HTTP 400; all nine colours survived reload and signed-out computed colours stayed the same at both widths");
  } finally { await settings.close(); }
}

export async function themeBrowserFlow({ appUrl, pageUrl, sessionId, cookieName, theme, image, font, currentSettings, snapshot }) {
  const browser = await chromium.launch({ headless: true, args: ["--use-mock-keychain", "--password-store=basic"] });
  const directory = "test-results/theme-001";
  await mkdir(directory, { recursive: true });
  let activePage;
  const clientErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: cookieName, value: sessionId, url: appUrl }]);
    const page = await context.newPage();
    activePage = page;
    page.on("pageerror", error => clientErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" || /hydrat/i.test(message.text())) clientErrors.push(message.text().slice(0, 1500));
    });
    page.on("response", response => {
      if (response.status() >= 400 && ["script", "stylesheet"].includes(response.request().resourceType())) clientErrors.push(`${response.status()} ${new URL(response.url()).pathname}`);
    });
    try {
      await page.goto(`${appUrl}/app/settings#look`, { waitUntil: "domcontentloaded", timeout: 90_000 });
    } catch (cause) {
      await page.screenshot({ path: `${directory}/settings-navigation-failed.png`, fullPage: true }).catch(() => {});
      throw cause;
    }
    await expect(page.getByRole("heading", { name: "Theme", exact: true })).toBeVisible();
    await operatorHydrated(page);
    await page.waitForFunction(() => {
      const form = document.querySelector(".settings-page");
      return form && !form.inert;
    }, null, { timeout: 30_000 });
    const saved = () => expect(page.getByRole("status").filter({ hasText: /^Saved · live$/ })).toBeVisible({ timeout: 60_000 });
    const open = async title => { const detail = page.locator("details").filter({ has: page.locator(":scope > summary", { hasText: title }) }).first(); if (!await detail.getAttribute("open")) await detail.locator(":scope > summary").click(); };
    await open("Colours");
    await page.getByLabel("Use a custom colour palette").check();
    await fillPalette(page, theme.palette);
    await saved();
    const textColour = page.getByRole("textbox", { name: "Text hex colour", exact: true });
    await textColour.fill(theme.palette.background);
    await expect(page.getByRole("alert").filter({ hasText: /text against background contrast/ })).toBeVisible();
    await expect(textColour).toHaveValue(theme.palette.background);
    assert.deepEqual((await currentSettings()).theme.palette, theme.palette, "refused contrast keeps the published palette");
    await textColour.fill(theme.palette.text);
    await saved();
    await open("Font and header image");
    await page.getByRole("combobox", { name: /^Page font/ }).selectOption("mono");
    await page.getByLabel(/^Upload font/).setInputFiles({ name: "synthetic-lamp-1.woff2", mimeType: "font/woff2", buffer: font });
    const fontUpload = page.waitForResponse(response => response.url() === `${appUrl}/api/app/page-settings/theme-assets/font` && response.request().method() === "POST", { timeout: 60_000 });
    await page.getByRole("button", { name: "Upload font", exact: true }).click();
    const fontResult = await fontUpload;
    assert.equal(fontResult.status(), 200, (await fontResult.json()).error);
    await expect(page.getByRole("status").filter({ hasText: "Font uploaded." })).toBeVisible();
    await expect(page.getByRole("combobox", { name: /^Page font/ })).toHaveValue("uploaded");
    await saved();
    await expect.poll(async () => (await currentSettings()).theme.font).toBe("uploaded");
    await page.getByLabel(/^Upload header image/).setInputFiles({ name: "synthetic-lamp-2.png", mimeType: "image/png", buffer: image });
    const headerUpload = page.waitForResponse(response => response.url() === `${appUrl}/api/app/page-settings/theme-assets/header` && response.request().method() === "POST", { timeout: 60_000 });
    await page.getByRole("button", { name: "Upload header image", exact: true }).click();
    const headerResult = await headerUpload;
    assert.equal(headerResult.status(), 200, (await headerResult.json()).error);
    await expect(page.getByRole("status").filter({ hasText: "Header image uploaded." })).toBeVisible();
    await expect(page.getByLabel("Show the uploaded header image")).toBeChecked();
    await saved();
    await expect.poll(async () => (await currentSettings()).theme.headerImage).toBe(true);
    await open("Header and footer links");
    await page.getByRole("button", { name: "Add header link", exact: true }).click();
    await page.getByRole("button", { name: "Add footer link", exact: true }).click();
    await page.getByLabel("Header link 1 label").fill(theme.headerLinks[0].label);
    await page.getByLabel("Header link 1 address").fill(theme.headerLinks[0].href);
    await page.getByLabel("Footer link 1 label").fill(theme.footerLinks[0].label);
    await page.getByLabel("Footer link 1 address").fill(theme.footerLinks[0].href);
    await open("Layout and history");
    await page.getByLabel("Collapse component groups by default").check();
    await page.getByLabel(/^History days/).fill("14");
    await page.getByLabel("Show uptime for Web application", { exact: true }).uncheck();
    await open("Custom HTML and CSS");
    await page.getByLabel(/^Header HTML/).fill(theme.headerHtml);
    await page.getByLabel(/^Footer HTML/).fill(theme.footerHtml);
    await page.getByLabel(/^Custom CSS/).fill(theme.customCss);
    await saved();
    await expect.poll(async () => (await currentSettings()).theme).toEqual({ ...theme, font: "uploaded", headerImage: true });
    await snapshot("Service updates from the Atlas team.");
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.screenshot({ path: `${directory}/settings-${width}.png`, fullPage: true });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Settings fits ${width}`);
    }
    const publicPage = await context.newPage();
    const paths = new Set();
    const outsiders = new Set();
    publicPage.on("request", request => {
      const url = new URL(request.url());
      if (request.resourceType() === "document" || !["http:", "https:"].includes(url.protocol)) return;
      if (url.origin === pageUrl) paths.add(url.pathname);
      else outsiders.add(url.origin);
    });
    const response = await publicPage.goto(`${pageUrl}/`, { waitUntil: "networkidle" });
    assert.match(response.headers()["content-security-policy"], /style-src [^;]+;.*img-src [^;]+;/);
    assert.equal(outsiders.size, 0);
    assert.ok(paths.size <= 4, `Theme assets stay in the four-request budget: ${[...paths]}`);
    await publicPage.evaluate(() => document.fonts.ready);
    assert.equal(await publicPage.evaluate(() => [...document.fonts].some(face => face.family.includes("Owner Font") && face.status === "loaded")), true);
    const palette = await publicPage.locator("body").evaluate(element => {
      const style = getComputedStyle(element);
      return Object.fromEntries(["--paper", "--card", "--ink", "--theme-link", "--ok", "--degraded", "--cell-partial", "--down", "--maint"].map(key => [key, style.getPropertyValue(key).trim()]));
    });
    assert.deepEqual(palette, { "--paper": theme.palette.background, "--card": theme.palette.surface, "--ink": theme.palette.text, "--theme-link": theme.palette.link, "--ok": theme.palette.operational, "--degraded": theme.palette.degraded, "--cell-partial": theme.palette.partial, "--down": theme.palette.major, "--maint": theme.palette.maintenance });
    assert.equal(await publicPage.locator(".owner-note").evaluate(element => getComputedStyle(element).letterSpacing), "0.4px");
    assert.equal(await publicPage.locator("body").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(244, 244, 244)");
    assert.equal(await publicPage.locator(".theme-header-image").evaluate(element => element.complete && element.naturalWidth > 0), true);
    await expect(publicPage.getByRole("link", { name: "Customer support", exact: true })).toHaveAttribute("href", theme.headerLinks[0].href);
    await expect(publicPage.getByRole("link", { name: "Service history", exact: true })).toHaveAttribute("href", "/history");
    assert.equal(await publicPage.evaluate(() => window.themeUnsafe), undefined);
    for (const width of [1440, 390]) {
      await publicPage.setViewportSize({ width, height: 1000 });
      await publicPage.screenshot({ path: `${directory}/page-${width}.png`, fullPage: true });
      assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Public theme fits ${width}`);
      const group = publicPage.locator("details.component-group").first();
      assert.equal(await group.getAttribute("open"), null);
      await group.locator(":scope > summary").click();
      await expect(group.locator(".component").first()).toBeVisible();
      await group.locator(":scope > summary").click();
    }
    const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
    const literal = await noScript.newPage();
    await literal.goto(`${pageUrl}/`);
    await expect(literal.locator(".owner-note")).toHaveText("Service updates from the Atlas team.");
    await expect(literal.locator(".theme-footer")).toContainText("Always here to help.");
    await page.getByRole("combobox", { name: /^Page font/ }).selectOption("default");
    await saved();
    await expect.poll(async () => (await currentSettings()).theme.font).toBe("default");
    await publicPage.reload({ waitUntil: "networkidle" });
    const bundled = await publicPage.evaluate(async () => {
      await document.fonts.ready;
      const family = getComputedStyle(document.body).fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
      return { family, loaded: [...document.fonts].filter(face => face.status === "loaded").map(face => face.family.replace(/^["']|["']$/g, "")) };
    });
    assert.ok(bundled.loaded.includes(bundled.family), "choosing the bundled font renders a face loaded by the public page");
    assert.notEqual(bundled.family, "Owner Font");
    await page.getByRole("combobox", { name: /^Page font/ }).selectOption("uploaded");
    await saved();
    await expect.poll(async () => (await currentSettings()).theme.font).toBe("uploaded");
    // Adapt the gate's paused typing probe: autosave may sanitize publication,
    // but must leave the owner's in-progress HTML and caret untouched.
    const typed = [];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await literal.setViewportSize({ width, height: 1000 });
      for (const [field, key, position, chunks] of [
        ["Header HTML", "headerHtml", "header", ['<p class="typed">Planned work on the ', '<strong>payments', ' API</strong> tonight.</p>']],
        ["Footer HTML", "footerHtml", "footer", ['<p>Questions? <a href="https://help.', 'northstar.example/">Ask our team', '</a></p>']],
      ]) {
        const input = page.getByLabel(new RegExp(`^${field}`));
        await input.fill("");
        await expect.poll(async () => (await currentSettings()).theme[key]).toBe("");
        const entry = { width, field, afterPause: [] };
        for (const [index, chunk] of chunks.entries()) {
          const prefix = chunks.slice(0, index + 1).join("");
          const saving = page.waitForResponse(response => new URL(response.url()).pathname === "/api/app/page-settings" && response.request().method() === "PUT" && response.request().postDataJSON()?.theme?.[key] === prefix);
          await input.pressSequentially(chunk, { delay: 60 });
          await pause(1500);
          assert.equal((await saving).status(), 200);
          await saved();
          entry.afterPause.push(await input.inputValue());
          assert.equal(await input.inputValue(), prefix, `${field} stays exactly as typed after a pause at ${width}`);
        }
        entry.complete = chunks.join("");
        entry.stored = (await currentSettings()).theme[key];
        assert.equal(entry.stored, entry.complete);
        await input.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${directory}/typed-${key}-settings-${width}.png` });
        await literal.goto(`${pageUrl}/`);
        entry.published = await literal.locator(`.theme-${position} > p`).evaluate(element => element.outerHTML);
        assert.equal(entry.published, entry.complete, `${field} publishes intact without JavaScript at ${width}`);
        if (key === "footerHtml") await expect(literal.getByRole("link", { name: "Ask our team", exact: true })).toHaveAttribute("href", "https://help.northstar.example/");
        await literal.locator(`.theme-${position}`).scrollIntoViewIfNeeded();
        await literal.screenshot({ path: `${directory}/typed-${key}-public-${width}.png` });
        typed.push(entry);
      }
    }
    await writeFile(`${directory}/typed-html.json`, JSON.stringify(typed, null, 2) + "\n");
    await page.getByLabel(/^Header HTML/).fill(theme.headerHtml);
    await page.getByLabel(/^Footer HTML/).fill(theme.footerHtml);
    await saved();
    await expect.poll(async () => (await currentSettings()).theme).toEqual({ ...theme, font: "uploaded", headerImage: true });
    await noScript.close();
    await context.close();
  } catch (cause) {
    await activePage?.screenshot({ path: `${directory}/settings-failed.png`, fullPage: true }).catch(() => {});
    const state = await activePage?.evaluate(() => ({ readyState: document.readyState, shellHydrated: Boolean(document.querySelector(".operator-shell[data-hydrated]")), settingsInert: document.querySelector(".settings-page")?.inert, scripts: [...document.scripts].map(script => ({ type: script.type, path: script.src ? new URL(script.src).pathname : "inline" })), hydration: window.__rerHydration?.count ?? 0 })).catch(() => null);
    throw new Error(`${cause.message}\nClient diagnostics: ${clientErrors.join("; ") || "none"}\nDocument state: ${JSON.stringify(state)}`, { cause });
  } finally { await browser.close(); }
}
