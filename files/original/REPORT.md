# Sorry notice and update template import

Run Edit Run fleet, 17 November 2026 UTC. Tag: sd-lamp-import-sorry-3.

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-import-sorry-3.
Candidate: 8b94d56ba4cd6a2e727a182adac6af6f19b147e3.
Base main: 96794ba126e1cf93642760b65a92a02541221045.
Initial published save: 68f0e97a5f228a7de51e8a566780f26b6f3983c6 [skip ci].

The full plan is in PLAN.md. This packet contains actual local receipts/logs and browser captures; it is published only on evidence/sd-lamp-import-sorry-3. Product custody and evidence transfer are separate. No main/default branch push, landing, deployment, Sorry write, account access, subscription activation or real-export promotion was performed.

## Changes

Authenticated local capture reads every page of both documented notice_templates and update_templates collections. Saved original responses are accepted without rewriting their bytes. Pagination validates count, current/next/previous, page size, stable total and complete chains. Missing pages, duplicate identities, wrong owning page, unknown collection-page scope and initial_comment/content disagreement refuse the input visibly. Alphanumeric template IDs and exact numeric scope lexemes are retained.

Both kinds have native template destinations and independently counted import targets. Names, complete wording, optional update subject, original creation/update timestamps and collection-page component_id scope survive through native API reads and private composers. A new additive migration 0083_sorry_template_metadata.sql adds kind/source metadata and the update-template import marker. Legacy templates keep their defaults; sealed default columns do not falsely turn old imports into owner edits.

Collection-page scope never becomes affected-service impact. Sorry supplies no lifecycle, audience, service-state, notification or next-update default. Its reusable wording fills a private draft while preserving existing operator choices, with visible review guidance. Automated vendor drafts refuse these templates. Oversized body fields and titles refuse application until shortened in Settings; immutable original wording/subject remain available after shortening. Import, private application, repeat and undo publish nothing and send no customer mail.

The existing Settings and composer layouts show kind, source subject, scope, timestamps and full original wording. Screens were proved once at 1440 and 390; the journey assertions run at 1440. No visual redesign was introduced.

MOVE-001 AP2 now explicitly counts exposed notice/update templates. MOVE-014 explicitly includes both Sorry collections and explains absent defaults, variants and scope in existing acceptance points. No acceptance points were added. Clause Status/Gap/Evidence cells and the complete Status section remain byte-identical to main. Contract docs generated and checked successfully, then ACCEPTANCE.md and docs/CLAIMS.md were restored whole from main and were not committed. The expected candidate generator check therefore differs on ACCEPTANCE.md. Source lock was regenerated after staging new files, checked, and committed last.

RELEASE.json contains the authorized MOVE-001 meaning entry update and the migration inventory entry required by validate:release. No version bump or CHANGELOG change was made. Existing release prose was retained.

Necessary supporting changes outside the narrow file list: template repository/schema/service expose and apply the missing native destinations; dependencies/service.ts refuses automatic use of templates whose source lacks defaults; import planning/service count the new target and recognize its provenance. These changes are required for the named acceptance flow and preserve unrelated behavior.

## Counts and proof

| Measure | Before | After |
| --- | ---: | ---: |
| Supported Sorry template collections | 0 | 2 |
| Templates in synthetic import | 0 | 54 (27 notice + 27 update) |
| Pages per collection at 25 rows/page | — | 2 (25 + 2) |
| Exact original files captured | — | 8 |
| Exact template metadata/API reads | — | 54 |
| Explicit HTTP refusals | — | 8, all HTTP 400 |
| Added by identical repeat | — | 0 |
| Templates after conditional undo | 54 | 2 edited retained; 52 unchanged removed |
| Status-table done judgments | 60 | 60 |
| Status-table partial judgments | 129 | 129 |
| Declared verification checks (registered cases + assertion scripts) | 121 (111 + 10) | 122 (112 + 10) |

The detailed isolated API helper additionally asserts four retained edited templates (two shortened titles and two shortened bodies), removal of fifty unchanged templates, native name conflicts and dependencies. Its status is recorded separately from the passing Vite HTTP proof; no unrun assertion is labeled a pass.

Passing evidence includes CLI capture with provider-boundary-only fake; byte-identical original files; saved-reader 54 exact records and 422 supplied field paths; eight saved-reader refusal cases; and the expanded ordinary HTTP/browser journey with exact API readback, count/repeat, source conflict preservation and named edited-template/dependency undo. Source subject/body/scope/timestamps are readable at both browser widths. Delivery and subscriber-mail lists remain unchanged, and no public incident updates are created.

