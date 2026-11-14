# gr-mt-lamp-dep-8: dependency security maintenance

Repository: just-every/run-lamp
Product branch: cloud/gr-mt-lamp-dep-8
Base: 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0
Candidate: a77fb8e35e0a7b9cf266d250c94372e30e640ae4

## Plan and implementation

The complete plan is retained in PLAN.md. The authorized fleet launcher was refreshed; the decrypted-bundle-only Git helper, fleet identity and co-author cleanup hooks were installed before committing. A fresh full-history checkout was used. The repository rules, contract, generated acceptance, divergence, manifest and test instructions were inspected. Only the declared repository was cloned or changed.

Current main already pins patched Vite 8.2.4 in both package.json and pnpm-lock.yaml. This resolves the six Vite alert entries cited in the brief without further Vite changes. Zod remained at vulnerable 4.5.4, and the existing Miniflare-scoped undici override forced vulnerable 7.29.1.

The change raises the direct Zod minimum from ^4.3.6 to ^4.6.6, resolving 4.6.7, and changes the existing miniflare@5.20260907.0-alpha>undici override to 7.30.1. The scoped override preserves the pinned parent and avoids unrelated parent upgrades. pnpm 10.12.4 regenerated pnpm-lock.yaml. Every Zod consumer, including TanStack tooling, now resolves 4.6.7. Vite stays at 8.2.4. No unrelated package version changes occurred.

The source lock was regenerated last using the repository's documented command. Only its package.json and pnpm-lock.yaml hashes changed. The product commit contains exactly package.json, pnpm-lock.yaml and sources.lock.json: 17 insertions and 17 deletions. No UI, copy, contract, generated acceptance/claim view, tests or workflows changed. Fleet report files remain outside the product tree.

## Before and after

| Item | Before | After |
| --- | --- | --- |
| undici | 7.29.1, vulnerable | 7.30.1, patched |
| zod | 4.5.4, vulnerable | 4.6.7, patched |
| vite | 8.2.4, already patched | 8.2.4, patched |
| Vulnerable resolved versions among listed packages | 2 | 0 |
| Existing targeted test registrations | 10 | 10 |
| Contract done / partial / missing | 60 / 129 / 55 | 60 / 129 / 55 |

Clause status changes: none. There is no target feature clause to promote or demote in this dependency-only brief. No owner ruling or new default was required. The version findings use the patched ranges supplied in the assignment; they do not assert live Dependabot alert closure or a complete audit of unrelated dependencies.

## Local validation

Validation used Node 22.20.0 and pinned pnpm 10.12.4. The VM starts with Node 24.19.0, so the repository's exact Node 22.20.0 was explicitly installed and placed first on PATH for setup and all validation. The first package-manager lock regeneration also used pinned pnpm 10.12.4; frozen installation was then repeated under Node 22.20.0.

- pnpm install --lockfile-only: pass; changes limited to Zod and undici.
- pnpm install --frozen-lockfile: pass.
- npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive: pass with the project's pinned CLI 0.2.108, local migrations and owner setup.
- pnpm typecheck: pass.
- npx -y @runeditrun/rer build: pass; production client and Worker built. Existing TanStack deprecation and mixed static/dynamic-import warnings remain nonfatal.
- LAMP_CHROMIUM_PATH=/usr/bin/chromium node --test --test-concurrency=2 tests/e2e/start-runtime.test.mjs tests/e2e/publishing-contract.test.mjs: 10 passed, 0 failed, 0 skipped, about 129 seconds.
- node scripts/edition-authoring/cli.mjs lock followed by check: pass, 2,272 locked files.
- node src/base/contract-docs.mjs check: pass, current documents, 0 prose errors or warnings.
- git diff --check: pass.

The existing publishing tests exercise input rejection, incident and maintenance publication, scheduled updates, chat review, immutable reports, subscriber HTTP/mail outcomes and retained history. The built-Worker test exercises generated Vite/Start output, native sign-in, protected routes, public documentation and client navigation with Chromium. No tests were added, weakened, deleted or skipped. Full local Verify was deliberately not run: the task calls for touched checks locally and exact-SHA branch Verify as the full wall. No UI was edited, so new visual comparison proof was not required.

