# Lamp Miniflare listener retry

Codex, 2026-11-21 UTC. Fleet task sd-lamp-miniflare-retry-1.

- Repository just-every/run-lamp
- Branch cloud/sd-lamp-miniflare-retry-1
- Base a72f4668621d5d8a43c3e312bb1d24f4b9067831
- Candidate e183bbf828c30ca5d278d80476bda97209808192

No contract clause claimed; this is test-infrastructure maintenance.

## Plan and implementation

1. Locate every direct Miniflare start in tests and check the listener option. The NOTIFY-006 update-reminder tests reach the shared follow-ups runtime, which reserved a port before constructing Miniflare. The rer-mail journey also carries the NOTIFY-006 tag and uses port zero, which lets the kernel select the port at bind time. Other callers that explicitly pass port zero or leave the listener port unset also bind an ephemeral port directly.
2. Put a three-attempt startup loop next to the existing Worker startup utilities. Await Miniflare readiness and dispose the failed attempt before retrying. Retry a Miniflare or Node address-in-use error or its startup message. Surface every other startup error and stop after the third collision. Exclude previously attempted ports from the retry.
3. Apply the shared loop to the follow-ups runtime, page data, operator management, mail settings, subscriber intake, traffic alerts, the browser chat fixture, health/version and the independent-release fixture. The last fixture previously used a fixed port. Rebuild port-dependent origins and bindings on each attempt. Restarts first try the prior listener port so the fixture keeps the same local address when available.
4. Regenerate and check the source lock, run the scoped local checks, fetch and rebase on main, push one linear candidate to the named branch and read its exact-SHA Verify result.

The registered counts before and after are 119 cases plus 10 assertion scripts, for 129 checks. The contract summary stayed at 66 done, 123 partial and 56 missing, for 245 clauses.

## Verification performed

- Frozen install, local setup and build passed.
- Typecheck passed with Node 22.20.0 and pnpm 10.12.4. The VM's default Node 24.19.0 also passed typecheck and ran the initial build and scoped suite.
- A local probe held a loopback listener open and verified that workerd failed to bind to it, then reached readiness and served an HTTP response on a different port. The same probe verified immediate propagation of an unrelated error and the three-attempt limit with disposal on every failed attempt.
- The scoped combined update-reminders, page-data and independent-release run passed all seven tests, including all three NOTIFY-006 registrations in update-reminders.
- The health/version journey passed and identified the exact candidate SHA in its receipt.
- Changed JavaScript syntax, the verification plan, the generated contract check, the source-lock check and the Git diff check passed.
- Audited the single candidate commit's author, committer and trailers. The cloud push guard published it on the first attempt. The Mac lander owns the full publication scan and landing.
- The combined delivery, update-reminders, page-data and independent-release run passed all 15 tests. This included the built mail settings and subscriber intake browser flows. The selected Settings chat identities and native owner sign-in registrations passed through their normal browser entry points with Chromium. All five update-reminder tests also passed with pinned Node.
- Standalone browser diagnostics stalled locally, including an operator-startup comparison on main. The corresponding registered browser journeys completed successfully.

## GitHub Verify

Verify run 44940519201 completed successfully for candidate e183bbf828c30ca5d278d80476bda97209808192. Observed at 2026-11-21T19:37:03Z. The run used its first attempt. https://github.com/just-every/run-lamp/actions/runs/44940519201
