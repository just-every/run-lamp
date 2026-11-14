# Lamp native size owner declaration: partial, blocked qualification

Product: `cloud/sd-lamp-sizecheck-3` at `2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1`. Draft PR: https://github.com/just-every/run-lamp/pull/363.

The product branch is pushed. It is not READY. Native owner initialization now succeeds through Lamp’s existing bootstrap; ordinary size assertions remain red, and the permitted verification-only agent declaration does not satisfy the general verifier’s full agent-tool schema. No product routes, queries, schema, contract judgments or generated views were changed.

## Plan and source custody

The complete plan is in PLAN.md. Read the prior report first (previous-REPORT.md). Started from the pushed continuation head `865854019e82c8ed9530d30aeedbfa76f8a0df9e`, then merged current main `4271d1caa8f044a0265eb287c660e1777bd5b942`, keeping its newer import-security tests, test registration and release metadata. The merge candidate was committed once with fleet author/committer identity; every candidate including side parents was audited, and one product push succeeded through cloud-push.py. No force push, main push, landing, tag, release or deploy occurred.

The initial clone was shallow/filter=blob:none, then unshallowed for the requested scan. Base’s installed public scanner was run on the exact candidate with `--public-base https://github.com/just-every/run-lamp#main --project just-every/lamp --repository https://github.com/just-every/run-lamp`. It returned INCOMPLETE with `scan.gitleaks-unavailable` (requires Gitleaks 8.30.1). publication-scan.json is the actual result. This cloud does not claim a complete fleet/Mac publication scan or its private environment proof; the Mac must run that independent gate before landing.

## Native contract and committed change

agent-surface.json exactly mirrors the preceding evidence packet’s disposable-verification.json: verification.owner.email=`synthetic-lamp-1@example.test`, emailField=`SETUP_OPERATOR_EMAIL`, bindings.SESSION_SECRET=`sessionSecret`; verification.publicHosts=[`LAMP_PAGE_HOST`]. No secret value is committed. Published cli/agent-sponsors.mjs accepts these owner fields. cli/hosted-owner.mjs uses its supported default POST /auth/bootstrap with a fresh setup token and generates sessionSecret with randomBytes(32) for each disposable installation. Lamp’s existing route returns the required 303 and session cookie; both measured installations signed in. No initializer is required for this native setup-token path, and no product route was invented. hosted-check.json supplies app `rer-hosted-check.invalid` and page `status.rer-hosted-check.invalid`; the adapter’s existing hosted declaration remains authoritative.

The Verify size selector now includes agent-surface.json. The size-check job still downloads the one existing production build, runs supported rer size without dropping any flow, keeps failed JSON/statements as artifacts, and fails the aggregate when measurement fails. rer stays pinned to the preceding round’s published 0.2.115; main’s newer package test script is retained.

DEFAULT size-input-guard: the 200 MiB bound applies to synthetic fixture input bytes (size-check.json), not an invented SQLite database/WAL limit. The inherited job and published size schema have no 200 MiB live-database option. A diagnostic OS per-file limit stopped large generation at component_state_history rows 130,001–140,000 with `other side closed`; its complete output is retained as file-cap-ordinary-size.jsonl. It is not described as successful large measurement. Candidate input bytes: 10488. All fixtures remain generated synthetic data, not private/provider/customer input.

GAP verification-declaration: rer size’s prepareRun reads verification.owner/publicHosts independently, but the general verifier’s agentSurfaceClauses/checkAgentDoor treat any agent-surface.json as a full agent-tool declaration. The permitted file fails schema, seed, specialist, tools, notTools, resources, journey, events and witness assertions (declaration-check.json). The lease permits only owner/publicHosts; adding invented tools or routes, broadening that schema, or skipping the check would be outside scope. This is separate from Lamp’s successfully supported bootstrap and the measured query failures.

## Exact ordinary flow results

Authoritative final output: ordinary-size.jsonl; details: metrics.json. The measured source/build is the same clean tree committed as the candidate, with merged main and the committed native declaration. Exit 1. Every declared table read back exactly at both sizes.

| Size | Explicit fixture rows | Total rows before flows | Fixture generation seconds | All measured phase seconds |
|---|---:|---:|---:|---:|
| small | 4,979 | 6,782 | 0.230 | 29.305 |
| large | 370,183 | 541,170 | 5.375 | 60.078 |

