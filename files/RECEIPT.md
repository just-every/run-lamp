# Verification receipt for 1b72a39e8647ff81d97bdb3413ebe3e631b74927

Generated 2026-11-19T18:59:59Z.

## Dev readiness

The local process was launched through `rer dev --foreground --non-interactive --json --port <loopback-port> --no-queue`. The delay applied only to the Lamp dev child. The exact-candidate scratch checkout matched all 2,494 tracked source files.

Main with the 70-second delay
~~~text
dev target reached at 5.7 s: delaying application by 70000 ms
rer dev exit=1, error=command_failed, deadline at 65.8 s, last health=HTTP 404
~~~

Exact candidate with the 70-second delay
~~~text
dev target reached at 8.5 s: delaying application by 70000 ms
rer dev ready event at 125.7 s; GET /health HTTP 200 status=ok
After SIGINT the foreground rer command exited 130.
~~~

Real-clock no-listener run with matching candidate installer bytes
~~~text
dev target reached at 38.8 s: never opens a listener
rer dev exit=1, error=command_failed, deadline at 939.1 s, last health=HTTP 404
~~~

Exact candidate with only the readiness clock accelerated 30 times
~~~text
dev target reached at 60.4 s: never opens a listener
rer dev exit=1, error=command_failed, deadline at 90.6 s, last health=HTTP 404
Exact commit readiness-only clock at 30× reached the 900-second deadline.
~~~

The no-listener child exhausted the real deadline after about 900.3 seconds. The real-clock run started before the commit. The published installer file matched the bytes exercised by that run. The accelerated clock tested the same deadline on the exact candidate.

## Owner migration round trip on main

Used `pnpm run migrate:local` on the empty source, added one synthetic owner migration through `migrations/ext`, and ran the same migration command again. The source and destination had matching owner SQL. Each transfer used the installed rer 0.2.125 CLI. The destination started empty and was migrated once more after import as an idempotence check.

~~~text
rer 0.2.125, latest core 0083_sorry_template_metadata.sql
Local database migrations are up to date.
Local database migrations are up to date.
Owner ledger declared TIMESTAMP, storage text
rer export --output owner.rer --json: exit=0 events=node-selection,result
rer import --input owner.rer --yes --json: exit=0 events=node-selection,result
Local database migrations are up to date.
rer export --output restored.rer --json: exit=0 events=node-selection,result
Owner migration name, row and storage type matched. The fresh destination records its own application timestamp; rerunning migrations left that row unchanged.
~~~

## Extension migrations in disposable runtimes

Both probes installed two synthetic, dependent SQL files through `migrations/ext`. The first inserts a row into a core table and the second updates that row. The probes read the result through `GET /api/app/components`.

Main
~~~text
Sorry import and public contract runtime GET /api/app/components owner component=missing
Standalone Sorry receipt runtime GET /api/app/components owner component=missing
~~~

Exact candidate
~~~text
Sorry import and public contract runtime GET /api/app/components owner component=Synthetic Lamp owner migration applied in order
Standalone Sorry receipt runtime GET /api/app/components owner component=Synthetic Lamp owner migration applied in order
~~~

## Local suites and build

- Node 22.20.0 and pnpm 10.12.4 ran the ordered build on the exact SHA. `BUILD.json` contains its completion record. The nine steps were check:contract-docs, source:copies, source:check, typecheck, check:syntax, validate:release, verify:visual:source, build:app, build:site.
- `npx -y @runeditrun/rer build` also exited zero on the preflight product sources.
- Generated contract prose and view checks passed. The generated views were restored from main before the source lock was written and checked.
- Node 22.20.0 and system Chromium ran the Sorry and public-contract files together with two extension migration files present. The tested runtime files match the published ones.

~~~text
# tests 16
# suites 0
# pass 16
# fail 0
# cancelled 0
# skipped 0
~~~

Exact-SHA Sorry import, reconciliation and documented export
~~~text
exit 0
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
~~~

Exact-SHA public contract
~~~text
5 passed before the VM resumed with the local process stopped. The other two cases were restarted on the exact SHA.
exit 0
# tests 2
# suites 0
# pass 2
# fail 0
# cancelled 0
# skipped 0
~~~

Exact-SHA native portability
~~~text
exit 0
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
~~~

The initial supplemental channel run used Node 24 and only the executable override. It recorded failures and a timeout. Several channel browser helpers require the Playwright default executable location, which was absent. The exact local browser checks used a task-local mapping to system Chromium for those helpers.

The VM resumed with the supplemental channel retry stopped before a terminal result. The Sorry, portability, build, and combined Sorry and public-contract runs had already produced their completion receipts.

## Publication and Verify

Push Verify run 44590223466 reported `completed` and `success` on the exact candidate. [GitHub workflow run](https://github.com/just-every/run-lamp/actions/runs/44590223466)

Published product ancestry contained one candidate commit and zero merges. Both Git identities matched the fleet identity and the commit had no trailers. The independent publication scan is performed on the fleet lander.

Signed Codex, 2026-11-19 UTC.
