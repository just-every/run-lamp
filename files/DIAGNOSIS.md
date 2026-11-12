# Actual HIST-001 failure and logo-warning attribution

The refused Verify run is 43270958170, composer job 131367787538, at product head d251b52a5f987cfa19cee75c5c7991e8e6bb5437. Its actual failed-job archive was read once using:

```sh
gh run view 43270958170 --repo just-every/run-lamp --job 131367787538 --log-failed
```

The full actual output is retained in `refused-verify-composer.log`. Relevant evidence:

- At 2026-11-12T17:42:37Z, the configured-logo warning appears while PAGE-005 runs. PAGE-005 then reports `ok 2` at 17:42:37.783Z.
- `tests/e2e/helpers/snapshot-release-rebuild-flow.mjs:98` deliberately writes `branding/missing` to the configured logo key, calls health on a new release, checks the failed build remains pending and health remains healthy, clears the logo setting and checks recovery. Its assertions at lines 174–180 require this failed-build/recovery behavior.
- UPTIME-003 reports `ok 3` at 17:42:42.215Z.
- At 17:42:42.688Z, workerd reports a fatal bind failure on `127.0.0.1:38971`.
- HIST-001 then reports `not ok 4`, duration 488.610724ms, with `MiniflareCoreError [ERR_ADDRESS_IN_USE]` and the explicit message `Address already in use (127.0.0.1:38971)`. The stack reaches `openFollowUpsRuntime` while obtaining the D1 binding, before the journey can run.

The archived log therefore does not establish a missing-logo defect in HIST-001. It establishes a Worker startup port collision. The process occupying that address is not identified by the archive; no stronger root-cause claim is made.

The exact isolated HIST-001 test passes on both current main (7bfb459185882497098b4fed00155f248874ce81) and the refused merge, including with CI's Node 22.20.0. On the refused merge, running HIST-008, PAGE-005, UPTIME-003 and HIST-001 in their CI order also passes all four tests and emits the same expected configured-logo warning inside PAGE-005. An initial ordered local run lacked the Chromium executable override and failed two browser launches; that actual failed receipt is retained alongside the successful configured rerun. It did not fail HIST-001.

The snapshot service, release-rebuild fixture, native-history fixture, follow-ups runtime and shared Worker startup helper are identical between the refused merge and current main. No candidate-specific logo/object-storage change was found in the supplied merge. The candidate-only diff consists of the f131 attribution assertions/helper and their source-lock entries.

The chosen completion is a clean merge of current main into the supplied candidate on the named branch, preserving the published f131 history, followed by touched checks and fresh exact-SHA Verify. No logo fallback, mock, fixture weakening, contract judgment, claim, hold, homepage or migration change is introduced to address a warning that the existing test intentionally exercises. Product readiness remains dependent on the new exact-SHA workflow result.
