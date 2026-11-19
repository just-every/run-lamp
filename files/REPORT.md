# Lamp first-install faults on rer 0.2.125

No contract clause claimed; these are install faults found by a company's first install (main-pack-nonseed2-1).

| Provenance | Revision |
| --- | --- |
| Main used for the owner-ledger recheck | `1b3578b39a1e0166cbd0714f8d7d463210d7a190` |
| Previous candidate reviewed | `48ff8882f647a16328fa7b5c97c3c2d2edc2f321` |
| Newest main at the product push | `337435bb0de5c300e6c0ad8846608d0ac089a94e` |
| Product candidate | `1b72a39e8647ff81d97bdb3413ebe3e631b74927` |
| Product branch | `cloud/sd-lamp-install-faults-3` |

## Plan and decisions

1. Read both commits from the prior branch and inspect its core migration 0086. Recheck the reported owner ledger failure first on clean main using the pinned rer, Wrangler's real core and owner migration path, and the native backup and restore door.
2. Keep the owner migration history in the order recorded by the archive. Apply a synthetic owner migration after the latest core migration, export, restore to an empty checkout with matching owner SQL, rerun migrations, and re-export. The three transfer commands succeeded. The restored owner data, migration name, and text storage matched. The destination uses its own application timestamp, which a subsequent migration run preserved.
3. Give only Lamp's dev target a 900,000 ms readiness window in `scripts/installer/local.mjs` and document the 15-minute window in `RUN-LOCALLY.md`. Measure a real 70-second delayed child and a child that never opens a listener.
4. Have `tests/e2e/helpers/follow-ups-runtime.mjs` and `scripts/sorry-receipt/runtime.mjs` replay core SQL followed by the sorted extension SQL already discovered by Lamp's owner-migration helper. Exercise both through the authenticated components HTTP route, then run the existing Sorry, public-contract, and portability tests with their existing assertions.
5. Rebase onto fresh main before the product commit. Main gained an authentication test and its lock entry while this round ran. The archive implementation and migration paths were identical across that move. Regenerate and check the generated contract views, restore them from main and regenerate the source lock last. Check the exact candidate with the ordered build steps.
6. Push the single ordinary commit on the named branch and check the exact-SHA Verify. Preserve the report and verification receipt on the separate evidence ref for the fleet.

## Results by fault

- Fault 1 was fixed in `scripts/installer/local.mjs`. The delayed main target missed its default 60-second deadline with HTTP 404. The same imposed delay on the exact candidate reached the ready event with HTTP 200 and a healthy response. The receipt records the dead-listener refusal.
- Fault 2 was already fixed by rer 0.2.125. Wrangler still declared the applied-at column as TIMESTAMP with text storage. Native transfers used the owner migration history and completed export, restore and re-export without a Lamp ledger or migration change. Omit the prior core migration 0086 and all prior ledger writer and reader changes. This round added no migration file and rewrote no stored owner rows.
- Fault 3 was fixed in `tests/e2e/helpers/follow-ups-runtime.mjs` and `scripts/sorry-receipt/runtime.mjs`. Both main runtimes omitted the seeded owner component. Both exact-candidate runtimes returned the component with the value written by the second migration, proving core SQL ran first and extension SQL ran in filename order. An absent extension directory remains a valid installation.

## Counts

| Measure | Newest main | Candidate |
| --- | ---: | ---: |
| Done clauses | 65 | 65 |
| Partial clauses | 124 | 124 |
| Missing clauses | 55 | 55 |
| Total clauses | 244 | 244 |
| Registered cases plus assertion scripts | 125 | 125 |

The original main used for the baseline contained 124 checks. The move to the newer main introduced the additional upstream authentication check. Clause status changes in this round were zero. No independent migration gate was triggered.

The exact-SHA push Verify completed successfully in run 44590223466. [GitHub workflow run](https://github.com/just-every/run-lamp/actions/runs/44590223466)

Signed Codex, 2026-11-19 UTC.
