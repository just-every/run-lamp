# Lamp 1.11.17 release metadata candidate

Author: Run Edit Run fleet. Report date: 2026-11-15 (UTC).

## Outcome and custody

Repository: just-every/run-lamp. Branch: cloud/sd-lamp-release-1-11-17.
Candidate: `b5b5628a247ba2289aeb9af16cab04a998e823ce`. Base: `9b4ec5e7f84715ef4cbed54c8a51ece72c6303ea`.
PR: https://github.com/just-every/run-lamp/pull/388.
The product branch was published by the fleet push guard on its first attempt.
The exact candidate Verify run 43687023390 completed successfully on this SHA, observed at 2026-11-15T07:07:40Z. Its URL is https://github.com/just-every/run-lamp/actions/runs/43687023390. Final CI custody is recorded in final-receipt.json.
This round prepares release metadata only. It does not tag, sign, deploy, land or publish a release.

## Plan and implementation

The full pre-edit plan is in PLAN.md. The completed steps are:

1. Confirm main and the release boundary: main `9b4ec5e7f84715ef4cbed54c8a51ece72c6303ea` has successful exact-SHA Verify 43685623590 and Run site 43685623713. Tag v1.11.17 was absent. v1.11.16 is annotated tag `de6a8948cf2e12e3efb876066caa1a334bfd2599`, resolving to `429a46081ce68bab2dbdae46b8402b8ccce3ee2a`.
2. Inspect the actual 11-commit difference from v1.11.16 to main. CONTRACT.md is byte-identical across that boundary, so the new release has no contractChanges. The older two-migration paragraph in the brief is superseded by the explicit updated v1.11.16 boundary: 0079, 0080 and SETUP-002 remain exclusively in that release's immutable record. The current main had appended 0081 to its still-1.11.16 working metadata; it now belongs exclusively to the new 1.11.17 release record.
3. Update package.json and seed.json to 1.11.17; update only the existing Product version field in docs/accessibility/vpat.md. No new accessibility evaluation is claimed. There is no package-lock.json in this repository; pnpm-lock.yaml and the published rer 0.2.108 pin are unchanged. README.md and docs/install.md already use evergreen release guidance, so they remain unchanged.
4. Preserve the exact v1.11.16 RELEASE.json and CONTRACT.md as release-history/1.11.16.json and release-history/1.11.16.CONTRACT.md. Both match tagged bytes; their SHA-256 receipts are in metadata-integrity.json. Existing history records and the older changelog sections remain unchanged.
5. Prepend the 1.11.17 CHANGELOG section and make RELEASE.json publicReleaseNotes identical to it. The notes cover paged public history and feeds, scheduled-work repair, subscriber CSV component names and refusal reasons, Sorry scope and source-backed resolution, readable live audit subjects with anonymous erasure, optional native public Worker naming and its refusals, and deployment-guide attribution rendering. They contain no internal check names or contract IDs.
6. Set previousVersion to 1.11.16, date to 2026-11-15, contractChanges to empty and migrations to only 0081_scheduled_work_indexes.sql. Backup-first buyer and agent steps explain that deployment applies it after 0080 before the updated Worker starts. The description includes derived reminder work, triggers, subscriber counts, restoration initialization and indexes; it does not describe the migration as indexes alone. Existing source records and reminder history remain authoritative.
7. Fetch and rebase main before the first push. Main remained at the green base and there were no conflicts. The autostash used fleet identity. Run the affected metadata checks and typecheck, then regenerate the source lock last using AGENTS.md's command and check it. Commit using fleet author and committer identity with the cleanup hook active; inspect every origin/main..HEAD candidate identity and trailer before the guarded push.
8. Open PR #388 under the repository contribution rules. Keep the product tree free of fleet reports. Monitor exact-SHA CI within the 300-second cadence and ten-call GitHub budget, then publish only explicitly selected actual non-secret packet files to the separate evidence branch. Leave all publication scans, landing and immutable release publication to the fleet's existing owners.

## Changed metadata paths

- package.json
- seed.json
- docs/accessibility/vpat.md
- CHANGELOG.md
- RELEASE.json
- release-history/1.11.16.json
- release-history/1.11.16.CONTRACT.md
- sources.lock.json (generated last)

No product source, migration SQL, tests, homepage, contract source, contract judgments or generated acceptance/claim views changed.

## Counts and clause status

Version: 1.11.16 → 1.11.17. previousVersion: 1.11.15 → 1.11.16.
Retained release records: 30 → 31, with the new record copied exactly from the published tag.
Working RELEASE.json migration entries: 3 → 1, by assigning only 0081 to this release and preserving the tagged previous two in history. New SQL files in this candidate: 0. The main and candidate migration inventory remains 80 SQL files; v1.11.16 has 79, making this release delta one migration.
Contract clauses: 244 → 244. Done: 60 → 60; partial: 129 → 129; missing: 55 → 55.
Clause status changes: none. New contractChanges entries: zero; SETUP-002 stays once in retained 1.11.16, without duplication in 1.11.17.
New tests: 0. Changed, deleted or skipped tests: 0. No local full suite or browser journey was run for this metadata-only change, as instructed.

## Validation

Frozen dependencies installed successfully. The supplied cloud shim initially selected Node 24.19.0; the checks were repeated successfully with the repository's exact Node 22.20.0 and pnpm 10.12.4.

- pnpm run validate:release: PASS (standalone schema, complete release chain, clause meanings, migration inventory and vendor catalog).
- node src/base/contract-docs.mjs check: PASS, 0 errors and 0 warnings; no generated views changed.
- pnpm run typecheck: PASS.
- node scripts/edition-authoring/cli.mjs lock: PASS; executed after all metadata edits were staged.
- node scripts/edition-authoring/cli.mjs check: PASS.
- git diff --cached --check: PASS.
- Tagged release and contract history byte identity, matching public notes, predecessor and migration ownership, unchanged contract/views and dependency pin: PASS.
- Candidate author and committer: Run Edit Run fleet <fleet@runeditrun.com>; all candidate trailers absent. Guarded push: PASS, one attempt.

Actual command outputs, integrity hashes, API records and metadata patch accompany this report. The full-history publication scan remains with the guarded Mac lander; this cloud did not invoke it. No release tag or GitHub Release was created.

## Remaining custody

The candidate's exact-SHA Verify is completed/success. Seven GitHub API calls were used, with CI reads more than 300 seconds apart and one watcher. The run took longer than the brief's ten-minute target; no workflow was changed or rerun. No blocker remains. The actual packet is published separately to refs/heads/evidence/sd-lamp-release-1-11-17, and the terminal EVIDENCE line names its exact custody head. Scratch clone and dependency removal follows successful evidence publication. The lander owns admission and landing; producer/tag and publication follow their separate release rules. A metadata candidate is not a published release.

READY branch=cloud/sd-lamp-release-1-11-17 head=b5b5628a247ba2289aeb9af16cab04a998e823ce