| Flow | Small rows | Large rows | HTTP small/large | Large ceiling | Result |
|---|---:|---:|---|---:|---|
| component-list | 4,121 | 182,321 | 200/200 | 5,000 | ceiling, growth |
| incident-list | 1,805 | 180,005 | 200/200 | 5,000 | ceiling, growth |
| incident-detail | 1,317 | 1,343 | 200/200 | 25,000 | pass |
| component-history | 13 | 511 | 200/200 | 6,000 | growth |
| subscriber-list | 4,299 | 325,059 | 200/200 | 5,000 | ceiling, growth |
| monitor-list | 653 | 653 | 200/200 | 5,000 | pass |
| maintenance-list | 13 | 13 | 200/200 | 5,000 | pass |
| minute-tick | 24,219 | 1,671,933 | none/none | 40,000 | status, ceiling, growth |
| public-summary | 0 | 0 | 503/503 | 1,000 | status |
| public-history | 0 | 0 | 503/503 | 1,000 | status |
| public-feed | 0 | 0 | 503/503 | 1,000 | status |

Three of eleven flows pass, unchanged from the preceding diagnosis. Owner initialization no longer refuses. Public routes reach the declared page host but return 503 because the disposable installation has no current native public snapshot; 0 rows does not qualify success. The native minute handler fails scheduled preparation at both sizes; its actual reads before failure remain counted. Queue consumers are held/unmeasured by the published runner. No snapshot or successful scheduler response was fabricated.

Every row ceiling remains unchanged: lists 5,000; detail 25,000; component history 6,000; minute tick 40,000; public reads 1,000. Window budget stays 3,900,000 rows, growth stays 10% of small plus 200 with no exemptions, timeout stays 600 seconds. callsInRow=3 is the existing reservation; published runFlow meters one request, and these values are the actual measured totals, not multiplied estimates.

## Concrete failures for scoped follow-up

- **component-list**: over its ceiling of 5,000 at large by 177,321 (3 calls in a row); grew 178,200 rows from small to large; allowed 10% of small + 200 = 612.
- **incident-list**: over its ceiling of 5,000 at large by 175,005 (3 calls in a row); grew 178,200 rows from small to large; allowed 10% of small + 200 = 380.
- **component-history**: grew 498 rows from small to large; allowed 10% of small + 200 = 201.
- **subscriber-list**: over its ceiling of 5,000 at large by 320,059 (3 calls in a row); grew 320,760 rows from small to large; allowed 10% of small + 200 = 629.
- **minute-tick**: the scheduled handler failed: Native scheduled preparation failed (exception); fixture values are not logged. at small and large; over its ceiling of 40,000 at large by 1,631,933; grew 1,647,714 rows from small to large; allowed 10% of small + 200 = 2,621.
- **public-summary**: answered HTTP 503 (The last known public status snapshot is unavailable. No current state is being inferred.); expected status 200 at small and large.
- **public-history**: answered HTTP 503 (The last known public status snapshot is unavailable. No current state is being inferred.); expected status 200 at small and large.
- **public-feed**: answered HTTP 503 (The last known public status snapshot is unavailable. No current state is being inferred.); expected status 200 at small and large.

The prior negative control (1,620 →162,000 reads) was read as context, not rerun or newly claimed by this declaration-only round. The raw premerge run and file-cap diagnosis are retained with distinct filenames and do not replace final ordinary-size.jsonl.

## Local validation and external proof

Frozen dependencies, public setup, merged public production build, touched typecheck, workflow parse, diff whitespace and source lock check all pass. Source lock was regenerated last, after staging the new declaration; source-check.json records the final tree. No full local rer verify or broad suite was run. No UI changed and no browser proof was needed. Public `rer check --json` also exercises the declaration; its raw output is public-check.jsonl. The verification-plan inventory is 92 registered cases plus 10 assertion scripts =102 checks; unchanged from current main. The prior continuation had 91 cases; main added one, which was preserved. Every test file matches main; no assertion was deleted, skipped or weakened. The separate size gate remains one standalone gate.

Both emitted-statement files pass supported `rer size --statements ... --json` (exit 0): local SQLite structural confirmation only. Statement identities are in STATEMENTS.json. Real-D1 confirmation stays pending: Strategy’s separately authorized runner should seed disposable synthetic D1 with this exact declaration/geometry and execute the emitted ordinary statement artifacts under the real D1 limits, retaining exact artifact hashes and refusals. This run did not acquire D1 credentials, create provider resources or contact production.

