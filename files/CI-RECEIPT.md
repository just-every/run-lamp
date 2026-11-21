# Lamp branch Verify receipt

- Workflow: Verify, push event, run 44901028807.
- Exact candidate: 68d0a2f086c58c21ca8aae71615cc4461c73c94e.
- GitHub conclusion: completed with failure.
- Plan job 136836755195 passed. Build job 136836788132 failed at the first contract document check. The build receipt upload failed because the check stopped the build before a completion file was created. Job 136836859674 skipped the dependent shards. Required aggregation job 136836858331 failed downstream.
- On the exact candidate, the local build shard also exited 1 on the checked-in ACCEPTANCE.md. Running the seed's documented generator before checking produced current views. Main's copies remain in the product commit for the guarded lander to generate and verify.
- Branch provenance and independent landing status are separate. The full-history publication scan, resulting main SHA, and candidate Run site remain for the lander.

## Build job archive

```text
gh run view 44901028807 --repo just-every/run-lamp --job 136836788132 --log-failed (exit 0)
build	Build the production Worker once	2026-11-21T11:51:15.8812286Z ACCEPTANCE.md: generated content differs; run contract-docs write.
build	Build the production Worker once	2026-11-21T11:51:15.9001804Z Error: Command failed: /opt/hostedtoolcache/node/22.20.0/x64/bin/node src/base/contract-docs.mjs check
build	Build the production Worker once	2026-11-21T11:51:15.9218678Z  ELIFECYCLE  Command failed with exit code 1.
build	Build the production Worker once	2026-11-21T11:51:15.9350082Z ##[error]Process completed with exit code 1.
build	Retain commit-bound build completion	2026-11-21T11:51:16.0841320Z ##[error]No files were found with the provided path: /home/runner/work/_temp/lamp-verification/ci-shards/build.json. No artifacts will be uploaded.
```

## Required aggregation job archive

```text
gh run view 44901028807 --repo just-every/run-lamp --job 136836858331 --log-failed (exit 0)
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:23.8941579Z   SHARDS_RESULT: skipped
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0617252Z build: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0617576Z ownership: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0617892Z portability: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0618231Z imports: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0618538Z composer: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0618851Z public-pages: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0619161Z delivery: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0619514Z public: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0620281Z runtime: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0620616Z demo: missing shard artifact
verify	Require every planned command to succeed on this commit	2026-11-21T11:51:24.0679732Z ##[error]Process completed with exit code 1.
```

The aggregation job reported skipped shards and missing artifacts. The generated ACCEPTANCE.md check is the only independent Verify failure. This is the declared generated-view exception for the product handoff.