All setup/build/test commands that can leave descendants ran through cloud_run. The test fixtures closed their browsers and disposed their Worker processes. Setup's application descendants also exited before building. No process belonging to another task was stopped.

## Publication and custody

Product commit authorship and committer are Run Edit Run fleet <fleet@runeditrun.com>; no trailers were added. Every candidate commit, including side parents, is checked before the guarded push. The publication scanner is available in the pinned Base CLI package; pinned Gitleaks 8.30.1 was installed from its official GitHub release through the permitted API.

The first exact-tree full-history scan hit its 300-second deadline and returned INCOMPLETE / scan.deadline-exceeded. It did not authorize publication. The actual initial receipt is publication-scan-initial.json. The next attempt was deliberately interrupted after confirming that this scanner also reads ignored working files. A separate clean checkout was then materialized at the exact same candidate commit and tree; it contains no local setup files or build output. publication-input.json proves the clean full-history checkout and identical committed tree. The actual interrupted receipt is publication-scan-interrupted.json. The clean checkout scan then completed in about 302 seconds. Its only finding was destination.invalid because the scanner was invoked with a short project name and a bare repository slug. The committed edition ID is just-every/lamp and the scanner requires the destination repository as a full HTTPS URL. The destination preflight passes with those actual values. That complete failed invocation is retained as publication-scan-destination.json. The fresh full scan with the corrected invocation completed successfully: COMPLETE/PASS, zero findings, exact candidate a77fb8e35e0a7b9cf266d250c94372e30e640ae4 and tree 758e6654ae44cdf0d1ed9826da501ced23b8b2b5. Its actual receipt is publication-scan.json. Earlier incomplete and invocation-error receipts remain in the packet for accurate provenance.

The fleet push guard published cloud/gr-mt-lamp-dep-8 at a77fb8e35e0a7b9cf266d250c94372e30e640ae4 on its first attempt (push.log). The full candidate identity/trailer audit passed. PR creation initially returned HTTP 503. After the required authorized launcher refresh, a lookup verified that no PR had been created; the subsequent creation succeeded as https://github.com/just-every/run-lamp/pull/381 (pr-receipt.json). Exact-SHA push Verify run 43614287002 was discovered in progress at https://github.com/just-every/run-lamp/actions/runs/43614287002; ci-receipt.json records its actual observations. A single watcher uses at least 300 seconds between status calls. The final permitted status call was made after 600 seconds, and Verify still reported in_progress with head_sha a77fb8e35e0a7b9cf266d250c94372e30e640ae4 and no conclusion. The ten-call GitHub budget is exhausted. The watcher was stopped by its own recorded PID; no additional polling or duplicate workflow dispatch occurred. The evidence ref is separate and is not a product acceptance or landing signal. Landing remains with the Mac fleet and its independent gates.

Recovery custody: candidate.bundle is retained outside the clone at /home/agent/rer-consolidation/work/gr-mt-lamp-dep-8/candidate.bundle. It was verified with git bundle verify; bundle-receipt.json records its exact SHA-256. It is recovery data, not a READY or landing signal.

## Terminal result

PUSHED branch=cloud/gr-mt-lamp-dep-8 head=a77fb8e35e0a7b9cf266d250c94372e30e640ae4

PR: https://github.com/just-every/run-lamp/pull/381

Verify run 43614287002: https://github.com/just-every/run-lamp/actions/runs/43614287002. Last exact-SHA observation: in_progress, conclusion null, after 600 seconds. No green or READY claim is made. The API budget ended before the workflow. There is no observed red check, unresolved owner ruling or product blocker; CI completion remains pending. The Mac fleet reruns its independent gates and owns landing.

All ten touched tests, frozen installation, setup, build, typecheck, source/contract checks and the complete passing publication scan are recorded in this packet. The local result.json reports those completed maintenance results separately from pending product READY custody. The clone and verified recovery bundle are retained while CI remains pending. The task has not pushed main, force-pushed, rewritten published history or deployed.