Contract before/after: 244 clauses; 60 done /129 partial /55 missing, unchanged. No clause Status, Gap, Evidence or acceptance text changed; generated ACCEPTANCE.md and docs/CLAIMS.md match main and are not in the diff. This size-declaration adoption proves no new acceptance point. The related AGENT-008 surface remains unqualified; a PARTIAL/no-points handoff is not a status promotion.

## Exact-SHA CI

Exact candidate push Verify [43536233833](https://github.com/just-every/run-lamp/actions/runs/43536233833) completed **failure** on `2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1`. PR event run 43536280101 shares that source head but was not separately polled and is not substituted as evidence. One watcher made discovery plus one final REST status call, more than 300 seconds apart. Each of the three failed-job archives was read once with the required gh run view --job --log-failed command; all three archive reads succeeded.

- **size-check** (132266205778): only failing step is **Measure declared flows on small and large local D1**, running the committed owner/host declaration through published rer size. It took 96 seconds, compared with the preceding 3-second owner refusal. The shared build and synthetic input guard completed. This job does not call the general agent-surface validator, so the runtime schema failure is not its cause. Its CI JSON and statements were uploaded as artifact 14089079976. Local exact-tree results are the eight failures tabulated above; we cannot independently certify that CI’s failure is exclusively those same flow rules because that artifact’s blob transfer was refused. No CI per-flow values are fabricated.
- **shards (runtime)** (132266205836): the product runtime/publishing journeys completed, then the retained log prints **Agent door conformance: 1/10 points passed** and the nine missing schema/seed/specialist/tools/notTools/resources/journey/events/witness fields. This is the newly exposed verification-only/full-surface compatibility gap. The subsequent embedded size step was not reached. It is not reported as red solely for query measurements.
- **verify** (132270131784): the final aggregate correctly rejects `SIZE_RESULT=failure` and `SHARDS_RESULT=failure`.

The shared build and seven other shards passed. Total job span was 778 seconds (12.97 minutes), with 64.17 summed job-minutes. The added size job took 122 seconds, including 96 seconds in measurement, and added zero Worker builds. The ten-minute full-Verify target is not qualified.

| Job | ID | Conclusion | Seconds |
|---|---|---|---:|
| plan | 132265796963 | success | 6 |
| build | 132265840057 | success | 58 |
| size-check | 132266205778 | failure | 122 |
| shards (composer) | 132266205792 | success | 700 |
| shards (public) | 132266205793 | success | 590 |
| shards (demo) | 132266205804 | success | 342 |
| shards (runtime) | 132266205836 | failure | 430 |
| shards (delivery) | 132266205839 | success | 632 |
| shards (imports) | 132266205845 | success | 519 |
| shards (portability) | 132266205859 | success | 246 |
| shards (ownership) | 132266205892 | success | 197 |
| verify | 132270131784 | failure | 8 |

Final GitHub budget: **10/10**. The last call was `gh api repos/just-every/run-lamp/actions/artifacts/14089079976/zip`, allowing gh to handle redirects without custom authorization headers. It failed with `Forbidden` from the Azure `productionresultssa12.blob.core.windows.net` artifact redirect; GitHub CLI did not print a numeric HTTP status or response body beyond Forbidden. ci-artifact-receipt.json retains the exact sanitized diagnostic with signed query removed. No blocked-blob retry, Verify rerun or workflow dispatch was attempted. The complete local statement artifacts remain available for Strategy; CI’s artifact still requires retrieval by the fleet through its working transport.


## Handoff

Do not land until the unchanged ordinary flow failures and the verification-only/full-agent-schema compatibility gap have scoped resolutions and exact-SHA Verify is green. Keep provider/D1 qualification separate. Product and evidence custody are separate; this packet and its receipts confer neither READY nor acceptance.

## Additional offline secret inspection

After the first Base scanner attempt reported Gitleaks unavailable, installed the pinned Gitleaks 8.30.1 dependency from the checksum-verified Go module distribution (no additional source repository cloned). Offline scanning of all three candidate commits passes with no matches. Exact committed-tree scanning reports 39 raw matches; all matched source lines already occur on main. The matched files are byte-identical to main except regenerated sources.lock.json, whose matched lines are unchanged. They are retained redacted and are not asserted to be real credentials. SECRET-SCAN-RECEIPT.json records paths/rules and main comparison. This is not the fleet’s complete publication/privacy/license/environment scan, which remains a Mac gate; no extra GitHub API calls were used for these offline scans.
