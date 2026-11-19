# Lamp NOTIFY-004 linear replay

The candidate replays the gated delivery proof onto Lamp main at `9302c0a0f25b07950f2aa7fb84193e21cbf33703`. The branch is `cloud/sd-lamp-c-f147-lin-1`. The source round's gated head was `ddb1932d50ffa87a2d48ccaf7411bbb0045b78ee` with Verify run 44402120293.

## Plan and replay

1. Fetch main, the feeder and the continuation. List the feeder and continuation commits absent from main in oldest-first order. Inspect the remerge diff of `2c271f507015218f1769fdd9dbe491f551d4c0a1` for its four test files and source lock.
2. Apply `b6d7b40`, `f122201` and `ddb1932` in that order onto current main. Resolve each overlapping test against current main and the gated round. Resolve the lock by generation. Keep each published candidate commit linear.
3. Regenerate and check the contract views, restore the main versions of the two views and regenerate and check the source lock last. Check the tracked diff, contract counts, verification inventory, fleet Git identities and candidate ancestry.
4. Run the complete ordered local build shard with the candidate SHA and pinned toolchain. Run the two touched journeys against that build with system Chromium, and capture Settings and Deliveries at 1440 and 390.
5. Recheck and rebase against fresh main, publish the product branch, and look up Verify using the published full SHA. Publish this packet as a child of that same product SHA on the evidence ref.

The initial outcome and untracked-HTML changes from `b6d7b40` were already present on main through `6f7ae03`. Resolving to main's content left an empty replay for that commit. The two ordinary replay commits carry the populated-filter reconciliation from `f122201` with the merge's resolution, and the confirmed browser recipient from `ddb1932`. The source merge was inspected and omitted from ancestry. The final candidate includes the newer time-display ruling on main.

## Per-file comparison with the gated head

| File | Comparison |
| --- | --- |
| `tests/e2e/delivery-contract.test.mjs` | Byte-identical. The single subscriber-failures registration includes the populated inventory. |
| `tests/e2e/helpers/delivery-log-flow.mjs` | Byte-identical. It checks the complete CSV and every populated outcome or channel against independently known delivery facts, including a publication across two pages. |
| `tests/e2e/helpers/mail-settings-browser-flow.mjs` | One hunk differs. The exact queued and outcome time assertions still compare against the recorded instants. Their expected display now ends in “Universal time”, as rendered under main's current time-display ruling. The subscriber read, browser filters, CSV download and screenshots follow the gated flow. |
| `tests/e2e/helpers/subscriber-failures-flow.mjs` | Byte-identical. It exercises provider receipts, queued and future suppression, deactivation and recipient outcomes, and parses the provider-captured HTML for direct links and absence of tracking. |
| `sources.lock.json` | Regenerated against current main. The diff from main updates only the four test digests. Three match the gated head and one reflects the timestamp assertion. Other differences from the gated lock come from intervening main commits. |

`CONTRACT.md`, `ACCEPTANCE.md` and `docs/CLAIMS.md` match main. NOTIFY-004 is published and already has status DONE on main. No clause Status, Gap or Evidence cell changed. Core counts stay at 65 done, 124 partial and 50 missing out of 239. Full target counts stay at 65 done, 124 partial and 55 missing out of 244. The delivery file keeps seven registrations. The verification inventory remains 112 registrations plus 10 assertion scripts, 122 checks total.

The public release and full-history publication scan remain with the Mac lander. This task changes test proof and the generated source lock. Lamp's deployed code, schema and release metadata match main.

## Local verification

All nine build-shard steps passed on `0969500eae4f537d6c5a32be6a8bc85af41d13ec` with Node 22.20.0 and pnpm 10.12.4. Steps ran in order: contract documents, Base copies, source lock, typecheck, syntax, release validation, visual source, app build and site build. The known favicon-budget error did not appear in those local commands.

Both touched delivery journeys passed. They reconciled 132 deliveries, all six populated outcome filters and 41 complete CSV scopes. The bulk publication exercised 101 distinct recipients across two pages. The second journey proved owner provider selection, the confirmed recipient, queued and complaint facts, visible timestamps and the browser CSV download. It asserted at 1440 and captured Mail Settings and Deliveries at 1440 and 390. Synthetic address fields were masked during capture.

The preliminary replay failed the browser timestamp assertion because it still expected the technical UTC offset. The rendered instant matched and used the Universal time label. The updated browser assertion passed on the published candidate.

The final fetch and rebase left the locally checked SHA unchanged. The product branch was pushed once and advertised at that exact SHA. The product commits passed the identity and trailer audit and the tracked diff check.

## Clause evidence

CLAIM NOTIFY-004 DONE points=1,2,3,4 tests=tests/e2e/delivery-contract.test.mjs#Failing subscriber destinations deactivate with reasons, alert the webhook contact and suppress queued and future notifications; tests/e2e/delivery-contract.test.mjs#NOTIFY-013 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-007 NOTIFY-008 NOTIFY-010 — Owner-selected provider fallback preserves frozen notifications and reconciles delivery receipts

GAP NOTIFY-004: none beyond what the DONE claim names.

## GitHub Verify

Verify run 44477533131 completed successfully on `0969500eae4f537d6c5a32be6a8bc85af41d13ec` at the 07:26:10 UTC observation. [Verify run 44477533131](https://github.com/just-every/run-lamp/actions/runs/44477533131)

Signed Run Edit Run fleet 2026-11-19T07:26:39Z.
