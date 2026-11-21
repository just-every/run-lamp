# Lamp UPDATE-001 boundary proof

Run sd-lamp-c-f162, 21 November 2026. Candidate `cloud/sd-lamp-c-f162` at `08f3288e856d154feefdbbd66e56d919dc73904d`, based on `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`.

## Plan and result

1. Read UPDATE-001 and the status gap, inspect existing publishing proof, and check the shared schema, draft route and incident service. The schema already trims and limits the two inputs, the draft route refuses invalid input before saving, and publish validates and copies both retained values. The native proof passed with the existing product code.
2. Extend the existing reviewed-incident journey. Save distinct exact-length values, change one field per refusal, read the saved draft and update inventory after both refusals, then review and publish the valid draft. Match both submitted values to the committed update ID through native readback and the stored row. Keep the existing blank-optional public page, Atom and delivered email control.
3. Run the touched test file and TypeScript check. Regenerate and check the contract views, restore the main copies, regenerate and check the source lock, then push the checked candidate. Return this packet on the separate evidence ref.

| Outcome | Proof in `tests/e2e/publishing-contract.test.mjs` |
| --- | --- |
| Accepted what-still-works at 250 characters and details at 500 | Lines 178–199, exact values independently read from the saved Monitoring draft |
| What-still-works at 251 and details at 501 each refused | Lines 201–209, field-specific HTTP 400, identical native incident including the exact draft and updates, identical ordered complete stored update rows |
| Review and publication retain both values | Lines 218–243, reviewed draft ID matches publication ID, then exact native and database readback with the earlier update preserved |
| Blank optional statements still publish and are omitted from the displayed fields | Lines 325–344, empty stored fields, exact public page, Atom and delivered email wording |

PROBE UPDATE-001 3: native draft PUT with exact 250 and 500 character values, independent 251 and 501 requests, native review and publish -> exact saved limits, field-specific HTTP 400 with identical draft and update inventory, and exact values retained by committed update ID.

CLAIM UPDATE-001 PARTIAL points=3 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion

GAP UPDATE-001: Acceptances 1, 2 and 4–6 remain held by the planner, covering required fields and component, resolved promise suppression across every surface, plain-text and link treatment, complete publication refusal and the communication commitment.

Plan row for planner return `CLAUSES="UPDATE-001"` (sd-lamp-replan-35). Acceptance 3 boundary proof complete locally. Status stays PARTIAL. Before and after 65 done, 124 partial, 56 missing, 245 total. Publishing file registrations remain 11. No policy default or site, brand, visual, or documentation-site work was needed.

## Checks and custody

- Verify 44842171850, event push, status in_progress, conclusion pending. https://github.com/just-every/run-lamp/actions/runs/44842171850
- Main base 3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb: Verify 44839596494 and Run site 44839596465 completed successfully.
- The candidate descends from main. The fleet lander owns main equality, the complete full-history publication scan and the candidate's main-branch Run site. Scan result, history scanned and finding count are pending.
- Local Node 22.20.0. Publishing file 11 passed, TypeScript and first-party profile exited zero. The initial maintenance browser check lacked a Playwright executable. The complete touched file passed with the cloud VM's Chromium selected.
- MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0
- Product changes comprise the publishing journey and its generated source lock. The added lines passed the email-shaped-text and bare slash token checks. No product UI or authority, erasure, replay, custody or provider edge changed. The journey retained the existing reviewer, publication, lifecycle and blank-value checks. The new assertions fail if either exact-length save, either refusal, preservation of prior state, or exact committed readback breaks.

## DONE-RIDERS

| Row | Result for the candidate |
| --- | --- |
| 1 | Partial. Acceptance 3 passes locally as recorded above. Acceptances 1, 2 and 4–6 are held. |
| 2 | Pass for the slice. Lines 175–209 start from a nonempty publication inventory and read both rejected writes back. Lines 218–243 independently reconcile the committed result. |
| 3 | Pending (in_progress). The push Verify runtime shard includes `test:publishing`, which loads this journey. |
| 4 | Pass for local proof. The test receipt binds the full publishing file to the candidate SHA. |
| 5 | Pass by inspection. The clause already cites BASE-INPUT-001 and BASE-INPUT-002. This round claims the bounded-input proof only. |
| 6 | Pass for source and generated-view freshness. Main's recorded PARTIAL status, gap and judgment provenance are retained. |
| 7 | Pass by inspection. Acceptance text and the status table have no candidate diff. |
| 8 | No new authority claim. Separate native draft author and reviewer are retained at lines 79–101 and 178–225. |
| 9 | No new provider or legal claim. The existing blank-optional mail control uses the synthetic provider edge. |
| 10 | No policy choice required. Both limits are already specified in acceptance 3. |
| 11 | Pending guarded landing, full-history scan and candidate Run site on main. |
