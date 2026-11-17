# Public status, theme, components, vendor and uptime audit

Read-only source audit of current main `4c90e6c8f35775e2a0287ab24ccba87d7a8d8485`. Exact scope/status/acceptance came from `packet/contract-inventory.json`. No builds, servers, dependency installs, test execution, fetches, commits, pushes or secrets were used. Assertions below are **inspected tests**, not passing-test claims. This is the only file written by this audit.

Classification: **CHEAP** is bounded local implementation/proof; **HARD** is a substantial local feature or integration; **HELD-EXTERNAL** means actual account/device/provider proof that cannot be substituted locally. A missing feature is not held merely because its eventual hosted proof needs an account. Existing branch work is called out separately and must not be duplicated.

## Immediate queue recommendation

One clean local candidate remains after branch checks: **PAGE-001 acceptance 2 and 3, plus only their PAGE-002 acceptance 1/2 initial-HTML and script-disabled slice**. Build a controlled, populated native fixture with multiple unresolved incidents, more than five published updates per incident, a resolved/draft/private negative control, multiple in-progress maintenance windows and scheduled windows exactly at/beyond the 14-day boundary. Reconcile each incident's exact latest-five bodies/instants/newest-first order, complete permalink timeline, and the complete maintenance membership set in the same response; repeat those customer facts with scripting disabled. Existing source already implements these rules, so this is CHEAP proof work unless that fixture exposes a defect. Do not broaden it into catalogue/order/notes/severity, uptime, generic no-script subscription, or all time-zone proof.

Do **not** queue new THEME-004/005 implementation: real bugs remain on main, but `origin/cloud/sd-lamp-c-theme45` already contains the coherent fix and journey in its ancestry. Adopt/rebase/review that work. Do not queue native catalogue/severity/note work already in the `origin/cloud/sd-lamp-c-f12*` family.

## Material stale inventory findings

- DOCS-001's last claimed hole is closed in inspected current tests: `tests/e2e/start-runtime.test.mjs:105-159` uses a no-script unauthenticated browser, reconciles every index section/title/summary/destination and sidebar, follows every selected page, compares all headings/paragraphs against repository Markdown, and asserts no session cookies. Status-host exclusion is asserted at 431-434.
- THEME-001/002/003 are implemented, despite partial/missing statuses. Settings includes palette/fonts/header art/links/layout/history/CSS/HTML (`src/core/features/page-settings/ui/theme-settings.tsx:29-82`); validators and retained stylesheet/markup integration exist; extensive theme browser and full-capacity journeys are wired by `tests/e2e/publishing-browser.test.mjs:940-942`.
- DEP-001/002 are implemented, despite “Not built.” A twenty-provider catalog, generic formats, guarded scheduled reads, source-attributed history, show/draft/rollup modes, evidence on recovery and release fixture validation exist. DEP-003 operator-alert delivery is still absent in the inspected dependency service/repository.
- PAGE-008's two stated holes have explicit newer assertions: `tests/e2e/snapshot-retained.test.mjs:134-181` proves zero DB touches and reduced immutable artifact-byte reads while every warm request still checks current pointer/freshness.
- The packet's `tests/e2e/helpers/public-freshness-flow.mjs` citation does not exist in current main. Do not rely on it.
- COMP-001 adjacent severity comparisons, COMP-007 ten-second deletion and retained maintenance name, and COMP-010 history/uptime/widget/rollup holes have newer direct assertions. PAGE-002 no-script subscription and PAGE-009 actual relative-clock refresh also now have direct assertions.

## Per-clause findings: documentation and public page

### DOCS-001 — inventory partial; built/proof present; CHEAP metadata reconciliation

`src/routes/docs.index.tsx:1-6` routes the public index; the current complete proof is described above. The old “index usable guidance/navigation unasserted” gap is stale. No new local implementation is justified by that gap. Field proof: none required for this local outcome.

### PAGE-001 — inventory partial; built, remaining bounded completeness proof CHEAP

