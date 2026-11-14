# Lamp size-check adoption: blocked qualification

Product branch: `cloud/sd-lamp-sizecheck-2`; candidate `865854019e82c8ed9530d30aeedbfa76f8a0df9e`.
Draft PR: https://github.com/just-every/run-lamp/pull/362

## Result and boundaries

Added a Lamp-owned size-check.json, adopted published rer 0.2.115 because 0.2.108 refuses the size capability, and wired a single nightly schedule (03:37 UTC) and source/query/migration changes into Verify. The new job downloads the existing production Worker artifact; it adds no build. JSON results and statement artifacts are retained even on failure. Existing checks, query source, schemas, release metadata, contract judgments and generated views were preserved. No permanent tests or fleet tooling were added to the product. The negative control is a disposable built-Worker mutation only.

This is a blocked draft, not a qualified adoption or landing candidate. Current Lamp rer-setup.json declares only its native setup extension. The published runner refuses an owner persona with size_owner_missing unless an owner-claim step or verification.owner exists. Adding a product owner/agent declaration is outside this brief’s size-declaration/CI/synthetic-fixture lease. We did not invent that product declaration or silently make ordinary flows anonymous.

For diagnosis only, a temporary untracked agent-surface.json supplied verification.owner (native POST /auth/bootstrap, synthetic email binding and generated disposable session secret) and verification.publicHosts=[LAMP_PAGE_HOST]. The actual existing hosted-check.json selected by Lamp’s adapter supplied app rer-hosted-check.invalid and page status.rer-hosted-check.invalid. It overrides a declaration’s build.deployDeclaration; the preliminary unused .rer deploy fixture is not a new deployment configuration. All disposable verification declarations were removed afterward. This adaptation is evidence-only and does not establish that committed rer size passes.

## Plan

See PLAN.md for the full original plan. Completed: inspected main, AGENTS, CONTRACT, OPERATIONS, source/CI and published package help/validator; declared actual Lamp tables; built with public rer setup; ran supported local-D1 metering at both sizes; retained ordinary failures; ran the one-off negative control and emitted-statement checks; parsed workflow/typechecked/regenerated and checked the source lock; integrated current main; audited every candidate author/committer/trailer; pushed saves and final candidate, and opened the required draft PR. Exact-SHA CI completed red; CI-RECEIPT.json and the evidence transport receipt record their separate results. The remaining owner/host verification support and ordinary-query fixes require a scoped follow-up, with no ceilings weakened.

## Geometry and declared ceilings

The geometry is an explicit synthetic translation of public published ChargeDesk counts, not measured Lamp or HH contents. It uses Lamp’s current schema and no HH table names: 644 knowledge-document slots become 644 monitored components and 644 alert_sources (configured monitor definitions); 9,000 recent conversations become 90/9,000 resolved incidents, each with one attachment and three updates (270/27,000); 161,893 accumulated conversation records become 1,619/161,893 component_state_history records; 162,000 contacts become 1,620/162,000 subscription records. Only 1,000 subscriptions are active at either size; all remaining are deactivated, keeping Lamp’s 25,000 active/pending admission limit. One future maintenance window exercises the normal minute handler without inventing due customer mail. Content, IDs and addresses are synthetic.

No measured document/source-block histogram was transplanted into Lamp. Fixed catalogue size and per-incident multiplicity are deliberate domain analogies; this fixture does not qualify monitor polling, live alert-provider throughput, due publication, or deployment capacity. Source histories span 45 days. Public status artifacts must be produced by Lamp itself; they were not fabricated as fixtures.

Budgets were fixed before measurement: 3,900,000 rows per working 10-second window; growth ≤10% of small +200 rows; 600-second timeout; no growth exemption. Per-flow ceilings: lists 5,000, detail 25,000, component history 6,000, minute tick 40,000, public reads 1,000. Read flows declare callsInRow=3 as a window-budget reservation. The published runFlow implementation meters each request once (repeat is a separate cache-warming setting); these metrics are actual per-flow totals, including awaited background work, without manual multiplication. These are declared working budgets, not a measured D1 service limit.

| Size | Explicit fixture rows | Rows including native/derived tables before flows | Generation | All measured phases |
|---|---:|---:|---:|---:|
| small | 4,979 | 6,782 | 0.236s | 29.931s |
| large | 370,183 | 541,170 | 5.376s | 61.901s |

