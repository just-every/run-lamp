# Lamp picomatch patch

The branch `cloud/gr-lamp-picomatch-1` has one product commit, `cb7779bb1e2556de27fc7e6e21bbdcb0ec1bec11`, based on Lamp main `177378a989a7496a2e3dc00ac9a43947efd7c031`. Product push status is pushed on attempt 1. No pull request was opened.

## Plan and results

1. Read Lamp's authoring and testing rules, fetched main, and inventoried the existing lockfile. The five resolved dependency paths were already on `4.0.7`.
2. Read the Uptime commit and copied its byte-identical picomatch patch. The referenced product SHA was available. The referenced task's evidence ref was absent and the report endpoint returned HTTP 404. The assignment supplies Uptime Verify run 44249239504.
3. Registered the patch with pnpm, regenerated the pnpm lockfile and regenerated Lamp's source lock. The patched resolution count went from 0 of 5 to 5 of 5. Both the fdir peer binding and its tinyglobby reference carry the shared hash. There is one patched picomatch snapshot and no other resolved version.
4. Ran the frozen install, setup, production build, TypeScript check, source-lock and contract document checks, and focused installed glob tests. Each of the five consumers loaded the same patched parser. Repeated the frozen install, glob tests, source-lock check and contract document check from a separate full-history clone of the pushed SHA. Check details and local verifier status are in `CHECKS.json`.
5. Checked candidate identity and trailers and used the fleet product push guard. Checked the exact candidate's publication-scan and Verify status. Prepared the non-secret packet for the separate evidence ref.

Uptime source commit [4e76f8a0841a4224b5c7eaa57419a85b82d0905a](https://github.com/just-every/run-uptime/commit/4e76f8a0841a4224b5c7eaa57419a85b82d0905a).

| Dependency owner | Before | After |
| --- | --- | --- |
| @tanstack/start-plugin-core | 4.0.7 | 4.0.7 patched |
| fdir | 4.0.7 | 4.0.7 patched |
| tinyglobby | 4.0.7 | 4.0.7 patched |
| unplugin | 4.0.7 | 4.0.7 patched |
| vite | 4.0.7 | 4.0.7 patched |

The patch SHA-256 is `35fffafb79237d89b70c8e8cff0df4f4b156c76868f839e89accecdecc4da33b`.

## Contract and acceptance

Clause changes and CLAIM are both none. The full target stays at 60 done, 129 partial and 55 missing out of 244. The four changed files are `package.json`, `patches/picomatch@4.0.7.patch`, `pnpm-lock.yaml` and `sources.lock.json`.

## Publication and verification

- Publication scan. The single attempt used a fresh full-history clone of the pushed SHA and exited 127 because the VM lacks the fleet scanner. No COMPLETE report was produced. The exact argument vector and error are in publication-scan.log.
- Exact-SHA GitHub Verify. Verify run 44253753115 completed with failure at the candidate SHA. Runtime job 134630825838 failed the DOCS-001 PAGE-020 assertion in tests/e2e/start-runtime.test.mjs:148. The published contract/intake-details page omitted the Original daily-use status notes heading. The build and seven other product shards passed. The final required job 134638577884 also failed because the runtime shard failed.
- Full local verifier. The fresh candidate clone passed both commands in the local runtime shard using system Chromium. The failing docs assertion passed locally on both the candidate and a freshly built origin/main control. Both built Worker assets contain the heading. The documentation, renderer and test sources are byte-identical between main and the candidate. The additional full local rer verify completed build, ownership and portability before being stopped after the targeted runtime shard passed. No exact-SHA GitHub success was observed.
