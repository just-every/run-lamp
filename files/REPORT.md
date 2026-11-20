# Lamp HIST-006 test replay

Run Edit Run fleet · 2026-11-20T20:04:08Z

Product branch `cloud/sd-lamp-hist006-time-race-1-c1` points to `6c6eb9761ea048372bc0e692c161e9f03eac1733`.
It contains one ordinary cherry-pick of `83d90e1e19777f1b4407e28fac11772401c1da4c` on `173e93d259f968daffd0148365c2b9a26c62e3e6`.
The replay applied without conflicts and has the same tree and diff as the source commit. The only files changed are `tests/e2e/helpers/traffic-alerts-flow.mjs` and `sources.lock.json`.

No contract clause claimed; this is a test fix.
HIST-006 remains Partial. Full target counts are 65 Done, 124 Partial and 56 Missing across 245 clauses before and after. The touched test file retains five tests.

The replay validates the publication timestamp in each response and compares the rest of the public status JSON across two reads. This preserves the assertion that a traffic alert publishes no customer-facing content, even when a scheduled snapshot refresh advances the timestamp.

## Plan and results

1. Fetch the original branch and fresh main, then replay the sole non-merge commit. The candidate has zero merge commits. A fresh pre-push rebase retained the verified SHA. The author, committer and commit message passed the fleet audit.
2. Regenerate and check the contract views, then restore the tracked copies from main. The generator wrote zero documents. No view files appear in the candidate diff.
3. Run the nine build steps in the repository's declared order. All passed — `check:contract-docs`, `source:copies`, `source:check`, `typecheck`, `check:syntax`, `validate:release`, `verify:visual:source`, `build:app`, `build:site`. Typecheck is the fourth step. The build shard passed under the repository pin, Node 22.20.0.
4. Run `tests/e2e/update-reminders.test.mjs` five times in a single command using Node 22.20.0 and system Chromium. All 25 tests passed. In each repetition the two HIST-006 reads reported different publication timestamps and the content comparison passed.
5. Regenerate the source lock and check it. The regenerated lock matches the cherry-picked lock byte for byte.
6. Push the named product branch once. Exact-SHA Verify 44805539571 reported success. The source commit's Verify 44800109076 is historical context. The fleet lander owns the publication scan and landing.

[Candidate Verify 44805539571](https://github.com/just-every/run-lamp/actions/runs/44805539571)
