# Local owner subscriber confirmation and truthful mail outcomes

Repository: just-every/run-lamp
Branch: cloud/main-lamp-local-subscribers-1
Product head: bf1ada897c06515e86abdbb225877826a1e4c1c7
Base: ccc4f7a2f1c18223078b2f5e03440fd413d1575d

## Plan and result

The complete seven-step plan is in PLAN.md. The local public subscription was reproduced before editing: its 202 response claimed that confirmation email had been sent and said to check the inbox. reproduction.json records that actual observation. Code tracing found that developmentMail already returned suppressed and the subscription audit retained that fact; the log rendered suppression as provider acceptance.

The owner-only Confirm locally action is registered only in the application's existing development mail mode, after authenticated same-origin operator middleware. It reuses the signed confirmation token and the ordinary confirmation transition/event, retains subscriber identity and the original three-day deadline, and refuses replay on an active subscriber. It does not expose a token or create a new inbox/outbox. Production and demos have no local action. The configured-provider route journey asserts the endpoint is absent for rer, Resend and SendGrid.

Both public subscription doors, Add subscriber results and instructions, and the subscription/incident notification log now disclose local suppression. The log names no mail provider for a suppressed message. Its subscription rows use the existing mobile row layout, making the owner action visible at 390 pixels. Lamp owns the operator invitation text; its API already returned sent/suppressed, and the panel now uses that result. The copied Base runtime and its invitation flow were left unchanged. DIVERGENCE.md records this local behavior.

The real local browser flow submits page and incident subscriptions, observes both pending, confirms them in the owner's Delivery log, sees the incident follower, publishes another update and verifies both suppressed notification records, with subscriber/update/channel identity and queue/outcome times. It also exercises the owner's Add subscriber door and confirms that record. An unauthenticated local confirmation is refused. A separate local browser case proves the invite result. Screens of every changed state are captured at 1440 and 390; assertions run at 1440. The existing keyboard subscription journey retains its keyboard, focus, axe, confirmation and preference checks; its expected result now reflects local mail truthfully.

Before/after: registered cases 78 → 80; assertion scripts 10 → 10; total checks 88 → 90 (cap 200). Main did not drift during final fetch/rebase. The source lock was regenerated last and its check passed. Two product commits were pushed through the cloud guard after all candidate identities and full messages/trailers were inspected. Both have the fleet author/committer, no trailers and no skip marker. No generated view, report, receipt or screenshot is in the product branch.

Clause Status, Gap and Evidence fields: unchanged. No DONE claim. No contract acceptance points were added.

CLAIM SUB-002 PARTIAL points=1,2 tests=tests/e2e/maintenance-timezone.test.mjs#SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications
CLAIM NOTIFY-004 PARTIAL points=1 tests=tests/e2e/maintenance-timezone.test.mjs#SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications
DEFAULT SUB-002: The requested local owner confirmation uses existing development mail mode; production and demo consent behavior stays unchanged.
GAP NOTIFY-004: This round proves local suppression and complete local notification records, not real inbox delivery or every provider outcome.

## Validation

- node --test tests/e2e/rer-mail.test.mjs: passed, one registered journey across rer, Resend and SendGrid transports; added production local-action exclusion checks.
- node --test tests/e2e/maintenance-timezone.test.mjs: passed, all three registered journeys including the preserved maintenance/keyboard flow, local subscribers and local operator invitations.
- pnpm run typecheck: passed.
- node scripts/verification/check-plan.mjs: passed, 90 checks, eight test shards and one shared build.
- node src/base/contract-docs.mjs check: passed; current generated documents.
- node scripts/edition-authoring/cli.mjs lock, then check: passed.
- git diff --check: passed; final product worktree clean.

Final exact-head browser receipt and CI conclusion are recorded in CHECKS.json and CI-RECEIPT.json. Test stdout files in this packet are the actual non-secret successful-run output. Initial local test attempts exposed a snapshot-readiness wait and the old keyboard-result heading; these were corrected without dropping their user-flow assertions.

## Custody and limits

Verify run 43012346068 belongs to the exact product SHA above. The PR and final run conclusion are recorded in CI-RECEIPT.json. The fleet Mac must run its publication scan and landing gates; this cloud did not claim to run that unavailable scan. Evidence transport is report-only and independent of product readiness, acceptance or landing. No hosted mail account or real inbox was needed or used.

## Final custody

PR: https://github.com/just-every/run-lamp/pull/332 (open for the lane).
Exact-SHA Verify: completed/success, run 43012346068, https://github.com/just-every/run-lamp/actions/runs/43012346068, head bf1ada897c06515e86abdbb225877826a1e4c1c7.
The earlier product head 8df965814f0e5972e2fe0577f96b1e834623510a and its run 43011953723 were superseded by the hosted-label correction; no success is claimed from that earlier run.
Seven of the ten GitHub API calls were used; CI discovery/status checks followed the five-minute interval. No workflow was dispatched or rerun.

Blockers: none. The product is a READY candidate, not a claim that it has landed. The fleet retains its independent publication scan and landing gates. The actual packet remains outside the product clone and is published through the separate evidence ref. The pushed clone is removed after final evidence publication.
