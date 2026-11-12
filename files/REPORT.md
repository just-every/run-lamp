# sd-lamp-c-f120 — SUB-001 public email consent

Product candidate: `f18784ba3a649ed6abde85401f3ea29dc793f19b`.
Branch: `cloud/sd-lamp-c-f120` in just-every/run-lamp.
Draft PR: https://github.com/just-every/run-lamp/pull/335.
Base main: `62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b`.

The generic public-email journey reproduced a real boundary error: the request at exactly twenty-four hours returned the neutral 202 response but sent no second confirmation (expected two captured confirmations, observed one). The atomic reservation now accepts an existing reservation at or before the cutoff. The conditional upsert still reserves before sending, so earlier repeats and concurrent requests remain suppressed.

The only product change is that comparison in `src/core/features/subscribers/repository.ts:251`. `service.ts` and `routes.ts` were read end to end; their pending state, provider send, unsubscribe reset and cross-site refusal already implement the required semantics. One focused sanity journey was added and registered at `tests/e2e/delivery-contract.test.mjs:64`, reusing `subscriber-management-fixture.mjs` and `automation-clock-worker.ts`. Operator authentication is refreshed after advancing the Worker clock.

No contract sentence, Status, Gap or Evidence cell changed. No existing assertion was removed, narrowed, skipped or placed behind a new condition. Existing repeat-submission assertions remain in `subscriber-preferences-flow.mjs:28-53`; successful script-disabled form submission remains in `public-contract.test.mjs:700-702`. No generated view, visual source, homepage, documentation site, workflow, release pin or migration changed. No temporary report or receipt is in the product tree.

## Counts and plan result

Actual before and after contract counts are unchanged: 57 done, 132 partial, 55 missing, 244 total. SUB-001 remains PARTIAL in the source pending the independent gate. Proposed guarded transition: SUB-001 PARTIAL to DONE, all five points; resulting counts would be 58 done, 131 partial, 55 missing, 244 total. No other clause changes are claimed. The plan row is reported here for the lane; cloud does not edit the Mac plan.

Inventory grows from 84 to 85 registered cases, with 10 assertion scripts unchanged: 94 to 95 checks, below the 200-test ceiling. No duplicate or pin test was encountered or removed. The new registration is one coherent public-consent journey.

The complete execution plan is in `PLAN.md`. No additional unblocked clause with the same native scope is specified by this extract. SUB-003 retains pending-expiry ownership; SUB-006 retains one-click and real-provider DKIM obligations. Twilio, hosted delivery, provider receipt and release prerequisites remain outside this claim.

## Frozen acceptance rubric

Each row uses the named registered generic consent test unless another journey is stated. Its full registration name is “SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary”. The helper is `tests/e2e/helpers/subscriber-public-consent-flow.mjs`. Native mutations go through ordinary HTTP doors; independent D1 reads only reconcile outcomes.

| ID | Acceptance sentence or inherited duty | Proof on candidate |
| --- | --- | --- |
| A1 | A submitted address becomes pending and receives one confirmation at that address within sixty seconds. | Helper lines 21-43 and 48-54: a direct anonymous form POST, independent operator readback, exact combined To, Cc and Bcc recipient set, provider acceptance identity and monotonic request-to-acceptance bound. |
| A2 | Repeated submissions allow at most one confirmation during twenty-four hours. | Helper lines 53-54 and 74-83: immediate repeat, refusal at 86,399,999 ms, admission at 86,400,000 ms, and another immediate refusal after that admission. Stored identity and lifetime remain unchanged. Existing repeat assertions remain active. |
| A3 | The emailed unsubscribe flow immediately restores the confirmation allowance. | Helper lines 85-98: actual emailed unsubscribe URL, rendered form and accepted POST, deactivated native readback, fresh confirmation at the same controlled instant as unsubscribe, fresh token authority, old-token refusal. |
| A4 | A pending subscription receives only its confirmation. | Helper lines 56-72: a real incident publication completes with one active control at provider acceptance; the complete delivery identity set contains only that active control; the pending mailbox remains exactly its original confirmation and its record is unchanged. |
| A5 | The public form works without scripts, refuses cross-site submission, and needs no ambient session or form token. | Helper lines 21-25 and 100-108: direct form request without prior form read, Origin, Cookie, Authorization or token; absent Set-Cookie; both new and existing cross-site addresses refused 403, every application table unchanged, no message sent. Retained `tests/e2e/public-contract.test.mjs:700-702` submits the real script-disabled form successfully; the complete named public journey passed on this exact candidate with exit 0 in `public-receipt.json` (699.163 seconds including runner overhead). `browser-receipt.json` adds exact-candidate form and result captures at both widths. |
| D1 | Inherited BASE-PUBLIC-001 privacy duty. | The receiving citation remains at `CONTRACT.md:134`. Retained `public-contract.test.mjs:262-279` checks the initial form, own-origin resources and isolation headers. Its active `public-isolation-flow.mjs:44-63` and 67-124 journey passed locally on the candidate and checks empty cookies and all browser stores, no attempted storage writes, no CAPTCHA or consent prompt, across initial read, polling, publication and reload. No new provider or visitor-data flow was added. |

