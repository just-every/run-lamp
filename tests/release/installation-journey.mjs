import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { reservePort } from "../e2e/worker-startup.mjs";
import { installation, until } from "./installation-runtime.mjs";
import { exerciseOwner, installerEntry } from "./installation-browser.mjs";
import { checkRunPage, readmeGuide } from "./readme-guide.mjs";

const mode = process.env.LAMP_RELEASE_JOURNEY;
assert.ok(["installer", "readme"].includes(mode), "set LAMP_RELEASE_JOURNEY to installer or readme");
const evidence = resolve(process.env.LAMP_RELEASE_EVIDENCE ?? `test-results/release-${mode}`);
await mkdir(evidence, { recursive: true });
let fixture, browser, entry;
try {
  browser = await chromium.launch({ headless: true });
  const guide = mode === "readme" ? await readmeGuide(process.cwd()) : undefined;
  fixture = await installation(mode, guide);
  if (mode === "installer") entry = await installerEntry(fixture, browser, evidence);
  else {
    const port = await reservePort({ label: "release README journey" });
    // The fixture followed the guide through the public installer and tagged
    // clone. Start the candidate with the guide's bare command so a cold start
    // must succeed without the compatibility timeout used by published tags.
    const process = fixture.launch(fixture.rer, [...guide.restartArgs, "--port", String(port)]);
    let open, site;
    await until(() => {
      assert.ifError(process.error());
      assert.ok(process.child.exitCode === null || process.child.exitCode === 0,
        "documented rer dev reaches readiness; credential-bearing output withheld");
      assert.equal(process.child.signalCode, null, "documented rer dev stays running");
      const output = process.output();
      open = /^RER_OPEN (\S+)/m.exec(output)?.[1];
      site = /^RER_SITE (\S+)/m.exec(output)?.[1];
      return /^RER_READY /m.test(output) && open && site;
    }, "README rer dev installs, prepares and starts Lamp", 15 * 60000);
    await checkRunPage(browser, new URL("/run", site).href, guide.command);
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(open);
    await page.waitForURL(url => ["/setup", "/app"].includes(url.pathname));
    entry = { context, page, origin: `http://127.0.0.1:${port}` };
  }
  await exerciseOwner(entry, evidence, mode);
  console.log(`Release ${mode} journey passed: public installer, fresh clone, owner entry, component publication and sign-out`);
} catch (error) {
  // Browser transport errors can include the navigated one-use entry URL.
  const message = String(error.message).replace(/https?:\/\/[^\s"'<>]+/g, "[URL withheld]");
  console.error(`Release ${mode} journey failed: ${message}`);
  await writeFile(join(evidence, `${mode}-failure.txt`), message + "\n");
  process.exitCode = 1;
} finally {
  await browser?.close();
  await fixture?.close();
}