`public-snapshot/repository.ts:123-179` selects all non-internal components, ordered groups/components, current claims and updates newest-first; `renderer.ts:64-101` derives states/uptime and published incident models; `renderer.ts:142-143` renders exact component note; `renderer.ts:188-198` includes every unresolved incident, five updates, all in-progress maintenance and starts <= generation +14 days. Alternate templates share `templates/parts.ts:153-158` and `templates/history.ts:10-30` (five updates plus complete permanent link).

New current proof already reconciles **native API** component membership across cursor pages (`public-contract.test.mjs:380-399`), exact note escape/boundary (332-337), and representative initial-HTML figure (`public-contract.test.mjs:105-117`). That is stronger than the old packet, but does not reconcile every component's state/note/uptime/daily marks in the single HTML response. The clean new candidate is specifically acceptance 2/3 and matching no-script slice, described above; component point1/4 proof should be reconciled with existing catalogue branches before any additional queue.

### PAGE-002 — inventory partial; significant stale holes; remaining CHEAP proof

Initial HTML and plain POST form are produced server-side (`templates/parts.ts:39-44`, `renderer.ts:132-143`). Current `public-contract.test.mjs:890-935` disables scripts, asserts absolute configured-zone generation instant, zero public polls, no automatic navigation, unchanged document over a new publication/two refresh intervals, and submits the subscription form successfully enough to observe a confirmation email. Thus the old “no-script submit unasserted” gap is stale. Generation exact instant/zone in initial HTML and scripted tooltip are asserted at 635-674.

Remaining: reconcile all PAGE-001 incident/maintenance facts in initial HTML/no-script browser (bounded candidate above), and separately cover every operator entry/timeline/preview time-zone path. `maintenance-timezone.test.mjs:58-164` already exercises configured-zone scheduling/rescheduling and incident opened-at entry; do not claim all zones/paths absent. No live external account required.

### PAGE-005 — inventory partial; read-path/recovery holes largely stale; CHEAP trigger matrix proof

The service builds a complete artifact set before pointer advancement (`public-snapshot/service.ts:185-273`), retries pending work (384-415), reads retained artifacts without repository access (322-368), and renderer builds page/feed/widget together (`renderer.ts:248-276`). `snapshot-retained.test.mjs:134-181` directly asserts zero database access and immutable caching. At 182-206, an always-failing replica publication plus object-storage outage still reads the prior known outage, including cold restart. `snapshot-release-rebuild-flow.mjs` is wired at `public-contract.test.mjs:26` and covers release rebuild/retry/reset generation. Remaining exact acceptance1 proof is the complete PAGE-001 change-trigger matrix; do not rebuild the already implemented mechanism. No external blocker.

### PAGE-006 — inventory partial; most listed outage holes now covered; CHEAP boundary proof

`snapshot-retained.test.mjs:55-64` saves page/Atom/widget/badge bytes, injects queue failure and reads them unchanged. A throwing repository with real public routes/R2/durable replica is set up at 67-69. At 135-206, page/Atom/widget/JSON/badges retain known state through database access refusal, object-storage failure, failed replica writes and cold restart; stale headers/body and generation instant are asserted. Before first publication, root 503 is asserted at 115. Remaining precise gaps: no-snapshot-ever unavailable assertions separately for Atom and widget; exact origin-cache one-hour boundary. Those are local CHEAP fault/clock proofs. Provider-wide outage proof remains a separate field exercise; not a reason to hold local work.

### PAGE-007 — inventory partial; healthy cache invalidation proof present; latency/boundary matrix CHEAP

`routes.ts:20` emits max-age=0/stale-if-error=3600; fallback cache is retained one hour (`routes.ts:46-54`); service validates current pointer before using immutable version bytes. `snapshot-retained.test.mjs:227-236` publishes a new generation and asserts every previously warmed response and old ETag becomes a healthy 200 with the new generation; old-byte invalidation is therefore directly asserted.

Remaining: one shared ten-second deadline from successful initiating request across all seven representations for update, component-state change and maintenance transition; the exact one-hour origin-failure cache expiry boundary. Existing conditional visibility and deletion journeys have narrower ten-second deadlines, so reuse their conventions. No current `public-freshness-flow.mjs` exists. Hosted latency under load is PAGE-021 field proof, not a blocker for local clocks.

### PAGE-008 — inventory partial; stated remaining points already asserted; CHEAP metadata reconciliation

