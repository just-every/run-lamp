# Lamp MOVE-005 retained Statuspage proof

Run Edit Run fleet, 21 November 2026. Round sd-lamp-c-f175.

The candidate is 081613316b0dbacd5bc25264430ae8a8e73687aa on cloud/sd-lamp-c-f175. Its base is main at 2d49c9f3a8eb566e43b36126dbb844b6d9591b26. The product branch is advertised at the candidate SHA. The before and after contract counts are both 65 done, 124 partial, 56 missing, 245 total. MOVE-005 stays PARTIAL.

## Work and result

1. Read MOVE-005’s seven acceptances and the Status row, the plan extract, the Lamp rulings and DONE-RIDERS. The plan selected only the database-free public reads for one saved Statuspage incident in acceptance 4.
2. Inspected the native alias rendering and snapshot route dispatch in `src/core/features/public-snapshot/import-aliases.ts` and `src/core/features/public-snapshot/routes.ts`. The incident address resolves through a generation artifact and both Atom paths already serve generation artifacts. The parser and feed-title decision required no product change.
3. Extended the existing owner review and apply journey in `tests/e2e/statuspage-import.test.mjs` at line 320. The selected saved incident’s timestamps move together to a comfortable offset inside the feed’s rolling window. The first incident’s fixed-date component history controls are preserved. The settled pointer is captured only after the requested publication revision is complete and no build is active. Four public artifacts and the retained bundle are copied from that pointer’s generation, with original bytes and content types, into fresh object storage.
4. Extracted the existing retained Worker setup into `tests/e2e/helpers/retained-snapshot-runtime.mjs`, used by both import and retention journeys. The Worker in `tests/e2e/snapshot-retained.worker.ts` supplies the real public route registration and a counting, throwing repository. The test starts with an empty replica and no cached responses or artifact reads. Each public route reads its expected immutable object once and identifies the same generation and generation time.
5. Ran the existing journeys, typecheck, first-party profile, contract views write and check, source lock regeneration and freshness check. Reconciled with main, confirmed empty contract and generated view diffs, inspected every candidate identity and trailer, and used the fleet guard to push the branch. Verify is a push workflow. Run site starts on main, and the guarded lander owns that run and the full-history publication scan.

## Acceptance coverage

| Acceptance | Evidence and remaining scope |
| --- | --- |
| 1 | Existing old-address 301s and native record reads in `tests/e2e/statuspage-import.test.mjs` at lines 398–420. The new test exercises one Statuspage incident. Complete redirects and maintenance remain held. |
| 2 | Existing Sorry and Cutover journeys provide baseline coverage. Full numeric and supplied redirects and listings remain held. `tests/e2e/sorry-import.test.mjs` at line 27 and `tests/e2e/cutover-browser.test.mjs` at line 136. |
| 3 | Existing import journey compares reported source feeds in `tests/e2e/statuspage-import.test.mjs` at line 421. The expanded source, no-history and complete-undo feed proof remains held. |
| 4 | PASS locally for the scoped Statuspage redirect and Atom read in `tests/e2e/statuspage-import.test.mjs` at lines 70–151 and 340. All four reads share the settled import generation. Reapply and conditional undo, and the rest of the route and source matrix, remain held. |
| 5 | Named refusals, native-route collisions and retained warnings remain held. |
| 6 | Missing shortlink behavior, source-host custody and exact Better Stack saved webhook behavior remain held. |
| 7 | Existing Better Stack wording and native notice controls in `tests/e2e/statuspage-import.test.mjs` at lines 405–413. Complete historical lifecycle and notification silence proof remains held. |

## DONE-RIDERS

| Row | Result |
| --- | --- |
| 1 | Incomplete for the clause. The public probe in `tests/e2e/statuspage-import.test.mjs` at lines 127–150 passes for the leased slice. |
| 2 | Pass for the slice. A reviewed, populated saved capture supplies independent original wording. Native incident identity, both Atom bodies and the count of accesses are asserted at lines 70–150. |
| 3 | Candidate push Verify is the CI receipt below. The imports and public-pages shards already register the two journeys. |
| 4 | Pass. The touched source and test bytes verified locally are present on the candidate. The rebase was a no-op. |
| 5 | No new inherited duty. The related MOVE-004, MOVE-009, PAGE-006 and PAGE-017 duties remain with their owning clauses. |
| 6 | Generated documents are current. The existing PARTIAL judgment and its recorded Gap and Evidence remain on the contract. The new proof is supplied here for the lander’s judgment. |
| 7 | Pass. The clause and its acceptance points are byte-identical to the candidate base. |
| 8 | The new path only reads public snapshot data. Existing private-source and revoked-session refusals remain at `tests/e2e/statuspage-import.test.mjs` lines 299–304. Existing import undo and replay controls passed in the same journey. |
| 9 | Pass for the scoped proof. The saved capture is synthetic, with no live-provider or legal receipt claimed. The external shortlink host is held. |
| 10 | No new policy default or ruling needed. |
| 11 | Pending guarded landing. The advertised main SHA differs from the candidate. The full-history scan and exact-candidate Run site have no cloud receipt. |

## Handoff

The planner’s MOVE-005 row gains evidence for the acceptance 4 slice only. There is no count or clause-text edit. Test registrations changed by zero. The three test files and their source lock entries are the complete product diff. The round adds no screen changes. The existing import journey ran its retained provider client at 1440. No additional screenshot run applies.

CLAIM MOVE-005 PARTIAL points=4 tests=tests/e2e/statuspage-import.test.mjs#SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes

GAP MOVE-005: The rest of acceptance 4’s source and route matrix, reapply and conditional undo, and all held outcomes in acceptances 1–3 and 5–7 need additional proof.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0
PROBE MOVE-005 4: GET /incidents/i0000000002 -> 301 /incidents/INC-2; GET /incidents/INC-2 -> 200 with "Slow dashboard loads" and "Dashboard load times are normal."; both Atom routes -> 200 with 5272 identical published bytes and the incident entry; snapshot 01M7YBH318R5TVHCSEZSCP9KP1, generated 2026-11-21T06:08:35.369Z, cold cache, 0 database touches

The post-push replay on the exact candidate with pinned Node 22.20.0 also passed all five tests, typecheck and the first-party profile. Its observed output is in VERIFICATION.txt.

The changed assertions fail on a wrong redirect status or target, missing source wording, either changed feed body, a missing incident entry, a generation mismatch, a warm starting cache or any repository access. The existing import authority, erasure and replay controls stayed active. No assertions were deleted, hidden by a branch condition or narrowed. The source lock is fresh, and the added lines and selected packet files passed the email-shape check.

During candidate Verify, main advanced to 22888471699c91014a61db3499e59968c8bb8392. The advertised candidate SHA stayed fixed. The guarded lander will reconcile that later main before landing.

Exact candidate push Verify 44874414150 completed successfully on 081613316b0dbacd5bc25264430ae8a8e73687aa. The local acceptance 4 proof clears the scoped Verify requirement. Main landing, publication scan and Run site remain with the guarded lander. https://github.com/just-every/run-lamp/actions/runs/44874414150
