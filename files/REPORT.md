# gr-ci-lamp-flake-1 — Lamp hosted mail-off route lifecycle fix

Repository: just-every/run-lamp
Product branch: cloud/gr-ci-lamp-flake-1
Candidate: e556d574c59645510fcc1bf0aa8945bb96b447be
Base: 761f3d186e8fa73ea9aa8b61bcf9ebe8013384f6
PR: none, as requested.
Clause changes: none. CLAIM: none. No generated acceptance or claims view was changed.

## Cause and failing evidence

The cause differs from run-uptime's Miniflare seeding burst. Lamp already uses ephemeral ingress/inspector ports and one five-statement session seed batch; awaited D1 acquisition and migration batches run before any browser request. The offending lifetime belongs to the browser fixture: its asynchronous BrowserContext.route callback awaits a real Miniflare dispatchFetch, while cleanup previously closed the context and immediately disposed Miniflare without awaiting those callbacks.

A single bounded archive read of Verify 43766968979 attempt 1 shows an unhandledRejection TypeError, fetch failed, after 4919.613169 ms at the hosted mail-off journey. The stack enters undici processResponse, Miniflare fetch4/dispatchFetch, rer-mail.test.mjs:513, Promise.all, and Playwright RouteHandler/_BrowserContext._onRoute. It identifies the browser-to-Worker route bridge rather than the awaited seed or application operation. Attempt 2 completed successfully on the identical base SHA at 2026-11-15T22:25:06Z. See historical-failure.log and historical-rerun.json.

## Deterministic reproduction and correction

The unmodified focused journey first passed once, confirming that an ordinary pass cannot establish the absence of this race. Temporary timing instrumentation then held a real routed production Worker request at an isolated fixture outbound boundary until cleanup began. It retained every original journey assertion and all four none/resend × skip/read cases. The probe added no permanent test and changed no product implementation. The temporary request used the existing page-settings public API through the same route bridge; its latency gate was in the isolated test Worker wrapper and provider fixture.

Before: cleanup began Miniflare disposal with one route callback active. Both controlled before runs failed with the same unhandledRejection, fetch failed and the same dependency stack as the hosted failure (the fixture source line shifts under instrumentation). Both completed normally with one failed test; no retry or process termination was required.

After: awaiting context.unrouteAll({ behavior: 'wait' }) before context.close and runtime.dispose drained the one active callback. Its real Worker response completed with HTTP 200. All four disposals began with zero active callbacks; the instrumented existing journey passed 1/1 with zero failures. The proof gate has no timing lottery: the held request is explicitly observed in flight before cleanup, and release follows the observed drain or disposal lifecycle. The second before probe installed an observer solely to release its test gate on the already-observed unhandled rejection; Node's test runner still reported the failure. The first before run needs no such observer and demonstrates the same result independently.

The product candidate contains only the callback drain and its explanation in tests/e2e/rer-mail.test.mjs, plus that file's regenerated hash in sources.lock.json. No retries, skips, timeout changes, product mocks, assertion changes or new registrations are present. A second agent independently checked the stack correspondence, lifecycle proof and final diff.

## Counts and local validation

| Measure | Before | After |
| --- | --- | --- |
| Mail test registrations | 5 | 5 |
| Historical failed attempt | 4 pass, 1 fail | same-SHA rerun succeeded |
| Controlled race journey | 0 pass, 1 fail | 1 pass, 0 fail |
| Full candidate mail suite | — | 5 pass, 0 fail, 0 skip |
| New permanent tests | 0 | 0 |
| Clauses / claims changed | 0 / 0 | 0 / 0 |

Setup and production build passed using the requested cloud_run wrapper. All final mail tests and controlled probes used Node 22.20.0, pnpm 10.12.4 and /usr/bin/chromium with --no-sandbox. The initial unforced baseline used the VM Node 24.19.0; it is only contextual, not the before/after proof.

The complete candidate mail suite passed 5/5 (83.298 s), including all native provider transports and the four hosted setup/Settings cases. Typecheck passed. Syntax parsed 472/472 modules. Contract documents were current with zero errors and warnings. The initial source check correctly detected the changed fixture hash; documented source lock regeneration changed only that hash, and the subsequent source check passed. git diff --check passed. Full local wall was delegated to the natural exact-SHA Verify as the brief specifies; no workflow was dispatched or rerun.

See PLAN.md for the full execution plan; local-receipt.json, the selected logs, candidate.patch, and race-probe.patch retain actual commands and results. Temporary instrumentation and fleet reports are absent from the product tree.

## Publication and CI custody

Exact candidate publication scan completed PASS/COMPLETE with zero findings, with environment comparison and full selected/public-main history enabled (1155 commits, 1138 trees, 8726 blobs, 31 tag messages; 428.060 s). Its 50 pre-existing main findings are separately classified by the unchanged scanner and are not new candidate findings. Actual JSON and summary are retained. The named branch was pushed successfully on the first guarded attempt; remote ref custody was checked by Git. No PR was opened. Natural exact-SHA Verify is pending. Product READY/PUSHED provenance will be recorded separately from the report-only evidence transport. No main/default branch push, force push, PR, or published-history rewrite is authorized or performed.

The first scanner invocation ran against the development checkout, which deliberately held ignored `.dev.vars`, local owner/database state and built output from required setup. It completed with 16 findings in that local state plus a destination format error (`--repository` requires the repository URL). It found no newly introduced committed-source secret. That actual report is retained as publication-scan-working-checkout.json. The final source publication scan uses a pristine detached worktree of the exact same candidate, retaining complete history and the actual public main base; destination input is corrected to its full declared URL. This follows source publication scope rather than publishing private local installation state. No scanner rule, environment comparison, test assertion or product byte was changed to address these invocation findings.
