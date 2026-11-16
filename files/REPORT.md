# gr-mt-lamp-ci-6: Release journeys maintenance

Run Edit Run fleet, 2026-11-16.

Result: **no-change**. The reported scheduled failure is already resolved on the current default branch. No product commit, PR, contract edit, generated view edit or lock change is necessary. The local branch `cloud/gr-mt-lamp-ci-6` remains at the current main SHA `fa751697bd6ea6301dad830dd9f3483da57a1c98`. No product branch was pushed, and no READY or product custody claim is made.

## Plan and completed work

1. Set fleet Git identity; refresh the fleet launcher; install decrypted-bundle Git authentication and the push guard. Read launcher AGENTS.md, the inline brief/RULES.md and repository AGENTS.md, CLAUDE.md, TESTING.md, CONTRACT.md, ACCEPTANCE.md, DIVERGENCE.md and local-launch instructions. Clone only the declared repository with full history and create the named cloud branch.
2. Inspect the historical Release journeys job results and read each failed job log once within the GitHub call budget. Compare its upgrade harness with main and inspect subsequent runs of the same workflow. Keep all investigation and reports outside product source.
3. Install frozen dependencies and the repository-pinned toolchain (Node 22.20.0 and pnpm 10.12.4), run fleet owner setup through cloud_run, run the affected release upgrade journey and TypeScript checking. The upgrade journey builds its own isolated previous and candidate Workers; no full local verifier or unrelated suite was run.
4. Confirm current main identity, exact-SHA CI and a clean checkout. Use the brief's no-change outcome after proving the issue is already fixed. Write result.json and publish only explicitly selected non-secret evidence to evidence/gr-mt-lamp-ci-6.

## Historical failure and existing correction

Run 41967897516 at `db51225570c06767f403c1bb1634bc12e0575336` failed only in job 127049059169, `journeys (upgrade)`, step 9, `Upgrade from the declared previous release tag`. Installer and README jobs passed.

The exact command `gh run view 41967897516 --repo just-every/run-lamp --job 127049059169 --log-failed` exited 0 with zero bytes on stdout and stderr. `historical-failure.log` preserves that empty response; `investigation.json` records the result and job metadata. No blocked-blob or archive retries were made. The historical assertion cannot be quoted from unavailable log text.

Main already contains correction `ddb626c97e14a57c9121169a0276e5e9991f7ffa`, which updates `tests/release/populate.mjs` to supply maintenance affected-audience and customer-impact fields on release 1.11 and later while omitting them for earlier strict schemas. This is the only upgrade-harness change since the failing head. It fixes fixture admission without removing or weakening the upgrade assertions. The unavailable log prevents attributing the precise original assertion solely from log evidence.

The same scheduled Release journeys workflow subsequently completed successfully:

| Run | Exact SHA | Result |
| --- | --- | --- |
| 42562043813 | d64a3f7d81d76420628b8b30064cbca3d855f393 | completed/success |
| 43154882994 | 62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b | completed/success |
| 43804964374 | 9a12aa722bb49eff2c9db2c266180c11a869220d | completed/success |

The latest successful release SHA is an ancestor of current main. Its only subsequent changes are documentation/source-lock updates and a hosted-mail test teardown wait; the release harness and application source are unchanged between that successful run and the current head. Local proof below additionally exercises the exact current head.

## Commands and results

- `pnpm install --frozen-lockfile`: passed. Fleet owner setup via `cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: passed. Private local setup output is excluded from the public packet.
- `cloud_run pnpm run verify:release --evidence /home/agent/rer-consolidation/work/maint/gr-mt-lamp-ci-6/upgrade-proof`: passed in about 231 seconds, 1 test, 1 pass, 0 failures, 0 skips. Previous release v1.11.18 (`f495b89afd9f6832e4d4807018d91fa4c4670147`) upgraded to v1.11.19 at `fa751697bd6ea6301dad830dd9f3483da57a1c98` with no tracked working changes. The actual receipt is `upgrade-receipt.json`; full non-secret terminal output is `upgrade.log`.
- The journey preserves applied migrations and all prior rows/defaults and R2 bytes, owner sessions and authority, drafts, reports, historical deliveries and uncertain sends, subscriber permissions, native import history and owner sidecar data. It exercises new publication and subscription, then exports, restores and compares the complete entity archive. Its only provider substitute is a synthetic Resend network edge; no live provider claim is made.
- `cloud_run pnpm typecheck`: passed; `typecheck.log` is retained.
- `git merge-base --is-ancestor 9a12aa722bb49eff2c9db2c266180c11a869220d HEAD`: passed.
- `git status --short`: empty. `git log origin/main..HEAD --format="%an <%ae>%n%cn <%ce>%n%(trailers:only,unfold)"`: empty, because there are no new product commits. `git ls-remote origin refs/heads/main` confirms `fa751697bd6ea6301dad830dd9f3483da57a1c98` remains main.
- Exact-SHA REST discovery reports Verify 43894123980 completed/success and Run site 43894124023 completed/success at `fa751697bd6ea6301dad830dd9f3483da57a1c98`. These are existing main runs, not evidence of a new cloud-branch push. Additional same-head Verify runs 43885222832 and 43885139385 also succeeded. Full results are retained in `current-head-runs.json`.
- Four GitHub budget invocations total: historical job discovery, one failed-job archive command, recent same-workflow runs, and current-head run discovery. No CI polling or workflow dispatch was needed.

## Before/after and contract status

Historical Release journeys jobs: 2 successful / 1 failed. Latest scheduled result: 3 successful / 0 failed. Exact current-head local upgrade: 1 successful / 0 failed / 0 skipped. Test registrations added/removed: 0/0; the affected journey retains its one registration. Product files changed: 0; new product commits: 0.

Clause status changes: none. Generated full-target counts stay 60 DONE / 129 PARTIAL / 55 MISSING (244 total); Core stays 60/129/50 (239), Agent surface 0/0/5 (5). No clause claims or new defaults are introduced. `table-counts.json` contains actual before/after inventory counts without any row values, tokens or object contents. No added migrations were required for v1.11.18 to current main.

## Custody, limitations and remaining work

There is no product change to land, no PR and no product-publication scan or push to request. The brief explicitly permits no-change after verification that main is already fixed. The historical log-text limitation does not prevent that conclusion: three later scheduled runs succeeded, and the unchanged exact current head passes the affected full upgrade/restore step locally. No product blocker remains.

The packet includes only reports, actual non-secret receipts, selected terminal output, CI metadata and inventory counts. Raw archives/inventories contain synthetic credential values and are deliberately excluded. Setup output, private local state, credentials and environment files are also excluded. No browser work or UI change was performed. The runtime harness disposed its Workers; the cloud_run subreaper completed. Report publication is separate from product READY, acceptance and landing.

Default: close this maintenance item as already fixed, without a product merge. The actual result is also written at `/home/agent/rer-consolidation/work/maint/gr-mt-lamp-ci-6/result.json`.
