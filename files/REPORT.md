# Lamp PAGE-016 acceptance 3

Codex, 2026-11-21. Round sd-lamp-c-f187.

- Repository and branch: just-every/run-lamp, cloud/sd-lamp-c-f187
- Product commit: 3f4be8e7165ad4009e3ed9a798cbfac1108e0d8e
- Main observed after push: f95b99b87f0ab98c8ad15c8e842a77baf30c95b1. The candidate differs from main. Base Verify 44888108728 and Run site 44888108898 completed successfully on that main SHA.
- Candidate Verify: see the exact-SHA GitHub receipt in RECEIPT.txt. Push starts Verify. The Verify plan runs test:public in its public-pages shard. Run site is a main-only check and awaits the guarded lander.
- Claim is PARTIAL before and after. Counts before and after are 66 DONE, 123 PARTIAL, 56 MISSING (245). The plan row PAGE-016 from sd-lamp-replan-39 earns acceptance 3 proof. No follow-on clause is in this lease.
- Product diff: the existing history journey helper and its source-lock digest. Registered test count is unchanged. CONTRACT.md, acceptance text, Status judgments, and generated views match main.

## Plan and result

1. Map the acceptance to the native public route and the registered HIST-001 history journey. Before this change, the journey followed native cursors and reconciled references, but never asserted the complete ordered update and report payloads of the records served by a later cursor.
2. Preserve the existing 51-row script-free history fixture and its 50-public-record inventory and private permalink refusal. After that browser check, seed two older public incidents and one released report. The older incident carries Investigating, Monitoring, and Resolved updates with distinct customer wording, timestamps, commitments, and one public component change. The newest public incident has an unreleased report as a negative control. Set the fixture clock and tick the native Worker to build a healthy generation.
3. Start a cookie-free read of the native incident collection and follow every returned cursor until the explicit terminal null. Require a single healthy generation throughout. Consume each expected fixture ID once, deep-compare every update in expected newest-first order, and compare the report's incident ID, summary, timeline, cause, remediation, and publication instant exactly. The released report appears beyond the first page. The draft report is absent. Every response excludes the private incident's ID, reference, title, wording and component name.
4. Check locally, publish the exact head on the cloud branch, and hand off the separate report packet for independent verification and guarded landing.

The script-free fixture remains a separate generation in the same journey. During development the expanded fixture returned 52 incidents in native JSON while the initial script-free history route showed 50. The final committed journey runs the original HTML checks on their original population and adds the two records for the leased native API proof afterward. The existing separate HTML pagination assertions in the containing journey still execute.

PROBE PAGE-016 3: signed-out native incident reads following all returned cursors -> 52 public incident IDs exactly once across two pages, complete ordered timelines and exact report fields, private incident and unreleased report absent, all on the healthy 2031-04-20T12:10:00.000Z generation.

## Read-only route trace

- src/core/features/public-snapshot/routes.ts:296 resolves the cursor query to an artifact key and serves it with snapshot version and generation headers.
- src/core/features/public-snapshot/native-api.ts:4–29 renders the first collection page or a cursor page and includes nextCursor. The reader follows the value as returned.
- src/core/features/public-snapshot/archive.repository.ts:12 defines public incident inclusion. Lines 46–56 use published public incidents for anchor and membership, seek by opening instant and ID, and detect another page. Lines 120–133 load descending public updates and published-only reports for the selected incidents.
- src/core/features/public-snapshot/public-api.ts:25 projects incident identity and lifecycle, timestamp and update fields, projected component changes and the released report. The fixture expectation is taken from seeded records, without source projector calls or reuse of any HTTP response.

## Acceptance evidence

The registered test is tests/e2e/public-contract.test.mjs:30, “HIST-001 — completed native records retain their month, window, components and complete publication inventory.” It calls tests/e2e/helpers/public-history-flow.mjs:11, which calls the changed helper. All helper lines below refer to tests/e2e/helpers/public-history-selection-flow.mjs.

| Point | Candidate proof and disposition |
| --- | --- |
| 1 | Held. Existing v2 compatibility proof stays in the public contract and retained snapshot journeys. Full field, ID, impact, and status mapping proof is outside this lease. |
| 2 | Held. MAINT-009 still owes Verifying and full maintenance update projection. Full wording, messages, states, schedule bounds, and transition switches remain unproven in this round. |
| 3 | Local pass. The signed-out public probe at lines 7–50 verifies complete incident and update inventories and exact publication facts. Lines 141–195 provide the independent distinct history, released report and draft control. See exact-SHA Verify receipt. |
| 4 | Held. Lines 17–30 prove a single healthy generation for this native cursor walk. The all-representation database-outage, CORS, cache, and rate matrix stays with PAGE-007 and PAGE-008 as specified. |
| 5 | Held in full. Lines 25–28 and 124–137 pass the specific native collection and script-free private controls. Complete exclusion across all representations remains held. |
| 6 | Held. Official-schema conformance and unmodified-client qualification are outside this lease. |
| Inherited PAGE-007 | This walk checks current generation identity. The full refresh, cache, and failover matrix retains its own scope. |
| Inherited PAGE-008 | Rate proof retains its own scope. |
| Inherited MOVE-009 | Imported identity and cutover scope remain separate from this native fixture. |
| Adoption, UIP and release | Binding prerequisite scopes preserved. The change exercises native HTTP and alters no UI, branding, documentation site, or deployment. |

## DONE-RIDERS and pre-READY checks

| Row | Result |
| --- | --- |
| 1 | Acceptance 3 passes its named native journey locally. Whole-clause outcomes remain held as listed above. |
| 2 | PASS for the leased proof. Lines 17–49 reconcile populated positive records and reject private and unreleased records. The second page is required. |
| 3 | The existing registration is in push Verify's public-pages shard. The exact run event and observed conclusion are recorded in RECEIPT.txt. |
| 4 | PASS for local evidence. The exact product tree was tested. See RECEIPT.txt. |
| 5 | INSPECTED. Acceptance 4 names PAGE-007 and PAGE-008 and the delegated duties. The compatibility/reference and adoption scopes were preserved. |
| 6 | PASS for candidate views and source-lock generation. The existing PARTIAL Status, Gap, and Evidence cells were preserved. Landing judgment provenance is pending. |
| 7 | PASS. No acceptance text, rider placement, or coverage-map change. |
| 8 | PASS for the signed-out privacy controls at lines 25–28, 41 and 124–137. The change adds no permission, erasure, or replay path. |
| 9 | No provider or legal boundary is claimed. |
| 10 | No policy default was adopted. |
| 11 | Pending guarded landing. Candidate differs from main. Publication scan commit=3f4be8e7165ad4009e3ed9a798cbfac1108e0d8e, complete=unestablished, historyScanned=unestablished, findings=unestablished. Candidate Run site awaits main. |

Existing assertions were retained at the same width and in the same branch. The native proof checks stale responses, missing, repeated or unexpected records, wrong ordering, wrong wording and publication facts, and incorrect report visibility. Browser assertions remain at 1440 and the existing journey writes 1440 and 390 screenshots. No screen changed, so there is no UI audit delta. The changed test adds no email-shaped string. The full-history publication scan and exact-SHA Run site proof remain with the lander.

CLAIM PAGE-016 PARTIAL points=3 tests=tests/e2e/public-contract.test.mjs#HIST-001 — completed native records retain their month, window, components and complete publication inventory

GAP PAGE-016: Acceptances 1, 2 and 4–6 remain held, including MAINT-009 Verifying and full maintenance updates, the v2 mapping and schema and client qualification, all-representation cache and rate proof, and complete private-record exclusion.
