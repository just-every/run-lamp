# Lamp campaign sd-lamp-c-f136

Codex · 18 November 2026 UTC

## Plan and outcome

The planner row for SUB-009 in sd-lamp-replan-30 assigns the unfinished portions of acceptances 2–4. I mapped the existing consent, format, Slack and Lamp wording assertions, extended that transport journey for authenticating exact wire bytes and reconciling the complete payload, and then exercised the receiver deadline and redirect through the native Worker Queue. The original receiver and browser assertions remain in the existing Verify registration.

The repository's delivery service already signs with both configured keys, aborts slow requests and refuses redirects. The repository already reads all retained updates plus the published component snapshot. The native journeys proved those behaviours with synthetic destinations, so the product changes are test coverage and the regenerated source lock. Review scope included the delivery service and repository. No UI, schema, contract-source, generated-view, workflow or release edits were needed.

| Acceptance | Public door and observed outcome | Evidence on the candidate |
|---|---|---|
| 1 | Native subscriber POST returned 201 and one confirmation. The emitted confirmation link activated the subscription, and the operator directory read back that identity as active. | `tests/e2e/helpers/statuspage-webhook-flow.mjs:98`–110, statuspageWebhookFlow |
| 2 | The receiver captured the request as bytes. Node's HMAC implementation verified a versioned signature for each separately configured key over the same delivery ID, timestamp and complete bytes. An extra newline kept the JSON valid and invalidated both signatures. Lamp and Slack and the existing Statuspage transport crossed this receiver. | `tests/e2e/helpers/follow-ups-runtime.mjs:90`–95, `tests/e2e/helpers/statuspage-webhook-flow.mjs:10`–25 and 35–51 and 86–94, statuspageWebhookFlow |
| 3 | Native incident publication delivered three consecutive events. Each contained the full expected update inventory in order, with distinct submitted wording and commitments, publication identities and instants, and every public attachment's previous and new state. Native public catalogue reads confirmed the changed, unchanged and resolved states. The operator readback proved an internal attachment and a real internal transition existed. Its identity and the webhook subscriber's contact were absent from the complete wire body. | `tests/e2e/helpers/component-notification-flow.mjs:104`–122 and 132–188 and 206–209, componentNotificationFlow |
| 4 | The ordinary queue sent three POSTs under distinct delivery identities. An in-window 204 completed delivery. The unanswered request recorded an aborted attempt with retry still queued and no successful outcome. A late 204 left the entire record identical. A 307 failed and the accepting target recorded zero requests. The separate exact-commit runtime measurement is in `RECEIPT.md`. | `tests/e2e/helpers/webhook-receiver-deadline-flow.mjs:38`–84 and 86–136, webhookReceiverDeadlineFlow |
| 5 | Actual Slack message text preserved secure URL brackets and outside punctuation. Rich text contained link elements whose displayed text equalled the destination and reassembled each submitted field. Non-link text and markup stayed literal. | `tests/e2e/helpers/component-notification-flow.mjs:189`–202, componentNotificationFlow and `tests/e2e/helpers/update-link-evidence.mjs:91` |
| 6 | Each configured Lamp wording field, its lifecycle and next-update value matched the submission and the received publication ID matched the committed update. | `tests/e2e/helpers/component-notification-flow.mjs:124`–156, componentNotificationFlow |
| D-2 | Native token management persisted recipient format choices. Active native destinations crossed their chosen signed transport and disclosed no contact in the incident event. | `tests/e2e/helpers/statuspage-webhook-flow.mjs:112`–130 and `tests/e2e/helpers/component-notification-flow.mjs:174`–202 |
| BASE-OPS-003 | The existing concurrent Queue and publication replay journey retained one update and one delivery identity and produced one receiver request. | `tests/e2e/helpers/webhook-at-most-once-flow.mjs:64`–114, webhookAtMostOnceFlow |
| BASE-INPUT-002 | The received Lamp fields retained literal markup as text data. The Slack receiver reassembled the literal text and asserted that generated links had HTTPS destinations with matching URL labels. | `tests/e2e/helpers/update-component-flow.mjs:4`–9 and `tests/e2e/helpers/component-notification-flow.mjs:147`–156 and 189–202 |