`snapshot-retained.test.mjs:134` records zero DB touches; 141-181 counts immutable reads cold once/warm zero while every request still revalidates current pointer and stale marker. Public capacity/no-rate-refusal local loop exists at `public-contract.test.mjs:426-427`. No new builder needed for the two listed gaps; separately maintain PAGE-021's real scale evidence.

### PAGE-009 — inventory partial; relative-age gaps stale; remaining timestamp matrix CHEAP

`format.ts:49-67` supplies configured-zone UTC offset with machine-readable ISO instants. Delivery code uses the same formatter (`deliveries/service.ts:62-69,196-200`). `public-contract.test.mjs:640-674` parses absolute initial generation HTML, runs a browser in a different zone, advances an open page from “just now” to “1 minute ago” at 1440/390, and asserts identical ISO/title/LA zone without publication. Script-disabled absolute text is asserted at 895-925. These old gaps are closed in inspected tests. Remaining exact all-public/maintenance/feed/notification timestamp matrix and absolute-vs-relative membership can be CHEAP local proof; do not queue another relative-age implementation.

### PAGE-010 — inventory partial; built; CHEAP semantic/exact-membership proof

`feeds.ts:20-77` creates ordered Atom/RSS from stable event IDs; XML escaping is deliberate (`format.ts:10-31`). `public-contract.test.mjs:855-856` checks earlier feed IDs survive publication. Remaining inventory points: full Atom1.0 semantic validation, exact one entry per included event, durable never-reused IDs across event/deletion/import cases. Local semantic checks are implementable without live accounts; an actual public validator submission is separate external proof if required.

### PAGE-012 — inventory partial; built, proof partially stale; CHEAP settings/bytes/network matrix

Settings UI exposes branding fields (`page-settings/ui/page-settings-tab.tsx`, `brand-card.tsx`). Current test changes page name/accent/timezone/hostname/footer settings at `public-contract.test.mjs:312-317`; theme journeys upload/read assets, but that alone does not establish direct configured logo bytes for this clause. Both shells now put overall state in OG title/image alt (`renderer.ts:139`, `templates/parts.ts:28`), so missing OG implementation is not the gap. Remaining: independently read back every branding field, exact own-origin logo bytes, prove footer disable has no associated network effect, assert OG title+image state/favicon composition. No external blocker for local custom Host routing; live hostname TLS belongs PAGE-015.

### PAGE-015 — inventory partial; HARD local implementation, then external TLS/DNS proof

Configured hostname and app/public routing exist; inspected Settings/public-origin/snapshot code has no hostname provisioning/certificate state/DNS-record workflow. Build provider adapter and owner exact-record/cert-state UI with fake provider edges, route every public representation on custom Host. Real auto-issued certificate/DNS control and public TLS are HELD-EXTERNAL **field proof only**, not a local-build blocker.

### PAGE-016 — inventory partial; compatibility readers built; lifecycle remaining HARD

Snapshot renderer publishes native/Statuspage APIs (`renderer.ts:258-276`, `native-api.ts`, `public-api.ts`), and current public tests exercise native pagination and compatibility routes. Domain maintenance still has only Scheduled/In progress/Completed/Cancelled (`shared/domain.ts:22-23`), so MAINT-009 Verifying lifecycle remains absent; do not mistake existing native notice bodies/switches for the full specified mapping. Exact schema/client checks should be coordinated with existing f119 branch work identified by parent. Remaining local work: full maintenance contract/mapping (especially verifying), all eight official schema representations and private/internal exclusion plus snapshot/caching behavior; live external account not required.

### PAGE-017 — inventory partial; feeds built; CHEAP validation/exact variant proof

`routes.ts:273-280` publishes native feeds, both history aliases and component forms; `feeds.ts` constructs paired identities/order and component membership. Current test requests aliases without requiring import (`public-contract.test.mjs:887`); conditional populated feed exclusions are asserted in `conditional-component-flow.mjs:90-94`. Remaining: exact complete per-component incident+maintenance membership for both formats, RSS2.0 semantics, full snapshot-backing outage matrix and new-event polled alias ten-second deadline. W3C live validator acceptance, if literal hosted service submission required, is external field proof; local standards checks remain feasible.

