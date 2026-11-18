# Lamp design rulings

Run Edit Run fleet, 18 November 2026 UTC.

## Plan

1. Compare the published continuation with fresh main in source and in isolated Chromium sessions at 1440 px and 390 px.
2. Keep the published commits, integrate main’s native export and URL-validation fixes, and finish the remaining owner-facing state and time displays.
3. Generate and check the contract views locally, restore main’s generated views, regenerate the source lock, and run the build steps and the affected journeys.
4. Push the continuation branch, read Verify at its exact head, and return the reports and browser proof on the evidence branch.

## Rulings

| Ruling | Fresh main and continuation result |
| --- | --- |
| D16 | Built in the saved round in `src/core/features/operators/ui/operators-panel.tsx`. Main used the older suppression notice and rendered Copy link when a local entry link was available. The candidate removes Copy link and explains how to invite again from a copy that is online and has email enabled. `src/core/features/operators/routes.ts`, `src/core/platform/auth/index.ts`, and native invitation handling show that repeating an invitation for the same pending role sends a link through the configured transport. Going online by itself does not resend a pending local invitation. |
| D12 | Main already removed the default state from the browser incident composer. The saved round unified displayed labels across the browser picker, lists, templates, preview, component history, public themes and widget, and added Partly down for a new incident attachment without a template. This continuation also fixes both chat desks (`src/core/features/chat-desk/slack/blocks.ts`, `src/core/features/chat-desk/teams/cards.ts`) and visible component language in the component catalogue, component details, embed settings and maintenance. Saved claims and published maintenance remain visible. Native state values are retained for persistence and integrations. |
| D8 | Built in the saved round in `src/core/features/incidents/ui/new-incident-page.tsx` and `incident-detail-page.tsx`. Both draft inputs now say “What customers will see next.” |
| Time zones | The saved round names the configured zone throughout the owner and public browser UI, with offsets shown in Time details. This continuation shares the named zone with the actual chat preview output for the public message and the email preview (`src/core/features/incidents/service.ts`, `src/core/shared/email-branding.ts`, and both chat card renderers). Real email and Atom timestamps retain their configured offsets. |

## Contract and release accounting

The carried PAGE-009 text now describes zone names with the exact offset in Time details, and retains the configured offsets for feeds and notifications. It stays Partial and inherits the recorded gap and evidence. The matching PAGE-009 release-validation entry is carried from the saved head. Both before and after, the full target is 60 Done, 129 Partial and 55 Missing across 244 clauses. Core is 60 Done, 129 Partial and 50 Missing across 239 clauses. Agent surface has five Missing clauses. The verification plan counts 111 registered cases plus 10 assertion scripts (121 checks) before and after.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

## Candidate and verification

- Saved head `d245ba342734095775ed5730dab1c850a841a6fb` was preserved. Main at `177378a989a7496a2e3dc00ac9a43947efd7c031` was merged forward. Its native export validation and stronger URL assertions were retained.
- `cloud/sd-lamp-design-calls-1-pc1` was pushed at `6a043e506fe201c26e1929e721cf3e7f6f207897`. The remote ref was read back at the same SHA. All five candidate commits, including the saved history and merge, have the fleet author and committer and empty trailers.
- The exact-SHA build and typecheck passed locally. The contract generator wrote one view and its check passed before main’s views were restored. The source lock, offline Base copy check, release validation, syntax, visual-source check, and production Worker and site builds passed.
- Verify run 44247238034 completed with a failure in the generated `ACCEPTANCE.md` check. The missing build artifact, skipped shard jobs and failed aggregate followed from that check. The landing exception applies. Saved-head runs 44241680242 and 44244699828 also reported failure. [Candidate Verify](https://github.com/just-every/run-lamp/actions/runs/44247238034)
- The browser receipt contains fresh-main and candidate observations from Chromium at 1440 and 390 px. In the local invitation fixture, both heads kept the same-browser entry, main offered Copy link, and the candidate removed it. The signed Slack and Teams workflow exercised an explicitly selected partial outage and the named-zone preview. No real mail or provider call was needed for these checks.
- All four focused journeys and both setup journeys passed. The focused Slack and Teams rerun also passed. The broader touched-file run passed 33 of 34 journeys. Its sole failure, THEME-001’s four-request budget, reproduced on untouched main and on the candidate with system Chromium 154. Both made the same five requests, including the favicon. The design changes preserve the asset references and the existing assertion.
- The browser packet also covers the draft’s public and email previews and customer history at both widths. The rendered email preview names Brisbane time and hides the offset in its usual view.
