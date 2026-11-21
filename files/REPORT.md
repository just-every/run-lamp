# Lamp required sign-in, sd-lamp-c-f201

TEAM-006 stays **PARTIAL**. Acceptance 1 is proven against an existing synthetic OIDC fixture. The recorded counts on main were 66 DONE, 123 PARTIAL and 56 MISSING out of 245. The candidate leaves those counts and the TEAM-006 Status row intact.

## Plan and results

1. Trace the lease to TEAM-006 and the BASE-SIGNIN-001, BASE-ROLE-001, BASE-OPS-005 and ACCESS-001 duties. The optional OIDC fixture already proved provider admission and one-use callbacks. The existing terminal journey separately proved deployed Owner grant issuance with fixture custody. The missing behavior was persisted required-provider selection, ordinary email refusal and terminal recovery with that selection active.
2. Add a Settings control for the current installation Owner after fresh proof. An enabled provider is offered after its OIDC exchange succeeds, its registration is pinned and it has no pending relink. Read back the saved provider independently after acknowledgement.
3. Suppress ordinary email issuance and refuse preexisting email proofs before session creation. Apply the policy at the HTTP routes and fence admission transactions in D1. Preserve email step-up bound to an existing session, the existing role checks and the terminal Owner grant. Clear enforcement in transferable archives so restored providers can qualify on the destination.
4. Extend the existing auth and browser journeys. Exercise positive provider admission, a denied non-owner policy write, an unqualified provider refusal, zero email and session creation for rejected sign-in and a terminal Owner grant that works once during the synthetic provider outage. Verify the Settings acknowledgement and public SSO screen at 1440 pixels and inspect both screens at 390 pixels.

The plan extract row for TEAM-006 from sd-lamp-replan-43 receives acceptance 1's fixture proof. Acceptances 2–4 remain held, including timed deprovisioning, TEAM-004 group-to-role and publish-right acceptance and provider lifecycle audit. SAML-only and the broader provider matrix, R-65, ACCESS-001 live custody and the SCIM and role-sync release exclusion retain their existing obligations. The fixture scope provides no provider release qualification.

## Acceptance and inherited duties

| Item | Result | Proof |
| --- | --- | --- |
| Acceptance 1, Owner selects an enabled and qualified provider | Passed locally | Native auth test authorization, failed unqualified selection and independent readback. Sign-in browser journey saves the selection and reloads the Settings value. |
| Acceptance 1, a non-owner magic-link request sees the SSO notice and sends no email | Passed locally | Native Hono form submission and follow-up built page. The capture count remains exact. Chromium renders the notice and the provider entry with the email form absent. |
| Acceptance 1, previously issued ordinary link opens no session | Passed locally | Native auth and browser journeys prove an issued link offered confirmation before the policy. Under enforcement, POST has no session cookie, native inventory is unchanged and an unauthenticated session request is refused. Clearing enforcement leaves the superseded ordinary token unusable. |
| Acceptance 1 and ACCESS-001, terminal Owner recovery | Passed locally within fixture scope | The native public Owner grant route opens the Owner session once during a controlled provider exchange failure. Replay has no session cookie. The Owner can clear the policy with the recovered session. The existing mocked deployment-custody journey independently runs the terminal CLI. Live custody remains held. |
| Acceptance 2, deprovision within 60 seconds | Held | No exact-SHA timed deprovisioning receipt in this lease. |
| Acceptance 3, role change removes publish rights | Held | TEAM-004 role mapping and publish-right proof remain held for SCIM. |
| Acceptance 4, audit every provider lifecycle change | Held | This change records policy updates. Provider lifecycle audit remains held. |
| BASE-SIGNIN-001 | Partial | The existing OIDC fixture completes a signed exchange and reaches the intended active operator under enforcement. Held provider qualification follows the field register. |
| BASE-ROLE-001 | Partial | A responder and another Owner cannot change the current installation Owner's policy. SCIM group mapping and publish-right behavior remain held. |
| BASE-OPS-005 | Partial | Policy writes record the actor in the same D1 batch. Provider lifecycle audit remains held. |
| R-65 field register | Held | The run used synthetic provider evidence. |