### PAGE-018 — inventory partial; missing DB proof stale for overall badges; CHEAP proof remainder

`badges.ts:24` emits `{schemaVersion:1,label:"status",message,color,isError:false}`. `snapshot-retained.test.mjs:135-206` explicitly serves overall SVG and endpoint JSON while repository throws and storage fails, checks bytes/cache/staleness. The old “database-unavailable badge serving unasserted” is therefore overbroad. Remaining: reconcile every required shields endpoint field and real shields-compatible rendering, component badge DB-outage coverage, ten-second freshness for every badge form. A live shields.io fetch is external field proof; use local renderer/schema fixtures first.

### PAGE-020 — inventory partial; mixed local and manual field proof

Current code uses text alongside states and a persistent live status node. `public-contract.test.mjs:630-738` checks persistence, clock location/relative instants and refresh announcements; `maintenance-timezone.test.mjs:164` invokes keyboard subscription flow. DOCS selected report/no-script/release-version checks are in start-runtime. The inventory's manual screen-reader/criterion-complete VPAT evidence remains separate HELD-EXTERNAL device/manual evaluation. Remaining automated keyboard/accessibility-tree coverage across public/history/incident/maintenance/subscription-management is CHEAP-to-HARD proof depending on journey breadth; private pages depend on AUD-002. Do not call automated checks a completed VPAT or manual screen-reader evaluation.

### PAGE-021 — inventory partial; HARD local capacity harness; hosted proof external

Current `public-contract.test.mjs:426-427` only runs declared local requests-per-second concurrently. It does not establish sustained 2000/s x10min, burst5000/s x60s, single-address200/s, exact p95 budgets, mid-run publish-to-all within10s or zero query count under load. Build and run a declared-hardware load harness locally; retain measured results and keep unmeasured hosted rate unproven. Actual hosted provider capacity/overload-DNS failover is HELD-EXTERNAL field proof only. A performance run may reveal architectural limits; not a cheap assertion patch.

### PAGE-022 — inventory missing; HARD

The current durable same-provider retained replica is **not** the independent owner-selected secondary required here. No selected AWS S3+CloudFront+ACM, B2+Bunny/Fastly or second-account setup/mirror/lag workflow found in snapshot/settings source. Build provider configuration/adapters, every-path mirror generation/stale labelling and lag/error observability, locally test failed/multiple-generation/five-minute cases. Real cloud accounts and cross-provider delivery prove field acceptance later.

### PAGE-023 — inventory missing; HARD

`/health` has general dependency health; it is not the required current-storage serving-only probe (the retained test explicitly records database dependency failure at 215-222). No independent-DNS setup, exact secondary-record/TLS/newest-generation check, local DNS harness or failback journey found. Build all six acceptance outcomes locally with same10s checks/threshold3/TTL60, named failed setup steps, 180s failover/overload and no-older failback. Hosted Route53 test zone/resolver/TLS proof is HELD-EXTERNAL field proof after build.

### PAGE-024 — inventory missing; HARD

Current retained artifacts can serve on primary failure but no independent read-only standby with explicit paused-subscriptions text/write refusals exists in inspected paths. Build all listed same-address read surfaces+CORS on one generation, refuse subscription/create/manage/unsubscribe/intake/operator writes with retry guidance, and prove committed primary work resumes delivery. Standby summary/RSS/badge/failed-subscription journey is fully locally buildable; real primary outage/DNS field test follows PAGE022/023.

## Per-clause findings: theme

### THEME-001 — inventory partial; implementation and broad test coverage already present

Palette contrast and named offending pair are in `theme-safety.ts:8-35`; UI fields at `theme-settings.tsx:29-82`; own-origin uploaded assets and stylesheet/chrome at `theme-rendering.ts:8-24`. `theme-flow.mjs:31-58` covers persisted settings/refused CSS/pairs/removals/HTML byte limit; browser journey exercises owner fields and script-disabled render; `theme-owner-journey.mjs:45-84` covers every shipped layout at component limit, gzip budget/own-origin resource counts. Status “palette/fonts/header/links/layout absent” is stale. CHEAP reconcile evidence/status; dark-card defects are THEME004, not reason to duplicate THEME001.

