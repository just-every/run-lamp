# Lamp incident owner journeys

Author: Run Edit Run fleet. Date: 2026-11-17 UTC.

Scope: just-every/run-lamp, cloud/sd-lamp-incident-1. Findings 3, 10 and 11 only. No release metadata, rer pin or contract judgments are changed.

Plan:
1. Read fresh main, launcher and seed rules; install the pinned checkout dependencies and fleet commit hooks.
2. Reproduce manual degradation followed by resolution, inspect new/resolved email previews, and attempt a timeline correction on the production build at 1440 and 390.
3. Keep incident claim history intact while rendering the component state that remains after resolution; warn about manual statuses and offer Automatic in the resolution screen.
4. Render the customer's branded email without repeated message labels, explain local email suppression and the source of incident impact, and label resolution wording as an update.
5. Expose Correct on published timeline entries, prefill an editable correction, retain the original, and identify the correction publicly.
6. Extend focused public-door journeys; run typecheck and touched tests, rebuild and repeat the changed screens at both widths.
7. Fetch/rebase fresh main before first publication; regenerate sources.lock.json last and run its check. Audit every candidate commit identity and trailer, push only the named cloud branch through the fleet guard, then inspect exact-SHA Verify within the ten-call API budget.
8. Publish this actual report, command receipts and browser proof on evidence/sd-lamp-incident-1. Return exact product/evidence provenance and lane POST lines.

Baseline verification inventory: 102 registered cases plus 10 assertion scripts = 112 checks. Baseline source-lock check passed. No contract clause claimed; these are owner-journey fixes (DIRECT 87).

Implementation decisions:
- Resolution keeps the immutable incident claim and records the remaining overall component status separately. Public-page and notification rendering use that retained remaining status, so a manual degradation is not announced as Operational. The resolve screen warns about each affected manual status and uses the existing component-status operation for Automatic; other incidents and maintenance still apply.
- Email preview renders the existing branded delivery HTML in a sandboxed, responsive frame. Sender details are hidden when no email can be sent; the notice distinguishes a local computer from an installation without mail. Impact explanation stays outside the customer's email. Resolved message wording is labelled Update on the shared rendering path.
- Correct on a timeline entry fills the normal draft with the published wording, keeps the current incident lifecycle and current component effects, and retains the correction target through autosave and reload. Publication appends the existing immutable correction record. Both the original and correction link to each other publicly; originals remain unchanged. Replacing an existing draft asks before replacing its contents.
- One short owner-documentation paragraph describes these actions. No migration, release metadata, rer pin, generated contract view or contract status is changed.

Baseline reproduction used the built production Worker, real migrated local D1 and synthetic operator/subscriber data. It captured the new-email preview, manual-status resolution screen, resolved-email preview, public resolution and operator timeline at both 1440 and 390. The actual baseline observations are in before/observations.json: the public resolution claimed Degraded performance → Operational while the component remained degraded; email paragraphs carried repeated MESSAGE labels; the two published timeline entries offered zero Correct buttons.

During verification, the first fixture attempt used an exact accessible label that included select-option text; the selector was corrected. An initial isolated production fixture needed explicit synthetic sign-in settings. The first post-change production probe also caught the missing mail-unconfigured suppression case; that product case was fixed rather than weakening the assertion. These are resolved attempts, not remaining blockers.

Local verification results:
- Typecheck: passed.
- Existing reviewed-incident route journey in tests/e2e/publishing-contract.test.mjs: passed, including public/feed/email field retention, recovery, immutable history and deletion.
- Existing compiled visual-edit and operator publication browser journey in tests/e2e/publishing-browser.test.mjs: passed (362.6 seconds), including autosave, failed-write recovery, stale-tab refusal, scheduling, previews, publication, resolution, correction and reopening.
- New focused incident-owner browser journey: passed on the development page (184.9 seconds).
- Final production build: passed. The same incident-owner journey passed against the built Worker (73.3 seconds), with screenshots of every changed screen at 1440 and 390. It also asserts that the correction target and edited draft survive reload, both public entries identify the correction, and Automatic clears only the manual setting while retaining the earlier resolution.
- Source lock regenerated last and checked successfully; diff checks passed. No generated contract views were committed.
- Inventory: 102 → 103 registered cases; 10 → 10 assertion scripts; 112 → 113 total checks. Contract status changes: 0.
- Baseline/current sample: 0 → 2 timeline Correct actions; 8 → 0 added MESSAGE labels in the new-email preview; false Operational resolution announcement present → absent. Before proof: 10 screenshots. Final proof: 14 screenshots.

Product custody:
- Fresh-main base: cb6f9af49f440380caeca1722bac8fb7b7815699.
- Product branch: cloud/sd-lamp-incident-1.
- Product head: 92aa684cf150afdc9472a238fb08ed5cfdfb61de.
- Main fetched immediately before locking/committing; rebase reported the branch up to date. No merge commit and no published-history rewrite.
- The sole product commit has fleet author and committer and no trailers. The full candidate range was inspected before push.
- Fleet push guard succeeded on attempt 1. Main was not pushed.
- Exact-head Verify discovered as run 44090247605; its terminal result will be recorded below.
- The complete publication scan remains with the fleet's landing process; this cloud run does not claim to have run it.

Out-of-scope note: the GitHub push response reports 12 existing dependency alerts on main (10 moderate, 2 low). No dependency or release change was made in this round.

Review PR: https://github.com/just-every/run-lamp/pull/407, opened against main at the exact product head. Its description records the implemented behavior and local validation; push Verify was still in progress when it was opened. No PR was opened in any other repository.

Terminal CI observation and custody:
- At the final allowed-budget observation, push Verify 44090247605 and PR Verify 44093747254 were both still in progress on 92aa684cf150afdc9472a238fb08ed5cfdfb61de. Neither had a conclusion. No failing run was observed.
- The separate dynamic PR #407 run 44093742745 completed successfully, but it is not Verify and is not used as readiness evidence.
- GitHub REST usage: 8 of 10 calls; 2 remain reserved for failure diagnosis. All observed-run polls were at least 300 seconds apart. No workflow was dispatched or rerun manually.
- Terminal product custody is PUSHED, not READY. Successful exact-SHA Verify remains pending; no product blocker was established and no acceptance or landing is claimed.
- The complete actual report, receipts, logs and browser proofs are published separately on refs/heads/evidence/sd-lamp-incident-1. That ref is report transport only and does not signal product readiness.
