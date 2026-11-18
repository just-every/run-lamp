# Lamp v1.11.23 same-SHA handoff

Published `refs/heads/cloud/sd-lamp-release-1-11-23-c2` at `a840e307fb68d0d248ae863ff10d8e94600ea5b0`, the exact head advertised by `refs/heads/cloud/sd-lamp-release-1-11-23-c1`. Both exact-SHA Verify runs completed successfully.

## Plan and execution

1. Read the remote source and destination refs, confirm the leased SHA, and fetch that commit into a dedicated clone.
2. Review every candidate commit and check the release metadata, contract-document consistency, source lock, source copies and setup digest. Compare the two predecessor snapshots with the published v1.11.22 tag.
3. Publish the leased SHA to the c2 ref through the fleet push guard and read it back. The c2 round created zero product commits and changed zero product files. Both candidate commits passed the author, committer and trailer check. No pull request was opened.
4. Discover Verify runs for the exact SHA and poll the c2 run. Keep the handoff report and check receipts in the separate evidence ref.

## Release and checks

The candidate moves Lamp from 1.11.22 to 1.11.23. Its two release-history files match the published v1.11.22 tag byte for byte. The contract-document check, edition source-lock check, offline source-copy check, release metadata validator and Git whitespace check all passed. The supplemental full local verifier was stopped after both exact-SHA GitHub Verify runs passed.

| Setup check on the published SHA | SHA-256 |
| --- | --- |
| `sha256sum rer-setup.json` | `d2c56bbcab4b784cf9012fb7e25f0732ef0f32ee6e9c404c28505b81a9fbbbab` |
| `rer-project.json` declared `setup.sha256` | `d2c56bbcab4b784cf9012fb7e25f0732ef0f32ee6e9c404c28505b81a9fbbbab` |

## Verify

- cloud/sd-lamp-release-1-11-23-c1 Verify 44307549822 returned completed/success. https://github.com/just-every/run-lamp/actions/runs/44307549822
- cloud/sd-lamp-release-1-11-23-c2 Verify 44312867398 returned completed/success. https://github.com/just-every/run-lamp/actions/runs/44312867398

## Contract

Full target before and after was 63 done, 126 partial and 55 missing across 244 clauses. No clause status changed. No contract clause claimed; this is release metadata.
