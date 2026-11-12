# Lamp v1.11.13 exact-head CI triage

Tag: sd-lamp-release-1-11-13-ci-triage-1
Repository: just-every/run-lamp
Candidate under investigation: 3da8bf2e469b229080489af89872f97fd23c76cf
Verify: https://github.com/just-every/run-lamp/actions/runs/43236095677
Product scope: read-only investigation. No writer or release authority was exercised.

## Evidence established before retry

The complete failed-step archive for runtime job 131244441868 was retrieved once through `gh run view 43236095677 --repo just-every/run-lamp --job 131244441868 --log-failed`. The failed test is `HIST-006 — independent public readership produces private traffic alerts and recoverable owner actions`, registered at tests/e2e/update-reminders.test.mjs:157. Its strictEqual assertion at tests/e2e/helpers/traffic-alerts-flow.mjs:111 says `traffic alerts publish no customer-facing incident or content` (HIST-006 acceptance point 7).

Expected public status:

```json
{"version":1,"generatedAt":"2026-11-12T14:25:21.682Z","overall":"Operational","maintenance":null,"incident":null}
```

Actual public status:

```json
{"version":1,"generatedAt":"2026-11-12T14:31:00.000Z","overall":"Operational","maintenance":null,"incident":null}
```

Only generatedAt differs. This log does not show a customer-facing incident or changed status. It is an assertion failure, not evidence by itself of a release product defect, a provider outage, or a main reproduction.

The assertion compares the entire response before and after controlled traffic plus scheduled ticks. The fixture derives a target at the current real UTC hour plus 30 minutes, controls the Worker Date during reads, and calls the production scheduled handler. public-snapshot/service.ts:22 declares a five-minute refresh interval; retryPendingBuild at :360 can rebuild solely because the current snapshot has aged past that interval. The observed delta of 5 minutes 38.318 seconds crosses that interval. This is consistent with an interaction between the test clock and scheduled snapshot renewal. It remains a source-supported hypothesis pending the retry and, if needed, a matched main reproduction. Removing generatedAt from the assertion is not proposed: the full public-silence guarantee must stay covered.

The failed job used the GitHub-hosted ubuntu-24.04 runner named `GitHub Actions 1000314748` (runner id 1000314748). The original runtime command passed its first two runtime tests, then publishing passed 11/12 with only HIST-006 failing. The reported verification inventory was 86 registered cases plus 10 assertion scripts, 96 checks; this investigation changes none of that inventory.

## Independent release blocker discovered

Attempt 1 also has delivery job 131244441625 red, which was absent from the brief's first snippet. Its complete failed-step archive was read once. `AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence` at tests/e2e/channels-and-presets.test.mjs:482 failed in automationRulesBrowserFlow at tests/e2e/helpers/automation-rules-browser-flow.mjs:175. Assertion: `the ended change is no longer offered for Undo`; expected 0, actual 1. The preceding assertions accepted the undo toast and native undoneAt/undoneByOperatorId, so the recorded failure concerns the immediate browser button count. That suggests an observation/render ordering question, but neither a product bug nor a flake is proven by this log alone. Delivery passed 7/8. This task did not rerun that additional shard or widen into a writer round.

Aggregate job 131252333234 failed at `Require every planned command to succeed on this commit`; it reflects failed shard results. Clearing runtime alone cannot make the original workflow green while delivery remains red.

## Retry authorization and execution

Before requesting a retry, exact-SHA discovery showed run_attempt 1 and completed/failure; the all-attempt jobs response contained 11 jobs, each attempt 1. No earlier runtime retry was present. Exactly one job-level POST was issued for runtime job 131244441868 at 2026-11-12T14:46:00.827513Z. It exited successfully with `{}`; the next status observation confirmed attempt 2 on the same full SHA. No workflow dispatch, whole-workflow rerun, main push, admission or resubmission was performed. GitHub may automatically rerun dependent aggregation as part of the job-level retry.

The status observer waits at least 300 seconds between run-status calls. All invocations, including diagnostic reads and the two failed-job archive reads, are listed in api-calls.jsonl against the ten-invocation budget.

## Main comparison and reproduction facility

Main at clone was fbba42453ca699b059154131a86c5fcec6f2c45a. The candidate differs from it in release metadata/history/documentation and its source lock; source-comparison.json records byte-identical traffic flow, traffic fixture, test registration, public-snapshot service and Verify workflow. Identical source is not a passing or failing test on main.

If HIST-006 stays red after its one retry, the next required operation is only this existing registered test on current main, on the matching GitHub-hosted ubuntu-24.04 facility:

```sh
node --test --test-concurrency=1 --test-name-pattern='^HIST-006 — independent public readership produces private traffic alerts and recoverable owner actions$' tests/e2e/update-reminders.test.mjs
```

