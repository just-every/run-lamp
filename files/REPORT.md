# Lamp install/deploy documentation — main-lamp-run-docs-1

Repository: just-every/run-lamp (treated as public).
Product branch: cloud/main-lamp-run-docs-1.
Product head: b32a0197ddfcf30633faf495a692c35574afee08.
Base: ccc4f7a2f1c18223078b2f5e03440fd413d1575d.
PR: https://github.com/just-every/run-lamp/pull/330.
Exact-head push Verify: 43011556088, COMPLETED / SUCCESS on b32a0197ddfcf30633faf495a692c35574afee08.
Run URL: https://github.com/just-every/run-lamp/actions/runs/43011556088.

## Plan and results

The complete execution plan is PLAN.md; SCREENSHOTS.md identifies each capture. Launcher refresh, decrypted-bundle Git helper,
clone-local identity and preserving commit hooks were installed before the product
commit. All product writes stayed in the declared repository and named cloud branch.

1. Reproduced the public-door gap before editing. Downloaded the public install.sh,
   installed rer 0.2.108 into a scratch home, and invoked bare rer in a new Bash
   without ~/.local/bin on PATH. It exited 127 with `rer: command not found`.
   Copied the exact Bash line from that installer's output and `rer cli path`;
   applying it made `rer --version` exit 0 and print 0.2.108.
2. README now leads with the combined curl launch from /run, links
   https://run-lamp.com/run and gives the npx line as the Node 22+ alternative.
   Its source-version section also refers to the combined launch consistently.
3. README, RUN-LOCALLY.md and docs/deploy.md now show the actual installer Bash
   instruction before their first bare rer command. The previous main already
   mentioned PATH inline in README and RUN-LOCALLY, but put bare commands before
   that guidance. Each guide now gives a separate copyable block, and the
   absolute `"$HOME/.local/bin/rer" cli path` door for other shells.
4. Deployment step 7 now stops the development server with `rer dev --stop`
   before the dry run, and names `rer preview --stop` for a production preview.
   The builder did not execute these stop commands; only PIDs started by its
   own browser/site tests were stopped by their scoped cleanup.
5. The Run page lives here: src/site/run.ts supplies its data and
   src/base/run-site.ts renders it. The combined curl lead and npx alternative
   already matched the desired ordering. Its existing “Other ways to run locally”
   section now supplies the same actual PATH instruction and links local guidance.
   The Base-copy adaptation was recorded with the documented adapt-base command.
   No other repository was cloned or modified.
6. Fetched main and rebased unpublished work with autostash; main had not moved.
   Contract generation check passed without changing CONTRACT.md or its views.
   Regenerated sources.lock.json last and ran its check successfully.
   The first and only product commit was pushed immediately using cloud-push.py;
   no skip marker or co-author trailer is present. All candidate authors and
   committers were inspected, including side parents: fleet identity only.
7. Opened PR #330 as required by AGENTS.md. The Mac fleet owns its complete
   publication scan, admission and landing. This cloud task cannot run that scan;
   it inspected the narrow diff and published no credential or private evidence.

## Validation and practical limits

- `pnpm run typecheck`: PASS. Calling shell Node 24.19.0 reported the repository's
  exact engine preference; rer setup/build used the pinned Node 22.20.0.
- `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`:
  PASS through cloud_run. Private generated owner entry material is not in this packet.
- `npx -y @runeditrun/rer build --site`: PASS through cloud_run, 37 pages.
- `node scripts/edition-authoring/cli.mjs verify-base --offline`: PASS after recording
  the intentional local renderer copy; this checks retained hashes, not a live Base read.
- `node src/base/contract-docs.mjs check`: PASS; current views, 0 errors or warnings.
- `node scripts/edition-authoring/cli.mjs lock` then `check`: PASS, 10 components.
- `node scripts/verification/check-plan.mjs`: PASS, 8 test shards plus one build,
  78 registered cases and 10 assertion scripts = 88 checks; 34 routine test files.
- Existing `tests/lamp-site/browser.test.mjs` journey: PASS on the committed head
  on one retry. The first attempt failed locally at its
  unchanged homepage image-readiness wait (line 114), before reaching the docs.
  It jumped directly from the top to the footer and timed out waiting for every
  image to load. A separate system-Chromium diagnostic found all images ready,
  so one retry was justified and the unchanged journey passed (1/1). Both actual
  attempt logs are retained. No assertion was weakened, skipped or changed.
  The changed docs screens also have successful browser proof; exact-SHA Verify
  is the full CI gate and its result must be read independently.