## Runtime probes

PROBE SUB-001 1: anonymous POST to the public subscribe route -> 202, pending native row, exactly the submitted recipient and provider acceptance before the measured sixty-second deadline.
PROBE SUB-001 2: repeat at first reservation plus 86,399,999 ms -> no send; at plus 86,400,000 ms -> exactly one new confirmation; immediate repeat -> no further send.
PROBE SUB-001 3: actual emailed unsubscribe form and POST, then resubmission without advancing time -> deactivated then pending with a fresh confirmation; old confirmation 404, new confirmation 200.
PROBE SUB-001 4: publish an incident with pending and confirmed subscribers -> confirmed control accepted, complete publication recipient inventory excludes pending, pending mailbox remains confirmation-only.
PROBE SUB-001 5: direct form POST without session or form token -> accepted; cross-site new and existing address POSTs -> 403 with every application table and all captured mail unchanged; real script-disabled form -> pending and one confirmation.

## DONE-RIDERS

| Row | Result and evidence |
| --- | --- |
| 1 | PASS: A1-A5 and D1 are covered by the named public-door journeys; push Verify 43195863784 completed success on the exact candidate. |
| 2 | PASS: real seeded pending and active subscribers; positive publication control plus complete recipient reconciliation; cross-site unsafe path refused with whole application-table invariance and no mail, helper lines 56-72 and 100-105. |
| 3 | PASS: push Verify 43195863784 completed success on the exact candidate. The new test is directly registered in `delivery-contract.test.mjs:64`, invoked by package script `test:delivery` and the shared public Verify shard. The retained script-disabled test is invoked by `test:public` in composer. Timing and clock proof passed outside Verify on the candidate at 10:03:57 UTC; `consent-timing-receipt.json` binds the command and exit 0 to the candidate. `focused-consent-measurements.json` records all four acceptances at 99.238, 46.320, 30.671 and 61.644 ms. Exact run conclusion is recorded below. |
| 4 | PASS: all final execution receipts name the full candidate SHA. No relevant source or test byte changed after that commit. Earlier reproduction is clearly marked pre-fix and is not claimed as passing proof. |
| 5 | PASS, INSPECTED: inherited privacy duty is explicitly cited at `CONTRACT.md:134`, with proof D1 above. |
| 6 | PASS mechanical: generator write and check both exit 0, writes zero files; generated files restored from origin main. Status and Gap remain the lander's exclusive responsibility. Candidate provenance is recorded in receipts rather than editing the judged-from line. |
| 7 | PASS, INSPECTED: no acceptance text or ruling changed, so no rewrite or coverage remap applies. |
| 8 | PASS: anonymous public authority is allowed; cross-site authority is refused without changes; revoked confirmation authority cannot activate the reopened lifetime, helper lines 96-108. Operator authority is not broadened. |
| 9 | PASS scope: controlled Resend network acceptance only, not mailbox delivery, DKIM or hosted provider performance. No live provider or legal guarantee is claimed. |
| 10 | PASS, INSPECTED: no new policy default was adopted. Existing exact-boundary and unsubscribe semantics come from SUB-001 itself; RL-101 and RL-102 do not change this clause. |
| 11 | PENDING guarded landing: main equality, exact landed Verify, Run site and the complete full-history publication scan are fleet duties. This cloud branch is not counted as landed. |

## Pre-ready self-check

1. Each named outcome has a live public-door assertion; removing a confirmation, weakening the allowance gate, sending to the pending subscriber, requiring ambient authority, or accepting cross-site writes breaks the corresponding journey. The pre-fix failure demonstrates sensitivity to the exact boundary.
2. No existing assertion changed. The diff only adds the new registration and helper, the atomic cutoff comparison, and generated source-lock entries.
3. Unsafe cross-site requests preserve every application table and emit no mail. Revoked confirmation links cannot reactivate the reopened subscription; only fresh authority succeeds. Existing subscriber authority and erasure journeys remain registered and retained.
4. No visual source changed. The real public form and result were inspected at 1440 and 390; ordinary text fits, addresses wrap, and all interactive controls on these screens have text labels. The envelope and status symbols are decorative rather than icon-only controls. Existing Settings placement is unchanged.
5. Source lock and contract generation pass on the exact candidate. Scan and landing status are reported honestly below. New fixture addresses are assembled from synthetic labels and a reserved test domain; no literal email-shaped fixture value or provider-shaped credential was added. All candidate author and committer identities are fleet identities, with no co-author trailer.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock then check exit=0; views=node src/base/contract-docs.mjs write then check exit=0; ledger=none exit=0.

