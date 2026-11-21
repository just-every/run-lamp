# Lamp 1.11.25 release metadata

Run Edit Run fleet, 2026-11-21. Task `sd-lamp-release-1-11-25`.

## Plan

1. Check the tag and GitHub Release names, compare the latest published tag with fresh main, and read the inherited Sorry, subscriber reporting, and rer changes.
2. Prepare the in-scope metadata, preserve buyer instructions and known limits, verify the migration inventory, and regenerate the source lock last.
3. Run the local checks, publish the one metadata commit to the named cloud branch, check declared hashes at the pushed SHA, and get the exact-SHA Verify result.
4. Return the report and receipts through the evidence ref. Leave release and landing custody with the fleet.

## Results

- Prior tag `v1.11.24` points to `3f1349f029fa8c8c59bf9adfe4e2ae59fd502842`. Fresh main was `d442dbb58d146eee3589c8880463d94d12b11981`, nine commits ahead of that tag. Git advertised no `v1.11.25` tag and GitHub returned HTTP 404 for the Release lookup.
- Pushed `ac3972b416ba736a32d34aec31631cde1b6b3cfd` to `cloud/sd-lamp-release-1-11-25`. It changes CHANGELOG.md, RELEASE.json, package.json, seed.json and sources.lock.json. The tracked pnpm lockfile already pins rer 0.2.126 and has no Lamp version reference to bump. RELEASE.md and package-lock.json are absent. The previous release metadata carries no screenshot reference.
- The Sorry dry run lists each ungrouped component displaced below groups, marks the item changed and explains the ordering. The inherited change for pending email expiry adds an operator-reporting assertion: each expiry removes one eligible address, records one anonymous email leave, and a repeated tick adds no leave. It changes only tests and the source lock, so the public notes make no new subscriber reporting claim.
- The installed rer pin is 0.2.126. Its upstream changelog describes a Platform-to-native archive restore fix for matching owner migration histories and a bounded local port inspection. Lamp's notes describe the pin, the local startup, owner entry and archive restore steps documented in RUN-LOCALLY.md, and the inspection deadline. They preserve the existing restore limits. [rer 0.2.126 changelog](https://github.com/runeditrun/base/blob/rer-v0.2.126/global/CHANGELOG.md)
- RELEASE.json names 1.11.24 as the predecessor and carries the same notes as the changelog. Buyer instructions still cover data and source backup, frozen install, reuse of deployment inputs, restored-copy validation, retained migration and mail instructions, account and installation custody, and the original archive source revision.
- Added migrations: none. The prior tag, fresh main and candidate all contain the same migration tree `aaf4efd6c27950bfa38ceb895f5bd532ab688580`. All 82 existing SQL migration blobs are byte-identical. The declared project setup hash matches the committed setup bytes. See DECLARED-HASHES.txt.
- Full-target counts in done/partial/missing/total order are 65/124/55/244 at the prior tag and 65/124/56/245 at both fresh main and the candidate. Main added COMP-011 as a missing target. The release metadata round changes no clause status or published guarantee.

No contract clause claimed; this is release metadata.

## Verification and blocker

The source lock check, offline Base copy check, contract document generator and check, typecheck, migration comparison, metadata agreement, changelog parity and diff whitespace check passed. This round changed release metadata only.

The release validator at the candidate requires the Product version line in `docs/accessibility/vpat.md` to be 1.11.25. Its current value is 1.11.24. The retained-history check separately requires `release-history/1.11.24.json` and `release-history/1.11.24.CONTRACT.md`. Both snapshots are absent from main. All three edits are outside the task lease. A temporary validation directory using the exact tagged snapshots and the VPAT version bump passed the same validator on the proposed metadata. Those mechanical edits require a lease extension for a green release candidate.

The product branch was pushed to preserve the in-scope work. The fleet owns the publication scan and landing. PR lookup returned none. The run created no PR, tag or Release.

[Exact-SHA Verify 44848376476](https://github.com/just-every/run-lamp/actions/runs/44848376476) completed with failure. The build job rejected the VPAT version mismatch. The test shards were skipped after the build failed, and the final verification job reported the failed build and missing shard artifacts. Both failed job archives were read. The verification plan lists 115 registered cases plus 10 assertion scripts, 125 checks on both main and the metadata candidate.