- Browser proof: /run (existing details expanded), /docs/run-locally and
  /docs/deploy returned HTTP 200 at both 1440 and 390, all documents fit the
  viewport. Deployment step 7 has a separate viewport capture. README has no
  application route: its changed sections were captured in a local Markdown
  preview, explicitly labelled as such, at both widths. These are review
  captures, not newly registered wording tests. The tracked documentation bytes
  used by the build/proof are identical to the committed candidate.
- No tests were added, deleted or modified; no full local Verify was run.
- No real deployment, provider credentials or hosted acceptance is claimed.

## Before/after counts and contract status

| Measure | Before | After |
| --- | ---: | ---: |
| Registered test cases | 78 | 78 |
| Assertion scripts | 10 | 10 |
| Total counted checks (cap 200) | 88 | 88 |
| Routine test files | 34 | 34 |
| Core Done / Partial / Missing | 57 / 132 / 50 | 57 / 132 / 50 |
| Full target Done / Partial / Missing | 57 / 132 / 55 | 57 / 132 / 55 |
| Contract clauses | 244 | 244 |

No clause Status, Gap, Evidence, acceptance text or generated view was edited.
No DONE claim or newly proven complete acceptance point is made. DOCS-001
remains partial; this is the narrowly requested install/deploy copy correction.
No default policy ruling was needed: the Bash line comes from actual installer output.

CLAIM DOCS-001 PARTIAL points=none tests=tests/lamp-site/browser.test.mjs#DOCS-001 PAGE-020 — Lobby, public Lamp site and accessible owner documentation journey

## Changed sections

```diff
diff --git a/README.md b/README.md
index 31f3a9c..25a2267 100644
--- a/README.md
+++ b/README.md
@@ -38,18 +38,35 @@ information.
 
 ## Run it locally
 
+```sh
+curl -fsSL https://runeditrun.com/install.sh | sh -s -- dev just-every/run-lamp
+```
+
+That one line gets Lamp, brings Node and pnpm, installs everything, makes you the
+owner and prints a link that opens Lamp signed in. Git is required. See the
+[Run page](https://run-lamp.com/run) for the same launch and hosting options.
+
+Already have Node 22 or later? Use this alternative:
+
 ```sh
 npx -y @runeditrun/rer dev just-every/run-lamp
 ```
 
-That one line gets Lamp, installs everything, makes you the owner and prints a link
-that opens Lamp signed in. To start it again later, run `cd run-lamp && rer dev`; after
-the `curl` installer below, a terminal without `~/.local/bin` on PATH needs
-`export PATH="$HOME/.local/bin:$PATH"` first or it says `rer: command not found` (add
-that line to your shell startup file to keep it; `"$HOME/.local/bin/rer" cli path` shows
-the line for your shell).
-No Node? `curl -fsSL https://runeditrun.com/install.sh | sh -s -- dev just-every/run-lamp`
-brings its own and does the same.
+After the curl install, if `~/.local/bin` is missing from your PATH, run the
+installer's Bash line once to make the command available now and in future
+terminals:
+
+```sh
+echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.local/bin:$PATH"
+```
+
+For another shell, `"$HOME/.local/bin/rer" cli path` prints its line. To start
+Lamp again later:
+
+```sh
+cd run-lamp
+rer dev
+```
 
 ## Owner guides
 
@@ -67,8 +84,8 @@ The app host serves Lamp's public documentation at `/docs`. Start with the
 
 ## Source and tooling versions
 