Every declared table’s count read back exactly matches its declaration. Derived rows include history audit/reporting rows and native owner records. Counts are before the measured flows run.

## Actual ordinary-flow result

| Flow | Small rows | Large rows | Status small/large | Result |
|---|---:|---:|---|---|
| component-list | 4,121 | 182,321 | 200/200 | ceiling, growth |
| incident-list | 1,805 | 180,005 | 200/200 | ceiling, growth |
| incident-detail | 1,317 | 1,343 | 200/200 | pass |
| component-history | 13 | 511 | 200/200 | growth |
| subscriber-list | 4,299 | 325,059 | 200/200 | ceiling, growth |
| monitor-list | 653 | 653 | 200/200 | pass |
| maintenance-list | 13 | 13 | 200/200 | pass |
| minute-tick | 24,219 | 1,671,933 | None/None | status, ceiling, growth |
| public-summary | 0 | 0 | 503/503 | status |
| public-history | 0 | 0 | 503/503 | status |
| public-feed | 0 | 0 | 503/503 | status |

Three of eleven ordinary flows pass. Do not remove the eight failures to obtain green. Public routes reach the real page host but answer 503 because Lamp did not produce a current snapshot; zero D1 rows there does not qualify successful public reading. The scheduled handler reports a native scheduled-preparation exception at both sizes. The metered rows before that exception remain visible, and queue consumers are explicitly unmeasured by the published runner. The run closes both disposable installations.

### Concrete scoped query follow-up

- **component-list** (GET /api/app/components): 4,121 → 182,321 rows. over its ceiling of 5,000 at large by 177,321 (3 calls in a row); grew 178,200 rows from small to large; allowed 10% of small + 200 = 612.
  - 162,003 rows across 1 executions: `WITH follow_event AS (SELECT NULL AS incident_id,? AS event_at)           INSERT OR IGNORE INTO sms_deliveries(id,subscriber_id,event_id,kind,incident_update_id,maintenance_id,incident_report_id,outcome,queued_at,outcome_at)           SELECT ?||'.'||s.id,s.id,?,?,?,?,?,CASE WHEN s.state='active' THEN 'queued' ELSE 'suppressed' END,?,CASE WHEN s.state='active' THEN NULL ELSE ? END           FROM subscriber_directory s WHERE s.channel='sms' AND s.state IN ('active','deactivated') AND s.destination NOT LIKE 'deleted:%' AND ((NOT EXISTS(SELECT 1 FROM incident_subscriptions incident_follow WHERE incident_follow.subscriber_id=s.id) AND 1 AND (s.selection_mode='all' OR EXISTS(SELECT 1 FROM subscriber_components sc WHERE sc.subscriber_id=s.id AND sc.component_id IN (NULL))) AND EXISTS(SELECT 1 FROM components c WHERE c.id IN (NULL) AND c.internal=0)             AND EXISTS (SELECT 1 FROM json_each(s.event_kinds_json) preference WHERE preference.value = 'maintenance') AND 1) OR (0))             AND EXISTS(SELECT 1 FROM maintenance_notices WHERE id=?)`
  - 18,002 rows across 1 executions: `         SELECT component_id AS componentId, state, 'standing-claim' AS causeType         FROM component_standing_claims         UNION ALL SELECT component_id AS componentId,state,'vendor' AS causeType FROM vendor_dependencies WHERE state IS NOT NULL         UNION ALL         SELECT attached.component_id AS componentId, attached.state, 'incident' AS causeType         FROM incident_components AS attached         JOIN incidents AS incident ON incident.id = attached.incident_id         WHERE attached.component_id IS NOT NULL AND attached.published_at IS NOT NULL           AND incident.deleted_at IS NULL AND incident.lifecycle <> 'Resolved'         UNION ALL         SELECT attached.component_id AS componentId, attached.state, 'maintenance' AS causeType         FROM maintenance_components AS attached         JOIN maintenance AS window ON window.id = attached.maintenance_id         WHERE attached.component_id IS NOT NULL AND window.state = 'In progress'       `
  - 1,288 rows across 1 executions: `select "components"."id", "components"."group_id", "components"."name", "components"."description", "components"."region", "components"."internal", "components"."only_show_if_degraded", "components"."uptime_start_date", "components"."display_order", "components"."note", "components"."created_at", "components"."updated_at", "component_groups"."name" from "components" left join "component_groups" on "components"."group_id" = "component_groups"."id" order by "component_groups"."display_order", "components"."display_order", "components"."id"`
