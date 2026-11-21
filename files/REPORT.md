# sd-lamp-c-f174 · Lamp recovery hold

Run Edit Run fleet, 2026-11-21 UTC.

- Repository and branch — `just-every/run-lamp`, `cloud/sd-lamp-c-f174`
- Product head — `8afab1e051703df9842745b725acef9a0b10575b`
- Main observed after the branch push — `2d49c9f3a8eb566e43b36126dbb844b6d9591b26`, the candidate's sole parent
- Status counts, before and after — 65 DONE, 124 PARTIAL, 56 MISSING, 245 total
- Plan row — `planner-return sd-lamp-replan-37`, AGENT-004, acceptance 3's one linked webhook hold proved locally. Acceptance 3 and the clause remain partial.

## Plan and result

1. Read AGENT-004's six acceptances and its Status gap. Read the recovery check, incident service and recovery repository. The repository links the incident to the authoritative receipt snapshot. The service uses the same recovery evaluator for the private check and publication. The prior incident-brief journey exercised a holding item and a reasoned override. It did not check the last millisecond of the hold or the first eligible publication instant.
2. Extend the existing incident-brief registration with the controlled Worker clock and a separate source and component. Accept one signed firing and one signed recovery through the public webhook. Read the exact operator receipt rows and compare the recovered marker on the original firing receipt. Save an independently read Resolved draft after an Identified publication.
3. Use the same versioned native publication request at 299,999 and 300,000 milliseconds after receipt recovery. Reconcile the linked item's source, key, evidence timestamp and recovery timestamp on both sides. Confirm the refusal preserves the full saved draft and committed updates. Confirm the successful publication writes the original draft's identity and wording, consumes the draft and leaves the private notes unchanged. Read the resulting public incident wording.
4. Run the touched journey on the exact clean commit with pinned Node. Check types, first-party project structure, generated views, Verify inventory and the source lock. Push the candidate and publish this packet separately.

## Exact-head proof

The test registration is in `tests/e2e/incident-brief.test.mjs:35`. The named `singleWebhookRecoveryHold` scenario starts at line 314. Lines 335–389 reconcile the signed webhook responses, receipt identities, exact evidence time and saved draft. Lines 392–409 reuse the acknowledged version, check a holding item and record a 409 with an unchanged draft and update list. Lines 411–431 check the same item as recovered and the 200 publication of the original draft and exact wording. The committed incident readback contains the new Resolved update and the full previous Identified update. The public incident permalink serves the Resolved wording.

`RECOVERY-RECEIPT.json` retains the actual synthetic receipt, incident, source, draft and update identities from the passing exact-head run. It records one passing test, two accepted webhook deliveries, the two checks and publication responses, and the full relevant draft and update readbacks. `CHECKS.json` records local command exits, observed refs and baseline CI.

PROBE AGENT-004 3: signed firing and recovery to the public intake route, then private recovery and versioned publish at 299,999 and 300,000 ms -> one linked item held, HTTP 409 with the identical draft and update list, then the same item recovered and HTTP 200 committing the same draft without an override.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The generator wrote zero documents and its check also passed on the clean commit. The lock diff contains only the tested file's digest. Verify's runtime shard already loads the case via `test:publishing`. The verification plan remains at 116 registered cases plus 10 assertion scripts. The existing provider, replay, publication and override assertions still execute. The diff is limited to the incident-brief test and source lock, with no UI work, production service edits, migrations, contract edits or generated views.

## Exact-head CI

Pushed Verify run 44874143345 was in progress as of 2026-11-21T06:19:12+00:00. Conclusion pending. The handoff records the pushed product head. Landing and the exact-main Run site are pending. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44874143345)

`CI.json` records discovery and both exact-head REST observations.

## Acceptance coverage

| Point | Result in this round |
| --- | --- |
| 1 | Held. The existing journey reads a hold and exercises refusal. The failing-monitor display is outside this lease. |
| 2 | Held. The existing reasoned-override journey remains active. Complete actor and override evidence is outside this lease. |
| 3 | The exact five-minute hold for a single linked webhook alert passed locally on the candidate. Multiple keys, grouped members, repeated recoveries and refiring of the same key remain held. |
| 4 | Held. The full later-firing and still-firing group case remains outside this lease. |
| 5 | Held. Historical and scheduled rechecks and override isolation remain outside this lease. |
| 6 | Held. Complete missing-evidence and evidence-carrier coverage remains with the cited clauses. |

RL-7 retains the held Base company-policy API and its external and live step-class boundary. DEP-001, HIST-006, HIST-010, INTEG-001 and COMP-008 retain their evidence duties. Adoption, UIP and release prerequisites are unchanged. No policy default was needed.

## DONE riders and pre-READY check

| Rider | Result |
| --- | --- |
| 1 | Partial. The exact-head native journey reaches the leased result at lines 397–431. The held acceptance outcomes above still preclude DONE. |
| 2 | Pass for the lease. The source, key, receipt timestamps, prior Identified update and saved draft are nonempty fixtures. The same request fails early without changing records and succeeds at the boundary. |
| 3 | The runtime Verify shard invokes the same registration. See the exact-head CI observation below. The controlled-clock journey also ran independently on the same commit. |
| 4 | Pass. The receipt and local test are bound to the clean product head. |
| 5 | Inspected. AGENT-004 names its three Base citations, RL-7 and the evidence-carrier duties. |
| 6 | Mechanical pass. Generated views check on the candidate. The existing Gap, Evidence and judgment provenance remain with the contract's writer. |
| 7 | Pass. No acceptance text or rider changed. |
| 8 | The native owner publication refusal and no-override completion are exercised. Broader authority controls are outside this lease. |
| 9 | Held. Synthetic HMAC requests establish the native boundary and carry no live-provider or company-policy claim. |
| 10 | Pass for the lease. No new custody, consent, spending or authority default. |
| 11 | Pending guarded landing. Main remains the candidate's parent. Candidate publication scan and Run site are unestablished. Main's parent has successful Verify run 44872765882 and Run site run 44872765905. |

The native test fails if the hold clears early, remains at its boundary, reports a different receipt timestamp, permits the early publication, loses the draft, rewrites existing updates or publishes a different draft. The pre-existing suite's identical accepted signed replay and unsigned refusal remain in this journey. Credential revocation and person erasure paths were not changed or requalified. The scope includes no changed screens. The fleet identity and trailer check covered the only candidate commit, and the added fixture text contains no email-shaped strings. The full-history publication scan remains with the Mac lander.

CLAIM AGENT-004 PARTIAL points=3 tests=tests/e2e/incident-brief.test.mjs#INTAKE-001 INTAKE-002 INTAKE-003 INTAKE-004 INTAKE-005 DRAFT-001 DRAFT-002 DRAFT-003 DRAFT-004 AGENT-002 AGENT-004 — authenticated alert to private evidence, cited suggestion and operator-approved recovery even when AI fails

GAP AGENT-004: This lease proves acceptance 3's five-minute hold for one linked webhook. Acceptances 1–2 and 4–6 and the remaining acceptance 3 matrix stay held, along with company-policy and external or live proof.
