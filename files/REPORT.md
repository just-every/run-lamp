# Lamp public subscription channels

Task: main-lamp-subscribe-channels-1  
Declared write repository: just-every/run-lamp  
Product branch: cloud/main-lamp-subscribe-channels-1  
Baseline main: 733e2ce1e2fc618183a93632218bb86456a06a79

## Result and scope

The public subscription choices now reflect the sending configuration. Email remains available. Unconfigured SMS, Slack, and Teams channels are omitted; configured SMS and Slack become available again. The public snapshot carries the availability booleans, and the source renderer version was bumped so existing public pages can receive the updated choices.

Reachable unavailable-channel results offer a clear return action to the subscription choices. Slack now has an explicit action in the result card; Teams has a return action as well. The SMS result already had a return action and retains it.

The Teams form links an on-site guide at `/subscribe/teams/guide` before the webhook URL field. The visitor-facing guide adapts the existing owner instructions for creating a Teams Workflows webhook. Subscription storage, verification, sending, and the owner's Notifications settings are unchanged.

No CONTRACT.md clause Status, Gap, or Evidence cells were changed. This report makes no DONE claim and does not claim live provider validation or landing.

## Baseline reproduction

Both reported channel/setup problems reproduced through public doors on baseline main. `REPRODUCTION.json` records measurements at 1440 and 390:

- The subscribe choices offered email, SMS, Slack, and Teams even when SMS sending and Slack subscriptions were unconfigured.
- The Teams form had no setup guide link at either width.
- Submitting the unconfigured SMS form returned “Subscription unavailable.” Its body already contained “Back to subscriptions”; the complete page had two return links.
- Opening unconfigured Slack returned “Slack unavailable.” The masthead already supplied one Subscribe link, but the result body had no return link. The report therefore does not claim that the baseline page had no navigation anywhere.

Baseline screenshots are `before/subscribe-1440.png`, `before/subscribe-390.png`, `before/teams-1440.png`, `before/teams-390.png`, `before/sms-unavailable-390.png`, and `before/slack-unavailable-390.png`.

## Local verification results

`CHANNEL-JOURNEY.json` records `subscriberChannelsFlow` assertions at 1440, with browser proof at 1440 and 390. Its configuration measurements demonstrate:

| Configuration exercised | Public choices recorded |
|---|---|
| SMS and Slack unconfigured | Email and Teams |
| SMS configured | Email, SMS, and Teams |
| Slack configured | Email, Slack, and Teams |
| Both SMS and Slack configured | Email, Slack, SMS, and Teams |
| Optional channels disabled/unconfigured | Email only |
| Teams available again | Email and Teams |

The same receipt records return links for the SMS, Slack, and Teams stale/unavailable results, a same-origin Teams guide, and operation with scripts disabled. These are local synthetic journey results; they are not evidence of a live SMS, Slack, or Teams provider connection.

The existing public email consent journey passed: 1/1 test, 26.6 seconds. `CONSENT-JOURNEY.json` records four confirmation measurements, a pending subscription receiving no publication, an active subscription receiving one publication, unsubscribe reset without advancing the clock, and two cross-site refusals. The provider acceptance fields belong to that local test setup and do not establish live provider validation.

Typecheck, the production build (including the docs link checker), contract generation check, source-lock check, and verification-plan inventory all passed. `LOCAL-CHECKS.json` records commands, exits and the hashes of every changed product file. The passing test, typecheck, build, contract check and count logs are included as actual files. No full local `rer verify` or full local suite was run. Earlier local test attempts exposed a fixture lifecycle error; the channel configuration restarts now use their own fixture, and the complete touched journey passed afterward.

## Browser proof files

The changed public screens have proof files at both required widths:

| Public screen/state | 1440 | 390 |
|---|---|---|
| Unconfigured subscribe choices | `after/subscribe-unconfigured-1440.png` | `after/subscribe-unconfigured-390.png` |
| Configured subscribe choices | `after/subscribe-configured-1440.png` | `after/subscribe-configured-390.png` |
| SMS unavailable result | `after/sms-unavailable-1440.png` | `after/sms-unavailable-390.png` |
| Slack unavailable result | `after/slack-unavailable-1440.png` | `after/slack-unavailable-390.png` |
| Teams unavailable result | `after/teams-unavailable-1440.png` | `after/teams-unavailable-390.png` |
| Teams webhook form | `after/teams-form-1440.png` | `after/teams-form-390.png` |
| Teams setup guide | `after/teams-guide-1440.png` | `after/teams-guide-390.png` |

