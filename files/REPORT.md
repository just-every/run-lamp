# PAGE-017 native history feeds

Run Edit Run fleet, 2026-11-18

Candidate branch: `cloud/sd-lamp-c-f139`  
Candidate SHA: `75ca30a019c2c669a233bf2ada6be63da93348ad`  
Base main SHA: `177378a989a7496a2e3dc00ac9a43947efd7c031`

PAGE-017 remains PARTIAL. This round extends the existing public catalogue journey for acceptance points 2 and 5. The candidate changes its public-door assertions and the corresponding source-lock digest. The clause text, status table, generated contract views and native feed code are byte-identical to the base. The plan row for PAGE-017 in sd-lamp-replan-31 should record the two points and retain the held remainder. See PLAN.md for the plan and the receipt for observations.

## Coverage

| Point | Outcome | Evidence |
| --- | --- | --- |
| 1 | Valid RSS 2.0, exact Atom inventory and stable order | Held. The alias checks compare like formats on their public doors. |
| 2 | Native Statuspage-compatible history aliases | The public catalogue journey reads both aliases before any import, receives 200, reconciles both complete response byte pairs and finds the actual native update. `tests/e2e/public-contract.test.mjs:49` and `tests/e2e/public-contract.test.mjs:919`. |
| 3 | Complete populated per-component inventories | Held. The existing component feed assertions remain. |
| 4 | Snapshot backing for all variants and W3C validation | Held. |
| 5 | The history RSS reader sees the new publication within ten seconds | The same journey checks 304 for the current validator, publishes a real native resolution, and polls the public alias with the initial validator. A 200 must have a new validator, the single exact new GUID, the exact submitted resolution wording, and every prior GUID. `tests/e2e/public-contract.test.mjs:71` and `tests/e2e/public-contract.test.mjs:919`. |

Registration: `tests/e2e/public-contract.test.mjs:368`. The Verify composer shard invokes this file through `test:public` at `package.json:57` and `scripts/verification/plan.mjs:8`. The timing probe also runs locally on the candidate SHA with real monotonic elapsed time.

## DONE riders

| Row | Result |
| --- | --- |
| 1 | Partial. The journey reaches points 2 and 5. The lease holds the remaining outcomes. |
| 2 | Pass for the leased points. The install contains actual native publications. The assertion joins the resolution wording to the GUID derived independently from the published update ID and the fixture's installation identity. |
| 3 | Exact-SHA Verify status appears in the receipt. The existing composer shard invokes the journey. |
| 4 | Exact-SHA local runtime evidence appears in the receipt. |
| 5 | Pass for the leased points. Native aliases and the ten-second bound are explicit in the clause's own acceptance text. |
| 6 | Contract generation and freshness checks pass. The current partial judgment and its legacy provenance remain under the lander's control. |
| 7 | Pass. Acceptance text, generated views and coverage mapping have no candidate diff. |
| 8 | Outside these public read outcomes. Native publish still uses the operator door. |
| 9 | Outside these native runtime outcomes. No provider or legal finding is claimed. |
| 10 | Pass. The round introduces no policy decision. |
| 11 | Pending guarded landing. The Mac owns publication scanning, main equality and candidate Run site. |

The initial local run reached the exact new GUID but the added assertion used the active incident's “Customer impact” label. The resolved public feed calls the field “Update”. The candidate compares the complete “Update” line to the originally submitted wording, keeping the exact GUID association.

Existing assertions remain in place. This is a public feed proof change with no UI or layout edits. No authority, erasure, replay or provider handling changed. Contract counts remain 60 done, 129 partial and 55 missing, 244 total. The verification inventory remains 111 registered cases and 10 assertion scripts, 121 checks.

GAP PAGE-017: Points 1, 3 and 4 remain held, covering RSS 2.0 semantics and complete Atom parity, populated per-component inventories, full snapshot backing and W3C validation.

## Verified candidate

GitHub Verify run 44253613649 completed successfully on the candidate SHA from the push event. The exact-SHA local journey and all six registrations in the touched test file also passed. No contract counts changed. The Mac lander has the publication scan and the candidate's main-only Run site run.

The retained feed renderer builds the canonical Atom and RSS bodies once and passes each to its history artifact at lines 86–94 of src/core/features/public-snapshot/feeds.ts.
