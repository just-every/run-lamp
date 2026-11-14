# gr-mt-lamp-dep-7 result

Repository: just-every/run-lamp
Branch: cloud/gr-mt-lamp-dep-7
Pushed head: bef5115afc3972d78962fbb899a2a32433f5f3a6
Pull request: https://github.com/just-every/run-lamp/pull/374
Product custody: PUSHED; no READY claim.

## Change and scope

Vite is pinned from 8.2.2 to the first patched release, 8.2.4, for GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv and GHSA-r825-w8mm-5pxw. The regenerated pnpm lock changes only Vite's version, integrity and peer references. The documented authoring lock command refreshes only the package.json and pnpm-lock.yaml hashes in sources.lock.json. These are the only three changed files. No unrelated upgrades, UI edits, tests, contract text, clause judgments or generated acceptance/claim views changed.

Main advanced with 6a3fe92809524f6463f98454cd72af0cd8724100 (status-feed sanitization) before publication. The unpublished dependency commit was rebased onto it with fleet identity, retaining main's source and tests. Source-lock generation/check, typecheck, build and both affected runtime journeys passed again on the final head. No published history was rewritten.

## Executed plan

1. Set the required global and local fleet identity, refresh the fleet launcher and install decrypted-bundle Git authentication plus the required commit hooks.
2. Clone only the declared repository with full history into the maintenance task directory and create the named cloud branch from origin/main. Read repository instructions, contract context, divergence and testing guidance.
3. Use Node 22.20.0 and pnpm 10.12.4. Change only Vite to 8.2.4 with pnpm and frozen-install the regenerated lock.
4. Run the pinned rer local setup with the required owner/non-interactive arguments. Preserve repository hooks. Regenerate the source lock last with the documented command and check it.
5. Commit the product update, then run typecheck, production build and the two affected built Worker runtime journeys. Repeat these after rebasing onto updated main. Retain actual command receipts/logs beside this report.
6. Install and digest-verify the official pinned Gitleaks 8.30.1 asset required by Base's scanner. An initial scan failed on generated local setup/build artifacts only; no committed-tree finding occurred. Run the full scanner against a clean detached worktree of the exact final commit. It completed with PASS and zero findings.
7. Inspect all unpublished candidate author, committer, message and trailer identities, including every side parent. Publish the first real commit through the required cloud guard; the push succeeded on its first attempt. Open the contribution PR through the GitHub REST API.
8. Preserve a verified full-history recovery bundle and publish the explicitly selected non-secret report/receipt packet on the separate evidence ref. Product, acceptance and evidence publication remain separate.

## Validation on the pushed SHA

| Command | Result |
| --- | --- |
| pnpm install --frozen-lockfile | Pass; pnpm 10.12.4 |
| node scripts/edition-authoring/cli.mjs lock | Pass; only the two intended source hashes changed |
| node scripts/edition-authoring/cli.mjs check | Pass |
| pnpm typecheck | Pass |
| cloud_run npx -y @runeditrun/rer build | Pass |
| LAMP_CHROMIUM_PATH=/usr/bin/chromium cloud_run node --test --test-concurrency=1 tests/e2e/start-runtime.test.mjs tests/e2e/independent-release.test.mjs | 2 passed, 0 failed, 0 skipped |
| Base publish-check against the clean final-commit worktree with full history and environment hash comparison | Complete, PASS, 0 findings |
| Candidate identity/message/trailer check | Pass; one candidate commit, fleet author and committer, no trailers |
| Fleet product push guard | Pass; first attempt |

The runtime journeys exercise owner claiming and publication, restart, protected preview, built Hono/R2/Start routing, public docs, snapshot retention and hydrated client navigation. Chromium used /usr/bin/chromium with --no-sandbox. All test-owned browsers and servers stopped; no full local verifier or unrelated suite was run. No UI change required additional desktop/mobile screenshots.

Publication source: commit bef5115afc3972d78962fbb899a2a32433f5f3a6, tree 8fc6c12b6478680a00463fbf8d77f94fcfb777cb. The full actual report is publication-scan.json; initial and interrupted scan receipts retain their distinct names and do not represent the final verdict. Local setup files, credentials and build output are absent from the scanned worktree and from all published product/evidence selections.

## Before and after

| Measure | Before | After |
| --- | ---: | ---: |
| Resolved Vite version | 8.2.2 | 8.2.4 |
| Vulnerable Vite resolutions in pnpm-lock.yaml | 1 | 0 |
| Brief-listed advisory alerts | 6 listed | Closure unverified |
| Unrelated package upgrades | 0 | 0 |
| Tests added/removed/weakened by this change | 0 | 0 |
| Contract done / partial / missing / total | 60 / 129 / 55 / 244 | 60 / 129 / 55 / 244 |

Clause status changes: none. Target product clauses: none; this is dependency maintenance. No CLAIM promotion is requested.

## Pending external evidence and default

GitHub denied the Dependabot alerts API with HTTP 403, Resource not accessible by integration, on all five attempts after the required 15/45/90/150-second backoff and launcher refreshes. The patched resolution is established locally; closure of alerts 21–26 is not confirmed. Do not dismiss alerts manually. Default: allow Dependabot to re-evaluate after the fleet lands the upgrade and confirm closure with an account that has alert read access.

Exact-SHA Verify run IDs and outcome are unobserved. The ten-call GitHub budget was exhausted by two scanner-asset calls, five denied alert reads, two scanner visibility batches, and PR creation. No Actions discovery/poll call was made, and no other SHA is used as CI proof. The workflow has push and PR entry points. Default: retain the PR and named branch for the fleet to observe exact-SHA Verify before landing; never push main from this cloud. CI remains a landing gate, so this handoff is PUSHED rather than READY.

There is no known product or local-check blocker. The remaining limits are alert-read authorization and unobserved exact-SHA CI.

## Retained files

PLAN.md contains the original full plan. checks-receipt.json binds final commands/log hashes to the pushed SHA. result.json is the required local maintenance result, also retained at /home/agent/rer-consolidation/work/maint/gr-mt-lamp-dep-7/result.json. source-lock-write.json and source-lock-check.json are the actual authoring outputs. product-push.log and pull-request.json preserve publication provenance. ci-receipt.json and dependabot-alerts-access.json document the two external evidence limits. custody-bundle.json records the verified recovery bundle path and SHA-256. No bundle bytes are selected for evidence transport.