## Test budget and clauses

The before and after counts are unchanged: 90 test registrations plus 10 assertion scripts, totaling 100. Existing journeys were extended; no registration was added. This remains within the seed cap.

Clause statuses are unchanged. The public consent test proves its existing email acceptance points with a real Worker and synthetic mail edge. Channel availability and guide navigation extend the same journey but do not establish the complete SMS/Slack/Teams provider clauses.

CLAIM SUB-001 PARTIAL points=1,2,3,4,5 tests=tests/e2e/delivery-contract.test.mjs#SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary
CLAIM SUB-013 PARTIAL points=none tests=tests/e2e/delivery-contract.test.mjs#SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary
CLAIM SUB-014 PARTIAL points=none tests=tests/e2e/delivery-contract.test.mjs#SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary
CLAIM SUB-015 PARTIAL points=none tests=tests/e2e/delivery-contract.test.mjs#SUB-001 — Generic public email consent preserves the daily allowance, pending silence and anonymous submission boundary

DEFAULT SUB-014: An unconfigured app is omitted from public choices; its configured authorization and subscription behavior is unchanged.
GAP SUB-013: This scope adds channel-availability and stale-result proof, not a live Twilio account journey.
GAP SUB-014: This scope exercises authorization initiation but does not qualify a live Slack workspace.
GAP SUB-015: The visitor guide is linked and reachable; this scope does not qualify a live Teams tenant.

## Plan and results

The original full plan is retained in `PLAN.md`.

1. Installed the fleet launcher authentication, identity and commit hooks, used the prescribed toolchain, and completed local owner setup.
2. Reproduced both findings on main through the public doors at 1440 and 390. Recorded the existing SMS return link and Slack masthead link accurately.
3. Implemented only public channel availability, explicit channel-result return actions, and a public Teams workflow guide. Did not change storage, consent, verification, delivery or Notifications settings.
4. Extended the existing public consent journey. Its final run passed with scripting disabled; browser proof covers each changed state at 1440 and 390. Typecheck, production/docs build and documented source/contract checks passed; total checks remain 100 before and after.
5. Fetched main and rebased before the first product commit; main was unchanged. Regenerated the source lock last, checked it, committed with fleet identity and active hooks, inspected all candidate identities/trailers and pushed the named branch once through the fleet guard. Opened the required PR. No generated contract views or fleet evidence were committed to the product branch.
6. Wait for exact-SHA Verify at the allowed five-minute interval, then publish the complete explicitly selected non-secret packet to the separate evidence ref. Main, full publication scanning and landing remain fleet-owned.

## Product provenance and CI

Product branch: cloud/main-lamp-subscribe-channels-1
Product head: dc565f4d31f87885c7dce6b8d97d995b797a13cf
PR: https://github.com/just-every/run-lamp/pull/353
Verify run: 43454446883 — https://github.com/just-every/run-lamp/actions/runs/43454446883
Exact-SHA Verify: pending; five allowed status polls have reported in_progress on the product head.

Product push succeeded on its first attempt. An independent `git ls-remote` check matched the branch to the full product head. `PRODUCT-RECEIPT.json` retains the actual product custody and PR/CI identities. GitHub API use is recorded in `API-CALLS.json`; one watcher polls at intervals of at least 300 seconds.

## Limits and handoff

There are no known implementation blockers. Verify is still running after five permitted polls; product custody remains PUSHED, without a READY claim. Live SMS/Slack/Teams account qualification was outside this brief. The browser journeys use the real application, host dispatch, D1, snapshots and HTML forms, with synthetic network edges; they establish the scoped behavior and do not claim live provider delivery. No clause status changed and no DONE claim is made. Publication and landing are separate from product and evidence transport.

Evidence transport destination: refs/heads/evidence/main-lamp-subscribe-channels-1. The final EVIDENCE receipt identifies the exact report-only commit separately from product custody. The clone can be removed after successful evidence transfer; packet files remain outside it for the fleet.
