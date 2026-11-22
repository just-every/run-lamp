import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readmeGuide(root) {
  const readme = await readFile(join(root, "README.md"), "utf8");
  assert.match(readme, /\]\(RUN-LOCALLY\.md\)/, "README links to the canonical local guide");
  const guide = await readFile(join(root, "RUN-LOCALLY.md"), "utf8");
  const runPage = /\[Run page\]\((https:\/\/[^)]+)\)/.exec(readme)?.[1];
  assert.ok(runPage && guide.includes(`[Run page](${runPage})`), "README and the local guide lead to the same Run page");
  const blocks = [...guide.matchAll(/```sh\s*\n([^`]+)```/g)].map(match => match[1].trim());
  const command = [...readme.matchAll(/```sh\s*\n([^`]+)```/g)]
    .map(match => match[1].trim()).find(block => block.startsWith("curl "));
  const launch = command && /^curl -fsSL (?<installer>https:\/\/[^\s]+) \| sh && (?<checkout>.+) && \(cd (?<folder>[\w.-]+) && .+ dev\)$/.exec(command)?.groups;
  assert.ok(launch, "README installs rer, checks out a release and starts it from its folder");
  const restart = blocks.find(block => block === "rer dev");
  assert.equal(restart, "rer dev", "the guide documents one dev command to restart Lamp");
  return { ...launch, command, restartArgs: restart.split(" ").slice(1) };
}

export async function checkRunPage(browser, url, command) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(url);
    assert.ok(response?.ok(), "the Run page renders successfully");
    const snippet = await page.locator("section.self pre code").first().textContent();
    assert.equal(snippet.trim(), command, "the Run page and README use the same launch command");
    const link = page.locator(".published-release");
    const tag = await link.textContent();
    assert.match(tag, /^v\d+\.\d+\.\d+$/);
    assert.equal(await link.getAttribute("href"), `https://github.com/just-every/run-lamp/releases/tag/${tag}`);
  } finally { await page.close(); }
}
