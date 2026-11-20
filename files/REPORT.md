# Lamp PAGE-002 continuation

Run Edit Run fleet, 2026-11-20. Round `sd-lamp-c-f159`.

PAGE-002 remains PARTIAL. This round covers the operator timeline publication timestamp within acceptance 3. The contract counts before and after are 65 DONE, 124 PARTIAL and 56 MISSING.

## Plan and result

1. Continue the predecessor candidate `a16d8b260b0fa9e6c0b90aab306d9dbcd2878718` on the round branch with current main as its base. Read the PAGE-002 acceptance text and recorded Gap, then inspect `src/core/features/incidents/ui/incident-record.tsx` and `src/core/app/client/ui/states.tsx`. The timeline reads each update's `publishedAt` through the configured page-zone formatter.
2. Extend the existing desktop publication journey and mobile smoke. Capture the operator's native publish response, reconcile its update ID and instant with the incident readback, and select that committed update's timeline row. Compare the visible date, 24-hour clock and Los Angeles label with a Node Intl conversion of the native instant. The independent test oracle uses explicit Los Angeles date and clock formatters. Browser and page settings are checked independently, with Chromium in Brisbane and the Lamp page in Los Angeles. The existing preview and public permalink commitment checks remain in the journeys.
3. Run the touched browser suite and typecheck, check the first-party profile, regenerate and check contract views, restore main's generated views, and regenerate and check the source lock. Capture the timeline at both leased widths. Submit the product branch for the guarded lander and return the evidence on its separate ref.

The current plan row is PAGE-002 in the `sd-lamp-c-f153` continuation. Record the operator timeline subpoint as proven and retain the remainder below. The contract source, status cells, generated views, runtime UI, homepage and site implementation have no candidate diff. No policy choice, provider dependency, test registration or migration was added.

## Acceptance evidence

| Point | Door and source | Result |
|---|---|---|
| 1 | Public root and initial response in `tests/e2e/public-contract.test.mjs` | Existing representative checks. Full initial PAGE-001 inventory and SUB-001 form coverage remain held. |
| 2 | Script-disabled browser in `tests/e2e/public-contract.test.mjs` and existing anonymous consent journey in `tests/e2e/delivery-contract.test.mjs` | Existing checks cover selected no-script facts and a consent submission. Full status, update, timestamp and submission reconciliation remains held. |
| 3 | Native operator Publish update and incident Timeline in `tests/e2e/publishing-browser.test.mjs`, lines 391–423, called at lines 1079 and 1084. Page preview and permalink commitment controls are at lines 874 and 906–910. | Operator timeline subpoint passed locally at 1440 and 390. Complete operator entry, preview, public timestamps and zone-label coverage remain held. |

GAP PAGE-002: Complete initial HTML, script-free content and subscription submission, and the remaining operator entry, preview, public timestamp and zone-label proof stay held.

## DONE-RIDERS and pre-READY checks

| Rider | Result on the candidate |
|---|---|
| 1 | Open for the clause. The acceptance table identifies the remaining outcomes. |
| 2 | Pass for the lease. Lines 391–419 check the selected published row using seeded incident data and a separate conversion of the stored instant. A missing row, wrong date, wrong time or wrong label fails the browser assertion. |
| 3 | Verify runs the test file via `test:composer` in the composer shard. The exact-SHA result is recorded below. |
| 4 | Pass. Both browser observations and screenshots are bound to the checked candidate in `receipt.json`. |
| 5 | Inspected. PAGE-002 names PAGE-001 content and the SUB-001 form in point 1. Existing inherited duties remain as written. |
| 6 | Mechanical pass. The views generate and check. Contract judgments and their provenance remain owned by the lander. |
| 7 | Pass. Acceptance sentences, Status, Gap and Evidence match main. |
| 8 | Outside this lease. The test exercises ordinary publication and reads its timeline. It changes no authority, erasure or replay behaviour. |
| 9 | Outside this lease. The proof uses a local application and a synthetic AI response boundary. |
| 10 | Outside this lease. The test exercises the existing configured time-zone policy. |
| 11 | Pending guarded landing. The branch push has no candidate Run site result or cloud publication scan. The Mac lander owns exact-main equality, the full-history scan and Run site. |

The touched journeys retain all previous assertions. The two screenshot excerpts show the timeline text and its labeled Correct action at each width. The runtime control, typography, borders and settings rendering were inspected as held code. No icon-only control was added or changed. A diff check found no new email-shaped fixture strings or bare owner-style slash tokens in prose.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Candidate and verification

The pushed product branch is cloud/sd-lamp-c-f159 at a044290f5467382dad631d860ca9f9b78250853d. Verify run 44794778932 is a push run on this exact commit. At the reporting cutoff its status is completed and conclusion is success. [Verify](https://github.com/just-every/run-lamp/actions/runs/44794778932)

Main was 173e93d259f968daffd0148365c2b9a26c62e3e6 at push time. Its Verify runs 44671292824 and 44666249683 and Run site 44671292988 reported success for that separate commit. The candidate awaits landing and its own Run site. Publication scan for a044290f5467382dad631d860ca9f9b78250853d: complete, historyScanned and findings are unestablished pending the Mac lander's scan.

The focused browser run, typecheck, first-party profile, generated-view checks and source-lock check passed. In the full browser file seven tests passed and the unrelated THEME-001 case could not find its default Playwright headless shell. It expects a default browser binary independently of the primary suite's executable override. With system Chromium supplied to that helper, THEME-001 reached the four-request check and observed five paths, including the favicon. The same invocation on the main commit failed at the same check with the same five paths. CI installs the pinned Playwright Chromium through its normal workflow. No theme assertion was edited.

PROBE PAGE-002 3: native Publish update and incident Timeline in a Brisbane browser with Los Angeles page settings -> the committed ID and instant survived native readback, and the identified row showed Nov 20, 2026, 10:34 Los Angeles time at 1440 and Nov 20, 2026, 10:35 Los Angeles time at 390. The timestamps, update IDs and screenshot hashes are recorded in receipt.json.

The selected packet contains this report, the exact candidate receipt and the two Timeline screenshots.
