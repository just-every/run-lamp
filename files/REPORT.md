# Lamp design calls and accessibility repair

Run Edit Run fleet, 2026-11-18T21:43:06Z.

Product branch `cloud/sd-lamp-design-calls-3` at `dcc2302592fa2c9fa05817235f695a4fcce8097c`.
Fresh main was `ee4f9e01762dd11ad3df31bb7842b336ce9443a8`. The fetched predecessor was `b39e82f55c6ec44f99006ce21a269e943ef7960a`.
The accessibility reproduction used the linear replay at `1a409b72265af59afac541c25ff8dd3f423fc0d6`.

## Plan and results

1. Confirm the predecessor SHA and replay its five ordinary changes on fresh main. Resolve the source lock against main and preserve main's later clause judgments and tests.
2. Build the replay. Reproduce the previous lander's failure in the unchanged BASE-PUBLIC-003 test using a read-only diagnostic preload, then fix the rendered control.
3. Check the product with the full ordered build steps, the demo and touched flows, and browser observations at 1440 and 390. Regenerate and check the contract views locally, restore the published views, and regenerate and check the source lock.
4. Fetch main again, confirm linear ancestry and commit identities, use the guarded branch push, and inspect Verify for the exact published SHA.

The 1440 px Operator settings audit on the replay reported **target-size**, severity **serious**, on `<summary>Time zone details</summary>`. Axe measured 23.3 px of target height and a 23.2 px safe clickable diameter against a 24 px minimum. The product CSS gives the native summary 44 px of height. At both widths the closed control opened with Enter and displayed the exact offset. Main and the repaired candidate returned zero Operator settings violations. The existing Axe audit passed on the product fix.

## Four rulings

- **D16 — built now.** `src/core/features/operators/ui/operators-panel.tsx` keeps the in-browser invitation entry and removes the copy action. Main already provided local guidance. `operators/routes.ts` and `platform/auth/index.ts` show that an invitation from the online installation can be emailed when its mail transport is configured. The local confirmation gives that action without promising an automatic email on deployment.
- **D12 — built now.** `src/core/shared/component-state-label.ts`, `src/core/app/client/ui/component-state-select.tsx`, `src/core/features/incidents/ui/affected-components.tsx` and the catalogue, preview, history, template and public snapshot renderers use Working, Slow, Partly down and Down. The new incident attachment starts with an empty value. The browser reached the underlying Partially unavailable state by choosing Partly down without a template. Main combined the middle two choices and displayed Operational on component rows.
- **D8 — built now.** The composer and existing incident draft in `src/core/features/incidents/ui/new-incident-page.tsx` and `src/core/features/incidents/ui/incident-detail-page.tsx` say “What customers will see next.” Main showed the older prompts.
- **Time zones — built now.** `src/core/shared/timezone-label.ts`, `src/core/app/client/ui/timezone.tsx`, the time renderers, and `src/core/features/public-snapshot/format.ts` show the zone name on regular screens. Settings and public Time details expose the exact offset. The browser showed Los Angeles time and zero visible offsets on the public page with its disclosures closed. Main showed UTC offsets there. Feeds and delivered notifications continue to carry configured absolute timestamps. The Settings fix is in `src/core/features/page-settings/ui/page-settings-tab.tsx` and `src/core/app/client/ui/settings.css`.

## Local verification

The inventory was 122 checks before and after, including 112 registered cases and 10 assertion scripts. Contract counts were 64 Done, 125 Partial, and 55 Missing before and after. PAGE-009 remains Partial with wording that describes where the name and offset appear. The release validator requires a matching PAGE-009 entry. The release diff contains that entry.

- 2026-11-18T20:58:38Z PASS check:contract-docs (regenerated view)
- 2026-11-18T20:58:38Z PASS source:copies
- 2026-11-18T20:58:39Z PASS source:check
- 2026-11-18T20:59:00Z PASS typecheck
- 2026-11-18T20:59:10Z PASS check:syntax
- 2026-11-18T20:59:11Z PASS validate:release
- 2026-11-18T20:59:12Z PASS verify:visual:source
- 2026-11-18T20:59:18Z PASS build:app
- 2026-11-18T20:59:24Z PASS build:site

Local shard results. Passed: ownership, portability, delivery, public, runtime, demo. Failed or incomplete: imports, composer.

All eight local shards ran. Demo, ownership, portability, delivery, public and runtime passed. In Composer, test:public passed. THEME-001 timed out before the Theme heading appeared on both main and the candidate. Diagnostic retries in disposable worktrees waited for hydration and reached the same five public asset requests against the four-request budget on both heads. The other Composer cases passed. In Imports, the Cutover journey initially hit a local port collision and passed in a separate run on the exact same head. Mail and site passed in the Imports shard. A supplemental hosted-output probe yielded no result in ten minutes and was stopped.
`RECEIPT.json` contains the measured Axe results, browser observations, local shard commands and exit codes, and product publication status. The browser images show the changed surfaces at 1440 and 390. Invitation images are cropped to the result line.

## Publication

The guarded push advertised the exact candidate on cloud/sd-lamp-design-calls-3. Exact-SHA Verify 44401819949 completed with the generated ACCEPTANCE.md difference as its only originating failure. The build produced no shard artifacts and the remote test matrix was skipped. The cloud-generated-view exemption applies. The demo shard, including BASE-PUBLIC-003, passed locally on the advertised commit.

The cloud retains the main-generated views as instructed. The fleet handles the exact-tree publication scan and landing. The private polish-playbook endpoint returned HTTP 404 on the bounded attempts. The supplied builder-rule excerpt provided its applicable guidance.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).
