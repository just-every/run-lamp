# sd-lamp-c-f124 report

CLAIM PAGE-009 PARTIAL points=2 tests=tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
GAP PAGE-009: Complete configured-zone notification timestamp reconciliation, including exact maintenance email and chat wall-clock times in acceptances 1 and 3, remains held by the planner. Only acceptance 2 is claimed.

Candidate: 7440c57ec4f27a63faf8f38bc0784df8355cc713, branch cloud/sd-lamp-c-f124. Product remote verified at that exact SHA. PR: https://github.com/just-every/run-lamp/pull/339. No product landing or full-clause DONE is claimed.

PAGE-009 remains PARTIAL to PARTIAL. Acceptance 2's missing generation-age lifecycle group is closed locally. Counts remain 60 done, 129 partial, 55 missing, 244 total against the refreshed main. During this run, main independently promoted PAGE-019, moving its earlier 59 done and 130 partial to those refreshed counts; this branch makes no status change. The selected plan row changes only in its proof record: acceptance 2 now has active initial and later relative-age assertions. No Mac plan, contract Status cell or other target was edited. No additional same-file target is authorized by this planner slice.

The full plan is in PLAN.md. Implementation extends the existing catalogue-to-customer registration with one retained publication, independently validated initial HTML, a separate browser context clock and two viewport cases. At 59 seconds the label says just now; one 30-second interval later it says 1 minute ago. Both cases retain exactly the same generation and reconcile the tooltip against the captured instant in the configured Los Angeles zone while the browser uses New York. Actual observations are retained in PROBES.md and CHECKS.json.

Only tests/e2e/public-contract.test.mjs and the generated sources.lock.json changed. src/core/features/public-snapshot/assets.ts and templates/script.js were inspected read-only. Initial-HTML, script-disabled, polling, tooltip, live-region, public isolation and existing catalogue assertions remain active. No test registration was added or removed: 85 cases plus 10 assertion scripts before and after. No product, homepage, documentation-site, brand, release or workflow file changed.

The touched file passed all 6 registrations both before and after integrating main's independently green embed journey. The final run includes both positive visibility assertions. Typecheck and the first-party check passed. The initial run was deliberately interrupted after finding that Playwright clocks are shared within a context; its four completed registrations passed. The final implementation gives the new proof its own context and asserts visibility at both age checkpoints. Both complete touched-file runs retain all existing assertions. The expected PAGE-005 failure-injection diagnostic about a missing logo remains within a passing existing test. An auxiliary standalone source-block runner produced no assertion result and was stopped after its 180-second timeout did not reap it; only its own Node and Worker PIDs were stopped. Its actual output is retained. The registered native journey, which passes all target assertions, supplies the POINT probe. This was not a red CI repair.

Mechanical receipt: MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0. The pre-lock check correctly detected the edited test's stale hash. Views were restored whole from origin/main and source lock was regenerated last. The unpublished rebase incorporated main's new embed journey and retained its newer judgment; the entire merged test file was rerun. The final main merge changed no tested source bytes.

Local proof is bound to the candidate by the exact committed test SHA-256 3573c472e077f2899cba5c62b3a2f43cdf8511c923c24e11afa217f852aef075; no test or runtime source bytes changed between final local execution and commit. The only file regenerated after that execution was sources.lock.json. This is not presented as a successful exact-SHA CI run.

Recorded candidate workflows:
- Verify 43231371714: push, in_progress, conclusion=None, https://github.com/just-every/run-lamp/actions/runs/43231371714

Observed main: 708ff579db8ac27b05765f63e00a80f8832bebba. Recorded main workflows: Verify 43226178741 status=completed conclusion=success; Run site 43226178483 status=completed conclusion=success; Verify 43223174864 status=completed conclusion=success. Candidate main equality is not established because this cloud publishes only its named branch. Candidate Run site is not run before main. Publication scan result: commit=7440c57ec4f27a63faf8f38bc0784df8355cc713; complete=NOT RUN; historyScanned=NOT RUN; findings=NOT RUN. The cloud cannot run the Mac publication scanner, so no COMPLETE or zero-findings result is claimed.

