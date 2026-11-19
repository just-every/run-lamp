# Lamp 1.11.24 release metadata

Run Edit Run fleet, 2026-11-19 UTC.

The candidate is `cloud/sd-lamp-release-1-11-24` at `c264dd9930542f9d5ea4c35852e4a473e12a81a0`, based on the freshly fetched main `1b3578b39a1e0166cbd0714f8d7d463210d7a190`. The 24 commits after the `v1.11.23` tag include both product changes and new evidence for existing behaviour. The candidate was pushed once and its named ref was read back. No PR was opened. The release tag and matching GitHub Release were absent when checked.

## Plan and results

1. Compare the tagged release with fresh main and retain the user outcomes supported by those commits. The notes cover maintenance start and completion notices and the fourteen-day public boundary, familiar component states and time labels, first publication and cache revalidation, local technical archive restore, Cutover bookmark checks, the delivery log and CSV, local invitation guidance and rer 0.2.125.
2. Update the existing release references in `package.json`, `seed.json`, `RELEASE.json` and `CHANGELOG.md`. Use 1.11.24 with previousVersion 1.11.23 and keep the changelog entry identical to publicReleaseNotes. Keep the backup, restored copy, deployment input, owner access and mail configuration steps from the prior release, and describe the existing archive and accessibility limits. The checkout contains no `RELEASE.md` or `package-lock.json`. The pnpm lock has no Lamp release-version field and the rer pin remains 0.2.125. No Base refresh was run.
3. Read both migration inventories from Git trees. All 82 migration files had the same blob ID at `v1.11.23`, fresh main and the pushed candidate. Zero new, zero changed, zero removed. The directory also contains one unchanged README.
4. Follow the previous screenshot convention. The `v1.11.23` GitHub Release attached `01-public-status-active-desktop.png` and its notes body contained no screenshot reference. Its tracked `visual/01-public-status-active-desktop.png` remains on main with the same blob ID. The older `.github/assets/release/lamp-1.10.0-status-page-1440.png` also exists. The notes contain no new reference.
5. Regenerate the source lock after the version and notes edits. Verify the source lock, contract views, copied Base files, typecheck and Git whitespace checks. All passed. Frozen dependency installation passed. The source lock changed only the four release metadata file digests. Schema validation for the new release and seed, matching version fields, changelog parity and migration and contract inventories passed. The isolated inventory check used the exact predecessor record and contract from `v1.11.23` in memory.
6. Inspect all candidate commit author, committer and trailer records, including side parents. The single product commit passed and has no trailers. The checkout was clean. The full publication scan is a Mac landing gate. The exact remote product head and declared-hash check are recorded in the product receipt.

## Contract counts

No contract clause claimed; this is release metadata.

| Revision | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| v1.11.23 | 64 | 125 | 55 | 244 |
| Candidate base and candidate | 65 | 124 | 55 | 244 |

Main already took NOTIFY-001 from partial to done and changed the PAGE-009 public timestamp guarantee. The release manifest records that PAGE-009 guarantee delta. This metadata commit makes zero clause status changes and adds or removes zero tests.

## Verification prerequisites outside the metadata lease

- The exact-checkout `pnpm run validate:release` validated the vendor catalog, then refused `docs/accessibility/vpat.md` because its Product version is 1.11.23 and the manifest version is 1.11.24. The brief excludes docs edits.
- The native history loader also reports missing `release-history/1.11.23.json`. Fresh main and the candidate lack both that immutable predecessor record and `release-history/1.11.23.CONTRACT.md`. The tagged release contains the exact source material for both. Retaining them in the product tree requires scope beyond the listed lease.

## Exact-commit CI outcome

Verify run [44585751260](https://github.com/just-every/run-lamp/actions/runs/44585751260) completed with failure on the advertised product SHA. The build job 135778158571 confirmed the VPAT version mismatch in `validate:release`. The contract view check passed. The shard jobs skipped after the build failure, and the final Verify job 135778838622 rejected the unsuccessful build receipt. Both failed job archives were read. The local release upgrade test reproduced the missing predecessor record failure before it could start the upgrade.

Product metadata is preserved on the branch. The Verify prerequisite requires an authorized VPAT version update and retention of the predecessor release record and contract in the product tree.
