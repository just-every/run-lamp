# Lamp incident publishing repair — sd-lamp-incident-1-c2

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-incident-1-c2.
Parent: 92aa684cf150afdc9472a238fb08ed5cfdfb61de (the supplied round-one candidate, PR #407).
Product head: f4e68ea69aae8caa6f50476c0ad4be1c6a952fd9.

## Decision and root cause

Case (b): this was a product defect with no unanswered manual-status prompt; the owner helper is unchanged.

The failed composer job was read first: Verify 44093747254, job 134090900643. The unchanged owner case passed by itself. Running the two affected cases together reproduced both failures: the phone journey stalled in accessibility inspection immediately after opening the email preview, timed out, then its pending task resumed against the next test's shared page. Its stale Publish locator consumed the owner's resolution. The owner's own click then waited on the cleared draft's disabled button, whose explanation was “Describe what’s happening before publishing.” This was not a required new owner answer. The manual-status warning never participates in publishBlockReason.

The email preview's new sandbox="allow-same-origin" disabled iframe script callbacks, so Axe's in-frame asynchronous inspection could not finish. A minimal isolated reproduction confirms this. During the original phone stall the actual Publish button was enabled and Draft saved was visible. See diagnosis.md, before-live-state.json, before-pair.log and iframe-diagnostic.log.

## Product and regression changes

The email iframe now permits callbacks in an opaque origin, using sandbox="allow-scripts" without allow-same-origin. Its small trusted sizing script reports the measured content height. The operator page validates the sender against that exact iframe window and checks the height's type, finiteness and bound. The preview cannot read the authenticated parent document. Customer wording remains the shared branded email document.

The original incident-owner-journey.mjs is byte-for-byte unchanged. The owner test is now named “Owner incident communication — manual resolution, customer email, timeline correction and isolated preview”. It retains the existing manual-degradation truth, customer email, immutable original publication and correction-link checks, and adds a real Axe inspection, parent-document isolation, refusal of unrelated sizing messages, and a successful further correction publication that preserves its target.

The repair commit changes only the incident preview, its leased owner test case, and the regenerated source lock. No contract clause, generated acceptance/claim view, version, release metadata, tag, or rer pin changes.

## Plan and execution

1. Installed the launcher, fleet Git identity, bundle-reading credential helper, commit hooks, push guard and evidence entrypoint outside the product repository. Read launcher and repository guidance and the relevant requirements.
2. Cloned only the declared repository, confirmed the exact supplied parent, and created the named candidate branch. Kept the branch linear; no merge of main. Main advanced to a6df8fc6b186b28e1f9ac142f79c0081abdfdb8c during verification, so the unpublished feature was rebased to 8bd8c8df7dcde45f3321f66355623806e1e4ff18 before the repair commit. The application and e2e source bytes were unchanged by that unrelated removal-tooling update; see rebase-receipt.json.
3. Read the failed composer log, ran the unchanged owner case and paired cases, inspected their actual rendered state and traced the failure to the preview sandbox before editing product code.
4. Fixed the iframe callback/isolation behavior and extended only the owner test that uses the existing helper; retained every customer-truth assertion.
5. Ran the failing pair after the change, publishing and incident API tests, typecheck, and the repository build/composer verification paths. Captured the incident journey at 1440 and 390. Inspected the actual images; final opaque-frame proof paints the entire document before capture so below-fold frame content appears in the exported phone screenshot.
6. Regenerated sources.lock.json after source edits and checked it. Checked contract generation without modifying CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md.
7. Committed with explicit fleet author/committer environment and active hooks, audited all candidate identities/messages/trailers and pushed only the named product branch through cloud-push.py.
8. Followed exact-SHA Verify through the declared REST protocol within the ten-call GitHub budget. Published explicitly selected non-secret reports, actual receipts and browser proof only on the separate evidence ref. Product readiness and evidence custody remain separate.

## Local results

- Before pair: 2 selected cases, 0 passed, 1 failed, 1 cancelled by timeout. The owner case alone passed.
- After pair: 2 selected cases, 2 passed, 0 failed, 0 cancelled.
- Publishing/incident API suite: 15 passed, 0 failed.
- Typecheck: passed on pinned Node 22.20.0 and pnpm 10.12.4.
- Contract document check: current, 0 errors and 0 warnings.
- Build verification (`LAMP_VERIFY_SHARD=build npx -y @runeditrun/rer verify`): passed, including source-copy and lock integrity, typecheck, syntax, release validation, visual-source checks, production app/site builds, hosted output, hydration, and statement-size checks.
- Final extended owner case, with proof enabled: 1 passed, 0 failed after correcting capture synchronization.
- Broad local composer run: 9 passed, 1 theme-budget assertion failed, and the earlier proof capture timed out. The capture is fixed and its final case passed; the existing full-Chromium theme budget assertion is retained and reported below.
- Public verification: 8 passed, 0 failed. The overall broad command exits 1 because it retains the earlier theme failure and superseded proof-capture timeout; no green overall local result is claimed.

The first exploratory API run had 14 passes and one environment failure because its browser executable override was omitted. The corrected run used /usr/bin/chromium with --no-sandbox and passed all 15; both actual logs are retained. This was not a product assertion failure.

## Counts and clause status

Counts are unchanged: Core 60 done / 129 partial / 50 missing / 239 total; Agent surface 0 / 0 / 5 / 5; full target 60 / 129 / 55 / 244. Published clauses remain 42 / 65 / 0 / 107; target and push-further clauses remain 18 / 64 / 55 / 137. No clause status changed.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

## Publication and CI

Product pushed successfully on the first guarded attempt: f4e68ea69aae8caa6f50476c0ad4be1c6a952fd9. All two candidate commits passed the full identity/message/trailer audit. No PR was opened by this task. Exact-SHA Verify 44118900256 completed successfully on f4e68ea69aae8caa6f50476c0ad4be1c6a952fd9, observed 2026-11-17T16:11:27Z. Run URL: https://github.com/just-every/run-lamp/actions/runs/44118900256. The watcher used five calls after the two initial failed-job investigation calls, for 7/10 total; every poll was at least 300 seconds apart. Full actual responses are retained in ci-receipt.json.

No deployment, release, tag, self-submission or main/default-branch push is performed by this task. The fleet performs publication scanning and landing on its own machine.

## Local verification limits retained honestly

System Chromium requested /assets/favicon.svg in addition to stylesheet, header image, mark and template script, causing the untouched THEME-001 four-request budget assertion to fail. The public rendering and its test helper are unchanged from the supplied parent. Independent source review confirmed that all five resource URLs were already declared. The archived-parent comparison failed before that assertion because its copied source tree did not hydrate Settings; it is inconclusive as a runtime budget comparison, and its actual log/status are retained. No out-of-lease theme change or assertion weakening was made. CI uses its existing Playwright browser configuration and passed the full exact-SHA Verify, including its unchanged theme assertion. The local full-Chromium failure remains a separate reported limitation, with no out-of-lease fix or assertion weakening.

The first optional proof capture waited on animation callbacks in an offscreen opaque frame and timed out. Scrolling the frame into view fixed the capture synchronization; the final owner test passes with both 1440 and 390 proof images reviewed. The two primary proof files are browser/isolated-email-1440.png and browser/isolated-email-390.png. Earlier helper full-page captures can leave an offscreen opaque frame unpainted; use the explicitly painted primary pair for the changed email surface.

## Terminal custody and limits

The product branch is pushed at the exact SHA above, and its Verify is completed/success. The original owner helper remains unchanged. The complete explicitly selected 58-file packet is transferred separately through evidence/sd-lamp-incident-1-c2; its actual ref/head is emitted by the publisher and copied verbatim into the terminal response. That transfer does not claim product acceptance or landing. The fleet runs its own publication scan and lands from its own machine. No owner-journey blocker remains. The local theme-budget limitation and inconclusive archived-parent diagnostic are retained rather than presented as passing checks.

The task's temporary source trees are removed after the evidence transfer is verified, as requested; reports and receipts remain outside the checkout.