## Custody and pending results

Product push succeeded on the first guarded attempt. The checkout was rebased onto current origin main before that push, with no change in base. No main push, force push or published-history rewrite occurred. Product identity and full messages were inspected before push; there is one fleet-authored and fleet-committed candidate and no trailer.

Main at inspection was `62e6a2c30f7f87ad29c5e9d3eec2e0946315cc6b`: Verify push run 43083760988 success, Run site push run 43083760843 success. Candidate push Verify 43195863784 completed success on `f18784ba3a649ed6abde85401f3ea29dc793f19b`, observed at 10:13:20 UTC. This is the push event, not an older commit or a PR merge SHA. Six GitHub calls were used, one watcher, and each run poll was at least 300 seconds apart. The PR is draft #335. Final local receipts, exact-SHA CI state, publication-scan limits and evidence transfer appear in the appended final-results section.

## Final results

CLAIM SUB-001 DONE points=1,2,3,4,5 tests=tests/e2e/delivery-contract.test.mjs#SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary; tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story

All seven delivery registrations passed on the committed candidate (1,146.875 seconds total). The retained public journey passed (699.163 seconds total). No local command timed out, no failing existing assertion was repaired, no test was weakened, and no CI repair or rerun was needed.

- `delivery-receipt.json`: exit 0, exact candidate, completed 2026-11-12T10:15:38.178193+00:00.
- `public-receipt.json`: exit 0, exact candidate, completed 2026-11-12T10:08:11.928027+00:00.
- `consent-timing-receipt.json`: exit 0, exact candidate, completed 2026-11-12T10:03:57.746845+00:00.
- `browser-receipt.json`: exit 0, exact candidate, completed 2026-11-12T09:58:59.646701+00:00.
- `typecheck-receipt.json`: exit 0, exact candidate, completed 2026-11-12T09:58:37.961991+00:00.
- `first-party-receipt.json`: exit 0, exact candidate, completed 2026-11-12T09:59:50.465171+00:00.

The final full-delivery run measured its four generic confirmation acceptances at 79.928 ms, 33.208 ms, 29.514 ms, 50.103 ms. The separate committed-candidate clock and timing receipt also passed and is included. These are controlled provider-edge acceptance measurements; they do not claim live mailbox delivery.

Push Verify event: completed success, run 43195863784, exact head `f18784ba3a649ed6abde85401f3ea29dc793f19b`, https://github.com/just-every/run-lamp/actions/runs/43195863784. Every acceptance row A1-A5 and inherited duty D1 passes locally and is loaded by this green Verify. DONE-RIDERS rows 1-10 pass in the scoped sense described above; row 11 remains pending the guarded fleet landing.

Main equality: false at the custody inspection. Main is still the base SHA in `custody-receipt.json`; only the named cloud branch was pushed. Candidate Run site: not run, because it belongs to the subsequent main landing. Base main Verify 43083760988 and Run site 43083760843 were both success.

SCAN commit=f18784ba3a649ed6abde85401f3ea29dc793f19b complete=NOT_RUN historyScanned=NOT_RUN findings=NOT_RUN. The cloud exception delegates the complete full-history publication scan to the fleet; no zero-findings scan result is invented. The product clone has full history. The lander must scan and require Run site on its resulting main SHA before counting the clause.

No product blocker remains. No policy default was adopted. No missing account, live-provider key, Base change or another seed prerequisite is needed for SUB-001. The unchanged provider and release holds of other clauses are not absorbed into this claim.

The packet is explicitly selected and checked for regular files, exact-candidate receipts and obvious credential material before the evidence-only transfer. The terminal EVIDENCE line identifies that transfer; it does not signal product acceptance or landing. The clone and its dependencies are removed only after product and evidence publication succeed.

POST lanes/sd/INBOX.md: sd-lamp-c-f120 SUB-001 claimed DONE points=1,2,3,4,5; daily boundary corrected, all five generic consent groups proven; candidate f18784ba3a649ed6abde85401f3ea29dc793f19b; branch cloud/sd-lamp-c-f120; PR https://github.com/just-every/run-lamp/pull/335; Verify push 43195863784 success; seven delivery tests and retained public journey pass; source counts unchanged 57 done, 132 partial, 55 missing of 244; proposed guarded counts 58 done, 131 partial, 55 missing; contract judgments untouched; publication scan and main landing remain with fleet.
