# sd-lamp-import-sorry-3-c1 results

BLOCKED: exact-SHA Verify 44197129871 failed in the imports shard with a real HTTP 409/200 reconciliation assertion. The correction itself passes the full local build list and the CI build; repairing this new blocker requires product/test work excluded by the lease.

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-import-sorry-3-c1.

## Scope and plan

The full executed plan is PLAN.md. Confirm the original candidate, rebase its three ordinary commits onto fresh main, regenerate the native contract documents, execute the nine ordered build commands, regenerate the source lock last, publish the named branch with fleet identity, and obtain successful exact-SHA Verify before READY. Save and transport the report packet separately.

The specific correction brief expressly requires the generated view to be committed and a successful Verify; its instruction supersedes the generic generated-view restoration/exception language. Historical report files under original/ retain the previous round's actual statements as history, including its incorrect READY interpretation. This report does not adopt that interpretation.

## Source results

Original candidate 8b94d56ba4cd6a2e727a182adac6af6f19b147e3 was confirmed by Git. Initial main was 96794ba126e1cf93642760b65a92a02541221045. A freshness probe found 2490c9fefe5e3bee30d2d1a49441d90a4ebe6ca3 (Hono 4.13.11 update); the three original commits were rebased onto that main before this branch was first pushed. No conflict or merge commit occurred. The original published branch was unchanged. Frozen dependencies were updated and the fleet hooks reinstalled.

The native command node src/base/contract-docs.mjs write changed only ACCEPTANCE.md (five generated lines), carrying the existing MOVE-001 template count wording and MOVE-014 Sorry template wording into the view. CONTRACT.md stayed byte-identical to the original Sorry candidate, and its complete Status section stayed byte-identical to main. docs/CLAIMS.md was already current. No status, gap or evidence was edited. The source lock was regenerated last and changed only the ACCEPTANCE.md SHA-256 entry. No additional product source, test, migration, release, version, changelog or rer-pin change was needed for this correction. Existing RELEASE.json passed validation.

## Counts and validation

Correction before/after: contract documents needing regeneration 1 -> 0; build commands green 8/9 -> 9/9 after refreshing the view's lock entry; status counts 60 done / 129 partial / 55 missing / 244 total -> unchanged; registered checks 122 (112 cases plus 10 assertion scripts) -> unchanged. The complete candidate plan has eight test shards plus the shared build, nine completion records total.

The initial local build pass found the source lock stale after generating ACCEPTANCE.md; that real failure remains in build-receipt.json and build-source-check.log. All other initial steps passed. After rebasing and locking, final-build-receipt.json records the entire ordered list rerun against the final source tree. Local toolchain was Node v24.19.0 with pnpm 10.12.4 under the supplied cloud toolchain script; CI uses the repository's Node pin. Setup completed through cloud_run with fleet as owner; private setup output is excluded.

No user interface or product logic was changed in this correction. The previous round's actual synthetic capture, HTTP, browser, regression and CI receipts, and eight screenshots at 1440/390, were retrieved from its public report-only ref and verified against its manifest hashes. Those are retained under original/ with their original candidate provenance, not presented as newly executed browser proof. Inherited original counts: 0 -> 2 Sorry collections, 0 -> 54 templates (27 notice + 27 update), two pages per collection, eight exact captured source files, 54 exact metadata/API reads, eight explicit HTTP 400 refusals, zero additions on identical repeat, and conditional undo retaining two edited templates while removing 52 unchanged templates. The original round added one check (121 -> 122); this correction adds none.

Independent publication scan and landing belong to the fleet Mac. This cloud neither pushes main nor lands a PR, self-submits, tags, releases or refreshes Base. Evidence publication is a separate report-only ref and never establishes product readiness.

## Original claim lines retained verbatim

CLAIM MOVE-001 PARTIAL points=1,2,3 tests=tests/e2e/sorry-documented-export.test.mjs#documented Sorry exports account for every field through preview, saved jobs and explicit refusals
CLAIM MOVE-014 PARTIAL points=1,2,3,4,5,6 tests=tests/e2e/publishing-browser.test.mjs#Sorry templates — both collections stay complete in Settings and private composers; tests/e2e/sorry-documented-export.test.mjs#documented Sorry exports account for every field through preview, saved jobs and explicit refusals
CLAIM UPDATE-009 PARTIAL points=2 tests=tests/e2e/publishing-browser.test.mjs#Sorry templates — both collections stay complete in Settings and private composers
CLAIM MOVE-002 PARTIAL points=3 tests=tests/e2e/publishing-browser.test.mjs#Sorry templates — both collections stay complete in Settings and private composers
CLAIM MOVE-003 PARTIAL points=1 tests=tests/e2e/publishing-browser.test.mjs#Sorry templates — both collections stay complete in Settings and private composers
CLAIM MOVE-004 PARTIAL points=1,2,3 tests=tests/e2e/publishing-browser.test.mjs#Sorry templates — both collections stay complete in Settings and private composers
DEFAULT MOVE-001: Owner-only review; complete supplied template chains are mandatory; historic captures may omit entire template collections.
DEFAULT MOVE-014: Collection scope never invents affected services; lifecycle, audience, service and timing choices remain private operator decisions.
DEFAULT UPDATE-009: Apply wording privately, preserving current lifecycle, component choices, channel selection and next-update promise.
DEFAULT MOVE-002: No outbound provider action or customer mail during import, review, private application or undo.
DEFAULT MOVE-003: Preserve existing names and source ownership; identical repeats add nothing.
DEFAULT MOVE-004: Preserve native edits and needed dependencies with named undo explanations.
GAP MOVE-001: No real-export verification claimed; broader clause/door coverage remains independently judged.
GAP MOVE-014: No real-export verification or independent gate claimed; all fixtures are synthetic and documentation-derived.
GAP UPDATE-009: This round proves Sorry wording application; the complete clause's other inherited template fields/doors retain their prior judgment.
GAP MOVE-002: This round proves the template flow's silence, not a new judgment on every inherited source door.
GAP MOVE-003: Identical Sorry repeats are proved; all cross-source ownership guarantees retain their existing judgment.
GAP MOVE-004: Both template kinds and their native dependencies are proved; the broader unchanged-record/other-kind obligations retain their existing partial judgment.
EVIDENCE sd-lamp-import-sorry-3: Actual build, capture, HTTP, browser, regression and CI receipts plus eight screenshots are explicitly selected in the report-only evidence publication.