### THEME-002 — inventory missing; implemented; CHEAP proof/status reconciliation

`theme-css.ts:17-113` parses CSS AST and rejects imports, foreign URLs (including escapes/image-set/custom-property forms), expressions and behavior with named rules; 121 onward scopes selectors to body.lamp-public. `theme-rendering.ts` includes accepted scoped CSS. `theme-flow.mjs:35-45` tests refusal and unchanged persisted settings; theme owner budget/isolation journeys cover accepted output. “No CSS acceptance/scoping” is false on main. Review exact PAGE003/PAGE013 full required assertion coverage before claiming clause done.

### THEME-003 — inventory missing; implemented; CHEAP proof/status reconciliation

`theme-html.ts:4` has documented element allow-list, 31-40 enforces8192 UTF8 bytes; sanitizer removes forbidden nodes/attributes and reports removals. `theme-safety.ts:45-50` sanitizes both fields and merges removal reports; renderer places accepted chrome in initial HTML. `theme-flow.mjs:53-58` asserts dangerous HTML removed/reported and oversize refusal; `theme-browser-flow.mjs:130-134` has no-script output; typed incremental markup proof is already on main at 152-191. Do not queue replacement sanitizer/editor.

### THEME-004 — inventory missing; actual main bug, existing branch covers it

Main validator checks only seven foregrounds against background/surface (`theme-safety.ts:26-35`), never shared card inventory/named card. Main template still has fixed light incident/maintenance backgrounds (`templates/styles/history-led.css:70-71`); typography inherits owner ink. A valid dark palette can therefore yield light text on light cards. Main `theme-rendering.ts:18` fixes some surfaces but not every actual card. No dashboard shared measurement registry exists on main.

Existing `origin/cloud/sd-lamp-c-theme45` has 21-file diff from merge base, including `shared/theme-card-contrast.ts` (137 lines), named-card validator, theme/operator rendering corrections, and `palette-owner-journey.mjs:120-152`: refusal preserves settings/document/CSS and checks all four layouts plus dashboard at1440/390. Tip d325ad0d itself only updates docs; implementation is in its ancestry. **Do not create a new builder.** Local adoption/rebase/review is CHEAP-to-HARD depending on conflict; no external blocker.

### THEME-005 — inventory missing; actual main bug, same existing branch covers it

Main checkbox destroys state: `theme-settings.tsx:32` sends palette=null when off and a fresh initialPalette when on. Schema stores a single nullable palette (`shared/page-theme.ts:6-17`) with no enabled flag. Thus exact all-nine preservation/off/reload/other-save/on requirements fail by source inspection, not merely missing assertions.

Existing theme45 adds paletteEnabled, backward-compatible inference and partial-settings merge/preservation; `palette-owner-journey.mjs:82-113` asserts off/save/reload/other-field save/legacy-null/stale-save/re-enable and exact nine public CSS tokens/default CSS when off. `origin/cloud/sd-lamp-c49d-fix1` has additional typed-markup/preserved-toggle test ancestry; main already contains substantial typed-markup test changes, so compare patch equivalence before adoption. **No new builder.**

## Per-clause findings: components and vendor

### COMP-001 — inventory partial; exact listed ordering gaps already asserted

`shared/domain.ts:1-17,34-35` defines exact vocabulary/severity/default. `public-contract.test.mjs:586-600` explicitly covers Operational<Maintenance<Degraded<Partial<Major in both display orders; old missing two adjacent comparisons stale. f12 branches also add these independently. CHEAP metadata only.

### COMP-002 — inventory partial; single group implemented; existing branch has exact gap proof

Schema `shared/schemas.ts:43` uses scalar nullable groupId and `components` storage likewise; native ordering tested. Original f12 branch diff adds explicit groupId-array/groupIds refusals, duplicate same-component group assignments refused in preview/direct apply, persisted revision unchanged, and successful native/bulk moves observed under correct public groups. **No duplicate builder**; adopt/reconcile f12 ancestry.

### COMP-003 — inventory partial; append mechanism built, proof stronger than packet

