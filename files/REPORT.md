# Lamp incident corrections continuation

Repository: just-every/run-lamp
Branch: cloud/main-lamp-incident-corrections-1-pc1
Starting published head: 56dc48869caa37051e382e58e348842c41abc593

## Plan and diagnosis

PLAN.md records the full execution plan. Preserve the published incident fixes, read the failed exact-head delivery assertion, reproduce it through the operator UI, narrow the reset to the consumed correction panel, merge current main without rewriting history, run touched checks, push the candidate and require exact-SHA Verify. Publish evidence separately from product custody.

Verify 43268886507 failed in shards (delivery), job 131376026337, step Verify this product shard. Its composer shard succeeded. The retained failed log was read once with the mandated gh run view command. The failure was in socialBrowserFlow: after an ordinary publication, the Notify panel's Social accounts checkbox disappeared. The earlier incident change keyed the entire UpdateOptions component by update generation to clear correction mode. That also remounted every unrelated option panel and hid Notify. The existing assertion required the next update's choice to remain visible and unchecked.

The targeted private-channel journey reproduced exactly that failure locally on the saved implementation. One initial local attempt stopped before the relevant flow because a helper ignored the Chromium executable environment setting. The successful reproduction and subsequent checks use an external test-only Playwright launch override selecting /usr/bin/chromium with --no-sandbox; no product source or assertion was changed for that override. No real provider is called; browser fixtures create their own synthetic sessions and databases.

## Product result

The continuation replaces the remount key with a publication key. UpdateOptions reacts to it by closing its correction panel only, preserving Notify and other open panels. Correction action feedback still clears on publication, and the stored consumed draft remains removed. No assertion was changed, deleted, skipped or weakened.

The preserved starting commit provides the rest of the requested behavior:

- Resolved incident records keep the composer and preview. Publishing Investigating reopens the record; publishing a Resolved correction leaves it resolved.
- Corrections identify the original update by lifecycle and publication time and link to it on operator timelines, the public incident page and the public status page.
- Original wording and publication instants are retained, with original, resolution, correction and reopening in publication order.
- Publishing consumes correction feedback and selection, and the next ordinary publication has no correctsUpdateId. Reload also retains the ordinary next-draft state.
- docs/incidents-and-updates describes reopening and corrections through those controls.

Current main was merged, preserving its removed-subscriber labels, report-obligation behavior, tests and contract judgments. The DIVERGENCE.md conflict retains both intent entries; sources.lock.json was regenerated with the documented command instead of hand-resolved. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged by this round.

## Validation and counts

The exact commands, exit statuses and terminal provenance are in RECEIPT.json and selected logs. Browser proof contains the changed incident operator, public-page and permalink screens at 1440 and 390. Behavioral assertions run at 1440. The affected social flow also retains its existing phone accessibility/layout observations.

Before and after: 89 registered cases plus 10 assertion scripts = 99 checks; no new registrations. Clause statuses remain INCIDENT-004 partial and INCIDENT-005 done as inherited. This builder makes PARTIAL evidence claims only and changes no status, gap or evidence cell.

CLAIM INCIDENT-004 PARTIAL points=2,3 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM INCIDENT-005 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey

## Boundaries

This round introduces no published-update edit/delete flow and no correction delivery channels. It claims the specified UI, correction attribution, immutability retention and reopening checks only. Full publication scanning and main landing belong to the fleet Mac, and branch Verify cannot establish deployment or landing. Evidence publication is report transport only.

## Product provenance

Head: 1736dcb8a7c87d0f776a97c99a3ddfa222282a0a

PR: https://github.com/just-every/run-lamp/pull/347

The guarded product push succeeded on attempt 1. Main was merged at 7bfb459185882497098b4fed00155f248874ce81. The committed source lock passes; generated views and contract source were not changed. Both targeted journeys and typecheck passed before committing; the only test-side source probe restored its exact original bytes. The product worktree is clean.

Browser inspection: all ten incident screenshots were inspected at their native 1440/390 viewport widths. The resolved composer, active correction, public summary and incident permalink remain readable; the correction link identifies its original lifecycle/time in each surface. No additional UI was introduced by the continuation.
