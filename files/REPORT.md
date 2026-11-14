# Lamp 1.11.16 release metadata candidate

Repository: just-every/run-lamp
Tag for this fleet task: sd-lamp-release-1-11-16
Product branch: cloud/sd-lamp-release-1-11-16
Product head: 454648ef9f86fed6695d12043fcf4014bc22d37c
Pull request: https://github.com/just-every/run-lamp/pull/382
Base main: fdd6f5a5cfda7478b14b21129d7d9a24c512ce19

This prepares release metadata only. No tag, signature, deployment, GitHub Release or landing was performed. The product branch was pushed successfully on the first attempt. Independent guarded Mac checks and later release publication remain required.

## Preflight and plan

The complete plan is retained in PLAN.md. The clone was shallow and blob-filtered; history was deepened only to compare v1.11.15 with main, including side parents. Main matched the brief's observed revision. GitHub REST confirmed completed/success for Verify 43617813386 and 43619892385, and Run site 43619892524, all on that exact base SHA. See main-ci.json.

The public latest release was v1.11.15, published at 2026-11-13T22:24:48Z. Git advertised no v1.11.16 tag or matching 1-11-16 branch before editing, main's package version was 1.11.15, and the open-PR inventory contained no competing 1.11.16 release candidate. The historical release peer for 1.11.13 and other product branches are not this assignment. See release-refs-before.txt, releases-before.json and open-prs-before.json.

The main-to-tag comparison contained 14 commits including side parents. It showed time-zone preservation and audited page-settings writes; bounded incident, subscriber and component reads; complete incident update snapshots for imports/backups after paging; two migration additions; website icon and status-feed markup fixes; Vite 8.2.4; and SMS-flow assertion helper corrections. The changelog describes product changes without internal check names or contract IDs. Test-helper-only changes do not become a customer-facing feature claim. The brief also mentioned current-date Standard/Daylight labeling; it was not a new changed file in this tag-to-main diff, so the release notes make no new claim about it.

## Metadata result

Changed paths:

- package.json: 1.11.15 to 1.11.16; rer stays 0.2.108.
- seed.json: existing release-version field to 1.11.16.
- docs/accessibility/vpat.md: existing Product version reference to 1.11.16; evaluation dates and limitations retained, with no new accessibility evaluation claimed.
- CHANGELOG.md: new 1.11.16 section from the actual tag-to-main delta, retaining older sections intact.
- RELEASE.json: version 1.11.16, previousVersion 1.11.15, UTC date 2026-11-14, notes exactly matching the new changelog section, exactly one SETUP-002 changed entry and both migration entries.
- release-history/1.11.15.json and release-history/1.11.15.CONTRACT.md: retained byte-for-byte from the immutable v1.11.15 tag, rather than copying main's unreleased change entries into the published predecessor.
- sources.lock.json: regenerated last using node scripts/edition-authoring/cli.mjs lock, then checked successfully.

No package-lock.json exists in this pnpm repository. pnpm-lock.yaml is unchanged. README and docs/install.md already direct readers to the release list and chosen tags; neither pins a stale latest Lamp version, so both remain unchanged. Product source, tests, migrations, current CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain unchanged.

The 1.11.16 migrations are 0079_subscriber_directory_order.sql (directory order index) and 0080_incident_list_paging.sql (incident-list indexes, backfilled lifecycle totals and maintaining triggers). Upgrade notes and each buyerSteps entry require a pre-deploy data/source backup and explain that rer deploy applies migrations in order before the updated Worker starts. Existing credential and private INSTALLATION_KEY custody guidance remains intact.

## Counts and clause custody

Version: 1.11.15 to 1.11.16. Published 1.11.15's retained migration inventory is zero; 1.11.16 introduces two. Current migration SQL file count remains 79 to 79. No migration is added by this metadata commit.

Contract counts before/after: Done 60 to 60, Partial 129 to 129, Missing 55 to 55, total 244 to 244. No clause Status, Gap, Evidence or acceptance point changed. SETUP-002 stays PARTIAL; its single existing changed release entry now belongs to 1.11.16, while the published predecessor's record has no such entry. No DONE or new behavioral proof is claimed. Product files changed: zero. Test files changed: zero. Tests added/removed/run locally: zero.

## Checks and publication custody

Local touched checks passed: release validator (schema, predecessor chain, migration and contract inventory), pnpm typecheck, source-lock check and Git whitespace check. The supplied cloud toolchain used Node 24.19.0 and pinned pnpm 10.12.4; typecheck emitted an engine warning because this checkout requests Node 22.20.0, then exited successfully. No full local verifier, build or browser journey was run for this metadata-only update.

A fresh fetch confirmed main before the candidate commit. Rebase onto origin/main before the first push was a no-op. Every candidate author, committer, full message and trailer was inspected across origin/main..HEAD, including the graph's side parents; the single unpublished candidate used Run Edit Run fleet <fleet@runeditrun.com> for both identities and had no co-author trailers. Fleet commit hooks remained active. The first real commit was immediately pushed only to the named cloud branch through cloud-push.py. PR #382 remains open for the lane; nothing landed on main.

Candidate push Verify run: https://github.com/just-every/run-lamp/actions/runs/43621303281
Exact head: 454648ef9f86fed6695d12043fcf4014bc22d37c
The CI outcome and polling times are recorded in the final receipt alongside this report when available. One REST watcher polls no faster than 300 seconds; no workflow is dispatched or retried.

The full-history publication scan is reserved for the guarded Mac lander, as explicitly instructed; no unsupported cloud scan was invoked. The candidate's metadata and retained public history were checked for scope and identity. There is no new product or browser proof claim. Producer/tagging, signing, GitHub Release notes/assets, release readback and subsequent deployment/journey work are deferred to their authorized owners. This report never claims the release has been published.

All selected packet files are actual non-secret reports or receipts outside the product checkout. Evidence goes only to refs/heads/evidence/sd-lamp-release-1-11-16 and does not signal product acceptance, landing or release publication. The successful product push permits clone/dependency cleanup after evidence publication; the packet is retained separately.

## Terminal result

PUSHED branch=cloud/sd-lamp-release-1-11-16 head=454648ef9f86fed6695d12043fcf4014bc22d37c

Verify 43621303281 still reported in_progress with no conclusion at 2026-11-14T17:44:00.892623+00:00. Three REST polls followed discovery by at least 300 seconds each. Eight of ten API calls were used; the two-call remainder is short of another poll plus failed-job discovery and log diagnosis. The brief permits PUSHED when the budget runs short while Verify is still running. No READY, green CI, DONE, landing or release-publication claim is made. No known implementation blocker was observed; the exact-SHA CI conclusion remains pending. See FINAL-RECEIPT.json and the actual discovery/poll receipts. The lane must re-read this exact run before landing.
