# Lamp AUD-001 campaign

Run sd-lamp-c-f188 · 21 November 2026 · Run Edit Run fleet

## Plan and scope

1. Preserve the Public host, root address, feed identity and published records. Introduce immutable operator-host paths for Staff and named audiences, with independent settings and component inventories. Make the existing logo and footer-credit controls work on those pages.
2. Assign native incident and maintenance publications to the selected pages in the record transaction. Render the same publication into independent snapshots, feeds, widgets, badges and APIs. Reconcile Public and Staff together, a Staff-only publication and a named audience's maintenance.
3. Require a current operator session before reading a protected page or resolving an artifact. Keep protected object addresses, retained replicas and response caching separate. Check anonymous, wrong-host and revoked requests, public artifact bodies and public notification and outbox rows.
4. Migrate populated legacy data and verify both native installation archive restore and Settings page-data restore. Exercise the seven existing Public addresses with D1 unavailable.
5. Use Lamp's existing Settings and composer controls. Exercise the native operator journey at 1440, with the changed screens captured at 1440 and 390 for UIP. Run local touched checks and send the exact branch head through Verify and the independent landing gate.

Only the AUD-001 plan row advanced. The recorded contract has 66 DONE, 123 PARTIAL and 56 MISSING before and after. The builder claims PARTIAL for gate consideration. The lander owns status and count changes.

## Acceptance evidence

| Point | Coverage | Native proof |
| --- | --- | --- |
| 1 | Stable Public, Staff and named-audience addresses. Distinct names, tagline, accent, time zone, logo, footer credit and selected components. The existing Public address and feed identity retain the populated legacy records. Languages and the full inherited theme qualification remain held. | tests/e2e/helpers/audience-pages-flow.mjs lines 104–177. tests/e2e/publishing-browser.test.mjs line 1080. |
| 2 | One incident update and one maintenance notice reach selected pages. Separate HTML, Atom, RSS, widget, badges and API identify each page's state and membership. Acme-only maintenance stays on Acme. | tests/e2e/helpers/audience-pages-flow.mjs lines 178–265. tests/e2e/helpers/audience-pages-browser.mjs lines 98–165. |
| 3 | One submitted incident publication produces one committed update ID and shows its distinctive wording on both Public and Staff. The public subscriber captures one delivery for that publication. | tests/e2e/helpers/audience-pages-flow.mjs lines 178–213. |
| 4 | Native Staff-only publication and maintenance stay out of Public documents, feeds, widgets, badge state, API collections, individual permalinks, subscription signup, recipients, outbox and provider captures. Anonymous and revoked sessions perform zero R2 reads before refusal. A wrong-host request also performs zero R2 reads. | tests/e2e/helpers/audience-pages-flow.mjs lines 234–325. |
| 5 | Seven populated public representations survive a D1 outage with exactly zero database accesses and exclude Staff-only content. Protected outage reads remain held. | tests/e2e/snapshot-retained.test.mjs lines 96–151. |

The native publishing journey is registered at tests/e2e/publishing-contract.test.mjs line 1274. The populated upgrade runs the actual migration command over seeded earlier data and compares every previously present field. Native export and import reconcile stable paths, page memberships, logo bytes, feed identities and protected permalinks. Restored access requires fresh sign-in. The old active source cookie is refused. Settings page-data tests also round-trip those records and protect consent and prior-format archive compatibility. See tests/e2e/helpers/audience-archive-fixture.mjs lines 70–125, tests/e2e/helpers/audience-pages-flow.mjs lines 322–350 and tests/e2e/page-data.test.mjs line 101.

## DONE-RIDERS and handoff

| Row | Result | Basis |
| --- | --- | --- |
| 1 | Partial | Public-door journeys exercise all leased slices, with the full requirements in points 1 and 5 held. |
| 2 | Pass locally | Populated upgrade and restore, native allowed publication, refusal without artifact lookup, and unchanged public notification inventory. |
| 3 | See exact-SHA receipt | The journeys are registered in Verify's publishing, public and browser suites. |
| 4 | See exact-SHA receipt | Exact-candidate browser proof and local provenance are recorded separately. |
| 5 | Pass | AUD-001 cites BASE-ROLE-001. Existing operator session and publication permissions are used. |
| 6 | Generated locally | The seed generator wrote and checked the views. Main's checked-in views and Status section were restored for guarded landing. |
| 7 | Pass | Acceptance points are unchanged. The requirement describes the scoped 21 November ruling and assigns visitor access, membership and subscriptions to their existing clauses. |
| 8 | Pass locally | Native authorized write and read succeed. Anonymous, wrong-host, revoked-session, cross-page validator and refused scope-change paths are exercised. |
| 9 | In scope locally | Synthetic network-edge delivery only. Full theme and language qualification and protected outage access retain their original gates. |
| 10 | Pass | Existing operator authority follows the 21 November ruling. No new visitor authority was introduced. |
| 11 | Pending guarded landing | The lander owns candidate publication scanning, default-branch equality and the candidate Run site receipt. |

A published incident or maintenance record retains its page selection on later updates. The release candidate carries the additive migration, the previously tagged release record, and version 1.11.26 adoption metadata. It keeps the public page's hostname and identity. The new paths require operator authority. Durable full-installation archives and owner Settings page-data files preserve page settings and assignments. R2 storage and the retained object identity are scoped per page. Protected HTTP responses use private, no-store and same-origin resource policy. The optional isolated Staff scheduling probe stopped during fixture startup. The existing scheduled-publication regression passed.

GAP AUD-001: Point 1 still needs I18N-001 and full THEME-001, THEME-002 and THEME-003 qualification. Point 5 still needs authenticated retained reads for Staff and named audiences with D1 unavailable. Visitor access, membership, audience subscription and isolation qualification remain with AUD-002 through AUD-005. NOTIFY-019 point 4 and NOTIFY-022 audience settings remain sequenced after AUD-001.

## Runtime probes

PROBE AUD-001 1: native Status Pages Settings -> Public root and stable Staff and Acme paths with scoped branding and components.
PROBE AUD-001 2: native maintenance create selecting Public and Staff -> the same window and notice in both published APIs and permalinks.
PROBE AUD-001 3: native incident publish selecting Public and Staff -> one update ID in both snapshots and one public subscriber delivery.
PROBE AUD-001 4: Staff-only native publication -> Public artifacts and notification work exclude it. Anonymous and revoked sessions perform zero artifact reads.
PROBE AUD-001 5: anonymous Public reads against the built Worker with D1 unavailable -> seven populated retained responses, zero D1 accesses and no Staff publication.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=node --test tests/auth-adoption/setup-migrations.test.mjs exit=0

The configuration caps one installation at 12 protected pages and allows up to 100 components per protected page. The Public page continues to use Lamp's existing component visibility setting.

## Candidate provenance

Product branch cloud/sd-lamp-c-f188 is advertised at 68d0a2f086c58c21ca8aae71615cc4461c73c94e. Verify run 44901028807 completed for this exact push with the expected generated ACCEPTANCE.md failure and dependent missing artifacts. Both failed job archives were inspected. The exact-candidate browser and full native publishing suites passed. The full public and retained suites also passed. See the two local receipts and the CI receipt.

Main was 9ea011e0fe99033bc4e3d09fd6b6f96252c55324 when integrated and checked before the candidate push. Its Verify runs 44899481148 and 44897965626 and Run site 44899481252 were green. Main later advertised b6d1d051f754d8bc331658d496566450562de8ac. The guarded lander has candidate equality, publication scanning and Run site to establish.
