# Lamp API-001 acceptance 3

Run Edit Run fleet builder report for sd-lamp-c-f179, 2026-11-21 UTC.

- Repository: just-every/run-lamp
- Product branch: cloud/sd-lamp-c-f179
- Candidate: a97a162759fed8cdd80b9614209428928ffc0b64
- Main at handoff: 96b1d1ca2deb70b9e225ee217a3431ad7d16acc1
- Verify on candidate: push Verify 44880505744, completed with conclusion success
- Run site on candidate: awaits guarded main landing
- Counts before and after: 66 DONE, 123 PARTIAL, 56 MISSING, 245 total.
- Status and plan: API-001 remains PARTIAL. Record point 3 proof on the API-001 row of replan 38. The existing read-slice judgment and all contract judgments carry forward.

## Plan and execution

1. Read the clause and Status row and map the current journey to each acceptance. Confirm that the native component and metric reads authenticate, check scope and the token-specific quota, then record usage only after admission.
2. Extend the registered metrics journey using the existing clock Worker. Keep the existing metric, scope, revocation, provider redaction and retention assertions. At the end, freeze a future minute in the isolated Worker, issue two read tokens through the same operator session, exhaust the first through real versioned component requests and probe the metric read door through denial and reset.
3. Run the registered journey, stand-alone metrics flow, typecheck, contract generation and check, first-party structural check and source lock regeneration and check. Push the reviewed candidate from main through the fleet guard and capture the exact branch Verify status.

The trace is read-only. In `src/core/features/management-api/routes.ts:41` through line 54, authentication and scope precede the limiter, which uses the authenticated token ID. HTTP 429 and Retry-After precede `recordRead`. In `src/core/platform/security/rate-limiter.ts:6` and lines 17–36, the D1 fixed window floors the clock to a minute and uses a single conditional upsert to admit or refuse each scoped token. It resets the same token when the incoming minute starts after the stored one.

## Acceptance coverage

| Point | Result | Proof or held work |
| --- | --- | --- |
| 1 | Held | Existing issuance of the read and metric scopes stays covered in `tests/e2e/helpers/metrics-flow.mjs`. Full issuance scope and issuer-role matrix are held. |
| 2 | Held | The journey retains the existing hash-only, one-time bearer, usage and immediate read-revocation assertions at lines 26–53. The full token lifecycle and audit matrix stay held. |
| 3 | PASS locally | `tests/e2e/helpers/metrics-flow.mjs:164` through line 223. Distinct same-issuer tokens share the same operator. The first consumes its quota through native component requests. A metric request returns 429 and a Retry-After of 23 seconds with 22.5 seconds remaining. Token metadata stays identical after later refusals. A metric request with the second token succeeds in the same minute and advances its usage timestamp. At one millisecond before the boundary the first still receives 429 with Retry-After of 1 second. At the exact boundary it receives 200, the expected metric inventory and the boundary timestamp as last use. |
| 4 | Held | Component-write authority and incident-publish refusal remain held. |
| 5 | Held | Complete token and issuer write attribution, component state changes and audit view remain held. Existing metric write audit coverage remains active. |
| 6 | Held | Incident publication validation and review, computed external and live classes, and company policy remain held. |
| 7 | Held | OpenAPI 3.1 validation and the generated client lifecycle remain held. |

PROBE API-001 3: Native token issuance and versioned component and metric reads -> 60 component reads admitted before 429, Retry-After 23, unchanged refused credential metadata, second token 200, first token 429 at boundary minus one millisecond and 200 at the boundary.

CLAIM API-001 PARTIAL points=3 tests=tests/e2e/channels-and-presets.test.mjs#AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence

GAP API-001: Acceptances 1–2 and 4–7 remain held, including full resources and scopes, token lifecycle and audit, write authority and publication policy, and OpenAPI and generated client proof. The planner identifies TEAM-004, AUD-003 and AUTO-001 as dependencies for the broader resource and authority surface.

## DONE-RIDERS

| Row | Result and basis |
| --- | --- |
| 1 | PASS locally for point 3, `tests/e2e/helpers/metrics-flow.mjs:181` through line 222. Other acceptance points remain held. |
| 2 | PASS locally. The admitted metric reads reconcile the native operator inventory. Two refused reads preserve the same complete first-token record across changed clock instants. See lines 195–222. |
| 3 | push Verify 44880505744, completed with conclusion success. The existing registration at `tests/e2e/channels-and-presets.test.mjs:483` runs in the delivery shard through `scripts/verification/plan.mjs:10`. |
| 4 | PASS locally. The test and source lock are bound to the candidate by the receipt hashes. |
| 5 | INSPECTED. `CONTRACT.md:2581` records the inherited duties. BASE-ROLE-001 and BASE-AGENT-005 are exercised only within point 3 through native same-operator issuance and token identity isolation. BASE-AUDIT-001, BASE-AGENT-006 and BASE-AGENT-007 retain their existing broader clause gaps. |
| 6 | PASS for mechanics. Contract generation emitted zero changes and its check passed. The partial Gap and Evidence stay with the judging authority. |
| 7 | PASS by diff. The acceptance text and coverage map carry forward byte-for-byte. |
| 8 | PASS locally for this authority boundary. Lines 181–222 show that exhaustion affects only the first token and that refusal leaves its metadata unchanged. Existing scope and revoked-read 403 and 401 cases remain loaded at lines 32–53. |
| 9 | Outside point 3. The Worker uses local D1, a controlled clock and synthetic provider edges. |
| 10 | Outside point 3. The test follows the existing quota and authority policy. |
| 11 | Pending guarded landing. Main equality, the full-history publication scan and candidate Run site are established by the Mac lander. |

The new test catches missing quota enforcement, an operator-wide quota, an incorrect retry value, use recorded on a refusal and a reset on the wrong side of the minute boundary. The diff preserves all prior assertions and the number of registered tests. This API-only change leaves erasure and replay paths outside the lease. No touched UI needs additional browser proof. Changed lines were checked for email-shaped strings, credential-shaped additions and bare owner and repository references.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

Publication scan for a97a162759fed8cdd80b9614209428928ffc0b64: complete=unestablished historyScanned=unestablished findings=unestablished. Branch-only cloud publication leaves the full scan with the Mac lander.

## Execution receipts

- The candidate is advertised on the named branch. Main was at 96b1d1ca2deb70b9e225ee217a3431ad7d16acc1 at the final ref probe.
- The pinned local channels suite passed eight tests, including the unchanged registered monitors journey. The exact new metrics flow, typecheck and first-party check also passed.
- Two unrelated browser cases in the initial local command missed the default Playwright binary. Pointing both the explicit and default Playwright launcher paths at the VM Chromium resolved that setup issue on the pinned rerun.
- Main workflow checks at the base SHA: Verify 44876986189 (success), Run site 44876986360 (success), Verify 44875448330 (success).
- Candidate Verify URL: https://github.com/just-every/run-lamp/actions/runs/44880505744
