# Bounded CI triage plan

1. Inspect exact-SHA Verify metadata and all job attempts for run 43236095677 on 3da8bf2e469b229080489af89872f97fd23c76cf.
2. Read the complete failed runtime step once through gh run view --job --log-failed; extract assertion, expected/actual, test and job. Inspect any independently failed shard for accurate release-blocker reporting.
3. If no prior retry exists, request only runtime job 131244441868 once through the job rerun endpoint. Do not dispatch or rerun Verify as a whole.
4. Observe the existing run through REST at intervals of at least 300 seconds. Use one observer and a ten-invocation GitHub budget, counting each failed-job archive command once as directed.
5. If HIST-006 remains red, reproduce only that named test on current main using a matching existing CI runner facility. If no such facility exists, document the exact missing facility and relay REMOTE-NEEDS-LOCAL; do not substitute a full workflow, baseline or mismatched local run.
6. Classify evidence with appropriate limits, state the narrow next action, preserve actual reports and receipts, and publish only the evidence ref. Make no product commits, source/test/contract/status changes, release/tag, admission or landing-record writes.