`components/state-history-repository.ts:4-17` aggregates claims and inserts transition in transaction. Correction service appends both correction/audit facts (`components/service.ts:192-214`). `conditional-component-flow.mjs:45-47` compares complete prior history identities+values and exact transition set through hide/reappear; `uptime-correction-journey.mjs` tests independent correction/source behaviors. Old “only prior entries present” is stale for conditional changes, but every claimant/operator/incident mutation and correction remains to be explicitly reconciled if claiming the whole clause. CHEAP targeted matrix, coordinated with attribution branches.

### COMP-005 — inventory partial; most listed missing resource checks stale

Repository excludes internal component rows (`public-snapshot/repository.ts:144`); `public-contract.test.mjs:345-414` first proves public downtime/resources, makes the same component internal, asserts overall Operational and all visible healthy uptime figures, checks native pagination/v2/page/feed/widget exclusion, and tests all four formerly public component resource URLs404. Remaining exact inventory item is uptime-template aggregate figure under internal downtime; source computes from public components, but this template-specific observation still merits CHEAP focused proof only. Do not repeat feed/badge tests.

### COMP-006 — inventory partial; claims built; remainder CHEAP timing proof

Repository merges standing/incident/maintenance active claims (`components/repository.ts:98-113,169-170`), `mostSevereState` defaults Operational. `public-contract.test.mjs:527-555` explicitly starts/completes maintenance, tests competing claims and recovery, and records attributable manual notices. Conditional journey asserts public state/overall within a10s shared deadline for repeated standing transitions. Remaining exact ten-second matrix: incident resolve, maintenance complete, attach/detach, set/clear standing claim on every required public state; do not call in-progress claim/no-claims implementation absent. No external blocker.

### COMP-007 — inventory partial; both stated gaps already directly asserted

`public-contract.test.mjs:965-984` has a measured common10s deadline while reading prewarmed public component/uptime surfaces; at998-1001 published maintenance retains independently captured component name/body and exact notices. CHEAP metadata reconciliation, not new deletion feature.

### COMP-008 — inventory missing; HARD local feature

Current public claimant model includes standing/incident/maintenance (and separate followed-vendor state), not verified monitor automation claims. Intake Uptime/other integrations and metric evidence are prerequisites, not this fourth claimant. Build source-specific failure/recovery claim ledger with rule/evidence attribution, Unknown/stale behavior, standing-claim preservation, draft-only no-public-change and signed Uptime <=30s public fixture. Local signed/provider fixtures can prove all acceptance logic. Actual live monitor account/signing/provider receipt is later field proof.

### COMP-009 — inventory partial; CRUD catalog feature built, missing exhaustive table/CSV proof CHEAP-to-HARD

`components/catalogue-service.ts`, `catalogue-schema.ts`, `catalogue-csv.ts`, UI catalogue tables/drawer implement reviewed table+CSV replacement. Current public test exercises full-capacity reviewed apply and stale-review refusal (`public-contract.test.mjs:363-370`), then reviewed delete/replacement (455-458). That is not exhaustive table-and-CSV create/edit/reorder/delete separately for components and groups, nor the precise fifty-component description/tracking-start journey. Remaining is that explicit operation matrix and no-write preview/public order/script-free500-char disclosure/tracking-date proof. Reuse existing mechanism; don't rebuild.

### COMP-010 — inventory partial; all named holes now directly asserted

`conditional-component-flow.mjs:36-97` reconciles retained exact history, availability report numerator/denominator/tracking start, rollup, native/v2 component lists+flag, whole page/uptime/daily record absence, resources404, widget omissions and populated feed lists, all with10s deadline. Native history/uptime remain through repeated reveal/recover states. Import flag still needs existing import-specific evidence reconciliation but inventory's named widget/retention/rollup/figure holes are stale. No new generic builder.

### DEP-001 — inventory missing; built; CHEAP evidence/status reconciliation

`dependencies/formats/catalog.json` lists twenty vendors and per-format mapping/fixture. `formats/index.ts:6-20` covers Statuspage/RSS/Atom/configured JSON plus native catalog adapters. `dependencies/service.ts:43-55,74-97` follows only configured guarded public origins; repository claimSource sets120000ms gate (`dependencies/repository.ts:40-45`), records attribution/history at47-55 and retains prior state after third failure.

