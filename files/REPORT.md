# Lamp PAGE-012 acceptance 4

Run Edit Run fleet, 2026-11-21 UTC.

The campaign row from planner return 36 remains PARTIAL. Acceptance 4 is proven for Operational and Major outage. Before and after totals are 65 DONE, 124 PARTIAL, 56 MISSING out of 245. The test inventory is 116 registrations plus 10 assertion scripts before and after.

## Candidate and plan

- Repository `just-every/run-lamp`. Product branch `cloud/sd-lamp-c-f167`. Candidate `a7bddce3ddb8f72db57a80232344962f6b301d7a`. Main observed at `2939f22d0549be77fcc94315b2747667f8796e66`. That base has successful Verify 44861397097 and successful Run site 44861397172.
- Read the current PAGE-012 clause, recorded gap and planner lease. Trace the public rollup through `src/core/features/public-snapshot/renderer.ts`. The default head and `src/core/features/public-snapshot/templates/parts.ts` both use the public label and advertised origin for Open Graph. `src/core/features/public-snapshot/branding.ts` uses the same rollup for the favicon mark and the social image text.
- Extend the existing catalogue-to-customer journey immediately after its native logo upload. Read the Operational snapshot before a separate theme icon is uploaded, make a native Major outage standing claim, read a newer public snapshot and release the claim before the remaining journey. Keep direct logo readback and theme-icon controls. Regenerate the source lock and publish the exact test candidate.
- Collect local checks, exact-candidate browser captures at 1440 and 390, and exact-head Verify. The guarded lander owns the full-history publication scan, landing and Run site.

## Acceptance evidence

| Point | Result | Public or operator door and evidence |
| --- | --- | --- |
| 1 | Held | Settings update and logo upload are exercised at `tests/e2e/public-contract.test.mjs:622` and `:750`. Complete Settings readback and hostname proof remain in the planner remainder. |
| 2 | Held | The fixture sets footer credit off at `tests/e2e/public-contract.test.mjs:626`. Complete footer-credit network-effect proof remains in the planner remainder. |
| 3 | Existing control | `tests/e2e/public-contract.test.mjs:757` compares the first-party logo response bytes with the upload. The planner owns the remainder of points 1–3. |
| 4, favicon | Pass | `tests/e2e/public-contract.test.mjs:98` and `:750` read current, matching-generation HTTP artifacts. The favicon link resolves to the page origin. Its SVG embeds the exact uploaded PNG in both snapshots. The mark matches the served green or red state color and the two marks differ. |
| 4, Open Graph | Pass | `tests/e2e/public-contract.test.mjs:120` and `:151` read the visible page label and its Open Graph title, fetch the absolute advertised own-origin image, and compare its rendered SVG text with the full page name and public label. Operational renders Working and Major outage renders Down. |

The existing Verify public-pages shard runs `test:public` through `scripts/verification/plan.mjs:9`.

Candidate push Verify [44863408551](https://github.com/just-every/run-lamp/actions/runs/44863408551) was in progress with conclusion pending at 2026-11-21T03:59:10+00:00.

## DONE riders

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Partial overall, pass for point 4 | Acceptance rows above. `tests/e2e/public-contract.test.mjs:613`, `:98` and `:750` exercise the new outcome. The full clause retains the planner remainder. |
| 2 | Pass for point 4 | `tests/e2e/public-contract.test.mjs:125` checks an independent expected state label. Lines 129, 140, 149, 152 and 764 directly fail for wrong metadata, bytes, state marks or image text. |
| 3 | In progress, conclusion pending | Push Verify 44863408551 is exact to the candidate. The public-pages shard invokes `test:public`. |
| 4 | Pass | Candidate-bound test and browser receipts below. |
| 5 | Pass by inspection | PAGE-012 names its branding obligations in `CONTRACT.md:298`. No additional inherited Base duty is claimed. |
| 6 | Mechanicals pass | Contract document write produced zero changes and check passed. The current Status, Evidence, Gap and judged provenance are carried from main for the guarded lander's review. |
| 7 | Pass by inspection | The candidate diff has only the existing journey and regenerated source lock. |
| 8 | Inapplicable | The scoped check reads public assets after the existing authorized standing-claim door. Permission and authority outcomes are outside acceptance 4. |
| 9 | Inapplicable | The test serves native public assets from an isolated first-party install. |
| 10 | Inapplicable | The existing clause decides the requested relationship between the status and branding. |
| 11 | Pending guarded landing | Main and the product branch advertise different heads. Exact-candidate publication scan completeness, history coverage, findings and Run site await the guarded lander. |

PROBE PAGE-012 4: logo upload and native standing claim -> Working to Down; /assets/favicon.svg retained the upload bytes and changed mark; the same-origin /assets/og.svg text and Open Graph title matched each public label

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Local checks and handoff

- The touched file passed all eight registered tests. Candidate-bound Node 22.20.0 replay passed the named journey at the full product SHA.
- Typecheck, first-party check, source lock freshness, contract document generation and candidate build passed. The changed-line hygiene review and full candidate author, committer and trailer inspection passed before the first guarded push.
- Existing 200 response, artwork, direct logo and separate theme icon assertions are preserved or strengthened. No width or opt-in flag gates the new HTTP assertions. The browser receipt captures the two states once each at 1440 and 390 with script execution disabled.
- The product candidate is published on its named branch. Candidate publication scan and Run site remain with the guarded lander. The test-only scope does not establish any new authority, erasure, replay, provider or hosted release guarantee.

GAP PAGE-012: Acceptances 1–3 retain the planner-held complete Settings readback, hostname and footer-credit network proof. Existing first-party logo controls remain in the journey. The THEME, UIP and release prerequisites stay with their existing owners.

CLAIM PAGE-012 PARTIAL points=4 tests=tests/e2e/public-contract.test.mjs#SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
