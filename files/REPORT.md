# sd-lamp-qgrowth-tick-2 — bounded scheduled work and public snapshots

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-tick-2
Candidate: 9fec60c9129dc05eea8ba21ca49d6bb3596fe9d6
PR: https://github.com/just-every/run-lamp/pull/370
Verify: previous head e4046666857c4771852e49ca4d26656262a116b7 failed run 43546487324; replacement exact-head run/status in RECEIPT.json.

The assigned minute and public-route size checks pass on exact final candidate 9fec60c9129dc05eea8ba21ca49d6bb3596fe9d6. The product branch is pushed. No main/default branch, release, tag, deploy or other repository was changed. The fleet owns publication scanning, the independent migration gate and landing.

## Plan and scope

1. Continue published tick-1 7d3c98681313082a83752abe8d1c4b6f4f7c92fb and merge current main, preserving newer source, tests and metadata.
2. Move the unlanded scheduled-work migration to reserved 0081; add its inventory entry only to RELEASE.json. Keep release versions and other release metadata intact.
3. Make minute work seek durable due obligations rather than revisit incident, subscriber and state history. Preserve idempotent reminders, subscriber limits and restore behavior.
4. Keep the current snapshot bounded to current status/components, recent completed records and the ninety-day uptime window. Preserve boundary facts, every older incident, complete published wording, permanent links, and explicit history/feed/native API paging.
5. Run existing affected flows, typecheck, forward-upgrade and archive restore checks. Capture the changed history screens at 1440 and 390.
6. Extract the unchanged size declaration from cloud/sd-lamp-sizecheck-3 into scratch only. Run its published harness at both original sizes without changing its guard or thresholds. Diagnose failures through actual SQL rows and actual snapshot storage metadata.
7. Regenerate the source lock last, inspect all candidate author/committer/trailer identities, push only the named product branch through the fleet guard, open the required PR, observe exact-SHA Verify under the GitHub call budget, and publish this packet separately on the evidence ref.

The product work and local checks are complete. Exact-SHA Verify on the replacement head remains pending; the fleet also owns its expressly assigned terminal gates. No contract Status, Gap or Evidence cells were edited; no generated acceptance/claim view or size-adoption file was committed. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md remain unchanged. Test registrations were extended, not added, removed, skipped or weakened. Core migration inventory is 77 → 78; clause status/count changes are zero.

## Product changes

Migration 0081_scheduled_work_indexes.sql is additive. It indexes held/pending subscriber retention, current incident work, public history/feed order and component observation windows. Trigger-maintained current-commitment and report-reminder work tables reconstruct existing facts once before scheduling, advance after durable reminder receipts and stop on resolution/publication/waiver. A durable initialization marker travels with current archives; older archives restore its unset seed. The first scheduler use reconstructs queue rows atomically from canonical incidents, updates and receipt ledgers using eligible-work indexes, and later uses read only the marker and due work. Capacity seeds/counts remain eligible for the native archive engine’s supported migration replay, using explicit safe physical columns. Each minute processes at most 100 due obligations of each reminder kind; remaining work stays durable. Exact five-channel subscriber counters replace directory recounts. Terminal incident-follow cleanup seeks subscriber primary keys from ended follows, and pending channel work starts from events. An expression index selects the subscriber directory's effective channel before state, avoiding a cold SMS reminder scan across inactive email history.

Current snapshot loading selects all current incidents/maintenance plus the latest 50 completed incidents and maintenance windows. It loads non-correction observations inside ninety days plus first/pre-window boundary observations, and overlapping correction intervals, so uptime and original tracking dates remain correct. Correction audit rows never masquerade as observations. SQLite chose a legacy lifecycle index and history-sized temporary sort despite the correct ordering index being present; the ordered bounded queries now explicitly use the matching index.

The retained generation still contains the complete current page, first history/feed/native collection pages and related current artifacts. Repeated HTML footer bytes share one stored copy and reconstruct losslessly, including every component resource. No retained-bundle limit was increased. Archive rendering does not recompute unused component uptime charts; its private presentation context omits unused observations, corrections and metric series.

