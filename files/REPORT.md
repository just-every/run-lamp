# Lamp COMP-009 CSV review and apply

Run Edit Run fleet, 2026-11-21. Campaign run `sd-lamp-c-f163`.

## Plan and result

1. Map COMP-009 to the current contract and to the native catalogue routes. The existing journey drives JSON bulk preview and apply for catalogue capacity and replay. It never submits CSV for existing components, reconciles its reviewed edit or order, or checks its named deletion.
2. Inspect `src/core/features/components/catalogue-csv.ts`, `src/core/features/components/catalogue-routes.ts`, `src/core/features/components/catalogue-service.ts` and `src/core/features/components/catalogue.repository.ts`. The CSV merges by native ID, preview returns the proposed catalogue and removals, and apply verifies the reviewed revision and document. The scoped behavior passed through the existing implementation.
3. Add one isolated native journey in `tests/e2e/public-contract.test.mjs`. It seeds four existing components in one new group, using IDs returned from native creation. The CSV renames Monitoring to Edge monitoring with a quoted multiline description, moves Routing ahead of it, explicitly deletes Retired relay by ID, and omits an internal control. It asserts the proposal, zero apply effects during preview, rejection of a changed deletion with the original review token, and native list readback of the exact survivors and order. The control's complete row and all groups match the baseline.
4. Generate and check the contract views, take the main versions, regenerate and check the source lock, run the touched proof, typecheck and first-party check, inspect the candidate history, push the named branch and inspect its Verify. Publish this packet separately for the guarded lander.

## Acceptance coverage

| Item | Evidence and result |
| --- | --- |
| 1. Existing component CSV edits | Pass locally. `tests/e2e/public-contract.test.mjs` lines 50–69 and 79–83 compare the exact reviewed and persisted name and description. |
| 1. Existing component CSV reorder | Pass locally. Lines 44–48 establish the original IDs and order. Lines 56–69 check the proposed positions, and lines 79–81 assert the independent native API order without sorting its response. |
| 1. Existing component CSV delete | Pass locally. Lines 50–67 check the identity-bound request and named removal. Lines 70–77 prove preview writes nothing and a mismatched review refuses a second deletion. Lines 79–84 reconcile the requested deletion and the unchanged control. |
| 1. Bulk table, CSV creation and group operations | Held by the planner. Existing JSON catalogue assertions remain in the file. |
| 2. Fifty-component CSV with groups and descriptions, preview and reviewed apply | Held by the planner. This small existing-record exercise makes no fifty-component claim. |
| 3. Public order and script-independent descriptions | Held by the planner. COMP-011 retains unified page order and import ordering. |
| 4. Optional uptime tracking start | Held by the planner. |

PROBE COMP-009 1: native component CSV preview and reviewed bulk apply with four known component IDs -> exact edit and reversed survivor order, Retired relay named at preview and absent after apply, unchanged native reads after preview and refused apply, and untouched control intact.

CLAIM COMP-009 PARTIAL points=none tests=tests/e2e/public-contract.test.mjs#COMP-009 — reviewed CSV edits, reorders and deletes existing components

GAP COMP-009: Acceptance 1 still needs bulk table operations, CSV creation and CSV group operations. Acceptances 2–4 remain held.

## DONE-RIDERS

1. Partial. Lines 32–86 exercise the leased outcomes. Acceptance 1 is only partly covered and the remaining acceptances are held.
2. Pass for the slice. Lines 35–48 seed and read the four real records. Lines 73–84 exercise refusal with no persisted change and the reviewed deletion with exact readback.
3. See the exact candidate Verify observation in the receipt. Push Verify runs the public-pages shard and its existing `test:public` entry point.
4. Pass locally. The focused journey ran against the candidate test bytes on Node 22.20.0. The receipt binds these checks to the candidate SHA.
5. No inherited Base duty is claimed for this slice. COMP-011 retains its separate ordering scope.
6. Contract documents generated and checked successfully. The current PARTIAL row, Gap, Evidence and judgment provenance record the existing contract and are owned at landing.
7. Pass. No clause text, rider, or accepted behavior changed in `CONTRACT.md`.
8. Pass for reviewed deletion. Lines 73–84 show the refused mismatched review and the permitted reviewed deletion, with native state readback. The existing operator authority, erasure and credential boundary are outside the changed code.
9. No provider boundary is claimed. The Worker, database and routes run locally. Sign-in uses the fixture's existing synthetic mail transport.
10. No new policy default is needed. The journey uses the existing operator and review requirements.
11. Guarded lander pending. Main equality, the full-history publication scan, and candidate Run site are landing checks. The receipt records the available exact ref and workflow observations.

## Handoff

The plan row `CLAUSES="COMP-009"` from planner batch `sd-lamp-replan-35` gets the native CSV edit, reorder and delete evidence for existing components. Its status remains PARTIAL. Contract inventory before and after is 65 DONE, 124 PARTIAL, 56 MISSING, 245 total. Test inventory moves from 115 registrations and 10 assertion scripts to 116 registrations and 10 assertion scripts.

Only the new journey and its source-lock entry changed. Existing assertions are intact. The staged additions passed the email-shaped text, credential-shaped text and bare slash-token checks. The runtime probe uses HTTP only without a changed screen, so viewport proof is inapplicable. The guarded lander owns the exact-candidate full-history publication scan and Run site. No PR was opened for this guarded branch handoff.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Terminal provenance

Published product branch `cloud/sd-lamp-c-f163` at `e48ebca220a72ed26f6551f1b041f1c0f1dcccc9`. Main was observed at `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`.

Candidate Verify 44841998504 (push) was completed with conclusion success at 2026-11-21T00:26:16+00:00. https://github.com/just-every/run-lamp/actions/runs/44841998504

The exact candidate journey passed on Node 22.20.0. The full touched file passed eight tests on Node 24.19.0 with system Chromium before the final case-sensitive error assertion was run on Node 22.20.0. Typecheck and first-party check passed on Node 22.20.0.

Base main passed Verify 44839596494 and Run site 44839596465. Candidate Run site and the full-history publication scan await the guarded lander.
