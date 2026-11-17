# Lamp 1.11.22 release metadata

Author: Run Edit Run fleet
Date: 2026-11-17 UTC
Tag: sd-lamp-release-1-11-22
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-release-1-11-22

## Plan

1. Initialize fleet credentials, Git identity and clone-local forwarding hooks.
2. Read fresh main, the seed rules and supplied release rules. Check immutable tags and GitHub Releases for a 1.11.22 collision.
3. Compare published v1.11.21 with fresh main. Identify buyer-visible changes, migration inventory, contract meaning changes and the exact rer pin.
4. Update only release metadata and existing product-version references. Preserve published history, buyer backup and restore checks, owner customizations and deployment identity guidance. Retain the exact published 1.11.21 release record and CONTRACT snapshot to maintain the required predecessor chain.
5. Fetch and rebase unpublished work onto fresh main, regenerate the source lock last, then check release metadata, typecheck, generated contract views and source integrity. Inspect the full candidate diff and commit identity/trailers.
6. Commit with fleet identity and active hooks; push only the named product branch using the cloud push guard.
7. Discover and poll the exact-SHA Verify using REST within the ten-call budget and 300-second per-run interval. Do not self-submit, tag, publish a GitHub Release or refresh Base.
8. Save complete actual non-secret reports and receipts outside the product checkout, publish them only to the evidence ref, and remove the clone after successful custody transfer.

## Findings and scope

Fresh main initially: e569004dcd02b3453a9dbf1c8cbdaccb5d4f5528.
Published v1.11.21 peeled commit: 4d0675dbe51e2a86f69a8112b153baaf3fd91094.
The one product commit adds bounded R2 snapshot retention and a deployment-guide paragraph. Cleanup follows successful publication and pointer readback, protects current/previous and newer concurrent generations, and drains old piles over successive publications. Failed publication deletes nothing. Removal purges the snapshot bucket.
No migrations or contract meaning changes occur in that diff.
package.json and pnpm-lock.yaml both pin @runeditrun/rer to exactly 0.2.121; no pin or Base refresh change is authorized or performed.
No v1.11.22 tag or Release existed at the initial read. v1.11.21 is the last published predecessor.
RELEASE.md and package-lock.json do not exist in fresh main. No new files of those names are created. pnpm-lock.yaml contains no product-version reference to bump.
The seed's release validator requires a complete published predecessor chain. Its documented release-history/ convention therefore requires two newly retained files for 1.11.21, byte-identical to the tag. Existing history remains unchanged.
No UI or product implementation change is made. No clause status, gap, evidence, identities, generated acceptance view, homepage, README or deployment documentation is edited.
No CLAIM line is applicable.
The cloud cannot run the Mac publication scan; the fleet's independent publication gate remains required at landing. This is not a claim of release publication or product acceptance.

## Results

Local release validator, typecheck, generated contract-document check, source-lock check and staged-diff whitespace check all passed. Frozen dependency installation passed. Existing vendor-catalog validation covered 20 sources and 162 native-state cases.
The candidate's public release notes exactly match its CHANGELOG section. Both retained history files are byte-identical to published v1.11.21. The package and lock agree on rer 0.2.121.
Local Node was v24.19.0 with pnpm 10.12.4; the supplied toolchain retains a newer VM Node. Exact-SHA CI uses the repository's pinned Node 22.20.0.
No full local verifier or browser journey was run for this metadata-only change; the full wall is exact-SHA branch CI.

Product commit and pushed remote ref: 4c90e6c8f35775e2a0287ab24ccba87d7a8d8485.
The single product push succeeded on its first attempt using cloud-push.py. Every candidate commit (one, including all reachable side parents) has fleet author/committer identity and no trailers. Worktree is clean.
Product diff: 8 files, 3479 additions, 12 deletions. The retained prior contract accounts for 3438 added lines and changes no current clause.
Before/after clause counts: 244 total; 60 done, 129 partial, 55 missing in both. Status/Gap/Evidence changes: none. Tests added/deleted/modified: 0/0/0.
Migration inventory: 80 existing SQL files before and after, byte-identical to v1.11.21; zero new migrations.
No PR, tag or GitHub Release was created. This branch prepares release metadata only. No self-submission or landing was performed.
Exact-SHA Verify run: 44037000523, https://github.com/just-every/run-lamp/actions/runs/44037000523. Initial state: in_progress.
CI final verdict and evidence publication receipt will follow in this packet.

Evidence checkpoint, Run Edit Run fleet, 2026-11-17T07:29:16.541270+00:00: third exact-SHA poll is still in_progress with no conclusion. Product is PUSHED; READY is not yet claimed. This report-only checkpoint preserves local work while CI runs.
