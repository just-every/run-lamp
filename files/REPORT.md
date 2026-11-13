# Lamp incident reopen and availability download names

Task: main-lamp-incident-reopen-1. Declared repository: just-every/run-lamp.
Product branch: cloud/main-lamp-incident-reopen-1. Base: 733e2ce1e2fc618183a93632218bb86456a06a79 (Lamp 1.11.14).

## Plan

The complete plan is in PLAN.md: reproduce on main; extend native operator/public journeys; fix only reopen baselines and filenames; run touched checks and typecheck; capture changed screens at 1440/390; refresh main and regenerate the source lock last; push the named branch with fleet identity; await exact-SHA Verify; return evidence separately.

## Reproduction

The native operator API created Checkout at Major outage, published Degraded performance, resolved, then reopened at Partially unavailable. The component inventory read Operational before reopening, while the published transition and public incident permalink read Degraded performance → Partially unavailable. The original resolution remained unchanged. The direct CSV and PDF responses both named downloads with the full opaque component ID. before-receipt.json records the actual response metadata and main SHA.

The extended component History browser journey also failed its component-name assertion on unchanged product code. The first extended incident browser run stopped at its existing retained-claim assertion because the reproduction intentionally added a Degraded performance publication; its expected retained claim was updated to match the new scenario while preserving the same assertion.

## Changes

Publication and preview now use the current public component state when an incident moves out of Resolved. Ongoing incident transitions, historic publications, lifecycle changes, claim storage and publication transactions retain their existing behavior. No stored timeline is rewritten.

A server filename allocator normalizes names into short ASCII slugs. It orders components by ID internally, reserves all base slugs, and adds numeric suffixes to duplicates without exposing any ID. Names that normalize to the same slug are also disambiguated. Browser downloads use the response's Content-Disposition filename, so direct and browser CSV/PDF downloads agree. The report serializers, periods and calculations are unchanged.

The existing component History journey downloads both formats for two same-named components, verifies safe name-based filenames with no opaque ID, checks browser/direct agreement and proves distinct names. The duplicate fixture is removed before the rest of the original journey continues. The existing incident journey lowers impact before resolution, explicitly reopens at Partially unavailable, checks Operational as the previous state, compares all prior updates unchanged and checks both operator and public timelines. The existing native API journey checks preview and published reopen changes.

## Verification and browser proof

Typecheck passed. The extended native API journey passed. The extended incident browser journey passed, including both timelines and prior-publication immutability. The component History browser journey passed after correcting a test selector that had incorrectly excluded its state from the accessible row button name. Actual command results, the superseded failing browser run and successful rerun are retained in local-receipt.json and the selected logs. The test correction preserves the original journey's assertions. Browser assertions run at 1440; the changed component History and reopened operator/public timeline screens are captured once at 1440 and 390. Screenshots are evidence files only.

The test inventory remains 90 registrations plus 10 assertion scripts = 100 checks before and after (cap 200). Contract counts remain 60 done, 129 partial, 55 missing, 244 total. No CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md edits or clause status changes are made by this builder.

## Custody and limitations

Product SHA: ecb56522a4a95ab8373551a5e7cde05f7148bb03. The fleet guard pushed it successfully on attempt 1. Exact-SHA push Verify: 43454772215, initially queued. PR and final CI conclusion pending. The fleet lander owns the publication scan and landing. Evidence publication is report transport only, separate from product readiness. No deployment or main push is performed here.

## Builder claims

No clause Status, Gap or Evidence cells change. These are limited builder proof claims, not DONE declarations:

CLAIM INCIDENT-005 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM UPTIME-009 PARTIAL points=none tests=tests/e2e/maintenance-timezone.test.mjs#MAINT-009 PAGE-020 — operator schedules, reschedules and publishes maintenance in its configured zone, then a customer subscribes by keyboard
DEFAULT UPTIME-009: normalized component names use numeric suffixes when names collide; component IDs are used only for stable ordering and are absent from filenames.
GAP UPTIME-009: this round proves the filename correction only; it makes no new full-clause availability-report claim.

Browser proof was inspected at both widths: the changed timeline state transition is readable on operator and public screens, and the component History controls fit both widths. Earlier timeline wording remains visible as recorded.
