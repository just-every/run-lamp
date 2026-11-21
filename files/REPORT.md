# Lamp TEAM-006 continuation

2026-11-21 · Run Edit Run fleet · just-every/run-lamp · cloud/sd-lamp-c-f201-pc1

The saved head was 17a8630d863575486a33c2f0334c75ed98efec86. Verify run 44938104883, attempt 1, failed in ownership job 136949469879. Aggregate job 136953277102 reported nine of ten shard results successful and rejected the ownership receipt. The local ownership step on the saved SHA with Node 22.20.0 and Verify's Chromium 153 reproduced the same timeout at the first provider login, exiting 1. The Chromium trace located the error at navigation to the synthetic authorization hostname, with net::ERR_NAME_NOT_RESOLVED followed by the Chrome error page. The VM's system Chromium 154 finished the same shard, which is why the reproduction used the workflow's pinned browser.

## Plan and results

1. Resume both saved product commits and reproduce the Verify failure on their exact head before editing.
2. Serve the existing OIDC authorization fixture over a separate loopback origin. Leave the built worker's native form submission, redirects, provider exchange and session admission in the browser flow. Keep the original assertions.
3. Merge current main, generate and check the contract views, restore the two generated views, validate the release migration inventory and relock last. Run the affected native and browser tests, typecheck and first-party validation. Inspect Settings and the public Sign-in notice at 1440 and 390.
4. Push the exact candidate and verify its recorded GitHub run. Give the lander the report, reproduction receipt and visual proof through the evidence ref.

The plan row for TEAM-006 remains PARTIAL. The candidate demonstrates the leased acceptance 1 behavior with a qualified fixture Auth OIDC provider. The recorded counts remain 66 DONE, 123 PARTIAL and 56 MISSING, 245 total. The candidate retains main's plan and contract judgments, including the existing acceptance text and generated views.

## Acceptance and scope

| Point | Evidence or remaining obligation |
| --- | --- |
| 1 | The identity journey in tests/auth-adoption/dependencies.test.mjs:169–253 proves the deployment Owner and freshness checks, refusal of an unqualified provider and acknowledgement of the qualified one, an independent readback, the notice after an ordinary email request, zero new mail and session rows, refusal of an unused link, provider sign-in for the same operator, and one-use recorded-owner recovery during a provider error. The Sign-in browser journey in tests/e2e/auth-adoption-journey.test.mjs:92, through tests/e2e/helpers/required-sign-in-flow.mjs:18–92, confirms the saved policy after reload, SSO notice without the email form, successful admitted-provider navigation, refusal of the earlier confirmation and restored email sign-in when the Owner clears the requirement. |
| 2 | Provider-driven deprovisioning and subsequent access refusal within 60 seconds are held. |
| 3 | Mapping a provider group change to TEAM-004 roles and removing publish rights is held. TEAM-004 roles already have a DONE judgment on main. |
| 4 | Provider lifecycle audit coverage is held. |

PROBE TEAM-006 1: Owner policy PUT and independent Settings GET acknowledged the qualified provider. The non-owner email request displayed the SSO notice. Refused requests added zero mail and session rows. The prior link returned 403 without a cookie. Fixture OIDC admitted the expected operator. The terminal grant opened a recorded Owner session once during the simulated provider outage, and replay created no session.

The native recovery portion uses an issued-grant fixture with the same stored digest and owner identity used by the terminal issuer. The separate deployment-custody journey in tests/auth-adoption/dependencies.test.mjs:349 exercises the real terminal command against a synthetic deployment edge. ACCESS-001's hosted custody proof, R-65 real vendor tenants, the full provider and SAML-only matrix, and the SCIM and role-sync release exclusion retain their existing obligations. The existing clause supplies the authority for the Owner's enforcement decision.

## Rider review

| Rider | Result |
| --- | --- |
| 1. Acceptance outcomes | Point 1 passed through Settings, sign-in and terminal recovery. Points 2–4 remain held. |
| 2. Meaningful supported and refused paths | The tests use existing invited identities, an actual captured earlier link, counts before and after refusal and the same operator after signed provider callback. |
| 3. Recorded Verify | See the exact-SHA run receipt. The existing ownership shard loads the two journeys. |
| 4. Exact candidate | Local tests and four screen captures ran from the candidate. The older run is used only as reproduction evidence. |
| 5. Inheritance | CONTRACT.md:2407 cites BASE-SIGNIN-001, BASE-ROLE-001 and BASE-OPS-005. Point 1 retains ACCESS-001 terminal recovery. |
| 6. Judgment and generated views | The contract generator write and check passed. Generated views were restored from main. TEAM-006's current judgment and provenance are retained for the lander. |
| 7. Accepted wording | Candidate diff against main contains no contract or generated-view edits. |
| 8. Authority | The identity journey exercises another Owner, a non-owner, a session needing fresh proof, an unqualified provider and the recorded Owner's allowed and replayed recovery. Existing erasure and revoked-session assertions remain. |
| 9. Provider boundary | Fixture Auth is in scope. R-65, SAML-only provider qualification and hosted custody remain unproven in this run. |
| 10. Policy ruling | The clause already assigns enforcement to the installation Owner and retains terminal recovery. The repair changes the fixture transport. |
| 11. Landing | Exact-main equality, full-history publication scanning and Run site are the guarded lander's responsibility. Both the scan and the final landed-main receipts are pending. |

## Pre-landing checks

The repair retains every existing user-flow assertion. The harness follows real form and callback navigations over loopback and verifies the admitted operator and session. The before and after authority, erasure and replay checks remain within the existing journeys. The test plan remains 119 registered cases plus 10 assertion scripts.

The changed configuration is in Settings. The policy selector, save button and provider button have visible labels. The viewport screenshots cover Settings and the Sign-in notice. The changed controls fit at both widths. The minimum measured visible text was 14 px in the policy controls and 16 px in the Sign-in notice. Those controls all have text labels. The narrow Settings capture includes the vertically scrollable Providers section. Accessibility scans at 1440 report zero serious or critical findings in the two screens. The selected fixture and report additions contain zero email-shaped strings. Full-history publication scanning and correctness on the final landed main SHA await the guarded lander.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=node scripts/validate-release.mjs exit=0

## Product and verification receipt

- Published product branch cloud/sd-lamp-c-f201-pc1, exact SHA 4524788cf708042f3e51e9612d36f246843602aa. The candidate includes main at 15da5a7ddfc8aaec69e7239e497cde2d35840f69. Main and the product candidate were distinct at the confirmed ref check.
- Exact-SHA Verify 44944512643, attempt 1, push event, completed, success. https://github.com/just-every/run-lamp/actions/runs/44944512643
- Candidate build, typecheck, first-party check, release migration inventory, contract generation and validation, source lock, and test plan passed. The three touched test files passed seven cases. The operator management flow also passed on Verify's Chromium 153. Screens were inspected at 1440 and 390.
- Full-history publication scan and exact landed-main Run site are pending with the guarded lander.

CLAIM TEAM-006 PARTIAL points=1 tests=tests/auth-adoption/dependencies.test.mjs#ACCESS-001 ACCESS-002 TEAM-001 TEAM-002 TEAM-003 TEAM-006 TEAM-007 native identity setup, provider approval, invitations and erasure keep access recoverable; tests/e2e/auth-adoption-journey.test.mjs#SETUP-002 ACCESS-001 TEAM-002 TEAM-006 native rer setup, owner sign-in, invitations and deliberate sign-out

GAP TEAM-006: Acceptances 2–4, full provider and SAML-only qualification, R-65, and ACCESS-001 hosted custody remain held. The SCIM and role-sync release exclusion remains in effect.
