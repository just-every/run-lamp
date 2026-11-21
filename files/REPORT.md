# Lamp UPDATE-005 stale save after publication

Run Edit Run fleet, 21 November 2026. Round sd-lamp-c-f165.
Product branch `cloud/sd-lamp-c-f165` at `120746a7f36f4f3a054a2bd57b4f9f2dd6a5b807`.
Main at final integration `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`. Continuation base `268e93422a0ff044c720273e05da0eb74090a108`, retained as a parent.
Verify 44845638824 (push) was in_progress. https://github.com/just-every/run-lamp/actions/runs/44845638824

## Plan and result

1. Read the Next campaign extract, the UPDATE-005 clause and its Status row, the ct rulings, and all eleven DONE riders. The selected round covers the post-publication stale save in acceptance 4.
2. Trace the incident draft PUT in `src/core/features/incidents/routes.ts`, `src/core/features/incidents/service.ts` and `src/core/features/incidents/repository.ts`. The route reads the precondition and returns conflict on refusal. The repository atomically matches the current draft identity and published-update count before writing. No runtime correction was needed.
3. Extend the existing reviewed incident journey. Save the complete Monitoring inputs successfully, review, retain the draft identity and update count, and publish the same draft. Resend the exact original accepted input with the consumed version immediately after publication and before other incident writes. Confirm native HTTP 409, a null draft in the native view, no stored draft row, and exact equality of complete committed updates in both native readback and storage. The existing older-publish refusal and two-tab newer-draft controls are preserved.
4. Run the touched test file, typecheck, first-party checks, generated document write and check, source-lock regeneration and check. Review all candidate commit identities, messages and additions, then publish the branch and bind this packet to its full product head.

PROBE UPDATE-005 4: save the prior Monitoring wording with the consumed draft version -> HTTP 409, no draft and identical committed updates

CLAIM UPDATE-005 PARTIAL points=none tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion

GAP UPDATE-005: Acceptances 1–3 and 5–7, and acceptance 4’s complete newer acknowledged draft preservation proof, remain outside this lease.

Plan row to update is the continuation for UPDATE-005. Record the stronger acceptance 4 stale-save proof and preserve the PARTIAL judgment. Published counts stay at 45 DONE, 62 PARTIAL, 0 MISSING. Target counts stay at 20 DONE, 62 PARTIAL, 56 MISSING. Total counts are 65 DONE, 124 PARTIAL, 56 MISSING out of 245 before and after.

## Coverage and riders

| Acceptance | Evidence on candidate |
| --- | --- |
| 1 | Held. The existing native journey checks that populated private incident material is absent from several public surfaces. Complete public-surface coverage remains outside this lease. |
| 2 | Held. The existing browser journey records autosave and acknowledgement timing. Exact reload parity of the remaining draft fields stays outside this lease. |
| 3 | Held in part. Native publication consumes the draft at lines 208–218. Complete empty next-composer and lifecycle prompt proof is outside the lease. |
| 4 | The leased post-publication case passed locally at lines 180–240. Stale publish still returns 409 at lines 246–248. The existing two-tab stale-overwrite control at lines 806–816 of `tests/e2e/publishing-browser.test.mjs` remains unchanged. Its complete newer-draft proof was held by the planner. |
| 5 | Held. The additional acknowledged-version write doors are outside the lease. |
| 6 | Held. Fresh-composer acknowledgement and the Publish eligibility matrix are outside the lease. |
| 7 | Held. Lost-acknowledgement identification and reconciliation are outside the lease. |

| Rider | Finding |
| --- | --- |
| 1 | PASS for the leased refusal locally. The whole clause remains PARTIAL for the gaps above. |
| 2 | PASS for the leased refusal. The exact input first succeeds through the guarded PUT at line 187, then the consumed version is refused and both inventories are unchanged at lines 223–236. |
| 3 | `scripts/verification/plan.mjs` includes the native journey through `test:publishing` in the runtime shard. Verify 44845638824 (push) was in_progress. https://github.com/just-every/run-lamp/actions/runs/44845638824 |
| 4 | PASS locally. The focused native journey passed again with the candidate checked out at its full SHA. |
| 5 | Inspected. The lease relies on the incident draft precondition already named in acceptance 4. |
| 6 | PASS for mechanics. Generated documents are current. Status, Gap, Evidence and judgment provenance come from main. |
| 7 | PASS. The candidate preserves the full contract text. |
| 8 | PASS for the leased path. An authenticated draft author can save and a separate reviewer can publish. The same author’s stale save cannot modify native or persisted state. |
| 9 | Outside the leased stale-save operation. The proof runs in a local fixture. |
| 10 | PASS. The precondition implements existing contract semantics. |
| 11 | Pending guarded landing. Candidate main equality, full-history scan and candidate Run site await the Mac. The main base has green Verify 44839596494 and Run site 44839596465. |

## Mechanical and pre-READY checks

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The touched file retained all 11 registrations and all existing controls. The change adds no fixture email string or bare repository-shaped token. It changes only the existing native test and the source lock. It touches no screens, permissions, data erasure or provider boundaries. The replay exercised by this round returns conflict without a database write. No PR was opened because the branch push starts Verify. The publication scan is deferred to the Mac. Candidate scan fields are commit `120746a7f36f4f3a054a2bd57b4f9f2dd6a5b807`, complete unverified, historyScanned unverified, findings unverified.
