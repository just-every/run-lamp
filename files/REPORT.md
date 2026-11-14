# Lamp size-check adoption: rer 0.2.116, integration last

Repository: just-every/run-lamp  
Product branch: cloud/sd-lamp-sizecheck-4  
Candidate: e726cb9a0f786c96a19f3cfb16e84b3bc56c32a8  
Parents: prior adoption 2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1 and current main 76748e97deb8a8c2001c7ce043cf48ff6396d80a.

The candidate adopts exact published @runeditrun/rer 0.2.116 and refreshes managed Base source to c3532e238fe3e4b9d1bc70c957b775185c8207de. It preserves the existing size declaration, owner/public-host verification declaration, CI wiring, ceilings, growth/window limits, 200 MiB synthetic-input guard and negative control. The final refreshed Worker measures **6/11 ordinary flows passing**, versus 3/11 in the previous adoption. Five still fail. This is preparation only: integration belongs to sd after the incident and tick gates/landings. No landing submission, main push, tag, release or deploy is authorized or performed. No READY claim.

## Plan and completed work

The complete ordered plan is PLAN.md. Fleet identity was set before work; launcher refresh and the decrypted-bundle-only Git setup, preserved commit hooks, toolchain and separate report transport were installed. The initial injected credential returned 401; required backoff/refresh recovered access on attempt 4. Actual non-secret access receipts are retained. Only the declared Lamp repository was cloned; other source reads used gh api. No other credential was sought.

Started from the exact previous adoption head and merged main, retaining its component/subscriber query repairs, tests, migration 0079 and release 1.11.15. No incident/tick branch was acquired, cherry-picked or duplicated; their gates were not awaited. Product queries, SQL/schema, release metadata, CONTRACT.md, generated views, homepage files and all test source match main. Preservation-check.json proves those comparisons. No test was deleted, skipped or weakened.

Pinned only @runeditrun/rer to exact 0.2.116 and updated pnpm-lock.yaml. Public setup passed; the public npm version/integrity receipt is npm-release.json. The original required refresh-base --ref c3532e238fe3e4b9d1bc70c957b775185c8207de --from-api ran its whole-tree immutable acquisition, then refused `Unsafe path: scripts/size-check/` before writing files. base-refresh.stderr is the actual result. The inherited path is in the seed-owned Verify selector, outside this round's leased job edits.

Recovery used gh api to fetch that exact immutable Base archive, then the published CLI's supported --base-archive path. It required no Base clone, new credential, package/tool patch or invented source. The directory token was temporarily normalized only during refresh, and Verify was restored byte-for-byte before all checks and commit. The archive reader reported no edition migrations. The target source was applied, including three operator-auth dependencies. The raw archive refresh exits 1 with explicit adaptation/dependency notices: the existing run-site adaptation differs upstream, and Base metadata requests React 19.3.1 while Lamp owns React 19.2.8. Preserve both under this lease; no unrelated React pin or homepage change was made. The lobby wording was restored to main and recorded through supported adapt-base so it remains an acknowledged local copy. The supported offline Base-copy check then passed with zero drift. All receipts preserve these notices; they are not concealed as a clean refresh exit.

The workflow, size-check.json and agent-surface.json are identical to the preceding adoption. This includes the nightly/source/migration selector, existing single shared production build, failed-result artifact retention and aggregate failure. The local measurement omits the CI-only --no-queue flag; the existing workflow retains it correctly in CI=true. An initial local invocation refusal is retained in invocation-refusal/ and was corrected before measurement.

Stage intentional edits, regenerate source lock LAST with node node_modules/@runeditrun/rer/edition-authoring/cli.mjs lock, then run the declared source check and offline copies check. Both pass, as do typecheck, contract-view check, workflow parse and whitespace checks. Native owner-claim tests: 4 executed, 4 passed, no skips. Fresh public build passes. No full local suite or rer verify was run; exact-SHA branch Verify is the full wall. Node v24.19.0 and pnpm 10.12.4 were the actual toolchain selected by the supplied cloud setup. The pinned Gitleaks 8.30.1 was built from the checksum-verified Go module distribution for the approved publication-check attempt.

## Verification-only owner declaration

The published runtime checkAgentDoor now returns declared:false and prints `Agent door conformance: undeclared (verification-only agent-surface.json)`. The native setup/bootstrap and owner sessions also succeed in both measured installations. No full agent tools/routes were invented. The separate static rer check/agentSurfaceClauses diagnostic still evaluates the file as a full surface and reports nine missing fields (declaration-check.json; public-check.jsonl). That static diagnostic is recorded separately from the corrected runtime verification path. No AGENT clause or acceptance point is promoted.

