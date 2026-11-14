# Lamp timezone replay

Repository: just-every/run-lamp
Branch: cloud/pr-lamp-timezone-preserve-1-rb1
Head: d0eb2b0d36f34608042fca213c6bf9b6c4e87526
Main used: 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0
PR: https://github.com/just-every/run-lamp/pull/379

## Plan and execution

1. Configure fleet identity, refresh the fleet launcher, install bundle-only Git authentication and publication hooks, and read launcher/repository instructions.
2. Clone the declared repository, install frozen dependencies, and fetch current main and the finished source branch. Verify source head a17c12a5c70a8c821f47424409a471ed2089c7ef.
3. Create the named branch from current main. Replay bd1615809f016c3d29c0889a4efe77eadc9aaef0 and a17c12a5c70a8c821f47424409a471ed2089c7ef in order with --no-commit, then create one ordinary fleet-authored commit so the contract and release metadata travel together.
4. Generate and check contract views, restore ACCEPTANCE.md and docs/CLAIMS.md from origin/main as required by fleet policy, then regenerate and check sources.lock.json last. Validate the release and run the dependency-installed TypeScript typecheck.
5. Audit the complete diff, all candidate commit identities/messages and linear history; push the named product branch once without force. Open the repository-required PR and record the exact-SHA Verify run without waiting, as this replay brief explicitly requests. Publish reports separately, preserve a verified recovery bundle and remove the product clone after publication.

## Result and scope

One non-merge commit, 9 files, 40 insertions and 23 deletions. No replay conflicts occurred. Among the touched paths, main had changed only sources.lock.json since the source patch parent; its newer hashes were retained by regeneration. Every changed file except the regenerated source lock is byte-identical to the finished source branch. No version/date/release cut, migrations, new tests, status, gap or evidence changes were made.

The setup UI preserves a valid saved timezone and recovers only an invalid zone from the browser or UTC. Page-settings updates pass the current operator to the existing audit transaction. Public timezone labels use the current daylight name. The existing onboarding expectation now retains UTC after recovery. RELEASE.json contains exactly the source SETUP-002 changed entry with change, summary, was and now; all other release fields match main.

SETUP-002 acceptance point 2 changed wording only; clause judgments did not change. Counts before → after (Done / Partial / Missing / Total): Published 42/65/0/107 → 42/65/0/107; Target and push further 18/64/55/137 → 18/64/55/137; All 60/129/55/244 → 60/129/55/244.

## Validation and limits

Passed: pnpm install --frozen-lockfile; node scripts/validate-release.mjs; pnpm run typecheck; node src/base/contract-docs.mjs write and check before restoring generated views; node scripts/edition-authoring/cli.mjs lock and check; diff scope/source-equivalence/release-field audit; git diff --check; fleet identity and trailer audit. Toolchain was Node v24.19.0 and pinned pnpm 10.12.4; pnpm emitted the documented Node 22.20.0 engine warning but typecheck succeeded.

After restoring main's generated views, contract check reports only ACCEPTANCE.md differs, as expected by the fleet landing policy. The lander must regenerate it; neither view was committed. This replay task requested the release validator and typecheck in a dependency-installed clone; no new browser tests or fresh browser proof were added, and the full verifier was not run locally.

Product push succeeded on its first attempt and its remote head was independently checked. PR #379 is open for the lane. Exact-SHA Verify run 43609895492 was in progress at discovery, with no conclusion. The specific replay brief says not to wait for Verify; no CI-green claim is made. There are no known replay blockers. CI completion, publication scan and landing remain the fleet's work.

Actual command outputs and structured provenance are retained with this report. Product custody and evidence publication are separate. A verified recovery bundle outside the product clone is retained at /home/agent/rer-consolidation/work/pr-lamp-timezone-preserve-1-rb1/product-recovery.bundle (SHA-256 32f85471404d0aa3239032b8b19c6d4792f0eaf77a0f4a24f9731b6f1fc4c337).
