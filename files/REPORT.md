# Lamp MOVE-004 · sd-lamp-c-f161

Prepared by Codex, 2026-11-21 UTC.

- Product repository [just-every/run-lamp](https://github.com/just-every/run-lamp).
- The product branch is `cloud/sd-lamp-c-f161`.
- Candidate `c1f2554f9842351987eb2d7e608d89cbc526566b` is based on main `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`.
- Exact-SHA push Verify 44842545166 is complete with conclusion success. https://github.com/just-every/run-lamp/actions/runs/44842545166
- Main at handoff is `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`. The guarded lander records the full-history publication scan and Run site for the landed SHA.
- Verify 44839596494 and Run site 44839596465 completed successfully on baseline main `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`. The initial push at `b24d3b0e082c16991c3e9cce4a63870a3f5e22a5` started Verify 44841804383, last observed as in progress.
- The full target has 65 done, 124 partial and 56 missing of 245, both before and after this round. MOVE-004 stays PARTIAL. The branch push started Verify directly.

## Plan and completed work

1. Read the scoped plan, MOVE-004 and its Status gap, the DONE-RIDERS, and the Lamp ruling index. The lease covers acceptance 3 for the conditional undo in the Statuspage, Better Stack and Instatus owner flow. No policy change was needed.
2. Inspect the existing journey and the native undo code. `src/core/features/statuspage-import/door.ts` finalizes undo by forgetting invitation claims for removed subscribers and scheduling the snapshot rebuild. `src/core/features/statuspage-import/service.ts` confines the outbound invitation submission to the explicit invitation action. Native checks passed with the current production code.
3. Use the invitation helper's settled clock for one native scheduled invocation. Capture work and attempt identities immediately before undo and compare separately after its completion and after the scheduled drain. Require every observed identity to already be in the baseline and compare the captured transport arrays. The identity comparison permits the intended removal of work. Keep the existing native readback of the owner-edited incident and the removed untouched incident count.
4. Keep the expanded inventory local to this conditional-undo check. The follow-up candidate commit preserves the shared inventory used by other journeys. Existing assertions and all three registrations in the touched test file remain.
5. Run the native journey, typecheck, first-party check and product build, regenerate and check contract views, restore the views from main, and regenerate and check the source lock. The source lock contains only the three changed test and helper file hashes.

The proposed plan-row update is acceptance 3 conditional-undo silence locally proven for these three providers. Keep MOVE-004 PARTIAL and the remaining proof listed below in the plan.

## Acceptance evidence

| Point | Exact candidate outcome | Evidence |
| --- | --- | --- |
| 1 | Held. The complete removed-record inventory remains open. The existing incident-count control still runs. | `tests/e2e/statuspage-import.test.mjs` at the conditional undo readback. |
| 2 | Held. Complete dependency and named-disposition coverage remains open. The existing edited-incident, retained-disposition and independent native readback controls still run. | `tests/e2e/statuspage-import.test.mjs` at the owner draft, publish and undo. |
| 3 | Local pass for the leased conditional undo across Statuspage, Better Stack and Instatus. In each case, no new work or attempt identities appeared after undo or after the native scheduled drain, and captured mail, mail receipts, webhooks and channel requests stayed equal. Other undo paths remain held. | `tests/e2e/statuspage-import.test.mjs:307`, `tests/helpers/import-notifications.mjs:65`, `tests/e2e/helpers/import-invitation-flow.mjs:214`. Verify 44842545166, push, complete with conclusion success. |

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Held at clause scope. | Acceptance 3 leased flow passes locally. Full acceptance 1 and 2 outcomes and other undo paths are held. |
| 2 | Pass for the leased flow. | Deliberate invitations and an owner-edited incident populate the native journey. The comparison probe detects replacement at equal count, an additional attempt, and an extra captured transport. |
| 3 | Pass. | Imports shard invokes `test:imports`, which runs the touched file. Exact push Verify 44842545166, complete with conclusion success. |
| 4 | Pass for the leased local proof. | The tested changes match the published candidate. The receipt binds the native run to that content. |
| 5 | Inspected. | MOVE-004 names undo and notification silence in its own acceptance points. No inherited-duty claim or change was made. |
| 6 | Mechanical pass. | The generated-view check passes. Existing PARTIAL judgment and provenance await the guarded lander. |
| 7 | Pass. | No acceptance text, clause rider or status-table edit. |
| 8 | Pass for exercised controls. | Existing revoked-session apply refusal, owner-only invitation controls and owner edit retention still run. Other undo paths stay held. |
| 9 | Pass. | Synthetic provider exports and captured transport are the proof boundary. |
| 10 | Pass. | No consent, custody, spending or authority default was introduced. |
| 11 | Pending guarded landing. | Main is `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`. Candidate scan and candidate Run site are unestablished. |

## Checks and probes

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

PROBE MOVE-004 3: signed-in owner conditional undo of edited Statuspage, Better Stack and Instatus imports, followed by one native scheduled drain for each -> undone state, retained owner correction, no fresh notification work or attempt identities, unchanged captured transport requests.

The existing revoked-session, expired-invitation erasure, and confirmation-replay controls passed. There were no visual changes requiring a new viewport proof. The candidate diff contains no added address-like fixture values and the fleet identity and trailers were inspected for all candidate commits. The full-history publication scan remains a lander gate.

CLAIM MOVE-004 PARTIAL points=3 tests=tests/e2e/statuspage-import.test.mjs#SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes

GAP MOVE-004: Complete removed-record inventory, retained edits and all dependencies with named dispositions, and silence for the other undo paths remain held.
