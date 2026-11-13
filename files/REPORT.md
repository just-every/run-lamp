# Lamp 1.11.15 release metadata candidate

UTC report prepared: 2026-11-13T20:17:42.500383+00:00
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-release-1-11-15
Product head: 5dd84e13f6b0478edc2fc5e759d513f5eccf6d57
Base main: 8d980ecc58b7a683b942293033d42ed254af6ffb
PR: https://github.com/just-every/run-lamp/pull/360

## Plan and outcome

The complete pre-edit plan is in PLAN.md. Its sequence was to establish green main and an unused version, inspect the previous immutable release and actual product diff, prepare only release metadata and existing version references, validate affected metadata and typecheck, refresh main and the source lock, push one candidate through the fleet guard, leave a PR, observe exact-SHA Verify, publish this separate evidence packet and remove the scratch checkout after successful custody checks.

Main was confirmed at the brief's observed SHA. Both cited Verify 43493820644 and Run site 43497101381 were completed/success on that exact SHA; an additional main Verify 43497101467 was also successful. v1.11.15 was absent from remote tags and main carried 1.11.14. The open-PR listing and remote release branches revealed no active 1.11.15 peer. No duplicate release candidate was made.

The actual immutable v1.11.14 commit is 733e2ce1e2fc618183a93632218bb86456a06a79, tag object 3e87ad222ce54d7a783286d75e5f322c859d8022. Main contains 10 commits since that tag. Notes describe only their actual product changes: configured public subscription channels and Teams Workflows guidance; reopening from the last public component state; readable availability report download names; subscriber component names and honest local CSV invitation feedback; managed relay sender authentication status; built version in Settings and health, with version 1 schema observations.

Version changes from 1.11.14 to 1.11.15 in package.json, seed.json and RELEASE.json. CHANGELOG.md and RELEASE.json publicReleaseNotes match exactly. README.md, docs/install.md and the existing release reference in RUN-LOCALLY.md now direct readers to published releases without asserting a soon-stale latest number. docs/accessibility/vpat.md updates the existing product version and adds an edition note without changing its evaluation date, scope, conformance statements or limitations. Exact v1.11.14 RELEASE.json and CONTRACT.md bytes are retained under release-history/ as required by the existing release validator.

The checkout uses pnpm-lock.yaml and has no package-lock.json. No dependencies or package manager pins changed: rer remains 0.2.108 and the existing pnpm lock is unchanged. No migrations changed between the release tag and main: 77 before and 77 after, ending at 0078_vendor_dependencies.sql. RELEASE.json migrations remains empty. Pending business-settings migrations 0079–0081 are absent and excluded.

## Validation and custody

Frozen dependency installation succeeded. Affected release schema, retained release-chain and migration/contract inventories validate; the vendor catalog checked 20 sources and 162 native state cases. Typecheck passed. Contract document check reports 0 errors and 0 warnings and current generated documents. Diff whitespace and exact public-note matching checks passed. Source lock was regenerated last, after staging retained history so the new files were included, and its integrity check passed. Actual outputs are included with this packet.

The supplied toolchain selected installed Node 24.19.0 and pinned pnpm 10.12.4; pnpm warned about the repository's exact Node 22.20.0 engine. Typecheck still exited successfully. Branch CI uses the repository's exact Node pin. No full local suite, behavior tests or browser journeys were run for this metadata-only brief.

The final pre-push fetch retained the same main SHA; fleet-identity rebase with autostash completed without conflicts before publication. The candidate has one product commit with both author and committer Run Edit Run fleet <fleet@runeditrun.com>, and no trailers. The complete origin/main..HEAD traversal including side parents passed identity/trailer inspection. The fleet guard pushed once, on its first attempt, only to the named cloud branch. PR #360 targets main and remains for the lane. There was no force push, main write, tag, signing, release publication or workflow dispatch. The full-history publication scan and guarded landing remain with the Mac lander.

Exact-head push Verify: 43499858441, https://github.com/just-every/run-lamp/actions/runs/43499858441.
Exact-head PR Verify also discovered: 43499912385, https://github.com/just-every/run-lamp/actions/runs/43499912385.
CI conclusion: completed/success for both push Verify 43499858441 and PR Verify 43499912385, both on exact head 5dd84e13f6b0478edc2fc5e759d513f5eccf6d57. The final push observation was 2026-11-13T20:30:59Z and PR observation was 2026-11-13T20:31:11Z. Eight task GitHub CLI/API calls were used, with one watcher polling no sooner than 300 seconds after discovery or its previous observation. No workflow was re-dispatched or re-run.

## Counts and scope

Clause status counts are unchanged: 60 done, 129 partial, 55 missing, total 244, before and after. No clause Status, Gap, Evidence or guarantee changed. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain byte-for-byte equal to base main. There are no target clause claims or promotions in this round.

The existing registration inventory remains 91 cases plus 10 assertion scripts, total 101 checks, before and after. Tests added: 0; removed: 0; changed: 0. Product source, homepage and workflows are untouched. Eleven changed metadata paths are listed in RECEIPT.json; two are immutable release-history copies. The candidate diff is included as metadata.diff, excluding the already-public contract snapshot body.

## Remaining custody

This is a metadata candidate, with release production/signing/publication still owned by the fleet. A tag alone would remain release-pending. This round makes no RELEASED or product acceptance claim. No blockers remain for this metadata candidate. Both exact-head Verify runs succeeded, so the pushed SHA is READY for guarded fleet review and landing. This is not a release publication or product acceptance claim.

All evidence lives outside the product checkout and is published solely to refs/heads/evidence/sd-lamp-release-1-11-15 using cloud_evidence.py. Evidence transfer is separate from product readiness. The packet includes the full plan, metadata and migration inventories, local outputs, identity, push, PR and CI receipts. The scratch clone and dependencies are removed only after successful product and evidence custody verification.

Final UTC candidate report: 2026-11-13T20:31:43.707852+00:00
