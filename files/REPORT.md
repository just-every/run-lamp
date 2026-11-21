# Lamp UPDATE-012 acceptance 5

Round sd-lamp-c-f184, prepared by Codex on 21 November 2026.

## Plan and result

UPDATE-012 in sd-lamp-replan-39 was the only leased plan row. It called for a native attachment-conflict proof in the existing reviewed-incident registration. The plan was to capture the reviewed revision, detach the staged component, reconcile exact saved state around the refusal, and retain a matched publish control.

- Product branch cloud/sd-lamp-c-f184, head 35e766f177caa0d6b6a9cd40acc0e561709984fc. The parent and fetched main were f95b99b87f0ab98c8ad15c8e842a77baf30c95b1.
- Counts before and after were 66 DONE, 123 PARTIAL, 56 MISSING, 245 total. UPDATE-012 remains PARTIAL with acceptance 5 now covered through native routes. Verification inventory remained 126 checks, including 116 cases and 10 assertion scripts. The touched file retained all 11 registrations.
- The test and its regenerated source lock are the only two files in the product patch. All earlier assertions are intact. The source contract, generated views and Verify workflow match the fetched main.
- The first full-file run reached the native probe but could not launch the maintenance browser because the Playwright browser download was absent. With the VM Chromium path configured, all 11 tests passed on the same product head.
- Fetched main had successful Verify 44888108728 and Run site 44888108898 on its exact SHA. Candidate Verify is recorded in the accompanying CI receipt. Candidate scan fields for commit 35e766f177caa0d6b6a9cd40acc0e561709984fc are complete unestablished, historyScanned unestablished, findings unestablished. The guarded lander owns the full publication scan, equality with main and the landed head's Run site.

## Native proof

The existing journey is registered at tests/e2e/publishing-contract.test.mjs:79. Lines 630–649 create a two-component incident, publish an Investigating update, and save and review a Monitoring update whose staged change references an existing attachment. The journey retains the exact reviewed draft revision.

At lines 668–684, native DELETE detaches the staged component. Native readback retains exactly the other attachment, the reviewed draft and the opening update. The saved precondition reconstructed from the readback equals the original. Native publish sends that explicit If-Match and selects email. It returns HTTP 409 with “An affected component changed after this draft was staged. Reload and review the component changes.” The exact native detail and all 13 persisted inventories match their post-detachment snapshots. The fixture pauses consumers while comparing draft, update, attachment, audit, claim, history, channel selection, notification, delivery, attempt and outbox rows.

At lines 686–697, a matched two-component incident with both attachments still present publishes successfully with the current If-Match and same channel selection. HTTP 200 commits the reviewed draft identity and wording as the next update, preserves both attachments, applies Degraded performance to the staged component and captures one committed email recipient.

### Read-only source trace

- src/core/features/incidents/component-staging.ts:7 captures attachment ID, state and last change time with the staged choice. Line 28 rejects a missing or changed attachment before publication planning.
- src/core/features/incidents/routes.ts:127 dispatches native detachment. Line 173 passes the draft precondition through and maps the attachment conflict to HTTP 409. src/core/features/incidents/service.ts:146 checks draft identity before projecting staged component changes. Native detachment updates the attachment and history through src/core/features/incidents/repository.ts:128.
- src/core/features/incidents/publication-repository.ts:24 repeats the staged attachment checks inside the D1 batch. The batch writes the update, claims, aggregate state history, publication audit and notification work, and consumes the draft. The runtime probe covers detachment before publish. The in-transaction race fence was inspected.

## Acceptance coverage

| Point | Scope and evidence |
| --- | --- |
| 1 | Retained composer claim and selector coverage. Existing browser selectors are exercised at tests/e2e/publishing-browser.test.mjs:758 and tests/e2e/publishing-browser.test.mjs:917. Full selector proof is outside this lease. |
| 2 | Retained Operational release with attachment preserved. The dormant helper at tests/e2e/helpers/update-component-flow.mjs:111 contains a related native check. Registered proof of this point is outside this lease. |
| 3 | Retained staged addition and release. This round stages a change to an existing attachment at tests/e2e/publishing-contract.test.mjs:635. Staged addition and release are outside this lease. |
| 4 | Retained private and acknowledged draft assertions at tests/e2e/publishing-contract.test.mjs:181 and scheduled publication at tests/e2e/publishing-contract.test.mjs:1232. The full component-choice matrix is outside this lease. |
| 5 | PASS locally through native save, review, detach and publish. Draft continuity and 409 at tests/e2e/publishing-contract.test.mjs:668, durable no-change assertions at line 682 and matching 200 at line 686. CI event and conclusion appear in the CI receipt. |
| 6 | Retained Resolved release and selectors. The existing browser journey resolves and checks the published incident at tests/e2e/publishing-browser.test.mjs:922. The full release and selector matrix is outside this lease. |

API-001, API-002, AUTO-001, and the MAINT and SMS channel contracts retain the planner-held every-door work. COMP-006 and UPDATE-005 keep their scopes. Adoption, UIP and release prerequisites remain in effect. The separate aggregate-history gap remains in main's recorded judgment.

## DONE riders

1. PASS for acceptance 5. The registered journey at line 79 exercises the native endpoints and checks both outcomes. Full-clause coverage stays partial.
2. PASS. The negative case compares a populated incident and exact durable inventories. The equivalent two-component control succeeds through the same authorized route.
3. The runtime Verify shard invokes the existing test:publishing command via scripts/verification/plan.mjs:12. Exact-head push Verify 44890412769 reported success.
4. PASS. The local test and check receipts are bound to the candidate head.
5. PASS for the lease. Acceptance 5 expressly names the conflict. Existing every-door and inherited duties retain their clause owners.
6. PASS for generation and lock. The generator reported zero prose warnings and zero changed views. Status, Gap, Evidence and judgment provenance retain main's recorded values for the lander.
7. PASS. Acceptance text, riders and coverage mapping are identical to the parent.
8. PASS for the leased wrong-state boundary. The authorized reviewed update is refused without state changes when its attachment has been detached. The equivalent authorized update with live attachments succeeds.
9. PASS for the lease. The one email count demonstrates committed work in the synthetic fixture. Live provider qualification stays with its owning clause.
10. PASS. The test exercises existing policy. No new default was required.
11. PENDING guarded landing. The publication scan, main equality and candidate Run site remain unestablished.

The patch preserves existing authority, erasure and replay assertions. The added text contains no email-shaped strings or bare repository tokens. Candidate commit identities and trailers were checked across the full range, including side parents. There are no changed screens in this native test round. Branch push starts Verify directly.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM UPDATE-012 PARTIAL points=5 tests=tests/e2e/publishing-contract.test.mjs#INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion

GAP UPDATE-012: Acceptances 1–4 and 6 and the planner-held every-door proof under API-001, API-002, AUTO-001 and the MAINT and SMS channel contracts remain open.
