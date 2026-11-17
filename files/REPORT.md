# Lamp installed-health ledger follow-up

Run Edit Run fleet, 2026-11-17 UTC. Task: sd-lamp-health-ledger-1.
Repository: just-every/run-lamp. Branch: cloud/sd-lamp-health-ledger-1.

No contract clause claimed; this is the installed-health ledger follow-up.

## Cause established first

The native path is `scripts/installer/deploy.mjs:16` (rer's hook launches
`deploy:cloudflare`) → `scripts/deploy.mjs:69` (runs `setup:cloudflare`) →
`scripts/setup.mjs` (Wrangler core migration apply and resume loop).
On the starting main e569004dcd02b3453a9dbf1c8cbdaccb5d4f5528,
`scripts/setup.mjs:83-84` applied with `wrangler d1 migrations apply` and read
`coreLedgerQuery`; `scripts/setup-migrations.mjs:4` named `d1_migrations`.
Neither created nor populated `rer_migrations`.
`src/core/features/health/schema-observation.ts:28-32` instead checks and reads
`rer_migrations(name,sha256)` in DB. Thus native first deploy could truthfully
report successful setup and unavailable/ledger_missing at the same time.

The pinned rer deploy-kit also uses `d1_migrations`
(`node_modules/@runeditrun/rer/modules/deploy-kit/migration-ledger.mjs:3-6`);
it does not populate this observation ledger in Lamp's native pipeline.
The distinct RER Managed path has a Platform-owned `rer_migrations` with
prefixed delivery names and an installation initializer
(`scripts/platform-ledger.mjs:6-18`). That does not run during native setup.

## Decisions, in the brief's order

1. Maintain the native ledger in setup, the shared real-deploy path. After each
   apply pass, read confirmed filenames from D1 and write their exact file-byte
   SHA-256 values. Create exactly `name TEXT PRIMARY KEY, sha256 TEXT NOT NULL`;
   use INSERT OR IGNORE keyed by name. On a nonzero apply return, read and record
   any earlier committed files before surfacing the failure. Health stays read-only.
2. Backfill on every setup/deploy from the applied name set intersected with
   shipped files. Existing applied installs with a missing, empty or incomplete
   observation ledger converge on the next successful run. Never add unapplied
   names or Platform partial identities. Recorded hashes remain immutable.
3. Retain the installed-health v1 observer and deterministic ordinal-name digest.
   The current main has **80 core SQL files**, not the historical 81 in the brief.
   Full observed inventory is 80 complete files, 0 partial rows, SHA-256
   `1621631d8de89a7285c07b0240051a7ec7693cbed26cc3e6c88c460c9b7d6a8f`.
   The tests independently hash file bytes and recompute the UTF-8 JSON pair-array
   digest; no literal count/hash pin is asserted.

## Implementation and compatibility

- `scripts/setup-migrations.mjs`: strict successful ledger-response parsing and
  native observation ledger SQL from D1-confirmed files.
- `scripts/setup.mjs:83-95`: retain partial-apply failure, read confirmed D1 state,
  maintain/backfill the ledger, then continue the existing bounded resume policy
  or surface the failure. Page settings still require the complete core schema.
- `scripts/platform-ledger.mjs` and `scripts/import.mjs`: distinguish native
  two-column health inventory alongside Wrangler history from the managed ledger.
  This narrow compatibility change is necessary: otherwise adding the table
  would make native archive export/restore incorrectly demand managed prefixed
  migration authority. Ledger data stays excluded from owner archives.
- Existing setup-resume integration and health proof helpers are extended.
  Fake Wrangler sends actual SQL through the repository's fake Cloudflare HTTP
  edge into real local D1. The emitted production Worker observes that same D1
  through its ordinary /health route. No application code is mocked.
- Existing technical backup/restore journey also covers a native observation
  ledger: export excludes it and restore preserves the owner SQL data/behavior.
- One short owner paragraph in docs/deploy.md and OPERATIONS.md; lock regenerated
  last. No migration history, release metadata, pins, resource names, contract
  statuses or generated view changes.

## Plan and evidence

The complete execution plan is PLAN.md. Actual command outcomes, timestamps,
source identity and packet file hashes will be recorded in RECEIPT.json.
TAP/log files retain the real touched-check output. The completed task does not
claim live Cloudflare/provider proof: deploy provisioning/apply behavior is
exercised against the fake edge and real local D1, and /health is the emitted
production Worker's public door. No production account was used.

