# Lamp 1.11.13 release metadata preparation

Report stamped 2026-11-12T12:30:03Z.

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-release-1-11-13
Candidate: d110968e819a37e203b903c97ccb1409c94558a9
Base: cc961bfd91120b9b30224c8c552c9b93e70106fe
PR: https://github.com/just-every/run-lamp/pull/338
Version: 1.11.12 → 1.11.13; previousVersion: 1.11.12; date: 2026-11-12.

## Plan and scope

The full execution plan is in PLAN.md. Completed preparation: check the current green main and public release, inspect the actual tag delta, prepare only release metadata, preserve immutable predecessor bytes, validate affected metadata and types, regenerate/check the source lock last, rebase before publication, audit all candidate commits and push the named branch. PR creation follows the seed's AGENTS.md. Exact-head CI and evidence transfer complete the candidate handoff; the fleet retains landing and publication custody.

The public v1.11.12 tag peels to 62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b. Main is one commit ahead, cc961bfd91120b9b30224c8c552c9b93e70106fe, which distinguishes preview copies in owner status. Its Verify 43209269170 and Run site 43209269374 were completed/success on that exact main SHA. The latest GitHub Release was Lamp 1.11.12, published 2026-11-11T19:26:45Z. Version 1.11.13 was absent from main and tag refs; the branch listing showed only older release candidates. The first 100 open PRs contained no matching release builder. No fleet INBOX.md or STATE.md was read.

## Product result

The changelog describes only the main change since v1.11.12: Overview, page review and Settings identify preview copies, distinguish preview saves and failed preview updates, and direct the owner back to RunEditRun to publish. It introduces no new claim about notification delivery or a new product guarantee. RELEASE.json publicReleaseNotes exactly matches the new CHANGELOG section.

Metadata paths:

- `CHANGELOG.md`
- `README.md`
- `RELEASE.json`
- `docs/accessibility/vpat.md`
- `package.json`
- `release-history/1.11.12.CONTRACT.md`
- `release-history/1.11.12.json`
- `seed.json`
- `sources.lock.json`

The predecessor RELEASE.json and CONTRACT.md are copied byte-for-byte from v1.11.12 into release-history/1.11.12.json and release-history/1.11.12.CONTRACT.md. They are required to extend the release validator's complete predecessor chain; no historical snapshot was changed. The current CONTRACT.md, its Status/Gap/Evidence and summary, ACCEPTANCE.md and docs/CLAIMS.md are unchanged. The VPAT version and edition note advance without claiming a new accessibility evaluation.

README identifies this checkout as preparing 1.11.13 and retains v1.11.12 as the actual latest tagged release, including its clone example. RUN-LOCALLY.md and docs/install.md keep the same accurate published-tag references. Once publication occurs, any latest-release documentation follow-up remains with that publication round.

The rer pin remains 0.2.108, the pnpm pin remains 10.12.4, and pnpm-lock.yaml is byte-identical to main. This repository has no package-lock.json; none was created. No product source, tests, migrations, homepage, contract source or generated view changed.

## Validation

- Frozen dependency installation passed.
- RELEASE_TAG=v1.11.13 pnpm run validate:release passed: standalone release/seed schema, matching versions and VPAT, complete predecessor chain, migration and guarantee inventory; vendor catalog reported 20 sources and 162 native state cases.
- pnpm run typecheck passed.
- Source lock regenerated last with node scripts/edition-authoring/cli.mjs lock and checked with node scripts/edition-authoring/cli.mjs check: ok=true, 2248 file identities. Source component and tool identities are unchanged.
- Metadata consistency, exact predecessor byte comparisons, protected-path diff and Git whitespace checks passed.
- Verification inventory before/after is unchanged: 8 test shards and one shared build; 34 routine test files; 84 registered cases including release qualification + 10 assertion scripts = 94 checks. The inventory was read; no behavior tests or full local suite were run.
- Final release validation, typecheck and source-lock check passed with pinned Node 22.20.0 and pnpm 10.12.4. Earlier validation also passed on the VM's Node 24.19.0; the provided toolchain selector left that newer runtime active, so the pinned runtime was explicitly installed and used for final local receipts.
- Browser/build/setup/deploy proof was not run: this is a metadata-only release candidate. No new DONE or accessibility claim is made.
- Git fetch/rebase before first push confirmed main unchanged. The fleet hooks remained active and preserved repository hooks. All commits in origin/main..HEAD, including all parents, had fleet author/committer identity and no co-author trailer. One real candidate commit was pushed successfully on the first attempt through cloud-push.py. No force push, default-branch push or published-history rewrite occurred.

Clause status changes: none. Clause counts before and after: {"done": 57, "missing": 55, "partial": 132}. No target clause claim applies to this metadata assignment.

## CI and custody

Exact candidate Verify [43218109590](https://github.com/just-every/run-lamp/actions/runs/43218109590): completed/success on d110968e819a37e203b903c97ccb1409c94558a9. The final REST poll recorded completed/success; this report was finalized at 2026-11-12T12:43:49Z. CI discovery and polling use one watcher, at most one call per 300 seconds per run, and the ten-call task budget. No workflow was re-dispatched or re-run.

The remote product branch was read back and matched the exact candidate. The clone is to be deleted after successful evidence publication/readback; the terminal message confirms cleanup. The Mac fleet owns the full-history publication scan, guarded landing, final merged-view generation, immutable tag, release-envelope signing and GitHub Release publication/readback. This round creates neither a tag nor a GitHub Release and does not claim RELEASED.

## Actual files

PLAN.md, metadata-receipt.json, preflight-receipt.json, latest-release.json, pr-receipt.json, product-push.log, product-identity-check.txt, candidate-commits.txt, candidate-runs-discovery.json, counts-before.txt, counts-after.txt, release-validator.log, typecheck.log, dependency-install.log, pinned-node-install.log, source-lock-write.json, source-lock-check.json, file-identities.json, release-refs-before.txt, changes-since-v1.11.12.txt, diff-since-v1.11.12.txt and product-diff.patch are actual non-secret results from this task. Exact Verify REST observations are retained as verify-*.json. The GitHub call ledger is copied into the final packet before transfer. No credentials, secret values, environment dumps, private gate material or symlinks are selected.

## Terminal candidate result

Version 1.11.13 metadata is prepared and pushed; PR #338 is open. Exact-SHA Verify is completed/success. No blockers remain for the metadata handoff. The seed parser confirms 244 unchanged clause rows (57 done, 132 partial, 55 missing); no clause-status changes. Check inventory stays 84 registrations plus 10 assertion scripts = 94, before and after. GitHub calls used: 8 of ten, including discovery and PR creation; three status polls were at least 300 seconds apart. No failure-log reads or workflow reruns were needed.

Evidence uses a separate report-only ref. The selected packet includes complete reports, all actual validation/CI receipts and metadata diff, with no credential values, environment dumps, private held-out material or symlinks. The publication entrypoint does not change the product checkout, branch or index. Cleanup follows successful evidence transfer; the fully published product remains on its named branch and the PR stays open for the lane.

READY repo=just-every/run-lamp branch=cloud/sd-lamp-release-1-11-13 head=d110968e819a37e203b903c97ccb1409c94558a9
