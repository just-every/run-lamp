# Lamp Theme palette fallback

Campaign sd-lamp-c-f186, 21 November 2026. The plan row is THEME-005, acceptance 2. Use the existing Theme browser journey on a populated Default template. Record the rendered defaults, check a distinctive valid custom palette on the same elements, disable it from Settings, and compare the next healthy public snapshot with the defaults.

## Trace

- src/core/features/page-settings/ui/theme-settings.tsx:31–43 wires the Look checkbox to a palette object when checked and null when unchecked. Settings autosave sends the theme to the owner page-settings route. The service at src/core/features/page-settings/service.ts:66–69,104–137 stores the theme and awaits the public rebuild before returning the saved settings.
- src/core/features/public-snapshot/theme-rendering.ts:16–22 emits public color overrides when a palette is present. src/core/features/public-snapshot/routes.ts:209–235 attaches generation and freshness metadata to the retained artifacts.
- tests/e2e/publishing-browser.test.mjs:1079–1080 runs the extended journey. The composer shard uses the existing test:composer script through scripts/verification/plan.mjs:8.
- tests/e2e/helpers/theme-browser-flow.mjs:9–43,87–133 observes the public HTML and stylesheet responses, the seeded Web application component and its operational marker, and the checkbox write. It reads computed CSS on the body, component card, heading and state-marker dot. The test asserts at 1440 pixels. Screenshots show the custom public page, disabled setting and restored public page at 1440 and 390 pixels.

## Acceptances

| Point | Outcome | Proof |
| --- | --- | --- |
| 1 | Unticking keeps all nine colors stored | Held. The acknowledged null field proves disablement. |
| 2 | The public page shows the default look while custom colors are off | Browser assertion matches the stylesheet and HTML generation before reading the same four elements. All four positively match distinctive custom inputs and differ from the defaults. All four return to the recorded defaults after unchecking and receiving the successful Settings response. See palette-toggle.json and tests/e2e/helpers/theme-browser-flow.mjs:98–129. |
| 3 | Ticking again restores exactly the stored colors | Held. The journey re-enters fixture colors for the existing checks. |
| 4 | Unrelated settings saves during disablement preserve the colors | Held. |
| 5 | One public-door journey proves untick, save, reload and re-tick | Held. The new proof covers the untick, acknowledgement and public read in point 2. |

The clause declares no inherited Base duty. The changed files are the existing browser registration and helper plus their generated source-lock hashes. The Theme registration count is unchanged. The journey retains its contrast refusal, asset, script-free rendering, responsive layout, typing and capacity assertions. The new outcome is a visual setting. The proof adds no screen or control.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM THEME-005 PARTIAL points=2 tests=tests/e2e/publishing-browser.test.mjs#THEME-001 and THEME-005 — owner publishes branded themes within budget and restores default colours

GAP THEME-005: Acceptances 1, 3, 4 and 5 remain held for all-nine-color retention, exact re-enable restoration, unrelated saves while disabled, and the complete untick, save, reload and re-tick journey.

## Observations

PROBE THEME-005 2: Look checkbox and public root for the populated Default template -> acknowledged Settings disablement and a new matched HTML and stylesheet generation restored the four default computed colors.

| Computed color | Default and restored | Saved custom |
| --- | --- | --- |
| Body background | rgb(248, 246, 240) | rgb(244, 244, 244) |
| Component card | rgb(255, 255, 255) | rgb(233, 242, 236) |
| Component heading | rgb(24, 45, 36) | rgb(23, 45, 36) |
| Operational marker | rgb(25, 134, 90) | rgb(24, 90, 59) |

The browser journey passed with Node 22.20.0 and Verify's Playwright Chromium Headless Shell. The same system Chromium favicon request reproduced on main in the existing four-request assertion. The assertion was retained, and all four template capacity probes passed with the pinned browser. Typecheck, the first-party check, generated views and source lock passed. The source lock changed only for the two test files. The contract records 66 DONE, 123 PARTIAL and 56 MISSING at both the base and candidate. The recorded THEME-005 status is MISSING. The candidate claim is PARTIAL.

## DONE riders

| Row | Result |
| --- | --- |
| 1 | Point 2 passes the local public-door journey, tests/e2e/helpers/theme-browser-flow.mjs:98–129. Points 1, 3, 4 and 5 are held. |
| 2 | Pass for point 2. The named seeded component and state marker are visible before, during and after the change. All four custom colors are independently matched against the fixture and differ from baseline, lines 32–41 and 104–126. |
| 3 | The composer shard invokes the journey through test:composer. The candidate Verify outcome is recorded below. |
| 4 | Pass for point 2. The source, tests and lock are byte-identical to the tree used for the passing local journey. The test's normal temporary visual probe restores its exact source bytes on exit. |
| 5 | Inspected. No Base duty is cited or required by the named acceptance. |
| 6 | Generated views pass. Status and judgment provenance are retained from main pending the lane's decision. |
| 7 | Pass. The candidate has no contract diff. |
| 8 | Inapplicable to this display acceptance. |
| 9 | Inapplicable. This proof uses a synthetic local installation. |
| 10 | Inapplicable. The round adopts no new policy default. |
| 11 | Pending. The product ref is branch-only. The guarded lander owns publication scanning, main equality and Run site for the resulting main commit. |

## Publication and CI

Product branch cloud/sd-lamp-c-f186 advertises bb65d93d81f41499a9319ee5e5a22ace164b3901. Main advertises f95b99b87f0ab98c8ad15c8e842a77baf30c95b1. The candidate is a single child of the fetched main used for the local proof. Branch Verify 44890077225 was still in progress on the exact candidate SHA at 2026-11-21T09:48:27Z. Main-base Verify 44888108728 and Run site 44888108898 completed successfully on f95b99b87f0ab98c8ad15c8e842a77baf30c95b1. Candidate publication scanning, main equality and Run site await the guarded lander. No pull request was required because branch push triggered Verify.
