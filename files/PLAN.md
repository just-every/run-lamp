# Lamp maintenance owner journeys

Author: Run Edit Run fleet. Date: 2026-11-17 UTC.

Scope: findings 1, 5 and 6 only in just-every/run-lamp. No contract clause claimed; these are owner-journey fixes (DIRECT 87).

1. Read fresh main, repository instructions and maintenance/publication paths; reproduce the existing cancellation, near-immediate reminder and notice presentation on the built Worker at 1440 and 390.
2. Require an explicit cancellation confirmation explaining the customer notice, record an optional customer-facing reason, and let owners reinstate the same cancelled window with one correction notice and unchanged identity/automation.
3. Keep the default reminder at 24 hours before start. Skip it if the latest scheduling/change announcement already falls within that window; maintain cancellation and prior-reminder idempotency and consistent follow-up obligations.
4. Show native maintenance notices with customer text on separate lines, removing internal references from visible notices, mail and delivery descriptions while retaining stable URLs and identifiers.
5. Extend focused public-door integration/browser tests, run touched tests and typecheck, capture changed screens at both widths, regenerate/check the source lock last, then rebase on fresh main before the first product push.
6. Keep fleet identity/hooks active, inspect all candidate authors/committers/messages and push only cloud/sd-lamp-maint-1 through the guard. Await exact-SHA Verify within the ten-call API budget. Publish the actual non-secret report/receipt packet separately to evidence/sd-lamp-maint-1. The fleet owns publication scan and landing.

Defaults: an optional cancellation reason is delivered to customers; reinstatement restores the original future window and sends a rescheduled notice to its previous audience. Past cancelled windows must be rescheduled before reinstatement. No new lifecycle kind is needed. A forward migration relaxes only the once-ever cancellation index so reinstated work can be cancelled again; scheduled/reminder/start/completion uniqueness remains enforced.