It requires main's matching production Worker build and the pinned CI toolchain. No existing workflow exposes a single-test or command input: Verify has workflow_dispatch with no inputs and always executes the verification plan, including baseline/full shards. The other workflows deploy, release, run the demo or publish the site. The original ephemeral hosted runner has completed; GitHub job rerun preserves the original candidate SHA rather than substituting main. The installed heavy-slot stand-in only executes in this cloud VM; no remote-run controller or matched hosted runner execution door was shipped. This VM is therefore not a matching reproduction runner. Do not dispatch a new Verify or run a full suite to obtain that comparison. If the retry remains red, report REMOTE-NEEDS-LOCAL for the fleet's targeted runner/controller facility and keep the candidate refused pending the comparison.

## Product provenance and limits

Local investigation branch: cloud/sd-lamp-release-1-11-13-ci-triage-1 at fbba42453ca699b059154131a86c5fcec6f2c45a, created from main solely for read-only inspection and evidence transport. The release head being investigated remains 3da8bf2e469b229080489af89872f97fd23c76cf on cloud/sd-lamp-release-1-11-13-rebase-3da8bf2e469b229080489af89872f97fd23c76cf (release task cloud/sd-lamp-release-1-11-13). Product commits/pushes: 0/0. PR: none. Source/test edits: 0/0. Clause status changes: none. No local tests, baseline or full suite ran. No tag, release, deployment, landing-record edit, readmit or admission occurred. Existing account/key holds were untouched. No new READY/PUSHED product claim is made by this report-only task.

PLAN.md records the full bounded plan. triage-receipt.json and the actual status/job responses record the observations. Complete failed-step outputs are retained with injected values redacted; the execution environment preamble is omitted from public evidence. The explicit packet contains no credentials, environment dumps, private held-out material or symlinks. Publication uses only evidence/sd-lamp-release-1-11-13-ci-triage-1. The clone will be deleted after successful evidence publication and verification; no finished unpushed product work exists.

## Final retry outcome

**Done: the bounded runtime investigation is complete. The release candidate remains BLOCKED by a different shard.**

Runtime retry job **131259653057**, attempt **2**, completed **success** from 2026-11-12T14:46:07Z to 14:51:22Z on GitHub-hosted ubuntu-24.04 runner 1000314847. `Verify this product shard` passed, as did its receipt/log-retention steps. The exact source SHA stayed **3da8bf2e469b229080489af89872f97fd23c76cf**. Classification: **intermittent assertion failure recovered on unchanged head**, with probable fixture-clock / scheduled snapshot-refresh sensitivity. Neither an outside-service infrastructure outage nor an introduced product defect is established. The conditional requirement to reproduce HIST-006 on main was not triggered, because its authorized retry passed. The matching-runner limitation above therefore does not block this completed investigation.

The complete workflow nevertheless finished **completed/failure**, updated 2026-11-12T14:51:31Z. Attempt-2 aggregate **131262940884** is red. Attempt-2 delivery job record **131259655150** carries the original delivery failure from **131244441625**: its started/completed timestamps remain 14:21:19Z/14:28:39Z. GitHub exposes copied job records with attempt 2 and new ids even for retained results; that is not evidence that delivery executed twice. Only runtime was requested for rerun by this task.

| Count | Before | After runtime-only retry |
|---|---:|---:|
| Successful shards | 6/8 | 7/8 |
| Failed shards | 2 | 1 (delivery) |
| Failed jobs including aggregate | 3 | 2 |
| Reported inventory | 96 checks | 96 checks (no edits) |
| Product/source/test/contract changes | 0 | 0 |

Publishing originally passed 11/12. After retry its containing runtime job and verification step are green; per-test retry counts were not downloaded and are not invented here. Delivery's carried result is still 7/8. Eight budgeted gh invocations were used; no further API read or rerun is necessary for the assigned runtime investigation.

**Exact next step:** sd assigns an independent bounded delivery triage of the Undo-button assertion using original job 131244441625, carried as 131259655150 in run attempt 2. Check prior retry evidence and retry only delivery once if that allowance is unused. If its test remains red, run only that named test on current main on the matching runner (or name the missing targeted execution facility). Never rerun the full workflow or dispatch a fresh Verify. Keep the candidate refused; ordinary guarded readmission is appropriate only once exact-head required checks become green. Relay the recovered runtime assertion to fv as a clock-sensitive test-flake investigation, with its single successful retry evidence; no FIX or code-writing verdict follows from this log.

Triage branch remains cloud/sd-lamp-release-1-11-13-ci-triage-1 at fbba42453ca699b059154131a86c5fcec6f2c45a, with no product commit or push and no PR. No clause status changed. No READY or PUSHED product claim is made. All full plan and actual non-secret result/receipt files in this packet are published through the evidence-only ref.

