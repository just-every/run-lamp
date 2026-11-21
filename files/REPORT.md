# Lamp THEME-004 contrast evidence

Run sd-lamp-c-f192, 21 November 2026. Builder report by Codex.

## Plan and result

1. Map all five acceptance points and the held work to the existing journey. The existing light-palette theme journey captured CSS custom properties and already exercised generic contrast refusals. The missing case was a dark, near-threshold save whose visible update text passes against the healthy default status card, with a distinct refusal that would pass against the page.
2. Seed an operational component through the native API on a fresh test installation. Run the browser scenario before the incident journeys publish outages. Use the existing Theme form to save the palette, then load the public root in new signed-out contexts at 1440 and 390 pixels.
3. Read computed foreground from the real, visible update paragraph and backgrounds from its card and the page body. Calculate WCAG relative luminance from the computed sRGB channels in test code. Change only Text through Settings, record the native 400 and surface-contrast message, then reload Settings and independently fetch and measure the public page at both widths.
4. Run the touched browser file, typecheck, and first-party checks. Generate and check the contract views, restore the main versions, and refresh and check the source lock. Publish the product candidate and collect its Verify result separately from the browser evidence.

The plan row is THEME-004 in the replan-40 queue. Record the default, healthy public status card slice of acceptance 1 as proven locally. The candidate carries one additional journey and the regenerated source lock. The contract source, recorded status cells, and generated views match the checkout base.

| Browser width | Computed text on card | Proposed text on page | Proposed text on card | After refusal |
| --- | ---: | ---: | ---: | --- |
| 1440 px | 4.5092:1 | 7.3969:1 | 4.4556:1 | Original theme and all nine palette values retained. Fresh public colours identical. |
| 390 px | 4.5092:1 | 7.3969:1 | 4.4556:1 | Original theme and all nine palette values retained. Fresh public colours identical. |

The saved foreground, card and page computed to RGB (163, 163, 163), (58, 58, 58) and (17, 17, 17). The rejected input was RGB (162, 162, 162). The existing validator checks each foreground against both background and surface in `src/core/features/page-settings/theme-safety.ts:8–34`. The public theme stylesheet sets the card and text tokens in `src/core/features/public-snapshot/theme-rendering.ts:18`. The healthy status card and its 15 px update paragraph use those tokens in `src/core/features/public-snapshot/styles/status.css:3–9`. The card is rendered by `src/core/features/public-snapshot/renderer.ts:225`.

PROBE THEME-004 1: Settings Look saves the near-threshold palette, then the signed-out healthy default root serves a measured 4.5092:1 card at both widths. A text edit with 7.3969:1 against the page and 4.4556:1 against the card returns 400, shows the surface contrast error, and leaves all saved colours and both fresh page readbacks intact.

| Acceptance | Evidence and remaining work |
| --- | --- |
| 1 | Local browser pass for the healthy default public status card. Settings and computed values at `tests/e2e/helpers/theme-browser-flow.mjs:59–85` and refusal plus independent readback at lines 88–106. Other cards are held. |
| 2 | Held. Fixed light backgrounds outside the leased card have separate correction and proof. |
| 3 | Held. Complete validation across every public and dashboard card, including Uptime and Regions. |
| 4 | Held. The leased refusal names the surface contrast pair. Naming each failing card is separate. |
| 5 | Held. This proof shows the healthy public status card and its Settings at both widths. The complete dark-palette proof across both public and dashboard pages is separate. |

The existing theme, adoption, UIP, and release prerequisites stay in the campaign queue. THEME-001, THEME-002, THEME-003 and THEME-005 remain with their own campaigns.

## DONE riders

| Rider | Result |
| --- | --- |
| 1 | Partial. The named native browser journey reaches the leased decision and refusal. The acceptance table lists every outstanding outcome. |
| 2 | Pass for the slice. The test seeds a public component through native routes at `tests/e2e/helpers/theme-flow.mjs:10–20`. It checks rendered styles independently of product validation and tests both a successful and rejected edit. |
| 3 | Pass for the slice. Push Verify 44900560306 completed successfully on the candidate and loads this file through the composer shard and `test:composer`. |
| 4 | The local browser receipt identifies the candidate, measured values, and four screen captures. |
| 5 | Inspected. THEME-004 writes the contrast duty directly in its acceptance points. |
| 6 | Contract view generation and checking passed locally. Main retains custody of the existing MISSING judgment and judgment provenance. |
| 7 | Pass. The complete contract and acceptance text match the checkout base. |
| 8 | Out of scope for this test-only change. The existing owner Settings door and new signed-out reader contexts are used. |
| 9 | No provider or legal boundary is part of the leased behaviour. |
| 10 | No new policy default was adopted. |
| 11 | Guarded landing, candidate publication scan and exact-main Run site are recorded in the custody receipt when available. |

The active assertions check the real CSS property values, the 400 from the actual Settings write, the refusal UI, and retained values in both Settings and fresh public contexts. The existing branded theme journey reuses the palette input interaction with its assertions retained. This round changes test coverage only. Authority, erasure and replay paths, production UI styling, and controls were outside the leased behaviour.

CLAIM THEME-004 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#owner saves readable dark status card colours and a rejected edit stays private

GAP THEME-004: Acceptance 1’s other cards and acceptances 2–5 remain held, including fixed light backgrounds, complete public and dashboard coverage including Uptime and Regions, card-named refusals and complete two-page proof at both widths.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Checks and custody

The exact candidate's focused browser run, typecheck, first-party check, contract generator and source lock checks passed. The earlier run of the entire touched browser file passed eight of nine. Its existing THEME-001 four-request assertion counted the favicon as a fifth asset with the VM's system Chromium. The same assertion and asset list reproduced on the fetched main parent with the same Chromium. The candidate's final browser rerun captured the Text field on the phone-size Settings screen.

Recorded contract totals before and after were 66 DONE, 123 PARTIAL, and 56 MISSING, for 245 clauses. The recorded THEME-004 judgment remains MISSING. The claim is PARTIAL for a slice of acceptance 1, with zero complete points claimed.

The browser receipt contains the exact candidate assertions, comparison with main, and hashes for the four captures. The custody receipt records branch publication and exact-SHA CI separately.

Push Verify 44900560306 completed successfully on candidate 1c55d6b6f4e7e0f94d1015c4cbe5b03e0a9f786f. The Mac lander still owns the full-history publication scan and exact-main Run site.
