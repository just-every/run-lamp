# Lamp MOVE-006 cutover browser proof

Run `sd-lamp-c-f138`, 2026-11-18 UTC. Product branch `cloud/sd-lamp-c-f138`, candidate `dcb14a1094e29a42a966c624fe1214c6a4ea66c9`, and base `177378a989a7496a2e3dc00ac9a43947efd7c031`.

MOVE-006 remains PARTIAL. Acceptance 3 passed locally on the exact candidate at 1440 and 390 pixels. Acceptances 1, 2 and 4 are held by this lease. Contract counts before and after are 60 done, 129 partial and 55 missing, 244 total.

## Plan row and results

- `CLAUSES="MOVE-006"` in sd-lamp-replan-31. Read the contract, gap, planner extract and current Cutover implementation. Extend the existing four-provider journey and preserve its current checks. Bind browser and mechanical evidence to the candidate, push it for Verify and return the evidence separately.
- The journey imports the Statuspage fixture and selects the exact existing incident bookmark. The native browser request follows the old path to the imported incident, receives successful HTML containing the incident title and shows Opens in the matching row.
- The browser uses a second loopback port on the app host as a cross-origin, same-site public address. A credentialed control reaches both stages of the redirect with the seeded cookie. The Cutover action follows the same redirect with no Cookie header on either request.
- The selected address serves successful HTML at another URL, successful plain text at the expected URL and an HTML 404 at the expected URL. The journey also reaches a refused connection. Each case leaves the exact bookmark row visibly failed. The HTML 404 isolates the successful-response requirement in acceptance 3.
- Existing per-provider Opens checks, visible failure checks, accessibility and overflow assertions, and notification, invitation and undo controls remain active. The 390-pixel capture scrolls the existing table to the Live check column. Cutover UI source, contract cells, generated views, homepage, site, brand and visual files were unchanged.
- A separate local run passed at the regular 1440-pixel width with recording disabled. The local recording repeats the targeted assertions at 390. Browser, mechanical and ref receipts are included with two captures of the visible failure at both widths. The browser receipt records the Opens assertions at both widths.

## Acceptance and inherited scope

| Point | Outcome | Result and evidence |
|---|---|---|
| 1 | Dry-run and saved import show bounded old addresses, proposed or surviving permalinks, unavailable addresses and source-host limits. | Held. The round preserves existing import and preview assertions. |
| 2 | Preview lists source feeds, unsupported readers and eligible invitations with original expiry. | Held. The round preserves existing reader, invitation and notification controls. |
| 3 | Opens checks follow redirects without credentials and verify the final native address and successful HTML. Failures remain visible. | Local PASS on exact SHA. `tests/e2e/cutover-browser.test.mjs:62` establishes that both hops can carry the synthetic cookie, line 74 tests the native redirect and HTML, line 85 runs the positive and adverse HTTP cases and line 112 exercises the refused connection. The existing provider failure assertion remains at line 369. See the CI receipt below. |
| 4 | Guide orders import, preview, invitations, hostnames, rechecking and retaining the source. | Held. Existing guide checks remain. |
| Inherited | Import authority, provider compatibility, adoption, release and independent UI gates. | The owner journey still uses the native import and Cutover doors. No new Base duty, provider claim, authorization rule, or invitation behavior is introduced. Existing prerequisites remain with their current owners. |

## DONE-RIDERS and pre-READY review

1. Partial. Acceptance 3 is exercised on the exact candidate. Points 1, 2 and 4 are outside this lease. See the acceptance table and browser receipt.
2. Pass for point 3. A seeded imported incident opens. A credentialed control sends the cookie on both hops and the actual browser check sends none. Wrong final URL, non-HTML, HTML 404 and connection refusal visibly fail. See lines 62, 74, 85 and 112.
3. See the exact-SHA Verify result below. Verify schedules this existing registration through `test:imports` in the imports shard. The 390-pixel recording was run locally.
4. Pass for local provenance. The browser receipt, mechanics and screenshot digests bind to the exact candidate.
5. No new inherited duty. Acceptance 3 already states its credential boundary and the test asserts it.
6. Mechanical pass. Generator write and check succeeded and generated views match main. Status, Gap and Evidence remain owned by the lander.
7. Pass. No acceptance wording, rider or coverage mapping changed.
8. Pass for the applicable credential boundary. The browser sends its synthetic cookie in the control and sends no cookie during the real browser check. Authority, erasure and replay paths were outside the test-only change.
9. Pass for scope. Native local runtime plus a controlled HTTP edge prove browser behavior. No DNS validation, inbox delivery or live provider result is claimed.
10. No policy default was required.
11. Landing pending. Product is on the cloud branch. The Mac lander owns the full-history publication scan, guarded main update and candidate Run site. The candidate has no cloud receipt for scan completeness, history coverage or finding count.

`git diff --check`, the changed-text hygiene check, typecheck, first-party rer check, contract generation, source lock freshness and the routine verification plan passed. The test inventory remained at 111 registrations and 10 assertion scripts. The inspected Cutover check controls have visible text. The journey retains its serious and critical accessibility and overflow assertions. No screen code was edited.

PROBE MOVE-006 3: saved Statuspage import and exact Cutover bookmark control -> imported native HTML opens; native address and absent cookies on both hops verified; wrong final address, plain text, HTML 404 and unreachable origin leave the matching row visibly failed at 1440 and 390 pixels.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none.

CLAIM MOVE-006 PARTIAL points=3 tests=tests/e2e/cutover-browser.test.mjs#MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-006 MOVE-009 — owner reviews four providers, checks surviving public addresses, deliberately invites and undoes through Cutover

GAP MOVE-006: Acceptances 1, 2 and 4 remain held, including exact address inventories, source-host and reader limits, invitation expiry and guide order.

## CI and custody

Base push Verify 44244896491 and Run site 44242052319 were completed successfully at the exact base SHA. Candidate Run site and the full-history publication scan remain pending with guarded landing. The current remote refs and exact candidate Verify are recorded in the attached receipts.

Candidate push Verify 44253042743 was still in progress at 2026-11-18T06:51:13Z. GitHub returned the exact candidate SHA on discovery and both scheduled polls. The remote main ref was 177378a989a7496a2e3dc00ac9a43947efd7c031 when checked. The product branch is pushed. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44253042743)
