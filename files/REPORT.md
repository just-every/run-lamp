# Lamp design calls, linear replay

Run Edit Run fleet, 2026-11-18 UTC

## Plan

1. Confirm the two prior branch heads and identify their non-merge commits against fresh Lamp main. Re-apply each commit in order with main's intervening fixes and contract judgments retained.
2. Recover the Slack and Teams portions of the rulings found only in the preservation merge as a separate ordinary commit. Review all four rulings against the replayed source.
3. Regenerate and check the contract views, restore main's views, then regenerate and check the source lock. Run the production build steps in order, touched journeys and Chromium proof at 1440 and 390.
4. Fetch main and rebase before publication. Inspect the full candidate range, push the named branch through the fleet guard, and check its exact-SHA Verify. Publish this packet on the evidence ref.

## Provenance and scope

- Starting main was `177378a989a7496a2e3dc00ac9a43947efd7c031`.
- Confirmed `cloud/sd-lamp-design-calls-1` at `d245ba342734095775ed5730dab1c850a841a6fb` and `cloud/sd-lamp-design-calls-1-pc1` at `6a043e506fe201c26e1929e721cf3e7f6f207897`.
- Replayed `6ac73f2`, `9c5a172`, `d245ba3` and `6a043e5`. Re-applied the six in-scope chat and preview files from the remerge diff of `f66c21bb` as an ordinary commit.
- Main's native export, Base copy inventory, auth-adoption assertions and update-link checks are inherited. The candidate range contains five ordinary commits and zero merges.
- The contract generator produced current views with zero prose errors or warnings. `ACCEPTANCE.md` and `docs/CLAIMS.md` are held at main in the candidate for landing regeneration. The source lock was generated last and checked.
- `validate:release` rejected changed PAGE-009 meaning without a release entry. The required PAGE-009 entry is the sole release metadata change.
- Test registrations added or removed: zero. The local invitation journey was renamed and updated in place. The 24 changed test files include shared journey helpers.

## Rulings

| Ruling | Outcome | Where |
| --- | --- | --- |
| D16 local colleague invitation | Built now. The result explains local use and gives the actionable hosted invitation path. Local mail is suppressed. The native hosted invite sends as part of the invitation operation when mail is configured, so starting an online copy does not promise deferred email. | `src/core/features/operators/ui/operators-panel.tsx`, `src/core/features/operators/routes.ts`, `modules/operator-auth/accounts/admin.mjs` |
| D12 component state vocabulary | Built now. Owner and customer displays use Working, Slow, Partly down and Down. Unsaved incident attachments require a choice. Partly down persists as the existing Partially unavailable state. Maintenance remains a separate scheduled state, and native vendor mapping stays in Details. | `src/core/shared/component-state-label.ts`, `src/core/app/client/ui/component-state-select.tsx`, `src/core/features/incidents/ui/affected-components.tsx`, component history, public snapshot templates, Slack and Teams composers |
| D8 draft text | Built now. The new incident and the next draft both use “What customers will see next”. | `src/core/features/incidents/ui/new-incident-page.tsx`, `src/core/features/incidents/ui/incident-detail-page.tsx` |
| Time zone names | Built now. Owner and customer surfaces name the zone. Settings, public records and email preview expose offsets in Time details. Outgoing notifications and feeds retain offsets, and public time elements retain exact ISO instants. | `src/core/shared/timezone-label.ts`, `src/core/app/client/ui/states.tsx`, `src/core/features/public-snapshot/format.ts`, public snapshot renderers and incident previews |

## Contract counts

| Tier | Before (Done / Partial / Missing) | After (Done / Partial / Missing) |
| --- | --- | --- |
| Core | 60 / 129 / 50 | 60 / 129 / 50 |
| Agent surface | 0 / 0 / 5 | 0 / 0 / 5 |
| Later | 0 / 0 / 0 | 0 / 0 / 0 |
| Full target | 60 / 129 / 55 | 60 / 129 / 55 |

PAGE-009 is a wording change. It remains Partial.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

## Browser receipts

Chromium exercised the built production Worker at 1440 and 390. The synthetic incident started with its state unset, offered all four names and published Partly down without a template. Its new and next drafts showed the requested placeholder. The owner Preview, Overview and public page used Brisbane time. Expanding public Time details exposed the +10:00 offset. The separate local-mail browser journey recorded a 202 suppressed invitation, a pending row and no Copy link control. The maintenance journey also checked local scheduling, exact instants, UTC offset in Settings details and the scheduled Overview line at both widths.

See the production browser receipt and the matching screenshots under `browser/`.

## Checks and publication

- Local checks passed in the declared order through contract generation, Base copy integrity, source lock, TypeScript, syntax, release validation, visual source checks, production app build and site build.
- The focused maintenance and invitation suite passed all three journeys. The native reviewed-publication and Slack/Teams journeys passed. The 390 owner smoke and public history cases passed. The system-Chromium rerun of the private-channel journey passed after its initial missing-browser error.
- The broader local test pass is incomplete. An install in the disposable preview briefly relinked the shared dependencies during an early delivery run. Restoring the checkout-local links and giving preview its own dependencies fixed module resolution. Broader monitor, subscriber delivery and compiled browser journeys reached their time limits. The long-running public catalogue attempts were stopped after the narrower built public-page proof and passing public-history cases. The receipts preserve the observed outcomes by run.
- The branch was rebased against the newest main with no replay needed. The fleet guard published `cloud/sd-lamp-design-calls-2` at `b39e82f55c6ec44f99006ce21a269e943ef7960a` at 07:10:12 UTC. The complete candidate log had fleet authors and committers and no trailers.
- Exact-SHA Verify [44256779165](https://github.com/just-every/run-lamp/actions/runs/44256779165) completed. The archived build log identified the expected stale `ACCEPTANCE.md` as the sole underlying failure. It stopped before build artifacts were written, so shards were skipped and the aggregate failed for missing artifacts. This is the generated-view exception defined by the brief. See `VERIFY.md` for the job IDs.
- One broader Vite journey failed to find the Theme heading when opening Settings at `#look`. The production-preview browser reached that same address directly and verified the four palette labels at 1440 and 390. The broader check still appears as failed in the receipt.
- The dependency Settings and owner incident communication browser journeys passed. Remaining broad test processes were stopped after recording completed cases and the exact-SHA Verify result.
