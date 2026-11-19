# Lamp MOBILE-001 standing claim

Run Edit Run fleet, 2026-11-19.
## Plan and result

1. Read MOBILE-001, its recorded gap, the selected plan row and the DONE riders. Confirm the components collection reads the persisted standing claim for each component.
2. Extend the existing 390 × 844 phone journey after the standing-claim save. Use its terminal-authenticated browser session for a fresh component collection GET, locate the newly created component by its exact ID and check the saved claim. Reload the Components page and verify the named row and its reopened Status drawer.
3. Run the touched browser test, typecheck, first-party check, contract generator write and check, and source lock regeneration and check. Publish the branch and return the local evidence with its exact Git and CI provenance.

The product change is test-only. The components GET reads claim records by component ID in the existing service, and the existing PUT persists a standing claim before returning the updated component view. Both files were inspected read-only. The existing save, immediate visible status and remaining journey assertions still run. This extends one existing test registration.

## Acceptance coverage

| Point | Result and evidence |
| --- | --- |
| 1 | Held. The phone journey signs in via a terminal-issued link and opens an alert draft at tests/e2e/helpers/phone-desk-flow.mjs lines 20–47. Complete entry and draft coverage at both widths remains with the plan. |
| 2 | Held. The existing test attaches a component, checks saved impact and opens Email at tests/e2e/helpers/phone-desk-flow.mjs lines 48–68. Complete exact draft and email preview proof remains. |
| 3 | Held. The existing test checks one publication for the component and the resolved lifecycle at tests/e2e/helpers/phone-desk-flow.mjs lines 69–88. Complete persisted and visible publication and resolution reconciliation remains. |
| 4 | Passed locally. The existing 390-wide registration in tests/e2e/publishing-browser.test.mjs line 944 saves Degraded performance. The terminal-authenticated GET returns 200 and matches the exact component ID, name and standingClaimState at tests/e2e/helpers/phone-desk-flow.mjs lines 99–111. After reload the same named row shows Slow and the reopened drawer's selected state matches the saved claim at lines 113–125. |
| 5 | Held. The existing test schedules maintenance and sees its heading at tests/e2e/helpers/phone-desk-flow.mjs lines 126–138. Maintenance-window readback remains. |
| 6 | Held. The existing 390-wide screen checks cover document overflow and serious or critical axe findings at tests/e2e/helpers/phone-desk-flow.mjs lines 13–18. Complete overflow and 44-pixel touch control proof remains. |

PROBE MOBILE-001 4: 390 × 844 Components Status drawer, save Degraded performance → authenticated GET returns 200 for the exact component ID with standingClaimState equal to Degraded performance. The reloaded matching row shows Slow and the reopened drawer restores the saved selection.

## DONE riders

| Row | Result |
| --- | --- |
| 1 | Incomplete for DONE. Point 4 has public-door browser and HTTP assertions. The held points above retain their outstanding outcomes. |
| 2 | Pass for point 4. The test creates a fresh component, uses a literal expected state and checks the independent readback plus reloaded UI at tests/e2e/helpers/phone-desk-flow.mjs lines 28–30 and 99–125. An absent component, missing persistence, wrong status pill or wrong saved drawer selection fails the journey. |
| 3 | See the exact-SHA Verify record below. The existing composer shard runs this test through scripts/verification/plan.mjs line 8 and the test:composer command in package.json. |
| 4 | See the candidate browser receipt below. |
| 5 | Inspected. MOBILE-001 cites BASE-ACCESSIBILITY-001 and names the UPDATE-005 draft duty in CONTRACT.md lines 2668–2672. COMP-006 keeps general claim rules, and MOBILE-002 keeps installed-device push qualification. |
| 6 | Contract generator write and check passed. Main's status, gap, evidence and provenance are carried forward. Candidate judgment remains with the lander. |
| 7 | Pass. The candidate has no contract, acceptance-view or coverage-map changes. |
| 8 | Outside point 4. The test exercises the existing authenticated operator door and introduces no authority path. |
| 9 | Outside point 4. No provider, native device or compliance proof is claimed. |
| 10 | Outside point 4. No new policy choice was needed. |
| 11 | Pending guarded landing. The cloud branch advertises the candidate. Full-history publication scan and exact-main Run site remain with the lander. |

## Handoff

The plan's MOBILE-001 row gains proof for acceptance 4 only. The recorded clause remains PARTIAL and the contract counts remain 65 DONE, 124 PARTIAL and 55 MISSING out of 244. The test checks persistence and visibility on an isolated local installation. The desktop screenshot records the post-reload result at 1440 pixels, with assertions at 390 × 844.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

CLAIM MOBILE-001 PARTIAL points=4 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 AGENT-004 MOBILE-001 — 390-wide owner sign-in, alert review, publication, resolution and maintenance smoke

GAP MOBILE-001: Acceptances 1–3 and 5–6 remain held, including complete terminal entry and private draft at both widths, exact saved wording and email preview, publication and resolution reconciliation, maintenance readback, overflow and 44-pixel touch controls.

## Provenance

- Product branch cloud/sd-lamp-c-f150 advertises c0063db3f3316e04af782b9bd62ada581259fd2c. The branch name and commit identity were verified before publishing. The pushed diff contains the phone helper and its regenerated source lock.
- Main advertised 8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b at the final ref check. The candidate remains branch-only. At the opening main check, 8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b had green Verify 44548523701 and green Run site 44548523753.
- Candidate browser run on c0063db3f3316e04af782b9bd62ada581259fd2c with Node 22.20.0 and Chromium at 390 × 844 for the phone registration. The full touched browser file returned 7 passed, 1 failed, 0 cancelled, 0 skipped. The phone registration passed. Candidate screenshots accompany this report.
- The initial full file run passed the phone registration and seven of eight tests. THEME-001 could not launch because its independent Playwright launcher expected the browser registry path. Its focused rerun with system Chromium in an isolated registry reached the unchanged theme asset request assertion. The same assertion failed with the same asset list on main under system Chromium.
- Typecheck, helper syntax, first-party profile, contract generator write and check, source lock regeneration and check, and changed-text review passed. No migration ledger check applies. The changed text contains no email-shaped strings.
- Candidate Verify run 44554671811 was observed as in_progress with conclusion pending. Event push, SHA c0063db3f3316e04af782b9bd62ada581259fd2c. https://github.com/just-every/run-lamp/actions/runs/44554671811
- Candidate publication scan for c0063db3f3316e04af782b9bd62ada581259fd2c has complete=false, historyScanned=unestablished and findings=unestablished. The exact-main Run site has no candidate run ID pending guarded landing.
