# Lamp COMP-011 acceptance 4

Run sd-lamp-c-f197. Product branch cloud/sd-lamp-c-f197. Base 00eaed1983515aa829036376d7fabeea8337f13b. Candidate fbc51b72cf291392da9de7b261783f154f258489.

## Plan and scope

The Next campaign row for COMP-011 is the only row addressed. The lease covers acceptance 4 and leaves acceptances 1–3 and 5–6 held. The existing groups-first Other services behavior is the control. The scope leaves COMP-002's separate membership and cross-surface obligations, import qualification, homepage, site documentation, brand, visual changes, adoption, UIP and release prerequisites with their current owners. The ruling index contains no COMP-011 policy ruling, and the test made no policy choice.

The new fixture opens a disposable Lamp Worker. It creates two named groups and two members per group through native routes, with two real region choices so the Regions layout renders. A fifth component has no group and position zero. Independent GET requests read the complete catalogue before and after the moves. Each checks the exact group positions and every component identity, group identity and scoped position. The browser opens the published snapshot for each layout and verifies the tagged template and version, group disclosure headings, exact membership and the displayed vertical order. Uptime has both a heatmap and a visible component list at phone width. Expanded and collapsed presentations are both exercised. The persistent journey checks 1440 pixels by default. The supplemental browser run checks 1440 and 390 pixels and captures each phase and layout with the groups opened.

| Phase | First | Second | Last |
| --- | --- | --- | --- |
| Before | Delivery services — Webhooks, Dispatch | Account services — Sessions, Directory | Other services — Global routing |
| After | Account services — Directory, Sessions | Delivery services — Dispatch, Webhooks | Other services — Global routing |

## Source trace

- `src/core/features/components/routes.ts` lines 19–37 registers the read and the group and component move routes. The move request carries a direction, complete expected sibling identities and the component's group identity where applicable.
- `src/core/features/components/service.ts` lines 74–81 swaps adjacent positions and requests a public snapshot rebuild after persistence. `src/core/features/components/repository.ts` lines 117–138 checks scoped membership and order inside a D1 batch and writes contiguous positions. Component moves leave the group association alone.
- `src/core/features/public-snapshot/repository.ts` lines 132–145 reads group names and positions. `src/core/shared/component-order.ts` lines 17–39 sorts by group position then member position and places the ungrouped section last. `src/core/features/public-snapshot/renderer.ts` lines 147–158 uses those sections for the default page. `src/core/features/public-snapshot/templates/calm.ts` lines 16–22 does so for Calm. `src/core/features/public-snapshot/templates/history-led.ts` lines 141–146 and 168–179 apply that order to the Uptime heatmap and phone list. `src/core/features/public-snapshot/templates/regions.ts` lines 95–107 applies it to Regions. The proof uses none of these sorting helpers to construct its expected order.

## Acceptance and DONE riders

| Item | Result | Evidence |
| --- | --- | --- |
| Acceptance 1 | Held | Shared positions between groups remain planner-held. |
| Acceptance 2 | Held | Mixed bulk table, drag and CSV preview and save remain planner-held. |
| Acceptance 3 | Held | The full shared-position page, widget, feed, reliability and history matrix remains planner-held. |
| Acceptance 4 | Pass | `tests/e2e/public-contract.test.mjs` lines 699–788, invoked by the catalogue registration at lines 792–793. Native moves, saved catalogue and four public layouts check exact order and membership. |
| Acceptance 5 | Held | Source position imports and the unreproducible-order dry-run explanation remain planner-held. |
| Acceptance 6 | Held | Hidden component slot retention remains planner-held. |
| Rider 1 | Partial | Acceptance 4 is exercised through native HTTP and the rendered page. The five other outcomes above stay held. |
| Rider 2 | Pass for acceptance 4 | Lines 705–712 create nonempty fixtures. Lines 729–736 and 758–772 check exact independent inventories and the displayed layout. The initial order differs from name order. |
| Rider 3 | Pass for acceptance 4 | Push Verify 44915252912 completed successfully on the exact candidate. The active registration runs through `pnpm test:public` on the public-pages shard. |
| Rider 4 | Pass for acceptance 4 | See the candidate SHA, browser command and capture manifest in the run receipt. |
| Rider 5 | Inspected | COMP-011 point 4 expressly incorporates COMP-002 point 2. The journey checks that inherited ordering duty in the assigned layouts. |
| Rider 6 | Pass for view freshness | The generator wrote zero views and its check passed. The existing MISSING judgment and future provenance change remain in lander custody. |
| Rider 7 | Pass | The candidate leaves CONTRACT.md byte-for-byte equal to its base. |
| Rider 8 | Inapplicable | The test exercises baseline operator ordering. It changes no authority path. |
| Rider 9 | Inapplicable | Acceptance 4 needs no provider or legal qualification. Import qualification stays held. |
| Rider 10 | Inapplicable | No policy default or ruling was needed. |
| Rider 11 | Pending landing | Candidate publication scan, main equality and candidate Run site are Mac lander checks. |

## Checks and custody

The change adds assertions to an existing registration. All eight registrations in the touched file and all prior assertions were retained. The persistent catalogue proof is active without screenshot settings. Ordering and membership are user-visible outcomes, and the test checks them against literal fixture expectations, including CSS vertical order. The before-and-after expected vectors make a no-op group or component move fail the saved catalogue assertion, and a renderer that ignores position fail the browser assertion. No mutation run was performed. Revocation, erasure and replay paths are outside this ordering lease. No product view or operator controls changed. The existing Uptime phone heatmap uses 12-pixel labels and 11-pixel percentages. That baseline presentation stays in the held visual scope.

Contract counts at the base and candidate are 66 DONE, 123 PARTIAL and 56 MISSING, 245 total. The proposed PARTIAL judgment records only acceptance 4 and would make the counts 66 DONE, 124 PARTIAL and 55 MISSING if recorded by the gate. Main's base Verify 44912276262 and Run site 44912276281 succeeded. Candidate push Verify 44915252912 completed successfully on the exact SHA. See the run receipt for mechanical checks and publication status.

GAP COMP-011: Acceptances 1–3 and 5–6 remain held, including mixed positioning and preview, the complete public-surface matrix, source-position import and dry-run explanation, and hidden-slot retention.

Prepared by Codex on 2026-11-21.

CLAIM COMP-011 PARTIAL points=4 tests=tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
