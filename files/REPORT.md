# sd-lamp-c-f164 · Lamp availability report proof

Codex, 21 November 2026.

## Plan and result

The UPTIME-009 plan row advances with monthly download proof for acceptance 5. The controlled Worker creates a component with an Operational history entry at the start of tracking. The journey establishes a healthy baseline, creates three overlapping maintenance windows through the native operator API, cancels one, starts and completes another, and retains the third as Scheduled. A fourth window belongs to a different component and falls in the same month. The journey reads both native attachments and compares each download with the references returned by creation and the expected state labels.

Both March 2040 UTC downloads in the independent probe return exactly SCH-1 Database indexing (Completed), SCH-2 Cache replacement (Cancelled), and SCH-3 Network expansion (Scheduled) for the selected component. Both exclude SCH-4, the different-component control. Native component history records an hour Under maintenance followed by Operational. The two downloads agree on 100.00% uptime, 0.00 weighted downtime minutes, the March 15 tracking start, and two whole days of recorded coverage. The packet includes both original response bodies and a receipt. The independent probe read the PDF with Poppler and matched its extracted rows against the CSV and native maintenance references.

I inspected `routes.ts`, `service.ts`, `repository.ts`, `csv.ts` and `pdf.ts` under `src/core/features/availability-reports/`. The existing selection and serialization already preserve these three states and apply the zero weight to the recorded interval. The product candidate extends the existing journey and regenerates `sources.lock.json`.

UPTIME-009 stays PARTIAL. The underlying acceptance text, status judgments and generated documents are unchanged. Before and after, Lamp records 65 DONE, 124 PARTIAL and 56 MISSING, 245 clauses total. The touched file retains 11 existing test registrations.

## Acceptance coverage

| Point | Evidence and outcome |
| --- | --- |
| 1 | Partial and held. The existing publishing journey at `tests/e2e/publishing-contract.test.mjs:419` checks membership of a historical incident in JSON and reads both attachments at line 462. The updated maintenance journey at lines 845–868 checks the exact three-row maintenance set in two monthly downloads. Complete incident and maintenance membership over months and quarters stays held. |
| 2 | Existing partial proof inspected. `tests/e2e/helpers/uptime-correction-journey.mjs:149` tests figures from controlled corrections in monthly and quarterly JSON, CSV and PDF beside page figures. The wider same-window parity matrix stays held. |
| 3 | Existing partial proof inspected. `tests/e2e/helpers/uptime-correction-journey.mjs:155` checks selected end boundaries in UTC. Page-zone calendar and tracking-date cases stay held. |
| 4 | Existing partial proof inspected. `tests/e2e/helpers/uptime-correction-journey.mjs:155` checks observed time in selected cases. Full current, future and missing-history coverage stays held. |
| 5 | Proved locally. `tests/e2e/publishing-contract.test.mjs:783` establishes tracking, lines 816–837 exercise real maintenance mutations and read back the weighted interval, lines 839–868 reconcile both exports. The journey is registered at line 871 and called at line 1104. |
| 6 | Held. The historical JSON case at `tests/e2e/publishing-contract.test.mjs:419` checks one retained incident. The complete masked-claim and older imported-record cases stay held. |

PROBE UPTIME-009 5: Create the component, schedule and transition maintenance at the native /api/app/maintenance routes, then GET /api/app/availability-report for the component and March 2040 in CSV and PDF -> exactly three created references paired with Scheduled, Cancelled and Completed, one tracked maintenance hour, 100.00% uptime and 0.00 weighted downtime minutes over two tracked days.

## DONE riders

| Row | Result |
| --- | --- |
| 1 | Partial. Point 5 reaches the native mutation and report doors and checks both downloaded documents at `tests/e2e/publishing-contract.test.mjs:783`. See the held acceptance rows above. |
| 2 | Pass for this lease. Live seeded data, a tracked baseline, a real one-hour state transition, three distinct maintenance references and a different-component control guard the outcomes at lines 811–868. |
| 3 | See the exact-SHA Verify result below. The existing `test:publishing` command loads the test through the runtime shard in `scripts/verification/plan.mjs:12`. |
| 4 | Local verification is tied to the candidate tree. See the receipt for the exact HEAD run and the touched-file run. |
| 5 | Inspected. UPTIME-009 acceptance 5 names its maintenance and downtime duty directly. This round adds no Base inheritance. |
| 6 | Mechanical pass for contract generation and freshness. The lander owns judgment provenance and any Status, Gap and Evidence changes. |
| 7 | Pass. The committed diff contains the test and regenerated lock. The acceptance sentences and their coverage map stay intact. |
| 8 | Inapplicable. The proof uses existing operator authority. No correction, refund or other authority boundary changed. |
| 9 | Inapplicable. Native local test data is sufficient for the selected monthly download point. Existing provider and release obligations stay held. |
| 10 | Inapplicable. No policy default was selected. |
| 11 | Pending guarded landing. See branch, main, Verify, Run site and publication scan custody below. |

## Pre-READY checks

The new assertions check the actual rendered CSV rows and visible PDF text, including label association and exact membership. The report would fail the journey if a state were missing, duplicated, swapped or weighted above zero. Prior assertions are retained without added conditions. The diff contains no authority, data erasure, replay or UI change. The standard source lock check and a changed-line email and bare slash-token check passed. The Mac lander owns full-history publication scanning and Run site.

GAP UPTIME-009: Complete month and quarter report membership, page parity, page-zone calendar boundaries, current and missing coverage cases, and masked or imported incident membership remain held by the lease.

COMP-006 retains public claim and transition timing. UPTIME-010 and UPTIME-011 retain measured availability and private-audience work. The homepage, documentation site, brand and visual files were outside this lease.

## Candidate custody


- Candidate branch: `cloud/sd-lamp-c-f164`. Exact product HEAD: `1391f636036e163105fd3781e3c2ae29b6eddbf8`. Git advertised this exact head on the named branch.
- Starting and last observed main: `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`. The starting main Verify 44839596494 and Run site 44839596465 both passed. Candidate and main equality is pending the guarded landing.
- Exact candidate Verify 44842383923, event `push`, completed with conclusion **success**. Candidate Run site awaits main. [44842383923](https://github.com/just-every/run-lamp/actions/runs/44842383923)
- Full-history cloud checkout. Publication scan for `1391f636036e163105fd3781e3c2ae29b6eddbf8`: complete=unestablished, historyScanned=unestablished, findings=unestablished. The guarded lander owns the scan.
- No PR was created. The product branch push starts Verify directly. The lane owns landing.

## Verification receipt

The exact-head publishing test file passed 11 tests. The independent test-clock probe and PDF reader reconciled the two native March downloads on the same SHA. Pinned Node 22.20.0 and pnpm 10.12.4 were used for validation. Build, typecheck, first-party check, contract generation and source-lock checks passed. The candidate contains one audited fleet commit with no trailers. No migrations changed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM UPTIME-009 PARTIAL points=5 tests=tests/e2e/publishing-contract.test.mjs#MAINT-001 MAINT-002 MAINT-003 MAINT-004 MAINT-005 MAINT-006 MAINT-007 MAINT-009 MAINT-013 — owner schedules, announces, starts, extends and completes maintenance without losing window or calendar history