The ordered build receipt contains contract docs, source copies/check, typecheck, syntax, validate:release, visual source, build:app and build:site in order. Every step passed except the explicitly expected generated-view check after restoring main's generated documents. The separate generator write/check passed. The focused fixture generator test passed.

## Provenance and limitations

Fixtures derive only from Sorry's public documentation: https://developer.sorryapp.com/reference/get-notice-templates and https://developer.sorryapp.com/reference/get-update-templates. No live provider request or real export was used. The capture fake intercepts only the network boundary; owner imports, native storage, template reads, private drafts, conflicts and undo use ordinary product doors.

The first isolated Miniflare API harness attempts stalled before migrations at getD1Database on both Node 22 and 24; those were not product assertions. Temporary diagnostics were removed. A fresh unchanged openStatusJourney subsequently opened/closed successfully. Actual later regression outcomes are recorded in regression-receipt.json, without discarding earlier failures. The first broader Cutover browser attempt timed out waiting for its next wizard response after its Statuspage probes; one timing retry is recorded separately.

The cloud adaptation reserves the independent publication scan and landing for the fleet Mac. Exact-SHA CI custody is in ci-receipt.json; any generated-view-only exception is identified explicitly rather than calling a failed workflow success. No independent gate or real-export verification is claimed by builder receipts.

## Claims for the lane

These are partial builder claims for the Sorry delta, not edits to clause judgments or proof of every incumbent/door in the complete clause.

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

## Final local regression results

The full documented-export file passed both registrations on Node 22.20.0, including all 1,003 authenticated subscriber preview rows/23,974 field paths, public history apply/repeat/undo, and the complete template API journey. That template scenario imports 54, retains four edited templates (two shortened subjects and two shortened bodies) on undo, removes fifty unchanged templates and retains their required component. The separate Vite HTTP scenario imports 54 and retains two edited templates, removing fifty-two. Both scenarios are explicit in their own receipts.

All eleven publishing-contract registrations passed across the complete run and the single browser rerun with the required system Chromium path. The four-provider Cutover journey passed its timing retry. The final committed-runtime browser journey passed again at 45bb83a58d8119004e22571cd6e702223590e472, without recapturing the eight original width proofs.

The new isolated template test was corrected after two failed assumptions: supplying a different source correctly invalidates the earlier review, so the test now asserts HTTP 409 and obtains a fresh review; ordinary Sorry source imports correctly add their existing history/feed continuity aliases, so the test now checks preservation of prior aliases and unchanged incident/update/maintenance records. No pre-existing assertion was deleted or weakened. Native ownership inventories now include update-template markers. Earlier failed command logs are retained in this packet.

Final candidate: 8b94d56ba4cd6a2e727a182adac6af6f19b147e3. All implementation source, migrations and contract/docs match the previously passing browser runtime at 45bb83a58d8119004e22571cd6e702223590e472; the final commit adds stronger API review/ownership assertions and their regenerated lock. Passing API test-file hashes are in regression-receipt.json and match this candidate.

## Final custody and CI

PR: https://github.com/just-every/run-lamp/pull/415. Product branch push was confirmed by Git at 8b94d56ba4cd6a2e727a182adac6af6f19b147e3; all three unpublished candidate commits had fleet author/committer identities and no trailers before every push. Main remained 96794ba126e1cf93642760b65a92a02541221045.

Exact-SHA push Verify 44192808371 completed with actual conclusion **failure**, exclusively from `ACCEPTANCE.md: generated content differs; run contract-docs write.` The build receipt upload and aggregate fail, and the shards skip, because that check stops the build. Both failed-job archives were read once through the prescribed gh commands; their complete sanitized logs are retained. This meets the explicitly authorized generated-view-only READY exception; it is not a claim that the workflow concluded success. The fleet regenerates views and reruns its gates at landing. PR Verify 44192976630 and dynamic PR run 44192972557 were in progress at the final discovery; no unobserved success is claimed. Earlier Verify 44190976525 belonged to superseded candidate45bb83a and was not used for readiness.

No product blocker remains. Held/external gap: none. Real-export verification, independent acceptance and landing remain unclaimed.

The verification plan on the final exact SHA reports 112 registered cases (including release qualification) plus ten assertion scripts, for 122 checks. This round adds exactly one registration; before was 111 cases plus ten scripts (121 checks), below the default cap. The simple top-level syntax count is recorded separately and is not used as the policy count.