-The Run page's start line, `npx -y @runeditrun/rer dev just-every/run-lamp`, clones the default branch, `main`, not a release tag, into a `run-lamp`
-folder and starts it; after that, run `rer dev` from that folder. `main` is Lamp's
+The [Run page's](https://run-lamp.com/run) combined curl line above clones the
+default branch, `main`, not a release tag, into a `run-lamp` folder and starts it; after that, run `rer dev` from that folder. `main` is Lamp's
 development source and may hold changes not yet in a release; it pins
 `@runeditrun/rer` 0.2.108. The latest tagged release is `v1.11.10`, which pins
 `@runeditrun/rer` 0.2.107 too. To use that release instead, clone the tag and start it:
diff --git a/RUN-LOCALLY.md b/RUN-LOCALLY.md
index a14525e..50eb3b1 100644
--- a/RUN-LOCALLY.md
+++ b/RUN-LOCALLY.md
@@ -1,16 +1,39 @@
 # Run it locally
 
-Use `rer` from the project root. The checkout pins `@runeditrun/rer` 0.2.108,
-which every `rer` command here runs whatever `rer` you installed;
-`rer describe` reports the commands and tooling in use. Lamp runs on
-your computer without a Cloudflare account or mail credentials; development mail
-is silently suppressed.
-
-The one start line, `curl -fsSL https://runeditrun.com/install.sh | sh -s -- dev just-every/run-lamp`, installs `rer` with its own Node when needed, clones `main` (development source, not a release tag) into `run-lamp` and starts it. Git is required; rer brings Node and pnpm. When `~/.local/bin` is not on your PATH, the installer's last lines give the one required step: run `export PATH="$HOME/.local/bin:$PATH"` and keep it in your shell startup file (`"$HOME/.local/bin/rer" cli path` shows the line for other shells); a terminal without it says `rer: command not found` at `rer dev`. Already have Node 22 or later? `npx -y @runeditrun/rer dev just-every/run-lamp` does the same. The latest
-release tag, `v1.11.10`, pins rer 0.2.107; if you choose the tag, use that
-checkout's own instructions. See [source and tooling versions](README.md#source-and-tooling-versions).
-`rer` selects the project's pinned Node 22.20.0 and pnpm 10.12.4, downloading
-its Node version when needed even if your shell has a newer Node.
+Lamp runs on your computer without a Cloudflare account or mail credentials;
+development mail is silently suppressed. Start it with the same line as the
+[Run page](https://run-lamp.com/run):
+
+```sh
+curl -fsSL https://runeditrun.com/install.sh | sh -s -- dev just-every/run-lamp
+```
+
+Git is required; the installer brings Node when needed and rer brings pnpm.
+This clones `main` (development source, not a release tag) into `run-lamp` and
+starts it. Already have Node 22 or later? Use this alternative:
+
+```sh
+npx -y @runeditrun/rer dev just-every/run-lamp
+```
+
+After the curl install, if `~/.local/bin` is missing from your PATH, run the
+installer's Bash line once to make the command available now and in future
+terminals:
+
+```sh
+echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.local/bin:$PATH"
+```
+
+For another shell, `"$HOME/.local/bin/rer" cli path` prints its line. Run the
+remaining commands from the `run-lamp` folder.
+
+The checkout pins `@runeditrun/rer` 0.2.108, which every command here runs whatever
+rer you installed; `rer describe` reports the commands and tooling in use.
+The latest release tag, `v1.11.10`, pins rer 0.2.107; if you choose the tag, use
+that checkout's own instructions. See
+[source and tooling versions](README.md#source-and-tooling-versions).
+rer selects the project's pinned Node 22.20.0 and pnpm 10.12.4, downloading its
+Node version when needed even if your shell has a newer Node.
 
 ## Start Lamp
 
diff --git a/docs/deploy.md b/docs/deploy.md
index 66d98ff..453afa5 100644
--- a/docs/deploy.md
+++ b/docs/deploy.md
@@ -16,12 +16,23 @@ to your subscribers. On the Free path that mail goes through your own SendGrid o
 Resend account, from a domain you own and have authenticated there (step 6 shows
 how). If you have no domain you can add DNS records to, choose Managed instead.
 
-Do the steps in order. Each step names the inputs it gives you; `rer deploy
---dry-run` lists any you have not set yet by the same names, in the same order.
-You need the Lamp folder that `rer dev just-every/run-lamp` made (run every
+You need the Lamp folder from [Run Lamp locally](../RUN-LOCALLY.md) (run every
 command below from it), a Cloudflare account, a mail account at SendGrid or
 Resend, and a domain whose DNS records you can change.
 
+After the curl install, if `~/.local/bin` is missing from your PATH, run the
+installer's Bash line once to make the command available now and in future
+terminals:
+
+```sh
+echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.local/bin:$PATH"
+```
+
+For another shell, `"$HOME/.local/bin/rer" cli path` prints its line.
+
+Do the steps in order. Each step names the inputs it gives you; `rer deploy
+--dry-run` lists any you have not set yet by the same names, in the same order.
+
 ## Step 1: Make a private input file
 
 Your inputs live in one file outside the Lamp folder that only you can read. Run
@@ -172,7 +183,15 @@ SPF at your sending domain is not required.
 
 ## Step 7: Check, then deploy
 
-From the Lamp folder:
+Stop the development server before the dry run; an active server owns the
+checkout's local state and prevents deployment. From the Lamp folder:
+
+```sh
+rer dev --stop
+```
+
+If you are running a production preview instead, stop it with `rer preview --stop`.
+Then check your inputs:
 
 ```sh
 rer deploy --dry-run --environment production --env-file "$LAMP_DEPLOY_ENV"
diff --git a/src/base/run-site.ts b/src/base/run-site.ts
index bc53194..2e8db82 100644
--- a/src/base/run-site.ts
+++ b/src/base/run-site.ts
@@ -201,7 +201,7 @@ export function runPageHtml(identity: EditionIdentity, run: RunData, contract?:
     + `<section class="self" aria-labelledby="self"><div class="self-heading"><span class="badge">${escape(self.badge)}</span><h2 id="self">${escape(self.title)}</h2><p class="self-body">${escape(self.body(run.name))}</p></div>`
     + codeBlock(startLine(run), self.title)
     + `<section class="paste-panel" aria-labelledby="paste-title"><h3 id="paste-title">${escape(self.pasteTitle)}</h3><div class="paste-track">${stops(steps, true)}<p class="track-note">${escape(self.note)}</p></div></section>`
-    + `<details class="other-ways"><summary>Other ways to run locally</summary><p class="alt"><span>${escape(self.alt)}</span>${inlineStart(run)}</p><div class="alt"><span>To install rer separately:</span><pre><code>curl -fsSL https://runeditrun.com/install.sh | sh</code></pre><span>Then run:</span><pre><code>$HOME/.local/bin/rer dev ${escape(repo)}</code></pre></div><p class="alt"><span>Optional, for future terminals: add <code>$HOME/.local/bin</code> to your shell’s PATH. The one-line launch above already finds rer for this run; you can do this later.</span></p></details><p class="requirements">${escape(self.requirements)}${run.paths.requirementsExtra ? ' ' + escape(run.paths.requirementsExtra) : ''}</p><p class="email-note">${escape(self.email)}</p>`
+    + `<details class="other-ways"><summary>Other ways to run locally</summary><p class="alt"><span>${escape(self.alt)}</span>${inlineStart(run)}</p><div class="alt"><span>To install rer separately:</span><pre><code>curl -fsSL https://runeditrun.com/install.sh | sh</code></pre><span>Then run:</span><pre><code>$HOME/.local/bin/rer dev ${escape(repo)}</code></pre></div><div class="alt"><span>The one-line launch above already finds rer for this run. If <code>~/.local/bin</code> is missing from your PATH, run the installer’s Bash line once before using bare <code>rer</code> commands in this terminal or future ones:</span><pre><code>echo 'export PATH="$HOME/.local/bin:$PATH"' &gt;&gt; ~/.bashrc &amp;&amp; export PATH="$HOME/.local/bin:$PATH"</code></pre><span>For another shell, <code>"$HOME/.local/bin/rer" cli path</code> prints its line. See <a href="/docs/run-locally">Run Lamp locally</a> for restart and backup steps.</span></div></details><p class="requirements">${escape(self.requirements)}${run.paths.requirementsExtra ? ' ' + escape(run.paths.requirementsExtra) : ''}</p><p class="email-note">${escape(self.email)}</p>`
     + `<div class="timeline">${stops([self.start, ...steps])}<span class="track-divider" aria-hidden="true"></span><p class="track-note">${escape(self.note)}</p></div>`
     + (run.docs ? `<p class="guide">${action(self.guide.href, self.guide.label)}</p>` : '')
     + `</section><div class="doors">${doors}</div><div class="quiet"><p>${escape(PATHS.business.lead)} ${action(PATHS.business.href, PATHS.business.action)}</p></div>`
```

## Custody

Product provenance and product-push.txt identify the real pushed commit;
PR and CI receipts are separate. The full non-secret packet, including this report,
PLAN.md, actual command receipts and browser captures, is published only to
refs/heads/evidence/main-lamp-run-docs-1. Evidence does not establish product READY,
acceptance or landing. No evidence or screenshot file enters the product branch.

The installer scratch home was removed after retaining the actual non-secret
installer/PATH receipts. The product clone is removed only after successful
product and evidence publication, as required by the task.

## Final CI and disposition

Verify 43011556088 completed successfully on the exact product head
b32a0197ddfcf30633faf495a692c35574afee08. No contract-generator exception was needed.
Seven explicit repository REST calls were used: PR creation, run discovery,
four polls, and one PR-description update. Polls were separated by at least
300 seconds. No workflow was dispatched or rerun and no failed-job archive
was requested. There are no product blockers. The Mac fleet retains publication
scan, PR/landing and deployed-site responsibility.

READY branch=cloud/main-lamp-run-docs-1 head=b32a0197ddfcf30633faf495a692c35574afee08
