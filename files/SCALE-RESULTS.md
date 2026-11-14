# Lamp exact-candidate scheduled/public size results

Final product: `just-every/run-lamp`, branch `cloud/sd-lamp-qgrowth-tick-2`, exact clean committed and pushed SHA `9fec60c9129dc05eea8ba21ca49d6bb3596fe9d6`. The production build completed successfully before copying the source, migration inventory, source lock and emitted Worker into isolated scratch. `final2-provenance.json` records the exact SHA, clean working tree, copy time and SHA256 hashes of every measured source/script/migration file, release inventory, source lock and emitted Worker.

The unchanged declaration and owner declaration came from `origin/cloud/sd-lamp-sizecheck-3`, scratch only. Published `@runeditrun/rer@0.2.115` was installed outside the product and invoked through its exported CLI main, leaving the product's pinned rer dependency unchanged. Authoritative ordinary command from the isolated built candidate:

```
cloud_run env CI=true node ../rer115.mjs size --no-queue --json --write-statements <packet>/final2-statements
```

The declaration is 10,488 bytes, SHA256 `60e2c2ab6d35aa9dce8312d19d50f3bd512812ebb850cb7c8f4566da3a4a9c59`; it passes the unchanged 200 MiB synthetic-input guard. No fixture, ceiling or guard was reduced or bypassed. `CI=true --no-queue` avoids the shared CLI job queue in this dedicated VM, as the published CLI requires. Queue consumers remain held and unmeasured by the published runner.

| Assigned flow | Tick-1 baseline small | Tick-1 baseline large | Exact final small | Exact final large |
| --- | ---: | ---: | ---: | ---: |
| minute-tick | 6,853, failed | 122,680, failed | 5,804, ok | 5,804, ok |
| public-summary | 0 rows, HTTP 503 | 0 rows, HTTP 503 | 0 rows, HTTP 200 | 0 rows, HTTP 200 |
| public-history | 0 rows, HTTP 503 | 0 rows, HTTP 503 | 0 rows, HTTP 200 | 0 rows, HTTP 200 |
| public-feed | 0 rows, HTTP 503 | 0 rows, HTTP 503 | 0 rows, HTTP 200 | 0 rows, HTTP 200 |

All four assigned flows pass unchanged ceilings and growth limits. Final minute work performs 101 statements and writes 18 rows at both sizes, grows by zero rows, and stays below the 40,000-row ceiling and 10% of small plus 200 growth allowance. Public responses qualify because Lamp produced and published the actual snapshots; no snapshot was fabricated or seeded. Final fixture readback totals are 6,789 small / 541,177 large, with exact declared cardinalities. The additional scheduler-initialization marker is included.

The whole size command exits 1 only for unrelated incident-list and subscriber-list budgets: incident-list 1,828 / 180,028 rows; subscriber-list 3,301 / 324,061. These red flows are preserved in the complete result and are not represented as green. After the main merge, component-list is 3,873 / 3,873 and component-history 13 / 110, both passing; incident-detail 1,317 / 1,343, monitor-list 653 / 653 and maintenance-list 12 / 12 also pass.

Separate scratch-only diagnostics run the same unchanged small and large fixtures and the actual scheduled product door before owner maintenance-list can perform due reminder work. They then read snapshot-build status and R2 object metadata, retaining every SQL row measure with bound parameters omitted. Only the copied diagnostic Worker adds a metadata route and captures encoded byte counts; it changes no product source, fixture or limit. These diagnostics supplement the authoritative uninstrumented ordinary run.

The exact final cold minute also passes: **5,813 / 5,813 rows**, both successful, including due 24-hour maintenance reminder work. Both snapshots publish on the first storage attempt, without error. Actual R2 retained bundles are **16,639,719 bytes small / 16,644,687 bytes large**, matching encoded bytes and remaining below the unchanged 26,214,400-byte limit.

Authoritative final files are `final2-size.jsonl`, parsed `final2-size.json`, `final2-statements/{small,large}.json`, `final2-provenance.json`, and `final2-metadata-{small,large}.json` plus its log. `SCALE-RECEIPT.json` records these exact-head results and hashes the selected actual files. All scale-created runtimes have closed; no GitHub API call was used for these measures.

Earlier stages remain preserved honestly. `baseline-size.*` exactly reproduces tick-1, including large workerd heap exhaustion and 503 public routes. The first bounded candidate (`after-size.*`) still failed because SQLite chose the legacy lifecycle index and a temporary sort instead of the present resolved-public-window index, repeatedly scanning historical incidents. Actual SQLite and Miniflare plans are retained in `after-sqlite-schema-plan.json` and `after-runtime-sqlite-plan.json`; explicit indexed seeks resolved that growth.

That candidate also hit the existing 25 MiB limit: actual large rendered bundle 27,991,918 bytes. Fifty incident HTML artifacts repeated 644-component footers, totaling 10,723,650 bytes; root HTML 7,613,377 and native component pages 4,311,369 were other large contributors. Every artifact's size is retained in `after-render-artifact-sizes.json`. Lossless shared-footer encoding preserved complete served HTML while bringing the retained bundle below its unchanged limit.

Intermediate `final-size.*`, `candidate-size.*` and their metadata are retained as intermediate proofs, not the final SHA. Cold diagnostics then identified an SMS due-reminder recipient query scanning all active/deactivated email rows despite no SMS recipients. `sms-cold-query-plan.json` records the exact subscriber-directory CASE expression, query and before/after expression-index plans. The final migration uses that effective-channel index, eliminating the accumulated-subscriber scan. The final restore-safe scheduler marker and main merge were followed by the complete exact-head rerun reported above.
