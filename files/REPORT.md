# Lamp Statuspage template reconcile repair

Task sd-lamp-import-sorry-3-c2 for just-every/run-lamp. The executed plan is in PLAN.md. Product and evidence were published on separate refs.

## Reproduction and fix

The owner HTTP journey reproduced HTTP 409 with {"error":"import_door_conflict"} on c1 commit bb0d352045ccee4a350678dc61bfcdf6e91f6f2b. The failing assertion expected HTTP 200 from /api/operator/import/reconcile after applying reviewed Statuspage templates. Prior Verify 44197129871 showed the same 409 in imports. Eight of nine completion records passed on that prior commit.

The persisted read compares JavaScript and D1 digests under one custody fence. Sorry notice and update template targets use separate marker kinds but share the same native template and component tables. JavaScript grouped the expected rows by table alone. D1 selected only the matching marker kind for each digest, so even a Statuspage import with no update templates compared against an incorrect nonempty update-template digest. The fix groups native rows by the existing kind-and-table prefix on both sides. The marker count, native row comparison and atomic fence still participate.

The original Statuspage reconcile assertions passed without edits, including reconciliation of all three sources, repeat and preserve-conflicts undo. The Sorry API test now reconciles 27 notice and 27 update templates through the owner door. Once that fence worked, the two original Sorry tests reached the catch-up response and exposed an incorrect assumption about where conflicts are reported. Both now require an HTTP 200 preview and the exact two rejected source identities with the native-edit conflict reason in the top-level rejection list. Each test still verifies complete template readback, named undo preservation, dependency retention and silence. The initial failed runs and corrected reruns are recorded separately.

## Source and local checks

The branch retained the three original source commits on main 2490c9fefe5e3bee30d2d1a49441d90a4ebe6ca3. The c1 commit contained only the generated acceptance view and that view's lock entry. The c2 product tree uses main's whole ACCEPTANCE.md and docs/CLAIMS.md, per the current lander contract. The source lock was regenerated last and its check passed on the restored product tree. The original round's release metadata is inherited. The corrective commit changes the native digest, the two Sorry test helpers, and the regenerated lock.

The ordered local build passed all nine commands under Node 22.20.0 and pnpm 10.12.4 with regenerated views and their matching temporary lock. The final checkout's generator reports only the expected ACCEPTANCE.md difference. The Statuspage HTTP file passed 3/3, the documented Sorry export file passed 2/2, and the focused Sorry browser journey passed 1/1. The browser packet shows both Settings states and both private composers at 1440 and 390, with test assertions at 1440 and system Chromium. The tested source blob hashes match the published commit. The full local imports shard also passed at the exact published SHA through rer verify, with 13 import, five mail and four site tests. The CLI completed its hosted output hydration and D1 statement size checks.

| Measure | Before | After |
| --- | --- | --- |
| Statuspage reconcile | HTTP 409 on c1 | HTTP 200, 3 of 3 imported template targets reconcile |
| Sorry reconcile | Both collections supported by original round | HTTP 200, 27 notice and 27 update targets reconciled |
| Sorry identical repeat | 0 new templates | 0 new templates |
| Sorry conditional undo, HTTP fixture | 54 imported | 50 unchanged removed, 4 edited retained |
| Sorry conditional undo, browser fixture | 54 imported | 52 unchanged removed, 2 edited retained |
| Core contract | 60 done, 129 partial, 50 missing, 239 total | Same |
| Full contract | 60 done, 129 partial, 55 missing, 244 total | Same |
| Verification inventory | 122 checks on c1 | 122 checks on c2 |

The original round clarified MOVE-001 point 2 and the existing MOVE-014 requirement and points 1, 2 and 5. Its other claims, six partial statuses, gaps and evidence judgments carry through unchanged. The original round report and its exact return lines are included. No real export, hosted provider access, or independent acceptance was used.

## Product and CI custody

Product branch cloud/sd-lamp-import-sorry-3-c2 was pushed at 70ce322ff4376f5c210ad04010358158ff12577a. Git readback confirmed that exact ref and SHA. The candidate range contains four ordinary commits. Every commit has fleet author and committer identities and no trailers. The working tree was clean after publication. The first and only product push succeeded. The lane owns the PR and landing door. The existing PR #415 tracks the original round, and c2 had no PR at discovery.

Exact-SHA Verify 44207105019 completed with conclusion failure on 70ce322ff4376f5c210ad04010358158ff12577a. The build archive shows the sole root failure, `ACCEPTANCE.md: generated content differs; run contract-docs write.` The verifier stopped before creating the build receipt, so the test matrix skipped and the aggregate reported zero of nine completion records. The specified generated-view exception therefore applies to READY. The fleet lander regenerates the views and reruns Verify at landing. This candidate has nine passing local build steps and passing imports proof. Cloud CI did not run the eight test shards on this commit. Recorded 2026-11-18T00:41:46Z.

## Original round return lines

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
