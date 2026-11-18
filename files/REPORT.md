# sd-lamp-c-f135 · Lamp UPDATE-011

## Plan and scope

Resume the UPDATE-011 row in the Next campaign from sd-lamp-replan-30. Check the owner’s independently saved Writing settings and every wording rule in all four fields. Check where each finding appears, how the composer names it and how dismissal affects the text. Publish while findings remain and compare the exact submitted wording with both the committed update and the public incident timeline. Run the registered journey at 1440 and capture Settings, the composer and the public permalink at 1440 and 390. The other campaign rows are outside this assignment.

The existing deterministic checker and publisher already support the complete flow. The previous browser proof checked hostname and IP findings and the enabled Publish button, then restored the original Details before publishing. The added helper uses a separate synthetic incident, removes it through the native door after readback and restores the Writing settings. The existing journey and all its assertions still run. Test registrations in the touched file remain 7. The two Lamp rulings in the shipped index govern NOTIFY-013 and SUB-018. No UPDATE-011 policy ruling or new default was needed.

No clause text or status cells were edited. The checked-in counts are 60 done, 129 partial and 55 missing out of 244, both before and after the candidate. Counting an accepted landing would yield 61 done, 128 partial and 55 missing out of 244.

## Acceptance and public-door probes

| Point | Evidence in the registered operator publication journey |
| --- | --- |
| 1 | `tests/e2e/helpers/wording-findings-flow.mjs:23–103` separately saves and reads the owner’s term and preferred length, shows no findings on a next-update commitment and partial term at the chosen limit, then checks six rule names, exact highlighted text and counts in each of four distinct fields before any publication. `tests/e2e/publishing-browser.test.mjs:933–938` verifies the model receiver saw no requests during this flow. |
| 2 | `tests/e2e/helpers/wording-findings-flow.mjs:7–14,75–114` scopes the findings to their field wrappers, checks the named dismissal button for each finding, dismisses one Details finding and reads back all four inputs and the unchanged saved draft. The same blocked-term matches in the other fields remain. |
| 3 | `tests/e2e/helpers/wording-findings-flow.mjs:115–144` confirms the promise and internal hostname findings are still present, clicks Publish and receives HTTP 200. One native update retains all four exact strings. Its unauthenticated public permalink, with scripts disabled, matches the committed identity, publication instant and all four field values. |

PROBE UPDATE-011 1: Settings → Writing and the incident composer with four distinct warning fixtures -> both settings survive independent saved readbacks, 24 named findings before publication and zero model requests.

PROBE UPDATE-011 2: composer Details → Dismiss on Blocked term -> only the selected finding disappears, all input values and the complete saved draft match the pre-dismissal version.

PROBE UPDATE-011 3: Publish update with the resolution-time promise and internal hostname still shown -> HTTP 200, one committed update and exact four-field readback on the native detail route and the unauthenticated permalink.

## Pre-landing checks

- The existing composer registration still runs through push Verify. The composer shard selects `test:composer` in `scripts/verification/plan.mjs:8`, and that command selects the touched test file in `package.json:54`.
- The change adds one helper to the existing registration. All prior assertions still execute at their existing widths. The new assertions run at 1440. The three screen captures at 390 show the saved settings, advisory findings and Publish control, and the published wording. In the 390 full-page composer capture the two optional textarea viewports appear blank after the resize. Their findings, preview wording and published wording are visible.
- The wording settings live under Settings → Writing. Dismiss is a named text control and the advisory styling uses 13 px text. The existing Update options icon has an accessible name and lacks a visible tooltip in its implementation. Visual polish remains in the held scope.
- The native version and role checks in the existing journey remain in place. This change introduces zero new authority, erasure, replay, retention, spending or provider paths.
- The candidate’s contract and both generated views match main. The documented generator write and check succeeded and the generated views were restored from main. The final lock was regenerated mechanically and passed its freshness check at the committed head. The changed test lines passed a literal email and bare repository-token check. A full publication scan is pending with the guarded lander.

## DONE riders at the candidate head

Candidate `ab2220b826a95332655ed162450d592c917d4963` on `cloud/sd-lamp-c-f135`. Verify 44246831525 ran on push and completed successfully on this exact head. The scope is ACCEPT ON LANDING for UPDATE-011. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44246831525)

| Rider | Result and evidence |
| --- | --- |
| 1. Public-door outcomes | Pass. All three acceptance points reach the native Settings, composer and unauthenticated permalink in the registered journey at `tests/e2e/publishing-browser.test.mjs:565,933–938`. |
| 2. Behaviour assertions | Pass. `tests/e2e/helpers/wording-findings-flow.mjs:53–144` checks clean and warning inputs, exact field associations, selective dismissal, exact saved and published wording and a nonempty public timeline. |
| 3. Recorded Verify | Pass. Push Verify 44246831525 succeeded on the candidate SHA through the composer shard entry in `scripts/verification/plan.mjs:8`. |
| 4. Candidate binding | Pass. The local focused run’s two test hashes in the receipt match the candidate files. The subsequent source lock was the only addition before the push. Verify also ran on the exact committed SHA. |
| 5. Inherited duties | Pass. UPDATE-011 owns these duties in its three explicit native acceptance points. No Base duty or new inheritance is claimed. |
| 6. Generated evidence and provenance | Pass for this builder’s gate. The documented generator write and check passed on the candidate contract, and the committed views still match main. The lander owns the judged-from, Status, Gap and Evidence updates. |
| 7. Contract coverage | Pass. `git diff origin/main...HEAD -- CONTRACT.md` is empty. All three original acceptances remain. |
| 8. Authority | Inapplicable. The helper uses the existing signed-in native publication path. Existing role and stale-version assertions remain in the browser file. |
| 9. Provider or legal boundary | Inapplicable. `tests/e2e/publishing-browser.test.mjs:933–938` checks the wording helper makes no model request. The published update is in a synthetic local Worker fixture. |
| 10. Policy default | Inapplicable. No authority, custody, consent or spending policy changes. The native owner settings are independently saved test values. |
| 11. Guarded landing | Pending. The candidate is branch-only. The Mac lander owns the complete full-history publication scan, main equality and candidate Run site result. The receipt carries both independently observed refs and the starting main run IDs. |

The initial broad system-Chromium comparison showed an existing THEME-001 request-budget failure. A freshly built main worktree with the same command and browser reproduced the exact five asset paths. The focused UPDATE-011 run, first-party check, typecheck, production build, view generator and source-lock check all passed. The receipt contains the matching local failure and browser proof.

CLAIM UPDATE-011 DONE points=1,2,3 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey

Run Edit Run fleet · 2026-11-18
