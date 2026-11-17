# Lamp 1.11.21 metadata candidate

Author: Run Edit Run fleet. Date: 2026-11-17 UTC.

Product repository: just-every/run-lamp. Branch: cloud/sd-lamp-release-1-11-21.
Product head: 4d0675dbe51e2a86f69a8112b153baaf3fd91094.
Base: 7c17a3201ef326a841d91fb4dc26c035a5b1c60a.
PR: https://github.com/just-every/run-lamp/pull/399.

The candidate prepares version 1.11.21 and folds the unpublished 1.11.20 section into its notes. The last published predecessor remains 1.11.19, whose immutable tag resolves to 761f3d186e8fa73ea9aa8b61bcf9ebe8013384f6. The initial Git tag probe and GitHub releases response found no 1.11.21 collision, no 1.11.20 publication and v1.11.19 as the latest Release. No tag or Release was created or moved in this task.

The notes lead with the fresh installation completing in one rer deploy command, explain resumed migration application and its ledger check, then describe public deployment choices, naming copies with --environment, the custom-prefix owner-claim restriction, email-off wording and sign-in guidance. They retain the existing guide-to-the-checkout-pin explanation and report rer 0.2.121. The real sign-in domain change since v1.11.19 corrects test assertions to compare the exact domain field; it changes no product behavior. Per the brief's exclusion of test-only buyer notes, the candidate does not claim that assertion correction is a new sign-in product fix.

Before / after:

| Item | Before | After |
| --- | --- | --- |
| Existing release metadata | 1.11.20, unpublished | 1.11.21 candidate |
| Previous published version | 1.11.19 | 1.11.19 |
| rer package and lock pin | 0.2.121 | 0.2.121 |
| Core migration inventory | 80 files | 80 files |
| New migrations since v1.11.19 | 0 | 0 |
| Clauses done / partial / missing | 60 / 129 / 55 | 60 / 129 / 55 |
| Total clauses | 244 | 244 |
| Tests added / removed by this round | 0 / 0 | 0 / 0 |
| Source lock file identities | 2296 | 2296 |
| Registered tests plus assertion scripts | 101 + 10 = 111 | 101 + 10 = 111 |

Six product files change: package.json, seed.json, RELEASE.json, CHANGELOG.md, the VPAT product-version line and sources.lock.json. Five source-lock hashes change, matching the five metadata files. The patch is 19 insertions and 15 deletions. The pnpm lock has no root product-version entry to bump and remains byte-for-byte unchanged. RELEASE.md and package-lock.json do not exist in fresh main; the task changes existing references only and does not create them.

The entire changelog from 1.11.19 onward is preserved exactly. Backup of data and owner source before updating, frozen dependency installation, deployment with the same environment/input file, restored-copy rehearsal, sign-in/first-run/Settings/incident/maintenance checks, enabled-versus-disabled mail choices, deployment ownership records, account credentials and INSTALLATION_KEY custody remain in the upgrade guidance. All retained release-history JSON and contract snapshots remain unchanged. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md, application source, README and homepage remain unchanged. There are no contract clause status changes or claims.

The plan in PLAN.md was executed: configure and refresh fleet Git, shallow blobless clone only the declared repository, inspect fresh main and the actual six-commit published-tag diff, check release availability, update only existing metadata, install frozen dependencies, restore the fleet forwarding hooks, fetch and rebase onto fresh main before publication, regenerate the source lock last, run touched checks, commit with explicit fleet identities, inspect all candidate authors/committers/messages/trailers, and push the named branch with the supplied guard. The branch has one linear commit over the inspected main, no skip-CI marker and no merge commits. The push succeeded on its first attempt. No Base refresh, provider deployment, local full verifier, browser journey or test change was needed for this metadata round.

Local results: frozen dependency install passed; release schema/history/migration/contract inventory validation passed; supported source lock regeneration and check passed; generated contract document check passed with zero errors and warnings; typecheck passed; git diff whitespace check passed. The supplied cloud toolchain retained installed Node 24.19.0 with pnpm 10.12.4; pnpm emitted the exact-engine warning for the repository's Node 22.20.0 pin. CI uses the repository pin. The rer pin was verified against both pnpm importer specifier and resolved version. The CHANGELOG section equals publicReleaseNotes exactly, generated views and pnpm lock are unchanged, and the migration diff is empty. Actual output and structured receipts are included in this packet.

GitHub API custody uses one watcher, no workflow dispatch or rerun, and at least 300 seconds between observations of a run. Push Verify run: https://github.com/just-every/run-lamp/actions/runs/44005467148, exact product SHA 4d0675dbe51e2a86f69a8112b153baaf3fd91094. The run completed with failure, observed at 2026-11-17T03:02:51Z. Plan, build and seven of eight test shards passed. The composer shard (job 133780118818) failed its catalogue journey in tests/e2e/public-contract.test.mjs:303. The actual error is `locator.click: Timeout 30000ms exceeded`, waiting for `getByRole('button', { name: 'History', exact: true })` at tests/e2e/helpers/component-read-flow.mjs:80:70. Aggregate job 133784904824 correctly reported that not all shards succeeded (8/9 shared-build-and-test records succeeded). This is a browser-flow failure, not the generated-contract-view exception. The relevant helper and registering test are unchanged from both v1.11.19 and main; this observation does not establish whether the failure is intermittent. No product, test or CI change is authorized in this metadata-only lease, and no assertion was weakened, skipped or removed.

Ten GitHub operations were used: release collision inventory, exact-SHA run discovery, existing-PR discovery, PR #399 creation, three run observations at least 300 seconds apart, one completed-run jobs query, and one log-archive read for each failed job. Both required log reads succeeded. Full relevant logs are retained in ci-composer-log.txt and ci-aggregate-log.txt, with workflow environment blocks omitted; no private gate material or environment dump is in the selected packet. No blocked blob download retry, workflow dispatch or rerun was attempted.

Terminal status: BLOCKED pending successful exact-SHA Verify. The metadata candidate is fully pushed and reviewable; there is no push rejection and no unpushed product work. The fleet needs to resolve or adjudicate the component History journey before this candidate can be called READY. No follow-up fix was added to this release metadata branch.

Publication scanning is unavailable in this cloud by the task's stated adaptation. The existing Mac fleet owns the complete publication scan, landing, exact-main gates, immutable tag and GitHub Release publication. This is a metadata candidate, not a released version or hosted/provider proof. Evidence is published separately to evidence/sd-lamp-release-1-11-21; it never signals product readiness or landing. The packet is outside the product tree. After evidence and product custody are verified, the disposable clone will be removed as instructed, leaving this packet and remote refs.