## Final ordinary-flow measurements

The authoritative final outputs are ordinary-size.jsonl, ordinary-metrics.json and ordinary-statements/{small,large}.json. These were rerun on the refreshed, restored-lobby production Worker; pre-refresh measurements are separately retained in pre-refresh/. Measured-worker.sha256 binds the final artifact, and its bytes were verified restored after the negative control. The final flow totals agree with the preliminary run, but only final output is used below.

| Flow | Small rows | Large rows | HTTP small/large | Large ceiling | Result |
|---|---:|---:|---|---:|---|
| component-list | 3,873 | 3,873 | 200/200 | 5,000 | pass |
| incident-list | 4,450 | 343,030 | 200/200 | 5,000 | ceiling, growth |
| incident-detail | 1,317 | 1,343 | 200/200 | 25,000 | pass |
| component-history | 13 | 110 | 200/200 | 6,000 | pass |
| subscriber-list | 1,109 | 1,109 | 200/200 | 5,000 | pass |
| monitor-list | 653 | 653 | 200/200 | 5,000 | pass |
| maintenance-list | 13 | 13 | 200/200 | 5,000 | pass |
| minute-tick | 24,219 | 1,671,933 | None/None | 40,000 | status, ceiling, growth |
| public-summary | 0 | 0 | 503/503 | 1,000 | status |
| public-history | 0 | 0 | 503/503 | 1,000 | status |
| public-feed | 0 | 0 | 503/503 | 1,000 | status |

The component-list, component-history and subscriber-list improvements come from main's landed repairs, preserved by the merge. No query repair was added here. Incident-list still grows beyond its ceiling; minute-tick still throws during native scheduled preparation and exceeds ceiling/growth; public-summary, public-history and public-feed answer 503 without a native current snapshot. Their zero rows do not qualify successful reading. Raw emitted SQL and detailed refusal messages remain in the actual artifacts. Queue consumers are not measured.

| Size | Explicit fixture rows | Total rows before flows | Generation seconds | Sum of measured phases seconds |
|---|---:|---:|---:|---:|
| small | 4,979 | 6,783 | 0.224 | 27.719 |
| large | 370,183 | 541,171 | 5.443 | 60.707 |

Every declared table read back exactly at its declared count. Ordinary wall command: 93 seconds, exit 1. Synthetic-only geometry is unchanged. DEFAULT size-input-guard: the inherited 200 MiB bound is the synthetic input declaration bound; it is not a live database/WAL limit. Budget remains 3,900,000 rows, growth 10% of small +200, no exemptions, timeout 600 seconds, all eleven flows retained. callsInRow=3 remains the original reservation; actual measured rows are not multiplied estimates.

## Negative control and D1 custody

The unchanged public evidence control injects only the disposable built Worker's `/api/app/size-negative-control`, executing SELECT id FROM subscribers without a predicate or LIMIT. No permanent endpoint or source query is added. It reads 1,620 /162,000 rows, answers HTTP 200 at both sizes and correctly exits 1 for ceiling and growth under the same 5,000 ceiling and 10%+200 growth rule. Wall command: 20 seconds. The Worker was restored byte-for-byte and verified. The original negative declaration/injection description, final raw results and emitted statements are retained with hashes in STATEMENTS.json.

Both ordinary emitted-statement checks exit 0. This is local SQLite structural confirmation only. Real-D1 confirmation remains with the separately executing authorized session; no provider account/resources, production, scale or deployment acceptance is claimed.

## Counts, scope and publication custody

Before/after acceptance: 244 clauses; 60 DONE /129 PARTIAL /55 MISSING. No clause Status, Gap, Evidence or acceptance text changed; no new acceptance claim. Registered cases 92→92; assertion scripts 10→10; total 102, plus the existing standalone size gate. Core query/schema/test/release sources and homepage-related files match main. The generator views are not committed. Managed copy records 258→258; source lock generated last. Product and report refs remain separate.

All candidate commits, including side parents, have fleet author/committer identity and permitted/absent trailers; no OpenAI/Codex co-author remains. identity-audit.txt and PRODUCT-PROVENANCE.json retain custody. One normal, non-skip candidate commit contains the merge and adoption. Exact product/evidence publication and CI receipts are appended below from actual outcomes. The fleet/Mac still owns its independent complete publication scan and final integration; a saved packet or bundle confers no READY/acceptance/landing.

