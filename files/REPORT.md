# Lamp 1.11.24 release metadata

Prepared by Run Edit Run fleet, 2026-11-19 19:03:21 UTC.
Repository `just-every/run-lamp`, branch `cloud/sd-lamp-release-1-11-24-c1`, head `08ef2ecad69d9c5828e4fb95ec93415b00502f54`.
The guarded push was read back from `refs/heads/cloud/sd-lamp-release-1-11-24-c1` at 2026-11-19T18:42:34Z.
The branch contains one ordinary commit on main `337435bb0de5c300e6c0ad8846608d0ac089a94e`.

## Plan and result

1. Fetch fresh main, the named previous candidate and the published predecessor tag. Confirm the previous candidate `c264dd9930542f9d5ea4c35852e4a473e12a81a0` and v1.11.23 commit `199a635758939ab54b12f3a76dabeee68ab74b8f`.
2. Replay the previous candidate’s metadata in one commit. Review the product diff from v1.11.23 and the changes since the previous candidate’s base. Fresh main added a remote sign-in refusal assertion and its source lock update, so the existing customer notes remained accurate. The 1.11.24 changelog section and release notes match, and the checkout keeps rer 0.2.125. The checkout uses `pnpm-lock.yaml` and `RELEASE.json`.
3. Set the VPAT Product version line to 1.11.24. The byte comparison against main confirms the single-line change.
4. Retain the predecessor record and contract from the published tag. The tag carries both documents at `RELEASE.json` and `CONTRACT.md`. It did not carry its own numbered snapshots. The v1.11.23 preparation commit added the 1.11.22 snapshots by copying those two root files from v1.11.22. This round copied the corresponding v1.11.23 root files to `release-history/1.11.23.json` and `release-history/1.11.23.CONTRACT.md` and verified byte equality.
5. Compare the pushed migration tree to v1.11.23, verify all hash declarations from pushed tree bytes, and regenerate the source lock after staging the release files. The pushed tree has 82 byte-identical SQL migrations and the release declares zero new migrations.
6. Run the build shard and release upgrade, then check the exact pushed SHA in Verify. The fleet branch is the handoff for landing. GitHub reports no main branch protection or active ruleset.

## Validation

- `rer-project.json` declares one file digest, `setup.sha256` for `rer-setup.json`. Declared `d2c56bbcab4b784cf9012fb7e25f0732ef0f32ee6e9c404c28505b81a9fbbbab`. Actual `d2c56bbcab4b784cf9012fb7e25f0732ef0f32ee6e9c404c28505b81a9fbbbab`.
- Node 22.20.0 and pnpm 10.12.4 passed the frozen install and workerd launch probe.
- All nine local build-shard steps exited 0 on the candidate. `check:contract-docs`, `source:copies`, `source:check`, `typecheck`, `check:syntax`, `validate:release`, `verify:visual:source`, `build:app`, `build:site`.
- `validate:release` checked the retained chain, migration and contract inventories, and the matching release and VPAT versions.
- The populated Worker upgraded in place from v1.11.23, preserved owner authority and history, and restored its portable archive. The first attempt stopped before running the journey because the shallow partial checkout lacked objects for the journey’s internal shared clone. Fetching those objects in the same checkout resolved it.
- Verify run [44590666278](https://github.com/just-every/run-lamp/actions/runs/44590666278) reported completed / success on the exact branch head.
- The previous candidate’s Verify 44585751260 failed on the old VPAT version. This round also resolved the missing history files that blocked its local validator.

No contract clause claimed; this is release metadata.

| Contract status | Before | After |
| --- | ---: | ---: |
| Done | 65 | 65 |
| Partial | 124 | 124 |
| Missing | 55 | 55 |
| Total | 244 | 244 |

Zero clause status changes. The release record describes the PAGE-009 timestamp guarantee already on main. The fleet lander owns the publication scan and integration.
