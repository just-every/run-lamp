# Lamp 1.11.20 release metadata

Author: Run Edit Run fleet. Date: 2026-11-16 UTC.

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-release-1-11-20
Candidate: 626388fca54b18499b35b9e9c5f9cbcb51b4125b
Base main: fa751697bd6ea6301dad830dd9f3483da57a1c98
Pull request: https://github.com/just-every/run-lamp/pull/397

## Plan and scope

The complete plan is in PLAN.md. Read fresh main, confirm the version is available, inspect the actual previous-release delta, update existing release metadata, preserve immutable predecessor history, regenerate the source lock last, run the affected checks, publish the named branch, observe exact-SHA Verify and publish a separate report-only evidence packet. No tag, GitHub Release, deployment, main push or landing is authorized or performed.

## Results

The release metadata now names 1.11.20, with previousVersion 1.11.19 and the UTC date 2026-11-16. Package and seed versions and the existing VPAT Product version line agree. CHANGELOG.md and RELEASE.json describe the corrected install and deployment guidance: the package and lock declare the checkout's rer pin, and rer --version distinguishes the installed CLI from that checkout pin. The public notes do not claim that this delta changed runtime sign-in behavior: the domain-rule commit changes assertions to compare exact domain fields, and no application source changed between v1.11.19 and the inspected main.

Both package.json and pnpm-lock.yaml retain @runeditrun/rer exactly 0.2.118. The dependency lock is unchanged. No Base refresh was run. RELEASE.md and package-lock.json do not exist on main; neither was introduced.

Buyer instructions preserve backup of data and source, a restored-copy exercise, frozen installation, deployment with the same environment and input file, original ownership and account custody for rer signin, mail configuration guidance, retained earlier migrations and INSTALLATION_KEY custody. The new migration inventory is exactly empty: 80 migration files before and after.

The existing release validator requires the complete predecessor chain. Added release-history/1.11.19.json and release-history/1.11.19.CONTRACT.md byte for byte from the immutable v1.11.19 tag. No existing retained record or contract snapshot changed. These two ordinary release metadata artifacts are necessary to make previousVersion 1.11.19 validate.

Generated sources.lock.json last using node scripts/edition-authoring/cli.mjs lock, followed by its check. Eight product paths changed: package.json, seed.json, RELEASE.json, CHANGELOG.md, the VPAT version line, the two retained 1.11.19 artifacts and sources.lock.json. No homepage, README, application source, tests, current CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md changed.

## Counts and clause custody

Before and after: Core 60 done, 129 partial, 50 missing (239); Agent surface 0 done, 0 partial, 5 missing; Later 0; full target 60 done, 129 partial, 55 missing (244). No clause status, gap, evidence, acceptance point or meaning changed. No clause is claimed. No tests were added, removed, skipped or weakened. Migrations remain 80, with zero additions.

## Validation

On the exact clean final checkout, frozen offline dependency installation, pnpm typecheck, node scripts/validate-release.mjs, node src/base/contract-docs.mjs check, node scripts/edition-authoring/cli.mjs check and git diff --check passed. The validator verified the release schema, full predecessor chain, contract meaning inventory, migration inventory and matching package/seed/VPAT versions. The supported lock generation and check receipts are included in full. Setup completed with the fleet owner through cloud_run; its private runtime outputs and one-use sign-in material are excluded from this packet. No browser proof is applicable to this metadata-only change, and no browser was launched. No full local suite or build was run; branch Verify owns the full suite.

Local tooling used Node 24.19.0 and pnpm 10.12.4 under the supplied cloud toolchain; the repository's engine is 22.20.0 and pnpm reported the engine warning. The supplied helper keeps a newer VM Node. CI uses the repository's pinned Node. The Mac-only publication scan cannot run here and remains a fleet landing gate.

## Product publication custody

The first push, 43df283d3f14d150d2ce3fe7d9f6592dd18b393c, retained the predecessor artifacts and source lock. After the unpublished rebase autostash restored tracked metadata as unstaged files, that first commit omitted five metadata files. A post-push clean-tree check found the omission. The follow-up commit 626388fca54b18499b35b9e9c5f9cbcb51b4125b committed those files without rewriting published history. The final complete tree passed the affected checks again. Both product pushes succeeded on their first guarded attempt. All candidate authors and committers are Run Edit Run fleet <fleet@runeditrun.com>, with no co-author trailers. No force push occurred. Fresh main was merged before the second push and was already up to date.

PR #397 is open under the seed's contribution rule. The initial save's Verify was 43967446207; its result is not evidence for the final candidate. The exact final SHA has push Verify 43967552249 and PR Verify 43967565782, plus successful PR metadata workflow 43967553867. At the final observation, 22:28:30 UTC, both exact-SHA Verify runs remained in progress with no conclusion. The ten-call GitHub budget is exhausted after discovery and three polling rounds separated by at least 300 seconds per run. ci-receipt.json contains these exact-SHA observations. Terminal product custody is PUSHED, with no READY, acceptance or landing claim. The fleet must observe successful exact-SHA Verify before landing; no failing conclusion was observed. No CI dispatch or rerun was requested. Four GitHub API calls were used through discovery of the final runs; the six later polls brought the total to ten. No further GitHub API calls were made.

## Evidence and retention

This packet contains actual non-secret reports and command receipts. Runtime setup logs, generated local sign-in links, credentials, environment dumps and private provider material are excluded. Evidence is published only to refs/heads/evidence/sd-lamp-release-1-11-20 through cloud_evidence.py. Evidence publication is separate from product acceptance and landing. Product branch and evidence identities are verified before clone cleanup. The fleet still owns publication scan, exact-main checks, any tag or Release and landing.

## Terminal outcome

PUSHED branch=cloud/sd-lamp-release-1-11-20 head=626388fca54b18499b35b9e9c5f9cbcb51b4125b

Both exact-SHA Verify runs are pending, not green. No product blocker or failing run was observed. The final packet is published separately after this observation, read back with file-hash verification, and the product clone is then eligible for the instructed cleanup. No tag or GitHub Release was created. The previously published 25-file evidence packet was independently read back with every file hash verified and matching product identity; its actual transport receipts are included.