## Product publication and publication-check result

The single guarded product push succeeded on attempt 1: cloud/sd-lamp-sizecheck-4 at e726cb9a0f786c96a19f3cfb16e84b3bc56c32a8. Draft PR: https://github.com/just-every/run-lamp/pull/373. The product checkout is clean. Main was re-fetched immediately before push and remained 76748e97deb8a8c2001c7ce043cf48ff6396d80a. No history was rewritten.

The approved full-history publication checker was attempted on the exact committed candidate, public base https://github.com/just-every/run-lamp#main, project just-every/lamp and full destination URL. Its first attempt refused the public-base fetch; a direct fetch then succeeded. Its second attempt hit the checker deadline and returned INCOMPLETE/scan.deadline-exceeded. No complete history/environment/publication claim is made. Both actual reports are retained; the fleet/Mac must run its independent complete publication gate.

Additional offline inspection of the exact candidate diff reported three raw hex-api-key matches in base-copies.json. Each was proven to be the SHA-256 identity of the exact tracked source file named by its JSON key, not a credential assignment. The redacted raw findings and cryptographic classification receipt are retained. This inspection does not replace the complete publication scan.

The selected report packet was separately inspected with pinned Gitleaks. Its 18 raw matches were all verified build SHA-256 values or retained source-origin descriptor hashes, with zero unresolved credential matches. packet-safety.json records the checks; the redacted raw report is retained. No credential files, environment dumps, provider keys, Base archive/private gate files or symlinks are selected. The complete publication scan remains separate and incomplete.

## Exact-SHA CI

Push Verify [43558413306](https://github.com/just-every/run-lamp/actions/runs/43558413306) completed **failure** on exact candidate e726cb9a0f786c96a19f3cfb16e84b3bc56c32a8. The first delayed exact-head discovery already contained completed status, so no redundant status poll was needed. One watcher made no short polling requests, no rerun and no dispatch. PR run 43558458719 was in progress at that discovery and is not substituted as proof.

The shared build and seven test shards passed. Runtime product tests report zero failures, and the retained archive prints `Agent door conformance: undeclared (verification-only agent-surface.json)` before reaching size verification. Its only remaining failure is the five size flows listed in the final table, with exactly the same row totals and statuses as the local final run. Thus the old runtime verification-only schema blocker is fixed. The dedicated size-check job fails only its measurement step; its JSON is artifact-bound and was not downloaded, so its independent per-flow values are not invented. The final verify aggregate correctly rejects failing size/runtime jobs. Both assertion-job archives were read once with the required gh run view --job --log-failed command, and both reads succeeded. The aggregate archive was not fetched; no further calls remained.

| Job | ID | Conclusion | Seconds |
|---|---:|---|---:|
| plan | 132336410035 | success | 7 |
| build | 132336450498 | success | 54 |
| size-check | 132336677104 | failure | 139 |
| shards (portability) | 132336677151 | success | 261 |
| shards (delivery) | 132336677177 | success | 680 |
| shards (composer) | 132336677179 | success | 1018 |
| shards (ownership) | 132336677191 | success | 291 |
| shards (runtime) | 132336677197 | failure | 514 |
| shards (imports) | 132336677201 | success | 400 |
| shards (public) | 132336677219 | success | 786 |
| shards (demo) | 132336677223 | success | 299 |
| verify | 132340905069 | failure | 10 |

Job span: 1095 seconds (18.25 minutes); summed job time: 74.32 minutes. The 10-minute Verify target is not qualified (the observed span exceeds 600 seconds). The size job reuses the existing production build, adding zero builds.

Direct metadata/PR/CI CLI requests: 10, including initial report authentication retries, immutable source archive, draft PR, one exact-head discovery, jobs and two failed-job archive invocations. The mandatory published source reader and publication checker perform additional internal provider reads without exposing a count; this is not a claim of ten total wire requests. No further GitHub API call is made.

## Handoff

PUSHED preparation only, not READY. Integrate LAST after both independent incident and tick gates/landings. The five remaining flow failures need those scoped repairs and native snapshot preparation; no product query repair is authorized here. The fleet/Mac must perform its independent complete publication scan. Real-D1 confirmation remains in its executing session’s custody. Evidence publication is separate from product readiness and will be reported by its exact ref/head in the terminal handoff.