`tests/e2e/delivery-contract.test.mjs:29`–45 registers all these journeys under Subscriber consent, selected publication, channel delivery, export and erasure. The existing Verify public shard runs `pnpm test:delivery` via `scripts/verification/plan.mjs:10`. The local run and exact-SHA CI outcome are recorded in the receipt and summary.

## DONE-RIDERS and pre-landing checks

1. Native acceptance outcomes exercised for all six points. Each independently checks receiver-visible content or the operator-visible delivery result.
2. The fixtures create real records through Lamp. Both signing keys accept exact bytes and refuse altered bytes. The public read and captured wire body exclude an attached internal component and the subscriber contact.
3. Pass. Exact-SHA push Verify 44245454910 completed successfully. The outside-Verify timing run is bound to the same SHA in the receipt.
4. Pass. Exact candidate local delivery suite, timing and mechanical checks are recorded in the receipt.
5. Inspected. CONTRACT.md names BASE-OPS-003 and BASE-INPUT-002 and rule D-2 under SUB-009. The three inherited rows above map their proof.
6. Local `contract-docs write` and `check` passed and generated zero changes. The maintained Status, Gap, Evidence and Judged-from provenance are for the lander to update.
7. Inspected. Acceptance text and coverage unchanged, with no new rider or obligation.
8. Inspected. The change introduces no new authority or write verb. The registered journey retains unsubscribed token refusal, erasure and Queue replay suppression.
9. Fixture proof covers Lamp's transport against a synthetic receiver and synthetic Slack edge. Live Slack qualification and new public format creation stay with their owning clauses.
10. Inspected. Existing policies applied and no new policy default adopted.
11. Pending guarded landing. Main equality, the candidate full-history publication scan and candidate Run site are Mac lander gates.

The previous assertions are preserved. No screen implementation changed. The existing browser journey still runs its 1440-width subscription and management assertions. The source lock check and first-party check passed locally. Added fixtures contain no literal email addresses or provider credentials. Full-history scan completion, historyScanned and findings remain unestablished for this candidate until the lander scans it.

The checked-in counts are **60 DONE, 129 PARTIAL, 55 MISSING** both before and after, 244 total. A successful independent gate and judged SUB-009 promotion would yield **61 DONE, 128 PARTIAL, 55 MISSING**. The verification plan counts **111 registered cases and 10 assertion scripts**, unchanged. No plan files were modified in the cloud. The proposed row update is SUB-009 acceptances 2–4 completed with 1, 5 and 6 retained, pending the guarded landing decision.

SUB-018 public creation, live Slack or provider qualification, NOTIFY-003 retry pacing and NOTIFY-005 replay ownership remain with those assignments. No new landing, adoption, UI or release prerequisites were asserted.

## Branch and landing provenance

- Product branch `cloud/sd-lamp-c-f136` and head `2b52a97df43e97224b62a303e105d97e63c1b870`.
- Preserved intermediate commit `399a401b3725333619841b601869b001eb5eeee0` carried the CI-skip marker. The landing candidate advanced the branch normally through the fleet push guard and has its own Verify.
- Verify 44245454910 completed successfully on the product SHA, event push. All seven local delivery tests also passed on that SHA. [https://github.com/just-every/run-lamp/actions/runs/44245454910](https://github.com/just-every/run-lamp/actions/runs/44245454910)
- The starting main SHA was `177378a989a7496a2e3dc00ac9a43947efd7c031`. Successful runs observed on that starting SHA were Verify 44242051847 and Run site 44242052319. Main at the evidence check was `177378a989a7496a2e3dc00ac9a43947efd7c031`. The candidate's own Run site, main equality, and complete publication scan are pending guarded landing.
- Publication scan on candidate `2b52a97df43e97224b62a303e105d97e63c1b870` remains pending. The cloud packet supplies no complete, historyScanned or findings values.
- The source lock SHA-256 is `647b34c4c2ba64d0ec0d785dec95643c32cbf41bd6e439d8aa1dd26bde6f1549`.

CLAIM SUB-009 DONE points=1,2,3,4,5,6 tests=tests/e2e/helpers/statuspage-webhook-flow.mjs#statuspageWebhookFlow; tests/e2e/helpers/component-notification-flow.mjs#componentNotificationFlow; tests/e2e/helpers/webhook-receiver-deadline-flow.mjs#webhookReceiverDeadlineFlow
