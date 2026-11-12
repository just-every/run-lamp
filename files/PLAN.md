# Bounded delivery CI triage plan

Tag: sd-lamp-release-1-11-13-delivery-triage-1
Repository: just-every/run-lamp
Exact candidate: 3da8bf2e469b229080489af89872f97fd23c76cf
Workflow: Verify 43236095677
Role: read-only CI investigation; no product writer or release authority.

1. Configure fleet identity, refresh the launcher and install the supplied Git/evidence transport. Clone only the declared repository, shallow with blob filtering. Create the named investigation branch from main. Read the repository instructions and the inline fleet rules. Keep all reports outside the product checkout.
2. Discover runs on the exact candidate SHA using REST. Inspect jobs from attempts 1 and 2 and the prior published evidence packet, verifying the selected files against its manifest. Determine actual delivery executions from timestamps and runner identity, not renamed/copied job IDs.
3. Preserve the original failed assertion and its test location. If the sole delivery retry is unused, request only the delivery job once, never the whole workflow or successful runtime shard. Record the POST and actual response.
4. Observe only this existing run, with one observer, at least 300 seconds between run-status calls and at most ten budgeted gh invocations. Require completed/success on the exact candidate SHA. Record all attempts/jobs observed. Read a failed job archive once per failed job only if the retry remains red.
5. If delivery remains red after its sole retry, run only its failing registered test on current main on the same runner using existing facilities. If that cannot run here, name the exact missing execution dependency as REMOTE-NEEDS-LOCAL. Source equality alone never counts as main reproduction. Do not introduce a workflow or run a baseline/full suite.
6. Report the assertion, execution history, retry allowance, before/after counts, outcome and next action. Preserve product provenance, with zero source/test/contract edits or product commits/pushes. Do not modify admission, landing, tags, releases or production.
7. Explicitly select actual non-secret report and receipt files. Publish only the report-only evidence ref, verify the returned tree/manifest/hashes, then delete the disposable clone. Relay sd always, and fv for proven/recovered intermittent or infrastructure failures, via terminal POST lines.

Cloud adaptation: REST observation replaces ci-wait.sh; the cloud preamble grants a ten-gh-invocation budget and evidence-only publication despite the historical brief's no-API/no-push wording. No persistent watcher is created. No new Verify is dispatched. Evidence publication grants no product READY, acceptance or landing.
