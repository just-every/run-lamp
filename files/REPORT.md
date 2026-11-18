# Lamp 1.11.23 release preparation

Run Edit Run fleet, 2026-11-18 UTC. Task `sd-lamp-release-1-11-23-c1`, repository `just-every/run-lamp`.

## Plan

1. Verify the exact fresh main and published predecessor, rule out a 1.11.23 collision, and read the earlier candidate and draft packet.
2. Check `v1.11.22..main` against the draft, including migration files, operator workflows and contract meaning. Carry the setup hash fix into an ordinary candidate commit with the release metadata and immutable predecessor snapshots.
3. Regenerate the source lock last. Check the release record, first-party rer configuration and entire build shard. Confirm main and the candidate commit identity before pushing the product branch.
4. Compare the exact pushed setup manifest bytes with the declaration, wait for Verify on the pushed SHA, and return this packet through the evidence ref.

## Source and candidate

- The current published release is Lamp v1.11.22, published 2026-11-17T09:20:51Z. Its tag commit is `4c90e6c8f35775e2a0287ab24ccba87d7a8d8485`. The proposed v1.11.23 tag was absent, and the release lookup for v1.11.23 returned HTTP 404.
- Fresh main was `fd6695e358e5aa67c47c45f05591f2c33e83a930`. Its Verify run 44291956536 and Run site run 44291956510 completed successfully on that SHA. The pre-push main ref still pointed to this parent.
- The earlier branch advertised `70404ae45742014f3e465ec395bb00ca4c633309`, whose Verify 44293073651 was recorded as successful in its evidence. I read the report and draft on evidence head `f996253b687a4072b642d29f50f57f0255b66858`. I replayed the descriptor change in the same non-merge commit as the metadata to publish the release metadata and hash correction together.
- The product branch is `cloud/sd-lamp-release-1-11-23-c1`. First push `1046bf036cfc16e189d873075f208fc017ece67e` failed Verify 44306142905. I generated the source lock before Git tracked the two new snapshots, so CI rejected the lock. I reproduced the failure on the committed checkout, regenerated the lock with both paths tracked, and committed only the eight added lock lines in follow-up `a840e307fb68d0d248ae863ff10d8e94600ea5b0`. The history remains linear. The fleet retains landing and release custody.

## Release and upgrade

The notes cover invitation roles, first-run and branding, incident previews and corrections, notification configuration, maintenance and delivery history, Sorry field review and private templates, migration health, verified removal, connections and retained public snapshots. The published manifest mismatch caused Business approval to report that Lamp could not be installed. The exact candidate bytes match the corrected declaration in `HASH-RECEIPT.txt`. The pinned rer version is 0.2.121.

The predecessor tag lacks the two version-named entries. As specified in `release-history/README.md` and used by `scripts/release-metadata.mjs`, the snapshots are the exact root `RELEASE.json` and `CONTRACT.md` bytes from the published tag. Both candidate blobs match their tagged counterparts. The package lock in use, `pnpm-lock.yaml`, has no Lamp version field. This checkout has no `package-lock.json` or `RELEASE.md`.

Back up data and owner source, and exercise a restored copy. Update the checkout to v1.11.23 when released, install frozen dependencies, and deploy with the same environment and input file. The two migrations apply in this order:

1. `0082_repeated_maintenance_cancellation.sql` preserves maintenance and notice history and permits a second cancellation after reinstatement.
2. `0083_sorry_template_metadata.sql` preserves private source wording and scope for imported templates. Review status, audience and affected services before publishing an update using one.

There are 80 core SQL files on the tag and 82 on main and the candidate. The highest ordinals are 0081 and 0083 respectively because the sequence skips 0051. Every previously published migration retains its exact bytes. Keep the backup, original deploy checkout and ownership records, intended mail configuration and private installation key. Verify sign-in, first-run, Settings, publication, maintenance and configured notifications after updating. The changelog and machine-readable release record carry the full upgrade instructions.

## Contract and checks

| Source | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| v1.11.22 | 60 | 129 | 55 | 244 |
| Fresh main | 63 | 126 | 55 | 244 |
| Candidate | 63 | 126 | 55 | 244 |

Main had already moved UPDATE-011, SUB-009 and INTAKE-014 from partial to done. The release record carries the published MOVE-001 wording delta already on main. The candidate does not edit current contract clauses and makes no clause claims. Its snapshot of the predecessor is for release validation.

The release validator, first-party rer check, all nine build shard steps and standalone rer build passed. The full branch Verify result is recorded in `CI-RECEIPT.txt`. The fleet runs the publication scan at landing. Hosted platform approval and the release producer's tag gate remain downstream proof.

Candidate Verify 44307549822 returned in_progress/pending on a840e307fb68d0d248ae863ff10d8e94600ea5b0. https://github.com/just-every/run-lamp/actions/runs/44307549822