`vendor-dependencies-flow.mjs:34-54` follows all20, asserts one GET per declared path including supplement, no credentials, no request before119999ms, and Statuspage+AWS changes source-attributed next trigger. 87-101 checks third-failure unavailable instant/public notice and recovery; 102-122 checks generic RSS/Atom/JSON including Atom category changes. `scripts/validate-vendor-catalog.mjs:11-25` rejects missing tables/fixtures and asserts every mapped native state case agrees; wired by `scripts/validate-release.mjs:7`. Remaining prudent evidence check: catalog fixed required20 membership rather than only length/current-catalog self-comparison, every externally offered state completeness beyond declared mapping, and wall-clock4min assertion if literal. No external dependency blocks local build. Live vendor-origin behavior is independent field proof.

### DEP-002 — inventory missing; built; CHEAP evidence/status reconciliation

`dependencies/service.ts:29-39,53,57-66` defaults show only, validates saved template/dependents and prepares private drafts without resolving buyer incident. `renderer.ts:101` includes vendor severity only for explicit rollup. `vendor-dependencies-flow.mjs:58-86` explicitly asserts show-only unchanged buyer/overall/no incidents, vendor attribution link, rollup unchanged buyer claims, one private templated draft on repeats/no publication, then native publication followed by vendor recovery retaining buyer incident and adding attributed brief evidence. Exact listed acceptance has substantial direct coverage. No new implementation candidate.

### DEP-003 — inventory missing; HARD local alert feature

Internal vendor component/publicRows filtering is built (`dependencies/service.ts:52`, repository.ts:66-67). `runDue` currently records observation/drafts/rebuilds only (`service.ts:74-97`), and repository observed has no operator-email/chat/push dispatch/dedup. Build private watch alert event with per-vendor-incident dedup across email/operatorSlack-orTeams/push and exact no-public-surfaces fixture. Local adapters prove dispatch/dedup; live email/chat/push devices are separate external field proof, not a reason to hold implementation.

## Per-clause findings: uptime and languages

### UPTIME-006 — inventory partial; built, remaining exact rendered proof CHEAP

`uptime.ts:63-68` maintains null vs zero data and floored math; `uptime.ts:79-97` names exact weighted minutes in accessible title/aria and emits no-data/good classes; CSS has distinct no-data background (`styles/components.css:15-18`; template shared.css:52). Current tests have exact known daily state amounts (`conditional-component-flow.mjs:75-77`, `publishing-contract.test.mjs:763-765`) but not complete per-component reporting-window day set plus exact DOM label and visually distinct computed no-data/healthy colors. That is the remaining acceptance1/2/3 proof, not new uptime calculation.

### UPTIME-007 — inventory missing; HARD

No linked measured availability data model/public option/denominator found in component or snapshot code. Metric charts from timing/aggregate sources are not measured uptime bars. Build claimed/measured/both selection and source labels, immutable monitor-minute evidence with Unknown/stale excluded, measured daily downtime records, correction isolation and90day30min-outage+2hUnknown fixture. Can be built/proven with signed/local monitor fixtures; live monitor measurement is field proof afterward.

### UPTIME-009 — inventory partial; reports built; remaining complete-membership proof CHEAP

`availability-reports/service.ts:25-47` calculates timezone calendar bounds, observedEnd=min(periodEnd,now), same computeUptime math, masked claim interval membership/prefix fallback and overlapping maintenance independent of downtime weight. Types/CSV/PDF retain maintenance state. `uptime-correction-journey.mjs:147-170` checks month/quarter exact current observedUntil, CSV/PDF uptime and downtime; current-period stop gap is therefore partly stale. It deliberately uses a correction-only fixture, so it does not reconcile incident/maintenance membership. Remaining: complete month+quarter CSV/PDF incident sets (including masked/imported fallback), maintenance sets with Scheduled/Cancelled/Completed labels, current/future/nohistory cases and public-number agreement in page zone. Exact month/quarter report feature does not need replacement.

### UPTIME-010 — inventory partial; actually missing required measured feature; HARD