## Before/after counts and clauses

- Shipped core migration files: 80 → 80.
- Fresh native observation ledger: missing/unavailable, completeCount null →
  available, completeCount 80, partialCount 0.
- Interrupted apply: 0/80, 65/80 (five-pass budget), 56/80 (nonzero return) record
  exactly the confirmed subset; retry reaches 80/80. No page settings on failure.
- Touched test registrations: setup-resume 1 → 1; snapshot/health file 2 → 2;
  technical archive file 1 → 1. Total touched registrations 4 → 4.
- Contract summary unchanged: 60 done, 129 partial, 55 missing, 244 total.
  Published: 42 done, 65 partial, 0 missing (107); target/push further:
  18 done, 64 partial, 55 missing (137). Clause status changes: none.

## Verification and custody

All four touched tests pass: setup/resume (1), health/snapshot (2), technical
archive (1). Typecheck, `npx -y @runeditrun/rer build`, contract-document check,
and source-lock check pass (2,298 source files). Syntax and added-text credential
shape inspection also pass. Local checks exercised the candidate content before
commit; receipt fingerprints verify those bytes match the committed candidate.

Fresh main was fetched and the unpublished candidate rebased (already up to
date); no merge or history rewrite occurred. Product commit `555a02465950e651e8daa7fb5d675950b5056596`
was pushed once through cloud-push.py on its first attempt. All candidate authors,
committers and full messages, including side parents, were inspected: one fleet
commit and no trailers. Product checkout was clean after publication.

The bundled Base publication scanner was attempted on HEAD. It returned
INCOMPLETE / scan.gitleaks-unavailable because pinned Gitleaks is not installed
in the cloud. This is not a completed scan; publication-scan.json retains the
actual report. The cloud adaptation assigns the independent publication scan
and landing to the Mac fleet. Added candidate text had no credential-shaped
findings. No main push or self-submission occurred. No full local verify ran.

Exact-SHA push Verify **44046302963 failed** on
`555a02465950e651e8daa7fb5d675950b5056596`:
https://github.com/just-every/run-lamp/actions/runs/44046302963 .
The build and seven of eight product test shards passed, including
ownership/deployment and portability. Demo/baseline job 133913319983 failed in
`tests/e2e/helpers/widget-privacy-flow.mjs:92`: after all four widget privacy
probes completed, restoring settings through PUT /api/app/page-settings returned
HTTP 500 rather than 200. Aggregate job 133922167267 then reported 8/9 planned
shards successful. This is not a contract-generator-only failure and is blocking.

Each failed job log was read once with the prescribed `gh run view ... --job ...
--log-failed` command; both archive requests succeeded. The retained sanitized
logs omit CI environment metadata and signed URL queries. CI-jobs.json records
all job/step outcomes. No further GitHub calls remain: 5 rate-spaced CI
observations, 1 jobs listing, 2 failed-job log reads, 1 PR lookup, 1 PR creation
= 10 calls. There was no dispatch, workflow rerun or empty commit.

A focused local run of the failing baseline case passed on the published
candidate (1/1, baseline-focused.log). The widget privacy flow, baseline fixture,
page-settings application code and local migration runner are unchanged from
starting main; the hosted setup ledger path is not invoked by that baseline
fixture. There is no reproducible ledger-related fix for the CI-only settings
reset failure within this lease. The local pass does not replace the failed
exact-SHA result. No speculative change to that unrelated flow was made.

Draft PR: https://github.com/just-every/run-lamp/pull/401 . Its normal PR-triggered
workflow, if created by GitHub, was not observed after the ten-call budget; no
result is claimed for it. The lane can investigate/requalify the unchanged
widget cleanup and finish required exact-SHA verification under its own gates.

**Terminal product custody: BLOCKED on Successful exact-SHA Verify.**
Branch and full SHA remain pushed as named above; no push rejection or rescue
bundle was needed. Complete plan, actual reports and receipts remain in
`$HOME/rer-consolidation/work/sd-lamp-health-ledger-1/packet/` and are returned
separately through the evidence ref. Evidence publication does not signal READY,
acceptance or landing. The pushed clone is deleted only after evidence transfer,
as the brief requests; the complete product commit remains on the remote branch.
