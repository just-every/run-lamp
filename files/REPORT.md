# Lamp v1.11.13 delivery exact-head CI triage

Tag: sd-lamp-release-1-11-13-delivery-triage-1
Repository: just-every/run-lamp
Candidate under investigation: 3da8bf2e469b229080489af89872f97fd23c76cf
Verify: https://github.com/just-every/run-lamp/actions/runs/43236095677
Run branch: cloud/sd-lamp-release-1-11-13-rebase-3da8bf2e469b229080489af89872f97fd23c76cf
Release task branch: cloud/sd-lamp-release-1-11-13
Role: bounded CI triage; no product writer, release or landing authority.

## Actual failed assertion

Attempt 1 delivery job 131244441625 failed in `Verify this product shard`. The shard maps to `test:channels`, whose command is `node --test --test-concurrency=1 tests/e2e/channels-and-presets.test.mjs`.

The failing registered test is:

> AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence

Registration: tests/e2e/channels-and-presets.test.mjs:482, helper call :491. Assertion: tests/e2e/helpers/automation-rules-browser-flow.mjs:175.

`strictEqual`: **the ended change is no longer offered for Undo**. Expected **0** matching Undo buttons; actual **1**. The preceding assertions accepted the success message and durable `undoneAt` and `undoneByOperatorId`. The delivery file completed 8 tests, 7 passing and 1 failing. The complete original failed-step archive was reused from the prior published packet rather than downloaded again; selected-file lengths and SHA-256 hashes were verified against its manifest.

## Retry accounting

The exact-head REST discovery initially returned only Verify 43236095677, completed/failure at attempt 2. Both attempt-specific jobs responses show that original delivery job 131244441625 and copied attempt-2 record 131259655150 share **the same** execution interval (2026-11-12T14:21:19Z through 14:28:39Z), runner id 1000314744 and runner name `GitHub Actions 1000314744`, on ubuntu-24.04. In contrast runtime's attempt-2 execution is new: job 131259653057 ran 14:46:07Z–14:51:22Z and passed.

The prior packet's request journal and receipt record exactly one retry POST, for runtime 131244441868, and explicitly no delivery rerun. These facts establish that delivery had executed once, not twice: the new attempt-2 job id is a retained result, not consumed delivery retry allowance.

This task issued exactly one POST, `repos/just-every/run-lamp/actions/jobs/131259655150/rerun`, for the latest delivery record. The actual request stamp and successful `{}` response are preserved in delivery-rerun-request.utc and delivery-rerun-response.json. The next permitted observation confirmed attempt 3 on unchanged candidate SHA 3da8bf2e469b229080489af89872f97fd23c76cf. Runtime and other successful shards were never requested for rerun; neither the whole workflow nor an aggregate job was requested. GitHub may automatically re-execute the downstream aggregate as a dependency of the job retry.

## Source-supported hypothesis and conditional main comparison

The UI awaits the undo POST, calls `runs.refresh()` and displays the success message immediately; refresh schedules an asynchronous read. The test waits for the message, confirms native persistence, then immediately counts the old Undo locator. A lag between the success message and list refresh is therefore plausible. No source or test was changed, and this is not proof of root cause, a product bug or an infrastructure outage. SOURCE-NOTES.md records the relevant source lines.

Observed main was 75da4a858c901d96d103648d78dfba38eeb650ab. Its test registration, automation browser flow, alert-rule UI, UI data hook, native test runtime, Verify workflow and verification plan are byte-identical to the candidate, as recorded in source-comparison.json. This is not a test result on main.

If the sole retry remains red, the next required test on current main, on the matching runner, is only:

```sh
node --test --test-concurrency=1 --test-name-pattern='^AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence$' tests/e2e/channels-and-presets.test.mjs
```

