# Lamp 1.11.17 metadata preparation

Author: Run Edit Run fleet. Date: 2026-11-15 (UTC).

1. Confirm the current main SHA has completed successful Verify and Run site runs and that v1.11.17 is absent. Record the tagged v1.11.16 commit and immutable metadata.
2. Compare v1.11.16 with main. Use the brief's explicit updated boundary: only 0081 is new; keep 0079, 0080 and SETUP-002 in the exact v1.11.16 history. Check clause meaning against the tagged contract.
3. Bump package.json, seed.json and the existing accessibility report version reference. Retain the published rer pin and frozen dependency lock. Add exact v1.11.16 release and contract history files required by the release validator. Prepend owner-facing changelog notes from the actual diff and match RELEASE.json notes, migration buyer steps and update instructions. README/install are already evergreen.
4. Fetch and rebase main before the first candidate push. Resolve only release metadata within the brief's scope. Keep product, tests, contract judgments and generated views unchanged.
5. Run the affected release validator, contract-document check and TypeScript typecheck. Regenerate sources.lock.json last using the documented authoring command and run its check. Do not run the full local suite or browser proof for metadata.
6. Commit with fleet identity and active cleanup hooks. Inspect all candidate author/committer identities, messages and trailers, then push the named cloud branch through cloud-push.py at the first real commit. Open a contribution PR as required by AGENTS.md; leave landing to the fleet.
7. Discover and watch exact-SHA Verify through REST with one watcher, no more than one call per 300 seconds for a run, and a ten-call GitHub budget. Record its exact result. Publish actual non-secret reports and receipts only to the separate evidence ref; verify custody and remove the successful scratch clone/dependencies.

The stale two-migration paragraph in the historical brief is superseded by the explicit 1.11.16 tagged boundary at the top of the assignment. No clause status changes or release/tag publication are authorized in this round.
