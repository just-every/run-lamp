# Lamp 1.11.25 release metadata handoff

Run Edit Run fleet, 2026-11-21 UTC

- Task and branch `cloud/sd-lamp-release-1-11-25-c2`
- Repository `just-every/run-lamp`
- Source commit `19261bd230d989d6e890c47910fd40c45e5b4ce3`
- Fresh main base `ed7eff2049b04804047a8c26b9aadcb09ba22922`
- Product commit `e9af527b7301c73aabdd47e3367f6a1d2378d3a5`, advertised on the named branch at 2026-11-21T02:20:45Z
- Prior candidate Verify 44852065021 failed in composer job 136685822345 on the THEME-001 branded themes and layouts journey. Gate job 136689641017 propagated the failure. The prior base Verify 44846800586 passed.

## Carry plan and result

1. Clone Lamp shallow and blobless. Fetch fresh main, c1 and `v1.11.24`. Deepen to establish the common ancestor and confirm that c1 carries exactly one metadata commit outside main.
2. Replay that commit onto fresh main as one linear commit. Review the diff from `v1.11.24` and the delta past `d442dbb5`. The latter adds a test for existing reviewed CSV component behavior and updates the source lock. The existing notes still cover the user-visible Sorry dry-run change and the rer tool update, so the changelog and release notes carry forward verbatim.
3. Check contract generation and restore the views from main. Regenerate the source lock last, keeping the updated hash for the reviewed CSV test. Confirm that the only differences from the original c1 tree are the inherited test and its lock entry.
4. Run the release validator, typecheck, lock check, contract generator and its check, exact changelog parity, tagged snapshot byte comparisons and the project-declared setup hash check. Confirm the candidate is a single linear commit. The attached local receipt records the exact commit and command results.
5. Fetch main immediately before the unpublished rebase and verify the head still matches the local receipt. Audit the full candidate range for fleet identities and trailers. Push once through the fleet guard. The Mac lander owns the full Base publication scan and landing.
6. Observe GitHub Verify for the exact product commit. If the single known composer browser failure recurs, inspect the failed job logs and rerun the failed jobs once. Return the report and check receipts via the evidence ref.

## Scope and checks

The carrier changes eight files covering version metadata, changelog, the VPAT version, the two immutable release-history snapshots and the source lock. The snapshots match the tagged release and contract byte-for-byte. The release validator accepted 1.11.25, typecheck passed on Node 22.20.0 and pnpm 10.12.4, the source lock reported success, and both generated contract commands passed. The changelog section exactly matches the public release notes. The declared setup hash matches the on-disk file.

No contract clause claimed; this is release metadata.

| Tier | Before/after done | Before/after partial | Before/after missing | Before/after total |
| --- | ---: | ---: | ---: | ---: |
| Core | 65 | 124 | 51 | 240 |
| Agent surface | 0 | 0 | 5 | 5 |
| Later | 0 | 0 | 0 | 0 |
| Full target | 65 | 124 | 56 | 245 |

## CI

GitHub Verify 44855375637 completed successfully for product commit `e9af527b7301c73aabdd47e3367f6a1d2378d3a5` on the first attempt. Success was observed at 2026-11-21T02:37:21Z. The candidate has no remaining builder blocker.

[Exact-SHA Verify](https://github.com/just-every/run-lamp/actions/runs/44855375637)
