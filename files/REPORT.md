# Lamp release migration inventory carrier fix

Prepared by Run Edit Run fleet on 2026-11-22T00:49:03Z.

Branch `cloud/sd-lamp-notify-aud-1-c1`, head `3d7619d005a5a0a5f9e4574d0c9325436fa0999c`.
Original lander candidate `d2da32b04f336e32b51d11026140c02b6c3087e1`, previous Verify run 44964090421. The brief records the independent gate as PASS WITH FOLLOW-UPS for `2e4b6592ea289b60b990ecbf5767bddae950503b`.
Fresh main was `224a64b472f11c2d9d8b7c8d8bde8812aa0286a7`, already an ancestor of the candidate. Its highest core migration was 0084, so the candidate retained migration number 0085.

1. Reproduced the release validator failure on the original lander candidate. The release inventory listed 0084 and omitted 0085.
2. Added `0085_status_page_email_branding.sql` immediately after `0084_status_pages.sql` in `RELEASE.json`. The carrier commit changes that migration list and the source lock hash for the manifest. The candidate's migration, product code, tests and contract source are byte-identical to the supplied candidate.
3. Used the original candidate's parent as the carrier commit base to exclude the lander's generated-view commit. Ran the contract writer and check, then restored both views from main and regenerated the source lock. Neither generated view differs from main on the pushed tree.
4. Passed release validation, production Worker build, the setup migration-ledger check, typecheck, and source-lock validation locally. The ledger exercised 84 migration files, including interrupted application and backfill. Release inventory entries increased from one to two. The registered test count stayed at 119 plus 10 assertion scripts. Clause counts stayed at 245 total, 66 done, 123 partial, and 56 missing.
5. Checked author and committer identity and trailers across all three commits outside main and pushed the named branch once. The Mac lander owns the full publication scan and landing.

No contract clause claimed; this is a carrier fix for the candidate's RELEASE.json migrations list.

CLAIM NOTIFY-019 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#AUD-001 — an operator configures status pages and publishes to the selected pages; tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out
CLAIM NOTIFY-022 PARTIAL points=none tests=tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out

The named browser journey covers scoped save, preview, reload and inheritance. The mail journey covers provider-aware identity, public-message isolation, and mandatory opt-out links after wording edits. Both clauses remain partial. This metadata change uses the candidate's existing test evidence.

## Exact-SHA Verify

Verify run 44968385566 completed with GitHub conclusion failure. Build job 137042520966 stopped at the generated ACCEPTANCE.md comparison before reaching validate:release. Verify job 137042598076 reported the resulting missing shard artifacts. The generated-view exception applies. Release validation passed locally on the exact published head. The Mac lander regenerates both views and runs Verify before landing.

[Exact-SHA Verify run](https://github.com/just-every/run-lamp/actions/runs/44968385566)
