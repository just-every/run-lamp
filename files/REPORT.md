# Lamp DRAFT-003 · sd-lamp-c-f152

Prepared by Codex on 2026-11-19 UTC for the sd campaign.

Repository https://github.com/just-every/run-lamp
Branch cloud/sd-lamp-c-f152
Product head 4cca771f52fb49828681d9d899d784f8f40efd46
Base main 8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b
Pull request unnecessary for branch-push Verify and guarded landing.

## Plan and results

The plan row for DRAFT-003 in sd-lamp-replan-32 gains proof of the unanswered-provider deadline and immediate operator publication after timeout. The work mapped the three clause points to native routes and browser actions, extended both existing width-specific journeys and the local provider edge, then reran the browser file and checked source integrity. The original provider 503-to-publication and successful suggestion cases still run. The AI adapter and AI service were inspected, and the timeout and error propagation already handled the leased behavior.

- **Acceptance 1 · Held.** The native provider-free case checks disabled AI status and 404 on a direct suggestion attempt. Browser absence and request silence are outside this lease. See tests/e2e/incident-brief.test.mjs:300–308.
- **Acceptance 2 · Local pass.** The existing desktop journey shows a prompt 503 and proceeds to publish. At 1440 and 390, a fresh incident's Suggest update reaches the local HTTP edge exactly once with the intended brief, and the edge sends no headers or response. A monotonic clock measures the deadline error from the click. See tests/e2e/publishing-browser.test.mjs:70, :363 and :866.
- **Acceptance 3 · Immediate browser path passes locally.** Native readback sees the same draft and no new updates after the timeout. The operator publishes without changing the draft. Native readback sees one committed update with the exact lifecycle, wording and next-update time. The guest incident permalink agrees on update ID, lifecycle, wording, publication time and next-update time at 1440 and 390. See tests/e2e/publishing-browser.test.mjs:387. Scheduled, backdated, correction and other publication doors after failure or timeout remain held.
- **Inherited BASE-OPS-004 · Local pass for this slice.** The witnessed provider failure and deadline are visible in a composer status region beside Suggest update. DRAFT-003 cites the duty in CONTRACT.md:168.

DRAFT-003 stays PARTIAL. Counts before and after are 65 done, 124 partial, 55 missing (244 total). The Status table, acceptance text and generated views match the base. No policy default or new ruling was needed.

## DONE-RIDERS

| Row | Result | Evidence on the candidate |
| --- | --- | --- |
| 1 | Partial | The deadline and the immediate door pass. Acceptance 1 and the remaining acceptance 3 doors are held. |
| 2 | Pass for the slice | The tests use separate seeded incidents and assert the deadline, unaffected saved draft and exact native and guest readback. See tests/e2e/publishing-browser.test.mjs:363 and :387. |
| 3 | Pending | The shared Verify composer shard runs test:composer. Exact-head push Verify 44556904355 (in_progress). The timing receipt is from an on-head cloud browser command outside Verify. |
| 4 | Pass | Runtime receipt and four browser screenshots are bound to 4cca771f52fb49828681d9d899d784f8f40efd46. |
| 5 | Pass | BASE-OPS-004 is cited at CONTRACT.md:168. |
| 6 | Pass for the existing table and generated views | Generator write and check passed. Provenance of a future judgment belongs to landing. |
| 7 | Pass | Acceptance points and inheritance wording match main. |
| 8 | Inspected | Existing authenticated operator and unauthenticated guest readback cover their respective doors. The slice adds no product authority, erasure or replay changes. |
| 9 | Pass for the slice | Synthetic local provider transport establishes application behavior. |
| 10 | Pass | The slice makes no new policy decision. |
| 11 | Pending landing | The guarded lander owns the publication scan, main equality and exact-main Run site. |

## Pre-landing checks

Both leased outcomes have assertions in the existing browser journeys. Existing assertions and test registrations are preserved. Test plan inventory is 113 registered cases and 10 assertion scripts. The original operator authority and public rendering are exercised through their normal doors. This is a test-only change. Browser proof shows the deadline message beside the text-labeled control and the public readback once at each width. The inspected message style uses 13px text. The existing icon-only Update options control has an accessible name and no tooltip in its component. The test slice made no visual or UI implementation edits.

Both exact-head browser journeys passed. The broader browser file passed seven of eight cases under system Chromium. THEME-001 counted an automatic favicon as a fifth resource and failed identically on the pinned main revision. The first broader run also exposed that this existing theme helper selects the Playwright shell itself. An isolated Playwright browser directory routed that lookup to system Chromium for the retry and main reproduction. The source lock check, typecheck, broader browser result and first-party profile check are recorded in RECEIPT.txt. Added product text was checked for email-shaped strings, credential-like values and bare prose slash references.

Publication scan for 4cca771f52fb49828681d9d899d784f8f40efd46: pending on the guarded lander. No scan result, history-scanned flag or finding count is available from this cloud.
Main ref at handoff: 8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b. Candidate Run site: pending main landing.
Base main Verify 44548523701 (success) and Run site 44548523753 (success).

## Proof files

RECEIPT.txt contains the timed probes, command results and exact-head Verify observation.
The four PNGs record the deadline and public readback at 1440 and 390 pixels.

## Clause handoff

CLAIM DRAFT-003 PARTIAL points=2 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey; tests/e2e/publishing-browser.test.mjs#INCIDENT-001 AGENT-004 MOBILE-001 — 390-wide owner sign-in, alert review, publication, resolution and maintenance smoke

GAP DRAFT-003: Acceptance 1’s unconfigured control absence and request silence and acceptance 3’s scheduled, backdated, correction and other post-failure publication paths remain held.

PROBE DRAFT-003 2: Suggest update with an unanswered local provider -> one matching provider request at each width, and the visible deadline error in 18539 ms at 1440 and 18602 ms at 390.

PROBE DRAFT-003 3: Publish update from the same saved draft after the deadline -> one committed record and matching unauthenticated permalink at each width.