`availability-reports/types.ts:14-26` only supports basis=claimed and claimed figure/downtime; no measured fields, and UPTIME007 evidence is absent. This is not merely unasserted CSV/PDF output. Implement after COMP008/UPTIME007, then prove same-period measured CSV+PDF with unchanged claimed result. No live-account blocker for local fixture build.

### UPTIME-011 — inventory partial; actually missing audience-sharing feature; HARD

Inspected availability report service/type/routes only provide operator downloads, no audience selection/share storage/private-page publication. Requires AUD003/private pages, then selected audience record with exact component-page matching report numbers. Build locally; external identity/private-host rollout proof later if needed.

### I18N-001 — inventory missing; HARD

Public shell remains html lang=en (`renderer.ts:139`, `templates/parts.ts:28`); RSS language en (`feeds.ts:77`) and fixed English strings/templates persist. No language settings/per-language snapshot/metadata/switcher/public/private/email/SMS translation system found. Build six shipped languages/default+enabled choices, address-stable localized snapshots/formatting/suggested browser link, Spanish full initialHTML/email and disable cleanup. All can be locally implemented and synthetic recipient proof retained; linguistic review is separate human field evaluation.

### I18N-002 — inventory missing; HARD

No per-language update records/composer publish requirements/addition timestamps/no-renotify implementation found. Build with I18N001 shared model, explicit fallback choice and per-language preview, default-first/later translation timeline, chosen-language dispatch and durable no-second-notification assertions. Local fake delivery edge suffices to prove routing/idempotence; live recipient observation later.

### I18N-003 — inventory missing; partially scaffolded CSV, core feature absent; HARD

`subscribers/csv.ts:5,34,48` already accepts language column syntactically but refuses everything except en; UI explicitly says only English (`subscribers/ui/subscriber-import-export.tsx:50`). Thus “language-aware CSV entirely absent” overstates the gap, but choice/persistence/management/reporting split and Spanish support are missing. Build selection+change, counts/trend/CSV bylanguage and reviewed dryrun create/skip/refuse with enabled languages. Existing dryrun door should be extended, not replaced. Phone support has its own dependency; don't label missing local language work external-held.

## Done rows inspected for context, not queued

Inventory done DOCS/PAGE/THEME/COMP/DEP/UPTIME/I18N entries remain outside the open-work queue: PAGE003/004/011/013/014/019, COMP004, UPTIME001/002/003/004/005/008. Their mechanisms/tests were consulted where relevant: component note boundary, all adjacent severity comparisons, exact known uptime figures, stated method per layout/no-script, embed variants and immutable snapshot read paths. This audit does not rerun or certify their test results.

## Branch deduplication evidence

- `origin/cloud/sd-lamp-c-theme45` d325ad0d2008 is unmerged according to parent's branch audit; diff from main mergebase contains real implementation+palette journey. Its tip alone is a docs/source-lock change, so cherry-picking only tip would omit fixes. Inspect/adopt whole coherent ancestry and reconcile current main typed-markup changes.
- `origin/cloud/sd-lamp-c49d-fix1` 6ffba993 has typed-markup/preserved-toggle test changes; compare equivalence against already-present `theme-browser-flow.mjs:152-191`.
- `origin/cloud/sd-lamp-c-f12` and rebased `-land-*` variants cover scalar-group rejection/moves, exact note limits/defaults and severity. Original diff adds132 public-contract lines. No evidence there for PAGE001 multiple-unresolved latest-five/permalink or exact14day maintenance boundary. The scoped candidate above avoids that overlap.
- Parent separately identified f119 readers, f122 embeds, f124 generation age and f126 incident impact as existing branch work. Main now has actual age refresh assertions at640-674 and embed native-maintenance coverage at153-300; do not queue these based on old contract status.

Terminal main refresh: origin/main advanced from 4c90e6c8f35775e2a0287ab24ccba87d7a8d8485 to c77030f1bf9501975efca38be82a33d9611a9d5a during planning. The single newly landed health-ledger commit changes only deploy/setup/import ledger tooling and its tests/docs, not CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md or the audited product feature implementations. Read-only inspection of that delta preserves these findings; no authored product changes occurred. The former health-ledger candidate is now main, not in flight.
