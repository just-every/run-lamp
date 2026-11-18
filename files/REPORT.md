# Lamp PAGE-006 first snapshot evidence

Run Edit Run fleet builder, 18 November 2026.

- Product candidate `ddadc768d2039405b5dd35a425fd54270ee83ec4` on `cloud/sd-lamp-c-f134`. The product branch was pushed and matched this SHA when read back by Git. Main was `177378a989a7496a2e3dc00ac9a43947efd7c031`.
- Candidate Verify 44245059866 was in_progress on the exact product SHA. It was triggered by the branch push. The Verify `composer` shard includes `test:public` through `scripts/verification/plan.mjs:8` and `package.json:57`. Run site is main-only. On the recorded main SHA, Verify 44242051847 and Run site 44242052319 completed successfully. [Candidate Verify](https://github.com/just-every/run-lamp/actions/runs/44245059866) [Main Verify](https://github.com/just-every/run-lamp/actions/runs/44242051847) [Main Run site](https://github.com/just-every/run-lamp/actions/runs/44242052319)
- Plan row `PAGE-006` under `sd-lamp-replan-30` now has local proof for acceptance 2's first-publication lifecycle. The contract status remains PARTIAL. Counts before and after are 60 done, 129 partial, 55 missing, 244 total. The report supplies this row's new evidence for the lane.
- Plan executed. Map existing assertions to all three acceptances. Extend the existing retained journey with empty storage and cache preconditions, failure responses on all three public paths, and first-generation content assertions after the native rebuild. Preserve the fault and cold-restart controls. Verify the contract views and relock after aligning with main, run the touched checks, and push the candidate and this report on their respective refs.

## Acceptance evidence

| Acceptance | Result and public proof | Candidate Verify |
|---|---|---|
| 1. Successful current or retained content through database, queue or object storage failure, plus PAGE-007's origin-cache window | **Held by lease.** Retained controls still run in `tests/e2e/snapshot-retained.test.mjs:55`, `:173`, `:184`, `:239`, `:249` and `:269`. They cover a Queue fault with byte equality, database-free reads, retained bytes with object storage unavailable, and cold restart. The warm edge fallback was exercised with storage and the replica down. The one-hour PAGE-007 origin-cache relationship was held. Durable retained snapshots have no new expiry. | push 44245059866, in_progress |
| 2. Unavailable only before the first snapshot | **Proven locally.** Fresh Workerd fixture with empty R2, SQLite-backed durable replica and edge cache. `tests/e2e/snapshot-retained.test.mjs:72` through `:101` and `tests/e2e/snapshot-retained.worker.ts:23` prove all three requests receive 503 with the unavailable response and no generation metadata, and that those reads create neither a snapshot nor a cached response. `tests/e2e/snapshot-rebuild.ts:53` invokes the production rebuild against real fixture storage and reports the persisted R2 pointer and replica. In the same namespace, `tests/e2e/snapshot-retained.test.mjs:144` through `:152` checks the independently requested generation 1 on both backing stores. Lines 180–209 check all three 200 responses against the stored version and generation instant, the page's Major outage heading, Atom's exact incident entry and outage wording, and the widget's initial Major outage, incident identity and generation time. | push 44245059866, in_progress |
| 3. Stale content says Last known state and identifies its generation, and failed reads never invent an all-clear | **Held by lease.** Existing controls in `tests/e2e/snapshot-retained.test.mjs:239` through `:265` check the real HTML stale banner, retained generation, known outage, and Atom and RSS title preservation. The initial storage-down root refusal remains at line 98. The 17 November parser and feed-title decision is preserved. | push 44245059866, in_progress |
| Inherited BASE-OPS-001 health duty | **Existing proof reran.** The contract cites this duty at `CONTRACT.md:87`. `tests/e2e/snapshot-retained.test.mjs:49` runs the healthy schema journey. Lines 59–67 exercise Queue outage health and recovery. Lines 286–297 verify 503, no-store and database failure classification and suppress a false deployment-success response. | push 44245059866, in_progress |

PROBE PAGE-006 2: GET `/`, `/feed.atom` and `/widget.js` against empty snapshot storage, the durable replica and the edge cache, then against the same namespace after native rebuild → all three returned 503 without generation metadata, then 200 with the known Major outage content and generation 1.

## DONE-RIDERS

1. **PARTIAL.** The expanded retained journey proves leased acceptance 2. Acceptances 1 and 3 stay held. See the acceptance evidence.
2. **PASS for the lease.** The first-publication test proves the unavailable state and known seeded outage independently. `tests/e2e/snapshot-retained.test.mjs:89`, `:145`, `:196`.
3. **PENDING.** The existing push Verify runs the `composer` shard. 44245059866 was in_progress on the exact product SHA
4. **PASS.** The touched suite and typecheck ran on the full product SHA recorded in `LOCAL-CHECKS.json`.
5. **PASS.** The contract cites BASE-OPS-001. The inherited health controls reran.
6. **PASS for local generation.** The documented write and check both passed. The current Status, Gap and Evidence judgments and their provenance remain for the guarded lander to reconcile.
7. **PASS.** Acceptance text, citations and coverage map are byte-identical to main.
8. **N/A.** This acceptance adds no operator authority or mutation door.
9. **N/A.** The local recipe needs no external provider or legal receipt.
10. **N/A.** No new policy default.
11. **PENDING.** Candidate ref readback succeeded. Main equality, the complete publication scan and the candidate main-only Run site are guarded lander gates.

## Local checks and landing custody

- Build with the pinned Node, both tests in the touched file, typecheck and first-party rer check exited zero. The existing assertions stayed active. The test asserts the responses' availability, media type and known published content at the HTTP doors. No runtime or visual files changed, so there is no new layout proof or applicable UI gate for this slice.
- Both generated views were restored from main before the commit. The documented lock was regenerated last and its check passed. The lock delta contains hashes for exactly the two touched test files.
- Git checked every candidate commit including side parents and found fleet identity for both author and committer and no trailers. Added lines contain no email-shaped strings or bare owner and repository tokens. The cloud publication scan result is unestablished for this exact SHA. The full-history publication scan remains assigned to the Mac lander.
- The guarded lander owns final Verify and Run site checks at landing. Adoption and release prerequisites remain outside this test-only proof.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM PAGE-006 PARTIAL points=2 tests=tests/e2e/snapshot-retained.test.mjs#THEME-001 PAGE-005 PAGE-006 PAGE-007 PAGE-018 — a published status survives storage, database and queue failures, cold restart and an independent heartbeat silence alarm

GAP PAGE-006: Acceptances 1 and 3 remain held by the planner, including acceptance 1's one-hour PAGE-007 origin-cache proof.
