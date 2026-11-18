# Lamp 1.11.23 release preparation

Run Edit Run fleet, 2026-11-18 (UTC). Task sd-lamp-release-1-11-23.

**Result.** The setup manifest hash correction is published to `cloud/sd-lamp-release-1-11-23` at `70404ae45742014f3e465ec395bb00ca4c633309`. The release version change remains blocked by the missing immutable 1.11.22 predecessor snapshots, which are outside the lease. The branch contains the corrected declaration and regenerated source lock.

## Source and collision checks

- GitHub's latest release was Lamp v1.11.22, published 2026-11-17T09:20:51Z. Its tag resolves to `4c90e6c8f35775e2a0287ab24ccba87d7a8d8485`. The initial brief uses 1.11.23 as both latest and proposed. Git refs and GitHub Releases confirm that 1.11.22 is the published predecessor and v1.11.23 was available when checked.
- Initial main `4e97e8985ac870576ccaf3cf3a54332140c7e7d7` had successful Verify 44283624025 and Run site 44283624337. The fresh first parent is `fd6695e358e5aa67c47c45f05591f2c33e83a930`, which had successful Verify 44291956536 and Run site 44291956510. The additional landing recorded the UPDATE-011 judgment and its proof. The owner-facing release notes follow the actual tag-to-main diff.
- The checkout pins rer 0.2.121 in package.json and pnpm-lock.yaml. There is no Lamp version entry to change in pnpm-lock.yaml. package-lock.json and RELEASE.md do not exist in the checkout.

## Hash correction

The v1.11.22 descriptor declares `7ad0cd185d158e9fb9d0961159bf524f06f7faf8202bc32350baa544a993f1d8` but its setup bytes hash to `09950eb7a3f6a4bc426a09fc8c24d07b8a5f77e38ea8dd6bd2338fcd5d867993`. Fresh main still declared the old hash.

The project's existing `setup.path` points to `rer-setup.json`. The pinned rer describes `check` as read-only structural validation. Its installed project/release documentation and the edition descriptor generator provided no writer for the existing `setup.sha256` field. The correction sets that existing field from the setup file's bytes. On the confirmed pushed SHA, both values are `d2c56bbcab4b784cf9012fb7e25f0732ef0f32ee6e9c404c28505b81a9fbbbab`. The independent comparison reads files from the Git commit. The first-party structural check passed all 954 checks. The platform approval itself needs a release cut and its hosted gate.

## Release inventory and draft

- Published v1.11.22 has 81 core SQL migration files and fresh main has 83. The two added migrations are `0082_repeated_maintenance_cancellation.sql` and `0083_sorry_template_metadata.sql`. No previous migration file changed.
- The 244 contract clauses went from 60 done, 129 partial, 55 missing in the published tag to 63 done, 126 partial, 55 missing on main. UPDATE-011, SUB-009 and INTAKE-014 moved from partial to done on main. MOVE-001 and MOVE-014 also changed guarantee wording on main. The release delta records MOVE-001, a published clause. MOVE-014 is a target clause. The hash-correction branch changes zero clauses or judgments.
- RELEASE-DRAFT.patch contains the version and release note edits in the five existing leased files. Its operator notes cover the Approve failure, invitations, incident publication, Notifications, first-run branding, Sorry field accounting and private templates, Settings, maintenance, install and removal, and connection settings. They omit test-only changes and preserve the previous notes and backup/restore instructions.

## Release completion plan

1. Extend the lease to the two predecessor paths. Copy `RELEASE.json` and `CONTRACT.md` byte for byte from the published `v1.11.22` tag to `release-history/1.11.22.json` and `release-history/1.11.22.CONTRACT.md`. In an isolated checkout the draft produced the expected missing-file error without these copies and passed the same validator with them. See RELEASE-CHECK-RECEIPT.txt.
2. Recheck main and v1.11.23 availability, apply the draft version edits, verify the migration inventory, and regenerate and check the source lock last. Recompute the descriptor digest at the exact release-candidate SHA.
3. Require successful exact-SHA Verify and the fleet's publication scan and landing. The producer's pre-tag check must compare the setup bytes with the declaration again. The release's immutable tag and GitHub Release belong to the producer.

The branch build and local checks are recorded in the packet. The full publication scan belongs to the Mac lander.

## Branch verification

Verify 44293073651 reported in_progress for the pushed hash correction at 2026-11-18T11:36:15Z. The ten-call GitHub budget was exhausted with the run still active. See CI-RECEIPT.txt and https://github.com/just-every/run-lamp/actions/runs/44293073651.
The branch has no pull request in the branch lookup.
