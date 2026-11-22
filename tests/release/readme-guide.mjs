import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

function parseStartLine(line, message) {
  const match = /^curl -fsSL (?<installer>https:\/\/[^\s]+) \| sh && git clone --branch (?<tag>v\d+\.\d+\.\d+) (?<repository>https:\/\/github\.com\/just-every\/run-lamp(?:\.git)?) && \(cd (?<folder>[\w.-]+) && RER_OWNER_READY_TIMEOUT_MS=(?<timeout>[1-9]\d*) "\$HOME\/\.local\/bin\/rer" dev\)$/.exec(line);
  assert.ok(match, message);
  const { installer, tag, repository, folder, timeout } = match.groups;
  const cloneUrl = repository.replace(/\.git$/, "");
  assert.equal(cloneUrl.split("/").at(-1), folder, "the one-line launch enters the repository it cloned");
  return { installer, tag, repository, folder, timeout };
}

export async function readmeGuide(root) {
  const readme = await readFile(join(root, "README.md"), "utf8");
  assert.match(readme, /\]\(RUN-LOCALLY\.md\)/, "README links to the canonical local guide");
  const guide = await readFile(join(root, "RUN-LOCALLY.md"), "utf8");
  const blocks = [...guide.matchAll(/```sh\s*\n([^`]+)```/g)].map(match => match[1].trim());
  const start = parseStartLine(blocks[0], "the guide's first command installs rer, clones a release tag and starts Lamp");
  const restart = blocks.slice(1).find(block => block === "rer dev");
  assert.equal(restart, "rer dev", "the guide documents one dev command to restart Lamp");
  return { ...start, restartArgs: restart.split(" ").slice(1) };
}

export async function checkRunPage(browser, site, guide) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(new URL("/run", site).href);
    assert.ok(response?.ok(), "the local Run page renders successfully");
    const snippet = await page.locator("section.self pre code").first().textContent();
    const command = parseStartLine(snippet.trim(), "the Run page shows a tagged one-line launch");
    // The guide can point to the last published release while the candidate's
    // Run page already carries the next version. The launch steps must agree.
    assert.deepEqual({ ...command, repository: command.repository.replace(/\.git$/, "") }, {
      installer: guide.installer,
      tag: command.tag,
      repository: guide.repository.replace(/\.git$/, ""),
      folder: guide.folder,
      timeout: guide.timeout,
    }, "the guide and the Run page use the same tagged launch steps");
  } finally { await page.close(); }
}
