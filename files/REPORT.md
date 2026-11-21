# Lamp SETUP-002 browser time-zone fallback

Run Edit Run fleet, 21 November 2026. Tag: sd-lamp-c-f168.

Product branch: cloud/sd-lamp-c-f168  
Product head: f7dceaf2bd9334d57a47ce9d1b2db5cb9f87adc2  
Base and last observed main: 2939f22d0549be77fcc94315b2747667f8796e66

## Plan and results

1. Read SETUP-002 and its recorded gap, RL-5 and RL-6, the first-run page, the accepted-zone selector and the existing onboarding journey. The saved-valid control confirms UTC takes precedence over the New York browser and still exercises a Toronto edit. The both-invalid control uses the manual entry path and checks ordinary settings readback for UTC. The valid browser with an invalid stored zone had no website-confirmation proof.
2. Extend the same registered journey using a separate installation. Publish its initial UTC snapshot, seed an invalid stored zone with the local D1 fixture, and independently read that value through the operator settings door. A cold exploratory fixture with the invalid value and no prior snapshot hit the renderer before the settings door could respond. The final fixture models an installation with a retained snapshot and measures the ordinary confirmation path for that installation.
3. Have a signed-in owner read the recorded business website in a Chromium context reporting America/New_York. Check the resolved website and the New York suggestion, and check that the invalid stored setting remains in place until confirmation. Leave the suggestion unedited, click **Looks right, open Lamp**, and check that both the authenticated settings and unauthenticated public summary now show the browser zone. The public summary also identifies the expected business page.
4. Capture the setup review once at 1440 and 390 pixels using the established screenshot helper. Both widths show the New York suggestion and the confirmation button. The behavioral assertions run at 1440 pixels. Text-labeled Edit and confirmation controls need no icon tooltip. The existing 12-pixel preview and source captions were observed in the style sheet and are outside the leased proof.
5. Run the touched onboarding journey, typecheck, first-party check and contract views and lock checks. The existing control and wider website journey passed in the same registration. The full-history candidate range contains one commit without trailers. The product diff covers the existing test and its generated source-lock entry.

Plan extract update for the SETUP-002 queue row: the acceptance 2 branch for an invalid stored zone and a valid browser zone is proven locally through website confirmation, with ordinary settings and public readback. Keep the site's remaining reads and redirects, acceptances 1 and 3–7 and their prerequisites held. No campaign reordering.

SETUP-002 remains PARTIAL. The before and after totals are 65 DONE, 124 PARTIAL and 56 MISSING, for 245 clauses. The contract status, evidence, gap and acceptance text are identical to main.

## Acceptance coverage

| Acceptance | Result |
| --- | --- |
| 1. Operator entry and sign-in return | Held. The touched journey opens the setup route from the app. Existing owner entry coverage is in tests/e2e/auth-adoption-journey.test.mjs. |
| 2. Website read, script and redirect boundaries, and observed fields | Existing website assertions remain, including private destinations and reload without a reread. The planner holds the remaining read and redirect matrix. |
| 2. Valid saved zone takes precedence | Existing UTC control passed in tests/e2e/website-onboarding.test.mjs line 207. |
| 2. Invalid saved zone adopts a valid browser zone | Passed in tests/e2e/website-onboarding.test.mjs lines 60–106. The recorded site, visible suggestion, no change before confirmation, native settings and public summary are all checked. |
| 2. Neither zone is valid | Existing UTC fallback control passed in tests/e2e/website-onboarding.test.mjs lines 139–159. |
| 3. Linked vendor sources and groups | Existing Statuspage case remains. Other vendor and discovery cases are held. |
| 4. Optional silent resolved history | Existing imported history, active-state and delivery assertions remain. Full history exclusion proof is held. |
| 5. Empty, unreadable or omitted website defaults | Existing defaults and empty feed checks remain. Full editable defaults proof is held. |
| 6. Confirmation, persistence and Settings editability | The leased zone confirmation persisted through the native settings and public reads. Full retention and editability matrix is held. |
| 7. Completed entry, migration and rerun behavior | Existing returning-owner and redirect controls remain. Full completion and migration proof is held. |

## DONE-RIDERS

| Row | Result on this candidate |
| --- | --- |
| 1 | Partial. The leased path is asserted through ordinary doors in tests/e2e/website-onboarding.test.mjs lines 60–106. The other clause outcomes are held. |
| 2 | Pass for the leased path. Independent fixture and initial UTC snapshot, invalid settings read before and after the website read, and expected values from the browser and both post-confirmation doors. |
| 3 | The Verify imports shard invokes test:site, which registers this file. Exact-SHA run result is recorded below. |
| 4 | Pass. The screenshot and TAP receipts use the same test bytes recorded by the candidate source lock. |
| 5 | Inspected. SETUP-002 names its input-validation behavior in acceptance 2 and is listed in the BASE-INPUT-001 field proof register. No additional inherited proof is claimed. |
| 6 | Contract generator check passed. Clause judgment and provenance remain with the lander. |
| 7 | Pass. Acceptance wording and the generated views have no diff. RL-5 and RL-6 still govern. |
| 8 | No new authority behavior. This journey uses the ordinary owner session and an unauthenticated public read, with the existing site-reader refusals preserved. |
| 9 | No provider boundary claim. The business website is the existing recorded fixture. |
| 10 | No new policy default. The test exercises the precedence already stated in acceptance 2. |
| 11 | Pending guarded landing. The product head is on the named branch. Main still names the base above, and the full-history publication scan and candidate Run site are lander checks. |

PROBE SETUP-002 2: setup website review with an invalid stored zone and a browser set to New York -> New York suggested, invalid value retained until Open Lamp, then America/New_York in both settings and the public summary.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM SETUP-002 PARTIAL points=none tests=tests/e2e/website-onboarding.test.mjs#SETUP-002 — a fresh owner gives their website first; Lamp fills in the page from it, or from the status page it already runs, a site it cannot read leaves calm defaults, and the edited result is what customers see

GAP SETUP-002: The rest of acceptance 2's website-read and redirect matrix and acceptance 1 and 3–7's remaining entry, vendor, history, defaults, editability and completion proof are held. No entire numbered acceptance point is claimed in this lease.

## CI and landing

Branch Verify is a push run on the product SHA above. Main's base Verify 44861397097 and Run site 44861397172 completed successfully. Full-history publication scanning and the candidate's main-only Run site are pending guarded landing. No product PR was opened because the branch push starts Verify and the brief specifies guarded fast-forward landing.

Exact-SHA Verify 44863236776, event push, completed successfully. See verify-receipt.json and the [Verify run](https://github.com/just-every/run-lamp/actions/runs/44863236776).

The latest Git ref probe found main at 820ff8267db256927f5d95bad703f604b07197b5 and the product branch at f7dceaf2bd9334d57a47ce9d1b2db5cb9f87adc2.
