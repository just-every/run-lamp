# Lamp subscriber details: main-lamp-subscriber-details-1

Repository: just-every/run-lamp
Branch: cloud/main-lamp-subscriber-details-1
Reproduction base: 733e2ce1e2fc618183a93632218bb86456a06a79
Product head: 5938ef9f62f149729e1a54695d5331f10ca0db0b

## Requested results

All three stranger findings reproduced on current main through local public and operator browser doors. Public subscription selected Harbour Checkout; Add subscriber selected Harbour Order API; the owner confirmed both through Delivery log. Both rows displayed only “1 selected component”. A reviewed two-address CSV displayed its internal batch suffix between import time and remaining count. Send invitations reported “2 invitations sent. 0 remaining” while both corresponding Delivery log records said “Not sent locally”. The exact observations are in reproduction.json; screenshots contain invented Harbour data only.

The directory now shows each selected component's name directly in its existing Selection cell. Names come from the repository read joining the saved selection to the component. All-components and incident-following labels retain their meaning. CSV batch options show “CSV import”, the existing operator-local import time, and the remaining count; the option value remains the internal selection key, but that key is not displayed. Local invitation feedback states no email was sent from this local copy and links directly to Confirm locally in the Delivery log. The existing localMail flag from the directory's API response controls that feedback. Configured-mail feedback keeps its existing result.

No subscriber authority, import write, invitation response shape, confirmation rule, public subscribe form, transport path or invitation claim behavior changed. The owner intent is recorded in DIVERGENCE.md. CONTRACT.md Status, Gap, Evidence and generated acceptance views remain untouched.

## Plan and execution

1. Applied the fleet identity, refreshed the launcher, installed decrypted-bundle Git authentication, the push guard and preserving commit hook, then read launcher/repository requirements and the inline builder rules. Only just-every/run-lamp was cloned/written.
2. Set up Lamp through rer setup with the fleet owner. Used its documented local owner/public doors to reproduce trips 2, 3 and 4 before editing. Kept the plan, reproduction record and images outside the checkout.
3. Added component names to the existing subscriber component read and rendered those names in each row. Replaced the batch suffix with plain source text. Used the already-loaded local-mail mode for the invitation result and its Delivery log link.
4. Extended the existing local subscriber and configured-mail intake journeys without registering new tests. The local journey covers two distinct component-specific subscribers created from the public form and owner Add form, confirmed through Delivery log, plus all-components imports and truthful suppressed invitation feedback. It follows the result’s Delivery log link and confirms both imported pending subscribers there, while checking their Not sent locally outcomes. The configured journey checks exact selected names and exclusions, identifier-free source/time/count labels, two independently selected durable batches, unchanged sending feedback and the precise provider recipients, with no duplicate invitations on reload.
5. Ran the touched journeys and typecheck, the production build, source lock generation/check, contract document check and test inventory. UI assertions run at 1440; the changed subscriber screen and invitation states are captured at 1440 and 390. Browser instances and only servers started by this task were closed by their owning fixtures.
6. Fetched origin/main and rebased the unpublished work with autostash; main remained at the reproduction base. Regenerated the source lock last. Product publication uses the named branch with fleet commit identity, candidate-wide identity/message/trailer inspection and the fleet push guard. A PR is left for the lane; this cloud never updates main.
7. Saved actual non-secret reports and receipts, selected the relevant screenshots explicitly, and published the report-only packet to the separate evidence ref. The fleet owns the full publication scan, landing and independent acceptance.

## Validation results

All local touched checks passed: the complete maintenance-timezone file (3/3), the final affected local-owner journey (1/1), the final subscriber consent/import/delivery registration (1/1), typecheck, production build, source-lock generation/check, contract-document check, inventory and whitespace checks. Exact commands, exits and product file hashes are recorded in validation.json; actual terminal output is retained in the selected log files. The final configured journey ran for 307.8 seconds, the final local-owner journey for 84.5 seconds. The product branch was pushed successfully on the first guard attempt. Exact-SHA Verify 43455239953: in_progress/pending; https://github.com/just-every/run-lamp/actions/runs/43455239953. PR: https://github.com/just-every/run-lamp/pull/355.

The initial configured journey rejected an extra mailSuppressed response member against its existing exact-response assertion. That first attempt is retained in configured-first-attempt.log. The final implementation uses the page's existing localMail flag instead, preserving the original API response and its assertion.

Test count: 90 registrations + 10 assertion scripts = 100 checks before; 90 + 10 = 100 after. Cap: 200. Added registrations: 0. No test was deleted, skipped or weakened. Name-pattern selection runs only the affected existing registrations locally; full exact-SHA Verify is the branch CI wall.

## Clause claims

CLAIM SUB-011 PARTIAL points=2 tests=tests/e2e/maintenance-timezone.test.mjs#SETUP-001 SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications; tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure
CLAIM SUB-017 PARTIAL points=2 tests=tests/e2e/delivery-contract.test.mjs#SUB-019 SUB-001 SUB-002 SUB-003 SUB-004 SUB-005 SUB-006 SUB-007 SUB-008 SUB-009 SUB-010 SUB-011 SUB-012 SUB-013 SUB-016 SUB-017 SUB-018 SUB-020 PAGE-013 HIST-007 TEAM-003 TEAM-004 UPDATE-008 NOTIFY-007 — Subscriber consent, selected publication, channel delivery, export and erasure

Clause status changes: none. The before/after clause counts are identical: 60 done, 129 partial, 55 missing, 244 total. These are recorded in contract-counts.json, computed by the seed’s own contract parser. No DONE claim. These claims identify the operator selection point and the existing full 100-row reviewed import / explicit at-most-once invitation journey extended with UI proof. They do not claim the whole clauses anew.

DEFAULT SUB-017: Show the known CSV source, existing operator-local import time and remaining count; retain the internal batch key only as the select value.

## Custody and remaining work

Product push succeeded on cloud/main-lamp-subscriber-details-1 at 5938ef9f62f149729e1a54695d5331f10ca0db0b. PR 355: https://github.com/just-every/run-lamp/pull/355. Verify 43455239953 is in_progress/pending on that exact SHA: https://github.com/just-every/run-lamp/actions/runs/43455239953. Custody: PUSHED. Evidence is published separately to refs/heads/evidence/main-lamp-subscriber-details-1; the evidence manifest binds this product branch and SHA. No main/default-branch update or landing was performed. No product blocker remains. The fleet runs its full publication scan and independent landing gates. The product clone is removed only after successful evidence publication; complete actual reports and receipts remain outside it.

## Thirty-five-minute CI job snapshot

On the exact product SHA, plan, build, imports, demo, ownership, delivery, portability, runtime and public jobs completed successfully. Composer job 131988297951 remained in progress at “Verify this product shard”; no failed job was observed. This is a timed snapshot, not a final workflow verdict. ci-jobs.json retains the actual REST response. The final workflow status is recorded in custody.json and ci.json.