## DONE-RIDERS

| Row | Assessment | Proof |
| --- | --- | --- |
| 1 | Partial | Acceptance 1 executes the real Hono doors and built browser screens. The held outcomes in acceptances 2–4 remain unproven. |
| 2 | Pass for the lease | The auth fixture admits the active responder through OIDC, rejects ordinary email and replays, and recovers the recorded Owner. |
| 3 | Pending | Ownership Verify invokes both named journeys in the push workflow. |
| 4 | Pass for the lease | The receipt identifies the candidate and the tests, build and browser evidence used for it. |
| 5 | Pass | TEAM-006 cites the three Base duties and names ACCESS-001. |
| 6 | Pending judgment | Contract generation and its check ran. The recorded Gap, Evidence and judgment provenance are controlled at landing. |
| 7 | Pass | No acceptance point, rider or status cell was edited. |
| 8 | Pass for the lease | Responder, second Owner and stale Owner write attempts fail. The current Owner's confirmed write and terminal recovery succeed. |
| 9 | Partial | Synthetic OIDC and terminal fixtures suffice for this slice. Broader provider, legal and live custody claims stay with their existing register and clauses. |
| 10 | Pass | The selection applies the authority and scope already named in TEAM-006 and the lease. |
| 11 | Pending landing | Candidate branch provenance is in the receipt. Candidate main equality, full-history publication scan and Run site await the guarded lander. |

The production build and browser use the same changed source. Existing assertions were retained, including revocation of provider and email sessions after erasure, rejection of a replayed cancelled invitation and absence of a session after sign-out. The touched Settings section adds labelled text controls. Both screens keep readable text and fit at 1440 and 390 pixels. The browser assertions, including Axe and horizontal fit, run at 1440. The packet contains the four inspected captures. The existing verification plan counted 119 registered cases and 10 assertion scripts.

Candidate `17a8630d863575486a33c2f0334c75ed98efec86` is published on `cloud/sd-lamp-c-f201`. Exact-SHA Verify push run 44938104883 is in progress. The observed remote main is `a72f4668621d5d8a43c3e312bb1d24f4b9067831`. The guarded lander owns candidate publication scanning, main equality and Run site. The candidate base passed Verify 44936655191 and Run site 44936655200. [Candidate Verify](https://github.com/just-every/run-lamp/actions/runs/44938104883)

Verify 44937269514 failed in build job 136946565123 because the new migration was missing from the release inventory. The same build command reproduced the failure locally. The repair adds the migration entry and leaves the policy and browser files byte-identical. The repaired build shard and production archive command passed locally. [Initial Verify](https://github.com/just-every/run-lamp/actions/runs/44937269514)

**Test locations.** Native policy acknowledgement, refusals and readback are in `tests/auth-adoption/dependencies.test.mjs` lines 169–211. Provider login, forced outage and terminal recovery are in lines 213–253. The CLI custody edge is in the test at line 349. The Sign-in journey at `tests/e2e/auth-adoption-journey.test.mjs` line 92 runs the built browser proof in `tests/e2e/helpers/required-sign-in-flow.mjs` lines 18–101. The portability journey asserts archive and restored policy at `tests/auth-adoption/portability.test.mjs` lines 80–106 and 180.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=setup-migrations.test.mjs in the touched ownership command exit=0

PROBE TEAM-006 1: Owner policy save and readback, ordinary magic-link form and pre-policy link, signed OIDC callback, then terminal Owner grant during synthetic provider failure -> saved provider visible, SSO notice, zero mail and zero refused-path sessions, exact responder session, and one Owner recovery with replay refused.

GAP TEAM-006: Acceptances 2–4, the full provider and SAML-only matrix, R-65 and ACCESS-001 live custody remain held. SCIM and role sync remain excluded from release.

The exact-SHA Verify was still running when the task reached its ten-call GitHub budget.
