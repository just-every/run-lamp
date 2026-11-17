# Lamp incident continuation

Author: Run Edit Run fleet. Date: 2026-11-17 UTC.

Product branch: `cloud/sd-lamp-incident-1-pc1`.
Product head: `9f870400c181298626416cbdf2e39f56f5760daf`.
Preserved published starting head: `92aa684cf150afdc9472a238fb08ed5cfdfb61de`.
Repository: `just-every/run-lamp`. No PR created. No default branch, release metadata, tool pin or contract status changes.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

## Result

The saved implementation already provides the three requested owner journeys: it warns when a manual component degradation survives resolution and offers Automatic; previews the customer's complete branded email with local-delivery disclosure and explained incident impact; and exposes Correct on published updates while retaining and linking the original publication. The continuation fixes their failed verification path without changing those product decisions.

Verify 44093747254 failed the composer phone journey at the sandboxed email preview's accessibility scan. The normal Axe Playwright runner stalled while recursively trying to communicate with the script-disabled email frame. The phone test timed out after 600 seconds; subsequent tests shared its still-pending browser journey. The focused owner journey succeeds independently on the preserved starting head.

The new helper inspects the containing page, including the iframe's accessible label, through Axe's supported legacy entrypoint with nested-frame execution disabled. It separately inspects the exact customer document from the preview at that frame's actual width. Both inspections use the same WCAG tags and the same serious/critical violation assertion. The product's email sandbox and every existing user-visible flow assertion remain intact. No timeout increase, skip, registration removal, workflow edit or copy pin test was added. A separate negative diagnostic confirms that this helper still detects a critical missing alternative-text violation inside the email and a serious missing-name violation on the containing iframe; see `accessibility-preservation.log` and its probe script.

## Checks and browser evidence

- Typecheck passed.
- Focused phone publication/resolution/maintenance smoke and owner incident communication journey passed together: 2 passed, 0 failed, 0 skipped. See `focused-after.log`.
- The phone journey now passes all ten screens, including the email preview, required private recovery override, resolution and maintenance scheduling. See `phone-after/`.
- The focused owner journey proves manual degradation is retained and announced truthfully, resolution email rendering, correction draft persistence across reload, append-only retained original wording, public correction links and switching the manual status to Automatic. Its changed screens are captured at 1440 and 390 in `after/`.
- Production build passed on the exact candidate SHA. See `build.log`. Production Worker browser proof also passed on that SHA. All seven incident states are captured at 1440 and 390 in `built/`, including the customer email, manual-resolution warning, original timeline and linked public correction. The final email accessibility inspection found no serious or critical violations. See `built-proof.log`.
- The source lock was regenerated last and its check passed. See `lock-write.log` and `lock-check.log`.
- Every candidate commit's author, committer and trailers passed inspection, including the preserved starting commit. See `identity-check.log`. The product push succeeded on its first guard attempt. See `push.log`.
- Before/after test inventory is unchanged: 103 registered cases plus 10 assertion scripts = 113 checks; 35 routine files and 8 shards. This continuation adds no test registration. Relative to main before the original round, that round added one owner journey (102 to 103 registrations).

Baseline evidence is honest about its limits: `focused-baseline.log` is one passing owner test on the saved head; `phone-baseline-interrupted.log` stops at the reproduced email accessibility hang and is not a completed test result. `before/` records the saved implementation, rather than pretending to reconstruct the pre-original-round product. `DIAGNOSIS.md` contains the minimal-frame probe findings. The original failed CI log is retained in `prior-composer.log`.

## CI and custody

Exact candidate Verify: https://github.com/just-every/run-lamp/actions/runs/44111436347 . The watcher binds every observation to the full product SHA, uses one request at most every 300 seconds, and retains its actual observations in `ci-receipt.json` and `ci-watch.log`. The earlier failed run is 44093747254. Terminal result: completed/success on the exact full candidate SHA at 2026-11-17T15:36:53Z. This run used 8 of the 10 permitted GitHub calls (2 for the prior failure investigation, 6 for exact-SHA discovery and status observations). No required workflow failed on the final candidate, and there is no product blocker.

Product push, exact-SHA Verify, report-only evidence transport and fleet landing are separate. Evidence contains only explicitly selected public reports and synthetic local browser proof. The fleet retains responsibility for its publication scan and landing gates. No inbox file was read or written, and no self-submission or main push was performed.

## Plan and scope

The complete executed plan is in `PLAN.md`; diagnostic detail is in `DIAGNOSIS.md`; machine-readable custody and check results are in `RECEIPT.json`. The continuation preserves published history and confines its new product-branch commit to the focused test helper, its call site and the regenerated source lock. The original round's short incident documentation paragraph remains preserved. No clause status changed.

Out-of-scope observation: the push response reports 12 existing default-branch Dependabot alerts (10 moderate and 2 low). They were not investigated or changed in this incident round.

The first production-proof harness attempt used an app-only Wrangler upstream, so its public-host reads could not reach the status surface. The final harness follows the repository runtime fixture pattern with app and public listeners sharing the same production artifact and isolated state; the full journey then passed. The first attempt log is retained rather than presented as a product failure or a passing proof.

Terminal product custody: pushed candidate `9f870400c181298626416cbdf2e39f56f5760daf`, exact-SHA Verify `44111436347` successful. The prior failed `44093747254` is superseded by this successful continuation. No contract status changes or clause claims. Final evidence transfer uses the separate report-only ref; publication and landing remain the fleet’s independent gates.

Completed by Run Edit Run fleet, 2026-11-17 UTC.