- **incident-list** (GET /api/app/incidents): 1,805 → 180,005 rows. over its ceiling of 5,000 at large by 175,005 (3 calls in a row); grew 178,200 rows from small to large; allowed 10% of small + 200 = 380.
  - 80,999 rows across 1 executions: `select "automation_attribution", "automation_receipt_id", "id", "incident_id", "lifecycle", "affected_audience", "customer_impact", "what_still_works", "details", "next_update_at", "published_at", "is_retroactive", "author_operator_id", "corrects_update_id", "component_changes_json", "component_snapshot_json", "created_at", "updated_at" from "incident_updates" where "incident_updates"."incident_id" in (select "id" from "incidents" where "incidents"."deleted_at" is null) order by "incident_updates"."published_at" desc`
  - 35,999 rows across 1 executions: `select "id", "incident_id", "component_id", "component_name", "state", "relationship", "published_at", "created_at", "updated_at" from "incident_components" where "incident_components"."incident_id" in (select "id" from "incidents" where "incidents"."deleted_at" is null)`
  - 18,001 rows across 1 executions: `select "id", "incident_id", "body", "author_operator_id", "created_at", "updated_at" from "incident_internal_notes" where "incident_internal_notes"."incident_id" in (select "id" from "incidents" where "incidents"."deleted_at" is null) order by "incident_internal_notes"."created_at" desc`
- **component-history** (GET /api/app/components/10000000000000000000000001/history): 13 → 511 rows. grew 498 rows from small to large; allowed 10% of small + 200 = 201.
  - 504 rows across 1 executions: `select "id", "source_name", "source_url", "previous_state", "new_state", "cause_type", "cause_id", "operator_id", "changed_at", "created_at" from "component_state_history" where "component_state_history"."component_id" = ? order by "component_state_history"."changed_at" desc, "component_state_history"."created_at" desc`
  - 2 rows across 1 executions: `SELECT s.id,s.operator_id AS operatorId,s.created_at AS createdAt,s.expires_at AS expiresAt,s.kind,p.issuer,p.subject,p.sid, o.email,o.display_name AS displayName,o.role,o.status,o.version,o.created_at AS operatorCreatedAt       FROM oa_sessions s JOIN oa_operators o ON o.id=s.operator_id LEFT JOIN oa_provider_sessions p ON p.session_id=s.id       WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND o.status='active' AND s.operator_version=o.version AND (s.kind!='oidc' OR (p.session_id IS NOT NULL AND EXISTS(SELECT 1 FROM oa_auth_settings a WHERE a.singleton=1 AND a.idp_sign_in=1 AND a.generation=p.generation))) AND 1`
  - 1 rows across 1 executions: `SELECT p.provider_id AS id,p.issuer,p.client_id AS clientId,p.linked_at AS linkedAt FROM oa_provider_session_pins p JOIN oa_sessions s ON s.id=p.session_id WHERE s.token_hash=?`
- **subscriber-list** (GET /api/app/subscribers?limit=50&offset=0): 4,299 → 325,059 rows. over its ceiling of 5,000 at large by 320,059 (3 calls in a row); grew 320,760 rows from small to large; allowed 10% of small + 200 = 629.
  - 324,000 rows across 1 executions: `select "id", "channel", "event_kinds_json", "minimum_impact", "destination", "contact_email", "state", "selection_mode", "token_hash", "deactivation_reason", "deactivated_at", "created_at", "updated_at" from "subscriber_directory" order by "subscriber_directory"."created_at" asc limit ?`
  - 1,003 rows across 1 executions: `SELECT COUNT(*) AS total,       COALESCE(SUM(channel='email'),0) AS email,COALESCE(SUM(channel='webhook'),0) AS webhook,       COALESCE(SUM(channel='slack'),0) AS slack,COALESCE(SUM(channel='teams'),0) AS teams,COALESCE(SUM(channel='sms'),0) AS sms       FROM subscriber_directory AS subscribers WHERE state IN ('pending','active')`
  - 51 rows across 51 executions: `SELECT s.created_by_operator_id AS id,CASE WHEN o.id IS NULL OR o.email='deleted-' || lower(o.id) || '@operator.invalid'         THEN 'Erased operator · ' || s.created_by_operator_id ELSE o.display_name END AS displayName         FROM subscriber_directory s LEFT JOIN oa_operators o ON o.id=s.created_by_operator_id WHERE s.id=? AND s.created_by_operator_id IS NOT NULL`