It requires current main's matching production build and pinned CI dependencies. Verify has no single-test input and a job rerun preserves the candidate SHA; other workflows perform releases, deployment, demo or site work. The original GitHub-hosted runner is disposable and ended. The shipped cloud helpers contain no targeted remote-run controller; heavy-slot only runs commands in this VM. If the comparison becomes required, the precise missing dependency is access to the fleet's existing targeted execution controller for the matching GitHub-hosted ubuntu-24.04 runner facility, able to run only this test on current main. No baseline/full suite or new Verify dispatch is authorized as a substitute.

## Product and evidence custody

The investigation branch cloud/sd-lamp-release-1-11-13-delivery-triage-1 was created from observed main at 75da4a858c901d96d103648d78dfba38eeb650ab solely for read-only inspection and evidence transport. It is not the candidate being judged. There are **zero** product/source/test/contract edits, product commits, product pushes or PRs. Clause status changes: none. The recorded verification inventory remains 86 registrations plus 10 assertion scripts, 96 checks. No local tests or full/baseline suite ran. No landing-record edits, readmission, admission, tags, releases or deployment occurred.

PLAN.md records the full bounded plan. api-calls.jsonl records the task's budgeted gh invocations; prior-triage-api-calls.jsonl belongs to the separate prior task and is not charged again. Status observations are separated by at least 300 seconds. Actual job/status responses and triage-receipt.json are preserved with the complete relevant non-secret packet. Environment preambles and credentials are excluded. Public evidence is published only to refs/heads/evidence/sd-lamp-release-1-11-13-delivery-triage-1. That transfer does not grant READY, acceptance or landing, and no product branch is pushed to create a new Verify.

## Final retry outcome

**Done: the single delivery retry passed and exact-head Verify is green.**

Verify **43236095677**, attempt **3**, completed **success** on **3da8bf2e469b229080489af89872f97fd23c76cf**, updated 2026-11-12T15:21:18Z. Delivery retry job **131276328840** ran from **2026-11-12T15:12:50Z** to **2026-11-12T15:21:07Z**, on runner **1000314947** (GitHub Actions 1000314947, ubuntu-24.04). Its product-verification and evidence-retention steps passed. Aggregate **131281652366** passed. All eleven attempt-3 job records are completed/success, including all eight product shards.

Runtime's attempt-3 record **131276331800** retains the already-green attempt-2 runtime interval 14:46:07Z–14:51:22Z; runtime was not executed again. Delivery's new timestamps and runner identity confirm its first actual retry, rather than a copied result. Its sole allowance is now consumed, one of one. No further retry is authorized from this brief.

| Count | Before delivery retry | After delivery retry |
|---|---:|---:|
| Successful product shards | 7/8 | 8/8 |
| Failed product shards | 1 | 0 |
| Failed jobs including aggregate | 2 | 0 |
| Verification inventory | 96 | 96 |
| Product/source/test/contract changes | 0 | 0 |
| Clause status changes | 0 | 0 |

The original delivery result was 7/8. The retry job and its product-verification step are green; successful per-test logs were not downloaded, so no separate per-test retry count is invented. Seven budgeted gh invocations were used. The final status observation was 301 seconds after the previous one. There were no failed-job archive downloads in this task; the original failed-step output was reused from verified prior evidence. No main test was required because the retry passed.

Classification: **intermittent browser-count assertion recovered on unchanged exact head**. A success-message/list-refresh ordering sensitivity is plausible; an infrastructure outage, introduced product defect or failure on main is not proven. This evidence does not support a FIX verdict or weakening the test.

**Exact next action:** sd may resume ordinary guarded release review using the green exact-head run. Any independent product, account, release and landing gates still apply; this investigation changes no admission or landing record and creates no release. fv receives the recovered intermittent Undo-list assertion as a narrow test-observation follow-up. The investigation branch remains unchanged and unpushed at 75da4a858c901d96d103648d78dfba38eeb650ab, with no PR and no product READY/PUSHED claim. Only the separate evidence ref is published. The disposable clone is deleted after successful evidence transfer and verification; the full local packet and receipt are retained outside it.
