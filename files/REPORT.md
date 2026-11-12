# sd-lamp-audit-labels-1-pc1

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-audit-labels-1-pc1
Starting product head: 4e97cd125e6e6cb60a8c05e05878a3c96d78490b
Candidate product head: dd4c160e05eaae27198396cafc1c3ee8f7a16eb0
Current main incorporated: 7bfb459 (full identity retained in final receipt)
All timestamps are UTC. This packet is public, report-only evidence.

## Plan and scope

PLAN.md records the full continuation plan. Preserve the published saved fix, merge main forward, diagnose the prior delivery assertion, fix its audit rendering and assertion without losing its user-visible coverage, run the two touched journeys and typecheck, regenerate/check the source lock last, push the named cloud branch, require its exact-SHA Verify, open the contribution PR, and transfer this packet separately. Product commits contain no fleet reports or screenshots. No contract clauses, statuses, migrations, TEAM-003 acting-name code or public-name exclusions are edited.

## Root cause and correction

The saved audit-label fix joined native operator, invitation, incident-update, maintenance and component records at read time, supplied plain action labels and retained separate machine values in CSV and filter submissions. The prior Verify 43268823033 passed build and seven shards; delivery failed in automationRulesBrowserFlow at line 86 because the audit locator still required the raw rule ID and lowercase `updated` text. The failed job ID was 131375479964. Its complete once-read log is starting-delivery-failure.log. The aggregate verify failure was downstream of that shard.

The continuation joins existing alert_rules in the audit read to show the current rule name, with the same Removed item fallback after deletion. The existing automation assertion matches that exact rule's ID in JSON, proves its current name resolves, and finds the corresponding readable row to assert actor and nonempty formatted time. It also rejects the rule ID in the row. Existing automation/public-name exclusion assertions remain in place. No recorded event, filter predicate or CSV machine key changes.

Main's newer subscriber/report work was merged intact. The sole merge conflict was sources.lock.json; it was restored from main and regenerated from the merged tracked source after the audit edits. No generated contract view was committed.

## Native public-door probe and browser proof

A fresh `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive` install was opened with `rer dev --port 8787`. Its native owner entry completed first-run setup using Skip/Open Lamp. The probe created a component, published an incident, scheduled maintenance and invited an operator through the real authenticated HTTP API. Development mail remained suppressed. Native main audit files supplied the original rendering on that same installation; the candidate files were then restored and the same audit records re-read. There was no mock app or schema change. Session links and private local settings are excluded from this packet.

Before, the first four rows showed:

> Nov 12, 2026, 18:47 UTC+00:00 | Owner 5ad97235-87ed-45e4-9ec4-a6e5ad9af5bf  | invited | operator ecf6d909-4bbd-44ab-a9eb-edbd5001b4ee  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner 5ad97235-87ed-45e4-9ec4-a6e5ad9af5bf  | notice-published | maintenance 01M78HCM766B0E9SGCYSYEG46J  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner 5ad97235-87ed-45e4-9ec4-a6e5ad9af5bf  | state-changed | component Synthetic Lamp audit payments 1794509257561  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner 5ad97235-87ed-45e4-9ec4-a6e5ad9af5bf  | published | incident-update 01M78HCKV518M9XWS22QC1M45N  | —

After, those rows showed:

> Nov 12, 2026, 18:47 UTC+00:00 | Owner | Invited an operator | synthetic-lamp-audit-1794509257561@example.test Operator  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner | Published a maintenance notice | Synthetic Lamp audit database upgrade Maintenance  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner | Changed a component state | Synthetic Lamp audit payments 1794509257561 Component  | —
> Nov 12, 2026, 18:47 UTC+00:00 | Owner | Published an incident update | Synthetic Lamp payment delays Incident update  | —

The complete actual rows and four screenshot receipts are in browser-proof.json. `audit-before-1440.png`, `audit-before-390.png`, `audit-after-1440.png`, and `audit-after-390.png` capture only Settings Audit log. All four recorded no horizontal overflow. Across the unchanged 12 audit rows, visible UUID/ULID occurrences fell from 19 to 0 (measured from the actual rendered text). The assertion journey runs at 1440; 390 is visual evidence only. Two preliminary capture attempts encountered the native first-run setup and same-URL Settings navigation state; the final capture explicitly completed setup and reloaded the page. These were proof-script setup corrections, with no product workaround.

## Validation

- Focused native audit journey passed: tests/e2e/publishing-browser.test.mjs, TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys. It checks names, absent opaque IDs, unchanged actor/action semantics, CSV IDs/codes beside labels, invitee erasure without historic-email recovery and removed publication fallback. Actual output: audit-labels-test.log.
- Existing automation journey containing the failed audit assertion passed (1 registration, 369529.8 ms). Actual output: automation-audit-test.log.
- `pnpm run typecheck` passed; actual output: typecheck.log.
- Source lock regenerated last with `node scripts/edition-authoring/cli.mjs lock`; documented `check` passed: source-lock-check.json.
- Verification plan count: 90 registrations plus 10 assertion scripts = 100 checks; continuation 100 → 100, no added, deleted or skipped registration. The original saved focused test increased main's 99 to 100. Actual count: test-counts.log.
- Four visual captures show 12 retained audit rows before and after. Machine actor, subject and action values remain available through JSON and CSV.
- Candidate identities/trailers, push result, exact-SHA Verify and PR are recorded in final receipts. Only touched journeys ran locally; CI supplies the full wall. Base's fleet publication scan is unavailable in this cloud by the assignment's explicit cloud adaptation and remains a fleet landing gate.

## Clause result

TEAM-007 remains PARTIAL → PARTIAL; no acceptance point is claimed or contract cell edited.

CLAIM TEAM-007 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#TEAM-007 — audit labels identify people and subjects while filters and CSV retain machine keys
GAP TEAM-007: Existing holds remain: logo removal/replacement, standing-claim removal without aggregate change and archive-restored subscriber expiry proof; role, rule and token event authority remains under TEAM-004, AUTO-001 and API-001. This defect fix makes no DONE claim.

## Custody

The final product SHA, exact-SHA CI run/conclusion, PR URL, relevant checks and evidence selection are recorded in RECEIPT.json and ci-receipt.json. Evidence publication is separate from product READY and landing. This cloud never writes main, deploys, tags or lane inbox files.

Product push succeeded on the first guard attempt. Exact candidate Verify: https://github.com/just-every/run-lamp/actions/runs/43284812971. Its final outcome is retained in ci-receipt.json. Both candidate commits (including merge-side ancestry) passed the complete fleet author/committer/trailer inspection; see identity-receipt.json and candidate-identities.log.