Scoped proof register (all code references are tests/e2e/public-contract.test.mjs):
| Item | Result | Evidence |
| --- | --- | --- |
| Acceptance 1, every public and notification timestamp | HELD overall | Existing public checks retained; complete notification reconciliation is outside this planner slice. |
| Acceptance 2, initial relative generation label | MET locally | Lines 613–626 set the independent clock and positively read just now. |
| Acceptance 2, relative age refresh while page stays open | MET locally | Lines 627–636 advance the clock, read 1 minute ago and retain document and generation. |
| Acceptance 2, absolute configured-zone tooltip and offset | MET locally | Lines 625–626 and 633–634 reconcile visible date, wall clock and offset against the captured instant with assertVisibleTime. |
| Acceptance 2, exact machine-readable instant | MET locally | Lines 620, 624, 632 retain the response generation and datetime. |
| Acceptance 3, initial HTML and script-disabled absolute generation | PRESERVED and additional initial proof | Lines 602–609 parse actual initial HTML; the existing no-script block and 61-second observation remain active later in the same registration. |
| Acceptance 3, all notification timestamps remain absolute | HELD overall | No maintenance email or chat timestamp receipt is claimed. |
| Inherited duties | INSPECTED | No newly claimed Base or receiving-clause duty. |

DONE-RIDERS:
| Row | Result | Proof or boundary |
| --- | --- | --- |
| 1 | PARTIAL overall; scoped point MET locally | Acceptance 2 public-door outcomes pass at lines 602–636. Acceptance 1 and 3 complete notification obligations remain held. Exact-SHA CI is independently reported below. |
| 2 | PASS for scoped point | Real native generation, literal initial and later ages, independent visible-time parser, different browser zone, unchanged generation readback; lines 613–636. |
| 3 | PENDING CI | The existing test is loaded by test:public in the composer Verify shard; screenshots alone are not used as assertions. Candidate run metadata appears above. |
| 4 | PASS by byte comparison | Final touched-file run source SHA-256 3573c472e077f2899cba5c62b3a2f43cdf8511c923c24e11afa217f852aef075 matches the committed test exactly. No runtime source changed. |
| 5 | INSPECTED | PAGE-009 has no Base citation or newly claimed inherited duty. Its own configured-zone, instant and generation-label duties remain intact. |
| 6 | PASS mechanically; no promotion | Generator write and check both pass. Status, Gap, Evidence and generated views are untouched; original partial judgment remains authoritative. |
| 7 | PASS | No acceptance text, coverage map or ruling was changed. |
| 8 | NOT APPLICABLE | No authority or dangerous operation changed; this scope reads a public generation clock. |
| 9 | PASS for honest boundary | No provider, mailbox or legal proof is claimed; complete notification reconciliation remains held. |
| 10 | NOT APPLICABLE | No new policy default; existing RL-1 generation-label exception retained. |
| 11 | PENDING LANDER | Branch-only candidate. Main equality, exact-SHA successful Verify, Run site and complete publication scan remain independent landing gates. |

Pre-ready self-check: (1) scoped behavior is exercised through native public HTML and browser reads, with literal positive observations before and after the age change; CI state above remains honest; (2) no existing assertion was removed, narrowed or moved behind a condition; (3) authority, erasure and replay implementation is untouched and no such new claim is made; (4) no screen or icon control was changed, with the public screen proof retained at both requested widths; (5) lock and contract generation pass, while exact candidate Verify, publication scanning, main equality and Run site remain the maintained lander's gates. Added test text contains no email-shaped string, credential-shaped value or new bare repository-like slash token.

The first published save is e06d5539aa989c77cb18419454fee4b79954558c, explicitly marked to skip CI. Main's newer PAGE-019 journey and judgment were retained. The final candidate adds positive visibility assertions and has no CI skip marker. No blocker prevents the scoped test change. The explicitly held acceptance 1 and 3 remainder prevents a full-clause DONE claim. Screenshots, actual local logs, workflow metadata and check receipts are selected explicitly for report-only evidence publication; setup output and credential-related metadata are excluded.