Older history and month pages use explicit 50-record keyset pages with Older history links. Indexed adjacent-month seeks preserve forward/backward navigation, configured-zone month membership and Sorry redirect distinctions. Older incident/maintenance permalinks, global and component feed pages, and complete native incident/maintenance JSON collections use bounded indexed reads and generation caches. Feed pages expose rel=next; component filters survive paging. Compatibility collection responses explicitly link to the complete collections/history rather than imply their recent window is the full archive. Nothing is deleted. Template copy no longer gives a false total from a recent window.

DEFAULT HIST-008: Adopt the brief's decided default: current/recent content is retained; cold older pages use bounded reads and are cached outside the current retained bundle. The visible page size is 50.
GAP HIST-008: A never-generated cold archive page needs the database. Already generated/cached pages and current retained surfaces continue serving through storage/database failure. No claim is made that all historical pages are eagerly retained on the secondary before a reader requests them.

## Exact candidate scale results

| Assigned flow | Before small | Before large | Candidate small | Candidate large |
| --- | ---: | ---: | ---: | ---: |
| minute-tick rows | 6,853, failed | 122,680, failed | 5,804, success | 5,804, success |
| public-summary | 503, 0 rows | 503, 0 rows | 200, 0 rows | 200, 0 rows |
| public-history | 503, 0 rows | 503, 0 rows | 200, 0 rows | 200, 0 rows |
| public-feed | 503, 0 rows | 503, 0 rows | 200, 0 rows | 200, 0 rows |

Minute growth is zero, below both the 40,000-row ceiling and 10%-of-small-plus-200 growth limit. Public routes are below their 1,000-row ceiling. Separate cold preparation, including the due maintenance/SMS path that ordinary owner flows warm first, reads 5,813 / 5,813 rows and succeeds. Actual retained objects are 16,639,719 / 16,644,687 bytes, both published on the first delivery attempt, below the unchanged 26,214,400-byte limit.

The original 10,488-byte declaration passes the 200 MiB input guard. Fixtures retain 644 components/monitors, 90/9,000 resolved incidents, 270/27,000 updates, 1,619/161,893 accumulated correction audit rows and 1,620/162,000 subscriber rows with 1,000 active at either size. Final total fixture readback is 6,789 / 541,177 rows, including five exact channel counters and the initialization marker. No fixture was reduced, no guard was bypassed, and Lamp produced the snapshots through its own scheduled handler; no snapshot was fabricated or seeded.

The complete size harness exits 1 for out-of-scope incident-list and subscriber-list budgets. The merged main component-read repair makes component-list and component-history pass. All four assigned flows pass. Those unrelated failures are retained in the actual results; this report does not call the whole harness green. See SCALE-RESULTS.md and SCALE-RECEIPT.json for complete commands, exact source/build hashes, SQL receipts, diagnostics and disclosure.

## Validation and corrections

Existing HIST-001 and HIST-008 journeys pass, proving all 60 historical records and 59 native incidents are reachable once, all 55 tied-time feed events survive global/component paging, unrelated component events stay excluded, all five populated months navigate in both directions, TZ/DST boundaries remain correct and old permanent pages keep their full wording/times. Actual 1440/390 screenshots accompany the packet.

The retained outage/cold-restart journey passes with repeated full component resources, throwing database access, storage failures, failed replica delivery, uploaded theme bytes and retained month/permalink membership. Reminder journeys pass exact lead/day-seven/week boundaries, idempotency, replacement, escalation, resolution, report publication/waiver and historical import silence. The complete subscriber consent/delivery/capacity/export/erasure journey passes, including the 25,000-recipient limit and channel counters.

Forward-upgrade from v1.11.14 and full portable restore pass on the exact clean candidate in 170.1 seconds. The complete existing catalogue-to-customer regression passed on e404 in 311.4 seconds (and in CI); the final head’s restore and focused public journeys pass again, including all templates, 200 components, ten metrics, uptime corrections, feeds, widgets, privacy, subscriptions and component erasure. The separate technical/native archive and auth-upgrade checks pass 8/8 cases. Actual results are recorded in CHECKS.json/RECEIPT.json. Typecheck, release migration inventory validation, generated contract-document check and source-lock check pass. No full local rer verify was run; branch Verify supplies the required complete wall.

