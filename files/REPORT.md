# Lamp · sd-lamp-c-f170

NOTIFY-009 stays PARTIAL. Counts on the candidate and its base are 65 DONE, 124 PARTIAL, 56 MISSING, 245 total. The planner row to update is NOTIFY-009 in replan 36. Record the two proved sub-outcomes and retain the held remainder. The delivery test file still registers eight journeys.

## Plan and implementation

1. Read the current NOTIFY-009 acceptance and Gap, then map the existing delivery journeys. The channel-selection journey proves ordinary recipient selection and public presence. The existing retry journey proves durable eligibility, exhaustion and silence for a failing webhook. Ordinary successful mail paths already use the signed receipt fixture. The missing leased sequence was native publication during a mail rejection followed by recovery of the same email set.
2. Trace the incident route, publication service, delivery service and Worker lifecycle. The native publication persists the update and selected recipients together. Deferred effects publish the public snapshot and attempt delivery. The delivery service freezes mail before sending and Cron and Queue observe the durable deadline. The signed Resend webhook records delivery separately from provider acceptance.
3. Extend the existing native retry registration with a mail recovery flow. Use a controlled Worker clock and a Resend HTTP 429 before acceptance. Compare the complete native delivery log to two independently selected active subscribers and read back the exact publication through the operator route and public incident permalink. Keep an active unrelated subscriber and add an eligible subscriber after publication to detect audience reselection.
4. Recover the same provider. Run Cron and Queue one millisecond early and again at eligibility. Compare exact delivery identities and durable envelope bytes, as well as provider request bytes and the recorded attempt IDs. Rename the page before retry so an erroneous rerender would change the wire payload. Reuse the signed receipt fixture to record both deliveries. Replay publication with its original revision, replay the receipts, and rerun Cron and Queue. The persisted work and provider acceptance inventory stay identical.
5. Run the touched test and typecheck, regenerate and check contract views, restore the tracked generated views from main, regenerate and check the source lock, and run the first-party profile. Publish the named product branch and record its exact-SHA workflow. Attach this packet to the evidence ref after product publication.

## Acceptance and inherited duties

| Item | Result and proof |
|---|---|
| Acceptance 1, mail-provider failure | Local pass. Native publication returns HTTP 200 with the saved draft's ID, signed-in readback returns the committed update, the public permalink displays its wording, and the log contains exactly the two selected queued recipients with recorded HTTP 429 failures and zero provider acceptances. See `tests/e2e/helpers/mail-outage-recovery-flow.mjs` lines 12–27 and 64–118. |
| Acceptance 1, Queue and subscriber-endpoint failure | Held by the planner. |
| Acceptance 2, PAGE-007 page, feed and widget timing and caching | Held by the planner. The native permalink read belongs to the mail-provider proof above. |
| Acceptance 3, recovery of the original email set with the same provider | Local pass. Early dispatch is silent. At the durable deadline the unchanged delivery records send the byte-identical envelopes exactly once, despite the rename and new eligible subscriber. The signed events mark each original row delivered, and the outbox marks the dispatch complete. Publication, receipt, Cron and Queue replays leave state and wire counts unchanged. See `tests/e2e/helpers/mail-outage-recovery-flow.mjs` lines 119–198 and `tests/e2e/helpers/subscriber-management-fixture.mjs` lines 69–76. |
| Acceptance 3, recovery on other channels | Held by the planner. |
| BASE-MAIL-001 | Cited by NOTIFY-009. Separate queued, provider-accepted and signed delivered outcomes are covered at lines 92–104 and 150–181 of the recovery helper. |
| BASE-OPS-004 | Cited by NOTIFY-009. The native delivery log exposes the provider's rejection on both queued rows at lines 79–100. |
| NOTIFY-003 | Existing journey remains registered and runs after the recovery flow in `tests/e2e/delivery-contract.test.mjs` lines 71–74. This run adds first-deadline same-provider recovery coverage and retains exponential, terminal and replay assertions. |
| Hosted and release boundaries | The provider edge is a synthetic Resend response. Live provider delivery, hosted acceptance and release qualification remain with their existing prerequisites. |

## DONE-RIDERS and self-check

1. Partial. The two leased outcomes are exercised through native HTTP, Cron, Queue and provider events. The other outcomes remain held.
2. Pass for the lease. The data includes confirmed recipients, a live unrelated control, an eligible late subscriber, and both rejected and accepted provider outcomes.
3. The Verify public shard calls the existing delivery test script. See the exact-SHA workflow status below.
4. See the candidate-bound local receipts below.
5. Pass. The receiving clause already cites BASE-MAIL-001 and BASE-OPS-004 and names NOTIFY-003 in acceptance 3.
6. Mechanical pass. Generated views pass their check locally and the candidate preserves main's judgment, counts, Gap, Evidence and provenance. Judgment provenance for this run awaits the landing gate.
7. Pass. The contract text is identical to main. Every prior assertion and registration in the touched areas is retained.
8. Pass for the leased replay boundary. Repeating the original publication under its stale revision returns HTTP 409. Replaying the signed events and native dispatches creates no additional send or state change. New credential and erasure behavior are outside this test-only change.
9. Pass. A signed fixture receipt proves Lamp's delivery reconciliation. Live mailbox delivery and provider qualification are outside the proof.
10. Pass. No policy default was needed.
11. Pending the guarded Mac lander. It owns the full-history publication scan, main equality after landing and the Run site workflow on main.

A change to the publication result, selected set, frozen request, durable deadline, receipt reconciliation or replay behavior would fail the relevant assertion above. No production screen changed, so the changed-screen browser requirement has no applicable screen.

CLAIM NOTIFY-009 PARTIAL points=none tests=tests/e2e/delivery-contract.test.mjs#NOTIFY-003 — Durable exponential retry eligibility, exhaustion and replay silence

GAP NOTIFY-009: Acceptance 1's Queue and endpoint failure branches, acceptance 2's full PAGE-007 timing and cache matrix, and acceptance 3's other-channel recovery remain held.

PROBE NOTIFY-009 1: Native publish during pre-acceptance Resend HTTP 429 returned HTTP 200. The public permalink retained the update and the operator log showed the two original selected recipients queued without provider acceptance.

PROBE NOTIFY-009 3: Native Cron and Queue were silent before eligibility. Same-provider recovery accepted the two original payloads once each at the durable deadline, and signed receipts marked both delivered. The unrelated and late-subscribing controls and all post-recovery replays produced no acceptance.

## Candidate and local gates

- Product branch `cloud/sd-lamp-c-f170` advertised at `0f1201cf5a7e3a46eb07fba4a3e7c415855e8ba2`. The last advertised main was `2939f22d0549be77fcc94315b2747667f8796e66`, also the candidate's sole parent.
- Focused exact-candidate Node 22.20.0 run passed with both NOTIFY-009 probes and the retained NOTIFY-003 assertions. The full touched file passed all eight journeys on the VM's Node 24.19.0 with system Chromium. See LOCAL-CHECKS.txt.
- Typecheck and the first-party profile passed. Contract generation wrote zero files, contract prose and generated views checked cleanly, and the edition source lock checked cleanly with the new helper indexed. The branch contains tests and the source lock only.
- The product push opened Verify by push event. The Mac lander owns the publication scan and Run site on main. This candidate is a branch-only handoff.

Verify [44863557965](https://github.com/just-every/run-lamp/actions/runs/44863557965) completed successfully on the exact candidate SHA after the branch push. Five GitHub API calls verified the run. The exact-SHA publication scan and Run site are pending the guarded lander.
