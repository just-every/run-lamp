# Exact-SHA PAGE-017 receipt

Run Edit Run fleet, 2026-11-18

Branch: cloud/sd-lamp-c-f139

Candidate SHA: 75ca30a019c2c669a233bf2ada6be63da93348ad

Node 22.20.0, pnpm 10.12.4, system Chromium.

Command: `node --test --test-concurrency=1 tests/e2e/public-contract.test.mjs`. Exit 0.

```text
# PAGE-017 /history.atom: 200, 64647 bytes equal to /feed.atom; native update 01M7PP97T7G6364QCRWXMD85TZ
# PAGE-017 /history.rss: 200, 35701 bytes equal to /feed.rss; native update 01M7PP97T7G6364QCRWXMD85TZ
# PAGE-017 /history.rss: old validator received 200 for urn:lamp:synthetic-lamp-feed-1:event:update-01M7PP9DR9QVHBNDJZ61MDNHZ5 after 182 ms; retained 24 prior GUIDs; wording: API requests are working again.
ok 5 - SUB-019 PAGE-001 PAGE-002 PAGE-003 PAGE-004 PAGE-007 PAGE-008 PAGE-009 PAGE-010 PAGE-011 PAGE-012 PAGE-013 PAGE-014 PAGE-016 PAGE-017 PAGE-018 PAGE-019 PAGE-020 COMP-001 COMP-002 COMP-003 COMP-004 COMP-005 COMP-007 COMP-009 COMP-010 UPTIME-001 UPTIME-002 UPTIME-003 UPTIME-004 UPTIME-005 UPTIME-006 MOVE-009 — owner maintains a complete catalogue and customers read, refresh, embed and retain its public story
1..6
# tests 6
# pass 6
# fail 0
# duration_ms 418805.256621
```

The pre-publication conditional GET returned 304. After the actual operator publish returned 200, the conditional GET used the original validator and returned new bytes with a new validator. The receipt above records the exact GUID, wording and elapsed time.

Local checks and custody

- Build and setup passed.
- Typecheck passed.
- First-party structural check passed.
- The existing verification plan reports 111 registered cases and 10 assertion scripts.
- Source lock freshness check passed on the pushed tree.
- Contract generation wrote zero files. The check passed before and after restoring both generated views from origin main.
- The full-history checkout reports shallow=false. The cloud candidate used the fleet identity and no trailers.
- The fleet guard pushed the product branch on attempt 1.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

PROBE PAGE-017 2: Anonymous GET of /history.atom and /history.rss before any import -> both 200 with byte-identical canonical bodies, 64,647 Atom bytes and 35,701 RSS bytes, both containing the actual native publication.

PROBE PAGE-017 5: Native resolution followed by conditional GET of /history.rss with the old validator -> 200 with the exact resolution GUID and wording in 182 ms, with all 24 prior GUIDs preserved.

GitHub Verify run 44253613649 completed with success on the exact candidate SHA after the push event. The repository still advertises the candidate on its named cloud branch and 177378a989a7496a2e3dc00ac9a43947efd7c031 on main. Verify on that existing main SHA succeeded in run 44242051847 and Run site in run 44242052319. Candidate Run site and the full publication scan are pending the guarded Mac landing.
