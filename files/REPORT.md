# sd-lamp-c-f198 · MAINT-015

## Scope and plan

The planner’s MAINT-015 row in sd-lamp-replan-42 leases acceptance 1’s two explicitly supplied Statuspage switches. The plan was to read saved responses, map each Boolean to the existing maintenance automation sidecar, preserve sidecar-free target values and protect later operator edits, then extend the existing MAINT-015 journey through saved review, approved apply, native readback and replay.

MAINT-015 is recorded as MISSING. This candidate provides a PARTIAL claim for point 1. Recorded counts before and after are 66 DONE, 123 PARTIAL, 56 MISSING of 245. Status, Gap, Evidence and acceptance sentences have no diff. The handoff updates only the MAINT-015 plan row’s builder evidence.

GAP MAINT-015: Full acceptance still needs API-002 maintenance creation, imported-message lifecycle, timestamp and two-message notification-silence qualification under points 2 and 3, and NOTIFY-016 push. Their recorded judgment and active controls remain in place.

## Product changes

- Saved Statuspage responses read explicit start and completion Booleans independently. A single supplied switch preserves the existing automatic behavior for the omitted switch. With both fields absent, the target value still has no automation sidecar.
- Apply writes automation with the maintenance record. Readback and import guards include the sidecar, so catch-up can replace an unedited sidecar or a sidecar-free record and preserves a later native edit.
- The native journey imports opposite pairs, checks literal readbacks, checks existence and uniqueness of each native target, replays the same saved capture, and applies a changed source after an operator edit. It compares complete native record inventories on replay and durable notification work and captured transports after review, apply, replay and catch-up.

## Outcome evidence

| Item | Result and evidence |
| --- | --- |
| Acceptance 1 | Local PASS. The existing MAINT-015 registration in `tests/e2e/statuspage-import.test.mjs:599` reads a future false and true pair and a running true and false pair through native maintenance (lines 644–678). The absent pair stays automatic without a sidecar. Lines 690–727 prove stable identities, repeat silence, catch-up and preservation of a native edit. |
| Acceptance 2 | Existing control PASS locally. Lines 679–688 retain the three source messages, original publication instants and lifecycle labels at the native and public doors. Full point qualification remains held. |
| Acceptance 3 | Existing silence control PASS locally. Lines 661, 678–689, 699 and 727 check no new work or captured transports. The full point’s reviewed two-message qualification remains held. |
| Inherited MAINT-009, MAINT-013 and MAINT-014 | Existing obligations remain with those clauses. This evidence exercises native per-window automation and leaves their wording, timing, operator actions and notice matrices to their current owners. |
| Inherited MOVE-002 and MOVE-009 | The existing saved-source review and apply door is exercised. The changed capture and native maintenance readback retain record custody. Full migration and Cutover compatibility remain with those clauses. |
| Inherited API-002, public v2 and NOTIFY-016 | Maintenance creation in the compatibility management API, public compatibility projection and push are held. |

PROBE MAINT-015 1: reviewed saved Statuspage apply and replay through the native import door, then operator maintenance readback -> Scheduled false and true, In progress true and false, omitted fields preserve automatic behavior, stable IDs and references, zero new notification work. Catch-up replaces the unedited and sidecar-free records and retains the operator’s switch edit.

## DONE-RIDERS

| Row | Result |
| --- | --- |
| 1 | PARTIAL. The public-door journey reaches all leased switch outcomes at lines 644–727. Full clause obligations remain held as described above. |
| 2 | PASS for the lease. The asserted values are literal and the attempt to overwrite the native edit is rejected as a source conflict (lines 670–678 and 701–727). |
| 3 | See exact candidate Verify in the provenance section. The active registration runs in the `test:imports` Verify shard. |
| 4 | PASS. The unchanged candidate tree passed the focused case and the entire touched test file. |
| 5 | PASS. The clause names its own duties and cites MAINT-009 via its From line and MOVE-002 in point 3. The inherited obligations retain their owners. |
| 6 | Mechanical PASS. Contract generation and freshness check passed, then both views were restored from main. Existing Gap, Evidence and judgment provenance are reserved for the lander. |
| 7 | PASS. There is no contract text or Status table diff. |
| 8 | PASS for the lease. Native edit conflict and stable native identity assertions cover the changed custody path. Existing authorization controls are exercised by the touched file. |
| 9 | N/A. Saved synthetic responses exercise a native import and make no live-provider or release claim. |
| 10 | N/A. The import uses the existing maintenance defaults for unsupplied values. |
| 11 | Pending guarded landing. Main equality, the full-history publication scan and candidate Run site belong to the lander. |

## Local checks

The touched test file and the focused MAINT-015 run passed on pinned Node and pnpm. The build, typecheck, first-party check, test inventory and edition source integrity passed. The test inventory remains 117 registrations plus 10 assertion scripts. No assertions were removed or narrowed. The test uses operator routes and original public history; the change adds no screen or layout.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM MAINT-015 PARTIAL points=1 tests=tests/e2e/statuspage-import.test.mjs#MAINT-015 — imported maintenance messages retain their own source lifecycle labels

## Provenance


- Product branch `cloud/sd-lamp-c-f198`, full SHA `f38216d232a54300bdb67de2c01201d02ae6538d`, confirmed advertised.
- Candidate Verify 44924312336 (push), completed with conclusion success on the exact product SHA. https://github.com/just-every/run-lamp/actions/runs/44924312336
- Remote main at handoff `885d3d981556cdc99fa3656225fbd89d714e2058`. Main equality is false. Base `fb2f45426797a803d88515ed69adfbe7ce738930` had successful push Verify 44923068607 and Run site 44923068680.
- Candidate Run site awaits landing. Full-history publication scan fields for the candidate are complete=null, historyScanned=null, findings=null. The guarded lander supplies the scan and landing receipts.
- In a disposable worktree, removing the mapped sidecar failed the focused public-door test at line 671. Operator readback returned true and true in place of the expected false and true. The product checkout stayed at the candidate SHA.

Run Edit Run fleet · 2026-11-21