## Product publication

Product head: bb0d352045ccee4a350678dc61bfcdf6e91f6f2b. Fleet commit author and committer: Run Edit Run fleet <fleet@runeditrun.com>. Four candidate commits (three replayed original commits and one correction) were inspected, including complete messages and trailers; all use fleet identity and have no coauthor trailers. The correction commit contains only ACCEPTANCE.md and sources.lock.json. The guarded push succeeded on its first attempt, and Git readback confirms the named remote branch at this exact SHA. The working tree is clean.

Exact-SHA push Verify run 44197129871 was discovered in progress at https://github.com/just-every/run-lamp/actions/runs/44197129871. No READY is inferred from that pending result. No new PR was opened by this builder, as the correction brief assigns the PR door to the lane. Original PR 415 remains historical context.

## Final CI verdict and blocker

Exact-SHA push Verify 44197129871 completed with actual conclusion failure on bb0d352045ccee4a350678dc61bfcdf6e91f6f2b. The CI build passed. All eight test shards executed: ownership, portability, composer, delivery, public, runtime and demo passed; imports failed. This is 8/9 successful product completion records (one build plus seven shards), with all 9/9 product jobs executed. The aggregate verify job failed because of that one unsuccessful shard. The original candidate had 0/9 successful completion records because generation blocked the build; this correction reaches all planned jobs but does not reach green Verify.

The imports archive was retrieved exactly once using `gh run view 44197129871 --repo just-every/run-lamp --job 134442079662 --log-failed` (exit 0). Its real failure is in `tests/e2e/helpers/postmortem-template-import-flow.mjs:102`, called from `tests/e2e/statuspage-import.test.mjs:323`: after template import and repeat, the Statuspage reconcile door returns HTTP 409 with `{"error":"import_door_conflict"}` instead of the asserted HTTP 200. The archive labels this ERR_ASSERTION / testCodeFailure. The handler deliberately maps unknown native/parser errors to that safe response, so the generic public code alone does not identify the inner cause. The complete sanitized archive and exact excerpt are ci-imports-failed.log and ci-assertion-excerpt.log.

This is not a generated-view failure and no exception is claimed. It is not evidence of a provider flake. The brief prohibits product code and test changes and permits a failed-job rerun only for provider flakes; therefore no assertion rerun or out-of-scope fix was attempted. A follow-up builder needs scope to diagnose and repair Statuspage template reconciliation while preserving existing assertions, then obtain green exact-SHA Verify. The failed aggregate is consequential, not a second independent product assertion. Its archive was also read exactly once using `gh run view 44197129871 --repo just-every/run-lamp --job 134449046617 --log-failed` (exit 0): it reports "imports: wrong shard, commit or unsuccessful completion" and "Verification: 8/9 shards completed successfully for this commit." Nine of ten allowed GitHub calls were used for original/context/PR reads, discovery, three run polls, job details and the two failed-job archives; every call for this run was separated by at least 300 seconds.

A local diagnostic of the same imports shard was started after the CI failure with system Chromium and no source/test edits. Its final status is recorded separately in imports-local-receipt.json; no pending or unobserved local result is treated as a pass. Local proof cannot override the red exact-SHA workflow.

The local diagnostic independently reproduced the same Statuspage reconcile ERR_ASSERTION (HTTP 409 import_door_conflict instead of 200). The test:imports step exited 1; no test or product edits were made. The diagnostic completed: test:imports failed with that assertion, test:mail passed, and test:site passed (four site tests, zero failures). The complete local shard command exited 1. All test-owned browsers and native runtimes closed and the cloud subreaper returned.

## Terminal product custody

BLOCKED branch=cloud/sd-lamp-import-sorry-3-c1 head=bb0d352045ccee4a350678dc61bfcdf6e91f6f2b prerequisite="Successful exact-SHA Verify"

The product branch is pushed and retained. No PR was created or found for this correction branch; the lane owns its PR/landing door. The original PR 415 remains read-only context. No product/test patch or CI rerun was made after the real assertion was identified. Complete plan, local checks, root failure and aggregate archives, local reproduction, original claim receipts and screenshots are selected for the final report-only evidence publication. The product clone is removed after the final evidence transfer and Git remote-head verification as requested; this packet remains outside the clone.