- **minute-tick** (cron * * * * *): 24,219 → 1,671,933 rows. the scheduled handler failed: Native scheduled preparation failed (exception); fixture values are not logged. at small and large; over its ceiling of 40,000 at large by 1,631,933; grew 1,647,714 rows from small to large; allowed 10% of small + 200 = 2,621.
  - 971,358 rows across 3 executions: `select "source_name", "source_url", "id", "component_id", "previous_state", "new_state", "cause_type", "cause_id", "operator_id", "supersedes_history_id", "changed_at", "created_at", "updated_at" from "component_state_history" order by "component_state_history"."changed_at" asc, "component_state_history"."created_at" asc`
  - 162,000 rows across 3 executions: `select "automation_attribution", "automation_receipt_id", "id", "incident_id", "lifecycle", "affected_audience", "customer_impact", "what_still_works", "details", "next_update_at", "published_at", "is_retroactive", "author_operator_id", "corrects_update_id", "component_changes_json", "component_snapshot_json", "created_at", "updated_at" from "incident_updates" order by "incident_updates"."published_at" desc`
  - 161,000 rows across 1 executions: `SELECT id,destination FROM subscribers WHERE state='deactivated' AND deactivation_reason IN ('held for Sorry cutover','held for Business cutover') AND created_at < ?`

Inspect the full uncropped result and exact SQL/parameters in ordinary-size.jsonl and ordinary-statements/{small,large}.json. This report does not turn the synthetic snapshot/scheduler refusal into a production-incident claim; it needs a scoped fixture/native-publication diagnosis along with the demonstrated growing queries.

## Public-door checks and negative control

