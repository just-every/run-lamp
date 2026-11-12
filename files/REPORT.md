# sd-lamp-c-f131-hist001-fix-1

Repository: just-every/run-lamp
Product branch: cloud/sd-lamp-c-f131-hist001-fix-1
Refused product SHA: d251b52a5f987cfa19cee75c5c7991e8e6bb5437
Current main used for the merge: 7bfb459185882497098b4fed00155f248874ce81
Combined source tree under local verification: 4d3b5310cb16aeaf003f208d799dbfd5af56a4f9

## Finding

The archived failure is a Worker startup port collision, not a HIST-001 configured-logo failure. Verify 43270958170, composer job 131367787538, reports `MiniflareCoreError [ERR_ADDRESS_IN_USE]` for `127.0.0.1:38971` when starting HIST-001. The preceding missing-logo warning is deliberately injected by the passing PAGE-005 release-rebuild journey. `DIAGNOSIS.md` identifies the actual log sequence and the fixture assertions; the complete failed-job archive is retained in `refused-verify-composer.log`.

The requested exact isolated test passes on both main and the refused candidate, including under Node 22.20.0. The refused candidate also passes the four-test CI prelude in order with the expected logo warning. The archive does not identify the process that occupied the port; no unsupported claim is made about it. No candidate-specific logo/object-storage regression was reproduced.

## Work and preservation

Followed the setup and reproduction plan in `PLAN.md`. Merged current main into the supplied refused candidate on the named branch without rewriting any published history. The merge was clean. Every f131 test/helper file is byte-for-byte identical to the refused candidate. All 389 contract table rows from each parent are preserved, including the same clause judgments, gaps, evidence and holds. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and the Verify workflow are unchanged from both inputs. No homepage, migration or logo handling change is introduced. The fresh candidate provides new exact-SHA verification of the preserved work after the observed infrastructure failure.

Ran the documented contract generator and check, restored both generated views whole from origin/main, regenerated sources.lock.json last and checked it. `merge-integrity.json` records protected-file equality, parent row checks, the preserved f131 files and the exact staged tree. Product changes contain only the merged product/tests and their source lock; all fleet reports stay outside the product checkout and use the separate evidence ref.

## Local results

| Control | Result |
| --- | --- |
| Main exact HIST-001, initial runtime | 1 pass, 0 failures |
| Refused candidate exact HIST-001, initial runtime | 1 pass, 0 failures |
| Refused candidate exact HIST-001, pinned Node 22.20.0 | 1 pass, 0 failures |
| Refused candidate ordered HIST-008 / PAGE-005 / UPTIME-003 / HIST-001, configured Chromium | 4 passes, 0 failures; expected missing-logo warning |
| Main exact HIST-001, pinned Node 22.20.0 | 1 pass, 0 failures |
| Combined tree exact HIST-001, pinned Node 22.20.0 | 1 pass, 0 failures |
| Contract write and check | Passed |
| Source lock and source check | Passed |
| Source-copy integrity | Passed |
| Typecheck | Passed |
| Syntax check | Passed |
| Release validation | Passed |
| Visual-source validation | Passed |
| f131 touched native journeys | 4 passes, 0 failures, including subscriber, public catalogue/uptime, incident and maintenance attribution |

The first two diagnostic isolated runs used the VM Node 24.19.0. They were corroborated with the CI pin, Node 22.20.0. The initial local ordered prelude lacked `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and had two browser-launch failures because Playwright's downloaded browser was absent. HIST-001 itself passed. That failed run is retained as `candidate-ci-prelude.log` and `.json`; the configured rerun uses `/usr/bin/chromium` and passes. No assertion or product code was changed to resolve that environment configuration issue.

Checks performed while the merge was staged record parent HEAD d251b52a and `tested_index_tree=4d3b5310cb16aeaf003f208d799dbfd5af56a4f9`. Final provenance will bind that tree to the new merge commit. Existing native-history browser proof at 1440 and 390 is included with hashes in `browser-proof.json`.

## Counts and clause status

Before → after: 244 status rows → 244, done 60 → 60, partial 129 → 129, missing 55 → 55. HIST-001 remains done. TEAM-003/f131 claims and holds remain unchanged. No clause is promoted, demoted or edited. The original CI public command was 6 passed / 1 failed; its only failed test was HIST-001 during startup. Local isolated HIST-001 is 1 passed / 0 failed on main, the refused candidate and the combined tree, without a logo repair.

## Publication and final outcome

Product head `d23151fb5275aebc3365a4fd9b6110767bac55df` is pushed successfully on the named branch, with tree `4d3b5310cb16aeaf003f208d799dbfd5af56a4f9` exactly matching all merged-tree test receipts. The merge has the refused candidate and current main as its two parents. The working tree is clean. All four candidate commits (including the three preserved published ancestors) passed the author/committer/trailer audit; the new merge uses the fleet identity and has no trailers. The push guard succeeded on its first attempt. Exact-SHA push Verify [43280012619](https://github.com/just-every/run-lamp/actions/runs/43280012619) completed successfully on `d23151fb5275aebc3365a4fd9b6110767bac55df`. PR [346](https://github.com/just-every/run-lamp/pull/346) is open against main at that same SHA. No additional workflow rerun was requested. Evidence publication is report transport only and is not acceptance, product readiness or landing. The cloud cannot run the Mac publication scan, and no landing or record edit is attempted.

Final outcome: READY. No blockers. Six of ten GitHub calls were used: one original failed-job archive read, one exact-SHA discovery, three status polls, and one PR creation. The environment transition stopped the original watcher; its defunct state was confirmed and the same run was resumed without rediscovery and after the five-minute interval. `exact-sha-ci.json`, `github-budget.json`, `pr.json` and `final-receipt.json` retain the actual observations.

The product checkout remained clean and at the tested SHA after the push and PR creation. The disposable clone will be removed after successful report transport, as requested. The evidence ref contains only this explicitly selected non-secret report packet; evidence custody is returned independently in the terminal message.
