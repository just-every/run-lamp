# Lamp PAGE-002 operator timeline publication time

Fleet round sd-lamp-c-f153, 20 November 2026.

## Plan and result

1. Read PAGE-002 and its Status row, the plan extract and DONE riders. Use only acceptance 3's operator-timeline part of the lease.
2. Read the operator timeline and time formatter in `src/core/features/incidents/ui/incident-record.tsx` and `src/core/app/client/ui/states.tsx`. Extend the shared immediate browser publication flow in `tests/e2e/publishing-browser.test.mjs`. This keeps two existing journey registrations, one at 1440 pixels and one at 390 pixels.
3. Publish through the hydrated operator composer. Read the committed update through the native incident endpoint, match the Timeline list item by its update ID, and wait for that row's timestamp to be visible. Compare its exact text to the Los Angeles date and 24-hour time independently formatted from the API's recorded publication instant, followed by the Los Angeles label. Assert the fixture's configured page zone and the different Brisbane browser zone. The expectation uses the recorded instant, including across date or daylight saving boundaries.
4. Retain the Page and Email preview controls, native commit reconciliation, and the unauthenticated permalink controls for publication instant, customer wording and the next-update commitment. Run the touched browser file and typecheck, regenerate and verify the contract views, restore them from main, and regenerate and check the source lock. Publish the candidate on the named cloud branch and return the checked evidence packet separately.

The product diff contains the browser test and generated source-lock hash. No assertions were removed or weakened, and the existing eight registrations in this file remain eight. The comparison binds date, time and zone to the selected update, so hidden, absent, incorrect or browser-local timestamp output fails the journey. The screenshots show the timeline section from the matching desktop and phone journeys. There is no product UI edit, policy default, provider change, migration or new authority path.

## Acceptance coverage

| Acceptance | Evidence and result |
| --- | --- |
| 1 | Existing public catalogue journey in `tests/e2e/public-contract.test.mjs` at line 499 checks representative public content. Complete initial HTML reconciliation with PAGE-001 and the SUB-001 form is held. |
| 2 | Existing script-disabled checks in `tests/e2e/public-contract.test.mjs` at lines 977–987 and 1115 onward cover the incident form and some timestamps. Complete script-free content, timestamps and subscription submission are held. |
| 3 | The two existing publication journeys at lines 693 and 1073 both call the assertion at lines 398–410 in `tests/e2e/publishing-browser.test.mjs`. This proves the committed operator timeline timestamp. Existing preview and permalink checks at lines 416–430 and 846–901 stay intact. Complete operator entry, preview, public timestamp and zone-label proof is held. |

## DONE riders and pre-landing checks

| Rider | Result |
| --- | --- |
| 1 | Partial. The Timeline publication outcome was exercised. The acceptance table names the held outcomes. |
| 2 | Pass for the leased outcome. The browser publishes a populated native fixture. The expected date and time use separate Intl conversions of the native instant, with the zone label asserted explicitly. |
| 3 | The composer Verify shard selects `test:composer`, which includes the changed file. See the exact-head Verify receipt below. |
| 4 | Local browser proof and both screenshots use the checked-out candidate SHA. |
| 5 | The clause names its own time-zone duty. PAGE-001 and SUB-001 remain its existing public-page dependencies. PAGE-009 and PAGE-014 retain their timestamp and generation scopes. |
| 6 | Contract generation and freshness passed locally. Main's Status, Gap, Evidence and provenance cells remain in force. |
| 7 | Acceptance text and clause scope are identical to main. |
| 8 | The test uses the existing authenticated operator publication door. The slice changes no permission or authority path. |
| 9 | The timestamp uses local synthetic records. It requires no provider or legal receipt. |
| 10 | No policy default was adopted. |
| 11 | Guarded landing, the full-history publication scan and Run site for the candidate are Mac lander checks. |

Plan row PAGE-002 only. Record the operator timeline proof within acceptance 3 and keep the clause PARTIAL. Counts before and after are 65 DONE, 124 PARTIAL and 56 MISSING, 245 total.

GAP PAGE-002: Complete initial HTML and script-free content, timestamps and subscription submission, plus acceptance 3's remaining operator entry, preview, public timestamp and zone-label coverage, remain held.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and node scripts/edition-authoring/cli.mjs check exit=0; views=node src/base/contract-docs.mjs write and node src/base/contract-docs.mjs check exit=0; ledger=none exit=0

The affected Timeline text is 13 pixels in `src/core/app/client/ui/composer.css` at line 173. Its Correct action is text-labelled. The two browser images show the timestamp and control within the Timeline at the requested viewports.

There were no email-shaped additions in the candidate diff. The standalone slash-delimited strings in the added test are the existing page and browser time-zone identifiers. The candidate diff contains no screenshots, receipts, fixture values, workflow edits or generated contract views.

## Product custody and exact-head Verify

GitHub advertises branch cloud/sd-lamp-c-f153 at a16d8b260b0fa9e6c0b90aab306d9dbcd2878718. Main is at 173e93d259f968daffd0148365c2b9a26c62e3e6. The checked base recorded successful Verify 44671292824 and Run site 44671292988. The candidate uses push Verify. The cloud handoff precedes the candidate publication scan, guarded landing and Run site.

Exact-head push Verify 44784196691 was in_progress with conclusion pending at 2026-11-20T17:42:33+00:00. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44784196691)

CLAIM PAGE-002 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey; tests/e2e/publishing-browser.test.mjs#INCIDENT-001 AGENT-004 MOBILE-001 — 390-wide owner sign-in, alert review, publication, resolution and maintenance smoke