- Frozen pnpm dependency install: pass. Public `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: pass, built the real Worker and initialized only a local installation. No provider credentials or cloud resources were used. The setup output is summarized here; private generated local settings are not in the packet.
- Original pinned 0.2.108 `rer size --json`: exit 4, safety_refusal (first-party capability unavailable). Published 0.2.115 help and declaration/fixture/meter/verdict sources were read from its npm distribution.
- Committed candidate `rer size --json --write-statements ...`: exit 1, size_owner_missing. candidate-size.jsonl is the unadapted result on the exact pushed source tree; no temporary verification.owner declaration is in the candidate.
- Disposable native-owner ordinary run: exit 1 with the eleven flows above. The preliminary disposable-size.jsonl used the wrong public hostname; host-diagnosis.txt identifies Lamp’s selected existing hosted-check.json and the corrected authoritative run is ordinary-size.jsonl.
- Deliberate negative control: wrapped only dist/server/index.js in the disposable build. `/api/app/size-negative-control` runs `SELECT id FROM subscribers` without a predicate or LIMIT and answers the row count. Same public `rer size` door, same budgets, same fixture geometry, no engine changes. It read 1,620 → 162,000 rows and exited 1 for both ceiling and growth. Allowed growth was 362; observed growth was 160,380. The production-build bytes were restored afterward. negative-injection.txt, negative-size-check.json, negative-size.jsonl and negative-statements retain the actual inputs/output.
- `rer size --statements ordinary-statements/small.json --json` and the large equivalent: exit 0, all 381 emitted executions at each size compile and meet the published structural margins. This is local SQLite statement confirmation only, not execution on real D1.
- Typecheck: pass. Workflow YAML parse: pass. git diff --check: pass. Source lock regenerated last for each commit and checked: pass; source-check.json identifies the final lock. No full local suite was run; branch Verify is the full wall.

## CI cost and qualification

The new size job adds one dependency install/artifact download and zero Worker builds. Nightly runs reuse Verify’s single existing build and retain the existing eight test shards. Query/migration selection includes src/, modules/, migrations/, fixture/declaration/workflow and package/lock changes; an unavailable before-commit conservatively runs the gate. The dedicated CI job records elapsed seconds and exit status in its job summary even on failure.

The full disposable small+large run measured 91.832 seconds of phases in this VM (29.931s small, 61.901s large); 5.612s was fixture generation. This is a local measurement, not a GitHub-hosted overhead receipt. rer 0.2.115 also runs the declared size check at the end of the existing runtime rer verify; that existing public verifier must be retained. Until native owner declaration support is supplied, both size entry points refuse before measuring. Actual CI jobs/timings are recorded in CI-RECEIPT.json and RECEIPT.json. No claim of ≤10-minute Verify or green CI is made.

## Before/after and handoff

Contract: 244 clauses both before and after, statuses unchanged (60 done /129 partial /55 missing). No Status, Gap or Evidence edits; no CLAIM lines because this adoption targets no existing acceptance clause. Registration inventory: 91 →91; existing assertion scripts: 10 →10; one standalone public size gate added. No deleted/skipped/weakened tests. Product changes are limited to size-check.json, required rer pin/lock, Verify size wiring and regenerated sources.lock.json.

Builder blockers: (1) publish/adopt native owner + public-host verification support through the existing supported rer declaration path; (2) scope fixes for the measured ordinary flow growth and diagnose native snapshot/scheduled preparation at this geometry. Do not self-land this draft. The Mac lander still owns the complete publication scan and all landing gates; this shallow cloud builder did not claim a full-history publication scan.

Single external provider handoff after the local support/query fixes: Strategy’s existing separately credentialed real-D1 statement runner must consume the emitted ordinary statement artifacts and matching fixture declaration, seed disposable synthetic data, and confirm those statements against real D1’s structural limits. Local row-read measurements and hosted capacity remain distinct evidence. No real-D1 confirmation, production contact, private dataset, deployment, credential acquisition or new resource creation occurred here. Exact artifact identities are in STATEMENTS.json; packet receipts are separate from product acceptance.

## Emitted statement identities

- `ordinary-statements/small.json`: SHA-256 `77549281af4787ead825e3bf00b36474d3fbd1a490d480daff200050b2579253`; 381 executions, 123 distinct SQL texts.
- `ordinary-statements/large.json`: SHA-256 `00edd1e2ce10bb7fd7bbad4e76540c456446545e9e286424a825372bb2752a39`; 381 executions, 123 distinct SQL texts.
- `negative-statements/small.json`: SHA-256 `09b2149d9ec177d1155cb8a4f19766faa2ffe9801985b5786265bbf81855c94f`; 1 executions, 1 distinct SQL texts.
- `negative-statements/large.json`: SHA-256 `98e259095277cfd25fa06c2dad70c6b1c13f47446a98125a713b5ba1ed866275`; 1 executions, 1 distinct SQL texts.

## Exact-SHA CI conclusion

Verify run [43530416554](https://github.com/just-every/run-lamp/actions/runs/43530416554) completed **failure** on exact candidate `865854019e82c8ed9530d30aeedbfa76f8a0df9e`. Shared build and seven test shards succeeded. The runtime shard’s existing product journeys passed, then the new public size step refused the missing native owner declaration; its retained failed-job log prints the exact size_owner_missing message. The dedicated size job exited 1 at the same measurement entry point; its JSON output is retained by CI as lamp-size-43530416554-865854019e82c8ed9530d30aeedbfa76f8a0df9e. The final aggregate correctly refused SIZE_RESULT=failure and SHARDS_RESULT=failure. All three failed-job archives were read exactly once with the requested gh run view --job --log-failed command; every archive call succeeded. Total GitHub command budget: 10/10; no rerun or workflow dispatch.

Measured CI cost on this failed qualification: added size job **26s** end-to-end, of which the measurement/refusal step was **3s**; **zero additional Worker builds**. This measures the refusal path, not successful small/large fixtures in GitHub Actions. The entire Verify job span was 1016s (16.93min), with 68.12 summed job-minutes. The existing composer shard was the longest; the size job ended before the test shards. Nightly wiring retains the entire existing Verify wall, so daily total cost includes that wall as well as this size job. The ≤10-minute Verify goal is not qualified by this candidate.

| Job | Conclusion | Seconds |
|---|---|---:|
| plan (132246414628) | success | 9 |
| build (132246486592) | success | 57 |
| size-check (132246853145) | failure | 26 |
| shards (imports) (132246853314) | success | 476 |
| shards (demo) (132246853327) | success | 360 |
| shards (public) (132246853329) | success | 569 |
| shards (delivery) (132246853345) | success | 657 |
| shards (runtime) (132246853351) | failure | 450 |
| shards (ownership) (132246853380) | success | 288 |
| shards (portability) (132246853389) | success | 252 |
| shards (composer) (132246853400) | success | 935 |
| verify (132252901844) | failure | 8 |

Do not land this draft or describe it as READY. Product code was not changed to conceal the native-declaration or ordinary-flow failures.