Initial browser runs omitted the system Chromium executable and were rerun correctly with /usr/bin/chromium and --no-sandbox. An intermediate monthly source lost its adjacent-month navigation; indexed neighbor seeks fixed it without weakening the test. An intermediate full catalogue journey took long enough to expire owner step-up freshness because archive rendering recalculated unused uptime charts; the final implementation avoids those calculations and stores lean archive context. Intermediate scale attempts exposed the retained-bundle excess and SQLite index mischoice, then a cold SMS scan; all were repaired. Actual initial/intermediate logs are retained alongside the corrected final receipts.

## Custody and remaining gates

Published saves: b183f2e078ca1ba777e1775c3c38b94780fdca1d and 74ae7237 (skip-CI checkpoints); first CI candidate e4046666857c4771852e49ca4d26656262a116b7 and final product head 9fec60c9129dc05eea8ba21ca49d6bb3596fe9d6 have no skip marker. Unpublished c94a9aa5 was amended before its first push to include the archive CPU/context repair; published history was never rewritten. Every push used the fleet guard, succeeded on the first attempt, and was preceded by inspection of all origin/main..HEAD author/committer identities and trailers, including side parents. All candidates use the fleet identity with no AI co-author trailer.

Main at final integration was 1516f70a710d21775b8498c0357ea26a76f164d1 (the newer component-read repair was merged, preserving its tests and metadata), highest migration 0078, so reserved 0081 remained free. The source lock was regenerated last and checked. Full Git history is present. The cloud did not run the fleet's publication scan; the fleet must scan the exact final tree against run-lamp#main for edition just-every/lamp and destination https://github.com/just-every/run-lamp, run its independent migration gate, and land through the PR rules. Evidence publication is separate from product READY and acceptance.

Clause status changes: none. All builder claims remain PARTIAL, with exact claim lines in RECEIPT.json and the terminal response. No public/provider deployment acceptance is claimed.


## CI repair and replacement head

Run 43546487324 on e4046666857c4771852e49ca4d26656262a116b7 completed red. The build, ownership, demo, imports, delivery, runtime and public shards passed. All seven public/retained tests in the composer shard also passed. Composer's separate unsaved-work browser startup failed because its selected port was already occupied; the unchanged test passes locally in 48.7 seconds. The portability shard passed auth portability and page-data restore, but its much older listed-release archive correctly refused unsupported queue backfills. No archive guard or assertion was relaxed.

The generic archive replay classifier could not prove reads of new, uncarried reminder ledgers safe even when those ledgers were empty. The final migration therefore seeds a durable marker and preserves only supported counter replay. First scheduling use reconstructs derived queue work atomically once; current archives retain the marker/work, while older archives start unset and reconstruct from restored canonical facts. Explicit eligible-work indexes prevent initialization from scanning accumulated resolved history. Native prior-backup restore now passes with added first capacity-read and initialization-once assertions; focused reminder, concurrency, restore-reset and backfill checks pass. See CI-FAILURES.json and the tick restore receipts for the exact failure and repair.

Nine of the ten permitted GitHub calls were used for PR creation/update, exact-head polling, completed job status and one archive read per failed product job. The final call discovers the replacement head’s run; no budget remains for further polling. The terminal state is PUSHED while that exact-head Verify remains pending, never READY from the older red head. The fleet can continue observing and apply its independent gates.

Final post-repair verification: the exact clean 9fec head passes the original v1.11.14 forward-upgrade/portable-restore journey (170.1 seconds), the much older listed-release native backup restore (69.0 seconds), HIST-001/HIST-008 public journeys (2/2), focused reminder flows, typecheck and release/source-lock/contract-view checks. Exact-head final2 size and cold-due results are recorded in SCALE-RECEIPT.json. No local child processes or browsers remain.
