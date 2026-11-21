# Lamp maintenance calendar wording

Run: sd-lamp-c-f181. Prepared by Run Edit Run fleet on 21 November 2026.

## Plan and result

1. Read MAINT-009, its status row, the planner lease, the Lamp rulings and the DONE riders. The lease isolates acceptance 6. The existing maintenance journey proved the calendar payload structure, UID and window lifecycle. Its DESCRIPTION asserted none of the current saved customer wording.
2. Trace the native create and reschedule routes into the maintenance service. Create validates and persists both statements. Reschedule applies both together with the new window and its revision notice. The public snapshot repository selects the maintenance row and filters attachments for public visibility. The snapshot renderer already carries the saved row into its calendar artifact. The calendar now formats current fields directly from that row with the existing incident wording labels. This preserves the title and component names and sends the full text through the original RFC 5545 escaping and UTF-8 folding.
3. Extend the existing journey. Submit one pair of statements on native create and a different pair on native reschedule. Parse the public calendar with ical.js, match by UID, and compare the description and window. The revised fixture includes comma, semicolon, backslash, newline and multibyte text. An extension without new wording keeps the revised description. A legacy row with null wording supplies an independent title-and-component control. The existing empty-feed, visibility, completion and cancellation controls still run.
4. Regenerate and check the contract documents, restore the generated views from main, and regenerate and check the source lock last. Run the touched test file with its production Worker prerequisite and run typecheck and the first-party check. Publish the named branch, record exact-SHA Verify separately and publish this evidence packet on its evidence ref.

## Acceptance and scope

| Point | Outcome |
| --- | --- |
| 1 | Existing happy-path native scheduling is retained. Required wording and length refusal proof is outside the lease. |
| 2 | Optional wording and its links and limits are outside the lease. |
| 3 | Existing native transition checks are retained. The full notice wording lifecycle and Verifying are outside the lease. |
| 4 | The native calendar is covered under point 6. The rest of the cross-surface and transport matrix is outside the lease. |
| 5 | The null-wording calendar control is covered under point 6. Existing notice backfill protection is outside the lease. |
| 6 | Native schedule and reschedule wording are asserted in the matching parsed public calendar event, with the identity, start and end, sequence, omission of the old strings, extension retention and the legacy control. See the executable receipt for lines and runs. |
| 7 | Complete Statuspage-format maintenance bodies are outside the lease. |

MAINT-009 remains PARTIAL. Full-clause work still includes API-002 maintenance create, imported messages, NOTIFY-016 push, required and optional wording boundaries, notice and Verifying coverage, legacy notice backfill protection, the remaining surface and transport matrix and complete Statuspage-format bodies. MAINT-010 owns calendar-client and managed-relay attachment proof.

The campaign row to update is MAINT-009 in the replan-38 extract, with native acceptance 6 proven locally and the held remainder retained. Before and after counts are 66 done, 123 partial, 56 missing, 245 total. The plan was read from the inline extract. No contract acceptance text or judgment cells were edited.

## DONE riders

| Rider | Result |
| --- | --- |
| 1 | Point 6 has native parsed feed proof. Whole-clause coverage remains partial as detailed above. |
| 2 | Independent HTTP inputs and exact parsed output exercise the user-visible behavior. The new assertion failed against the old calendar renderer because both wording lines were missing. |
| 3 | The existing journey is invoked by the Verify runtime shard through the publishing test command. The exact-SHA run state is in the receipt. |
| 4 | Local proof is tied to the candidate tree. See the receipt for its head and commands. |
| 5 | No new inherited Base duty. MAINT-009 names the calendar duty in acceptance 6 and MAINT-010 retains its distinct calendar-client and mail obligations. |
| 6 | Contract regeneration and checks pass. The Status, Gap and Evidence cells retain main's current judgment. |
| 7 | The acceptance points, existing assertions and test registrations were preserved. |
| 8 | No permission or destructive-action change. The journey retains main's existing exclusion of internal-only maintenance and private component details. |
| 9 | Live provider, calendar-client and release proof are outside this native feed change. |
| 10 | No policy ruling or default was needed. |
| 11 | Publication scan, guarded landing, main equality and the candidate's Run site remain with the lander. |

The product door is a calendar data response. It did not require a browser viewport, visual changes, a live provider or an account.

PROBE MAINT-009 6: native create and window reschedule with distinct customer statements, then parse the public maintenance feed -> same UID, sequences zero and one with the exact current wording and matching UTC windows. A wording-free extension retains the revised description at sequence two, and a legacy window retains its title and public component without new labels.

Product head a843e8c8551872a67174172e2b8a3a94f571a138 passed exact-SHA push Verify 44880255296. The local production preview and all 11 publishing tests also passed.

CLAIM MAINT-009 PARTIAL points=6 tests=tests/e2e/publishing-contract.test.mjs#MAINT-001 MAINT-002 MAINT-003 MAINT-004 MAINT-005 MAINT-006 MAINT-007 MAINT-009 MAINT-013 — owner schedules, announces, starts, extends and completes maintenance without losing window or calendar history

GAP MAINT-009: Acceptances 1–5 and 7 remain held, including API-002 maintenance create, imported messages, NOTIFY-016 push, wording limits and optional fields, Verifying and the full notice lifecycle, legacy notice backfill protection, the remaining surface and transport matrix, and complete Statuspage-format bodies.
