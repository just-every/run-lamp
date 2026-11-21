# Lamp SUB-016 carrier

Fleet tag `sd-lamp-c-f189-c1` · Codex · 2026-11-21 UTC

## Plan and scope

1. Fetch the feeder and fresh Lamp main. Deepen the blobless clone only enough to identify the common ancestor and the feeder's unpublished-on-main commits.
2. Replay the single feeder change onto main, preserve the current contract judgments and generated documents, and regenerate the source lock.
3. Run the affected channels integration suite and typecheck. Compare the proof bytes with the feeder, then publish the candidate branch once.
4. Check push Verify on the exact carrier SHA. The brief authorizes one failed-job rerun only for the feeder's known mail route teardown race. Return the report and check receipt on the separate evidence ref for the lane.

## Results

The carrier starts at fresh main `33ba19fdf501e4af972ebd8d633f0d48f56e136a` and replays feeder `5a0f235ae252c0d597300eb4569684de919749dc` as a single linear commit `429823ba1e3094719a8646182465f060bafb8c40`. The proof helper is byte-identical to the feeder. The other changed file is the source lock, whose diff from fresh main updates only that helper's hash.

The proof opens the Slack and Teams token management pages in signed-out browser contexts immediately after consent, using synthetic provider edges. Both channels initially select incidents and maintenance and leave component status changes unchecked. It runs inside the existing private-channels journey at width 1440. The carrier changes test code only. The feeder recorded desktop and phone captures of these same UI states.

| Measurement | Main | Carrier |
| --- | ---: | ---: |
| DONE clauses | 66 | 66 |
| PARTIAL clauses | 123 | 123 |
| MISSING clauses | 56 | 56 |
| Total clauses | 245 | 245 |
| Channels test registrations | 8 | 8 |

SUB-016 remains PARTIAL. CONTRACT.md, its generated views and the mail suite match main byte-for-byte. The contract generator wrote zero documents and its check passed. Source lock regeneration and validation passed.

The feeder's Verify 44900105475 attempt 1 failed in imports with the existing mail teardown race. The lane recorded a successful attempt 2. The carrier's exact-SHA result is in the accompanying receipt. The full Base publication scan and main landing are handled by the fleet lander.

CLAIM SUB-016 PARTIAL points=3 tests=tests/e2e/channels-and-presets.test.mjs#INTEG-002 SUB-014 SUB-015 NOTIFY-011 NOTIFY-012 UPDATE-013 — Private channels deliver the selected publication once with literal text and punctuated links
GAP SUB-016: The balance of acceptance 3 and acceptances 1–2 and 4–6 remain held, including complete channel and audience preferences, single-incident scope, impact filtering, and SMS component and maintenance-only delivery proof.

## Carrier checks and Verify

The affected channels suite passed all eight tests with pinned Node and system Chromium, and typecheck passed. The first local test attempt lacked Playwright's default Chromium. A task-local browser path supplied the system binary to the existing helpers, and the complete rerun passed. The changed journey and typecheck passed before the single guarded product push. The full suite finished afterward.

GitHub Verify [44906309475](https://github.com/just-every/run-lamp/actions/runs/44906309475) completed successfully on the exact carrier SHA on attempt 1. The REST observation was recorded at 2026-11-21T13:11:18Z. The carrier required no rerun, dispatch or pull request for its branch Verify.
