# Lamp UPDATE-015. Reviewed Monitoring preview and email

Run Edit Run fleet (Codex), 21 November 2026  
Task sd-lamp-c-f191 · just-every/run-lamp · branch cloud/sd-lamp-c-f191

## Scope and plan

The planner leased the reviewed native preview and email wording portion of acceptance 1. I followed the UPDATE-015 row from the current plan extract. I read the acceptance text and existing Status gap, mapped coverage in the incident journey, traced the saved draft through native preview and the published record into the provider request, and extended the existing Monitoring step-down. The test still uses the original reviewed-draft workflow, initial incident publication, reader confirmation and independent native incident readback.

The previous test staged both changes and checked the public component's final state. The earlier Identified email proof compared wording with preview on a different publication. The Monitoring step now reads its own reviewed preview with both choices saved, explicitly selects email, and compares the submitted wording and committed state to the preview and the captured provider message for the confirmed reader. It checks the independently expected customer wording “Payments API: Down → Slow” and requires the separately staged and committed internal transition to be absent from the customer page preview and both text and HTML mail representations.

src/core/features/incidents/service.ts stages and previews saved choices at line 317 and hands the publication and recipient statements to the repository at line 214. src/core/features/incidents/publication-repository.ts persists wording and immutable transitions in the update row at lines 32–35. src/core/features/incidents/renderer.ts filters internal changes at lines 40–43 and appends the component lines alongside the wording at line 60. src/core/features/deliveries/service.ts renders the committed wording and changes into the provider envelope at lines 181–225. The email transport is captured at the synthetic provider edge. The test verifies provider acceptance for the exact committed update through native reach.

## Acceptance and proof

| Acceptance | Evidence and result |
| --- | --- |
| 1, reviewed native preview and email | Local pass. The existing reviewed incident journey in tests/e2e/publishing-contract.test.mjs lines 203–285 checks the exact staged public and internal choices, public preview fields, committed previous and new public states, wording and commitment, one provider message for the confirmed reader, and positive public wording and internal exclusion in preview and received text and HTML. |
| 1, remaining surfaces | Public timeline, history, feeds, Slack, Teams, and two-segment SMS parity remain with the planner's held every-door work. |
| 2 | Full per-recipient and channel matrix remains held. |
| 3 | Full Lamp and Statuspage webhook coverage remains held. |
| 4 | Component-only recipient event remains held. |
| 5 | Opted-in Statuspage webhook incident and component-event sequence remains held. |
| 6 | Full template, automation and chat consistency remains held. |
| 7 | Native management publication with per-component choices remains held. |
| 8 | Statuspage-compatible writes of the same atomic choices remain held. |

PROBE UPDATE-015 1: review the saved public and internal component changes in native incident detail, then publish with email selected -> the public preview, committed update, and captured provider message agree on exact submitted wording and the public step-down, and customer text and HTML exclude the independently committed internal transition.

## DONE riders

| Row | Candidate result |
| --- | --- |
| 1 | Partial. The leased native and email outcome passes locally at lines 203–285. The acceptance table records the outstanding doors. |
| 2 | Pass for the lease. The public change is required and the simultaneously staged and committed internal change is absent in the customer views at lines 208–285. Expected wording and states come from the submitted fixture and independent labels. |
| 3 | See the exact-SHA Verify receipt. The existing runtime shard runs test:publishing. |
| 4 | Pass. The receipt binds the test and source lock to the candidate. The runtime probe and touched checks use those same test bytes. |
| 5 | Inspected. UPDATE-015 retains its inheritance from UPDATE-012 and the held obligations keep their current owners. |
| 6 | Generated documents pass the mechanical check. Existing Status evidence and judgment provenance await the independent gate. |
| 7 | Pass. The candidate carries no acceptance text change. |
| 8 | Pass for the lease. The distinct reviewer is required before publication, with the pre-review publication refusal retained at line 126 and the internal data exclusion at lines 230 and 247–284. Full management authority remains held. |
| 9 | The network-edge fixture proves received payload and provider acceptance in the fixture. Live provider or mailbox qualification is outside the lease. |
| 10 | No new custody, consent, spending or authority policy decision. |
| 11 | Guarded landing, exact-candidate publication scan and landed Run site remain with the Mac lander. |

Existing assertions remain, including stale-draft refusal and publication immutability. The scoped change exercises authorized publication and excludes internal data. Revocation and erasure behavior are outside the test change, and the replay refusal remains in the same journey. This is a test and source-lock change with no UI change. No test registrations were added or removed. Candidate diff inspection found no newly added email-shaped values or bare owner and repository tokens. The exact tree's publication scan is deferred to the Mac lander.

## Plan return

Update the Next campaign UPDATE-015 row with the passing scoped native evidence and leave the row partial. Before and after counts are 66 done, 123 partial, 56 missing, 245 total. API-001, API-002, AUTO-001, and the MAINT and SMS channel contracts hold the remaining every-door work. UPDATE-012, UPDATE-014 and NOTIFY-017 retain their scopes. No policy default was needed.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Candidate and custody

Product candidate 50a14ac41d5af6d925b44f3fe1ece53319582f2a was advertised on cloud/sd-lamp-c-f191 immediately after its first commit. Its parent is main 9ea011e0fe99033bc4e3d09fd6b6f96252c55324, whose Verify 44899481148 and Run site 44899481252 succeeded. The rebase retained main's newer detachment assertions within the same incident case. The branch is eligible for push Verify through the existing workflow. No pull request was created.

Candidate scan receipt awaits the guarded lander. Scan commit 50a14ac41d5af6d925b44f3fe1ece53319582f2a, complete unestablished, historyScanned unestablished, findings unestablished. The product SHA is on the candidate branch and differs from main. Candidate Run site awaits guarded landing.

CLAIM UPDATE-015 PARTIAL points=none tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion
GAP UPDATE-015: The rest of acceptance 1 and acceptances 2–8 remain held with API-001, API-002, AUTO-001 and the MAINT and SMS channel contracts. The acceptance and rider tables above record the proof and remaining obligations.

Exact-SHA push Verify 44900080325 was in progress at the final cloud poll. The touched candidate test file passed all 11 cases. Typecheck, first-party check, build, generated-view check and source lock check passed. CI.json records the observed branch and main refs and full run metadata.
