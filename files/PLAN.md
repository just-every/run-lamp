# Carry plan

1. Clone the declared repository with full history and partial blobs, install fleet identities and hooks, and branch from current origin/main.
2. Fetch the fix1 candidate. Apply exactly the net diff bef5115afc3972d78962fbb899a2a32433f5f3a6..8bc4c80dfa69b4371c2d913f87227570df2007ed with git apply --3way, never replaying its merge history.
3. Preserve current v1.11.16 release metadata and migrations 0079/0080. Append only the pending 0081 entry. Retain main's newer setup migration expectations. Keep CONTRACT.md and generated views unchanged. Regenerate source lock last.
4. Establish a complete file-by-file carry proof against the candidate and main. Run candidate selection, history, archive/retention, reminders and backup tests; typecheck; contract-docs, source, release and migration-ledger checks; full verifier as required by repository instructions. Capture changed public history screens at 1440 and 390 using candidate tests.
5. Make one ordinary commit with fleet identity, inspect every candidate author/committer/trailer, push only the named cloud branch through cloud-push.py. Open a PR for the lane in accordance with AGENTS.md.
6. Observe exact-SHA Verify via REST within the ten-call budget with no poll under 300 seconds. Preserve actual non-secret logs, receipts, screenshots and this plan in the packet. Publish the explicitly selected evidence packet to the separate evidence ref. Report product and evidence custody independently and leave landing/migration gate to the fleet.

The cloud adaptation governs CI and READY custody where the historical assignment asks to skip waiting. No new tests, clause judgments, version bump or changelog section will be introduced. R3 diagnostic-only re-score and held-out migration gate remain independent fleet work.
