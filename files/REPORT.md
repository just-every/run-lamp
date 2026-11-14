# Lamp linear carry: sd-lamp-qgrowth-tick-2-fix1-c1

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-qgrowth-tick-2-fix1-c1. Base: 429a46081ce68bab2dbdae46b8402b8ccce3ee2a. Original merge candidate: 8bc4c80dfa69b4371c2d913f87227570df2007ed, net-diff baseline bef5115afc3972d78962fbb899a2a32433f5f3a6.

## Scope and implementation

Applied the whole original candidate net diff with git apply --3way onto current main. No merge commit, rebase, cherry-pick, version bump, new changelog section, new test, or contract judgment change was introduced. RELEASE.json preserves main's entire 1.11.16 metadata and its 0079/0080 ledger entries, appending only the original candidate's pending 0081 entry in the existing pre-release inventory form. sources.lock.json was regenerated last with node scripts/edition-authoring/cli.mjs lock and source:check passed. Generated views were restored from origin/main and are not part of the product diff.

The repair adds due-work indexes and transactionally maintained current work, bounded public history/archive selection, archive pages/feed/API traversal, retained archive documents, and the candidate's reminder and backup checks. The change is the existing candidate repair carried forward, with no additional product behavior.

## Carry proof

The product change set is exactly the candidate's 30-file lease: 929 additions and 110 deletions. All 27 non-overlapping candidate paths are byte-identical to the original candidate. tests/e2e/prior-backup.test.mjs is the exact conflict-free three-way union, retaining main's three-line lifecycle-total assertion and every candidate assertion. RELEASE.json is main's JSON plus precisely the candidate's 0081 migration object. The source lock is regenerated from the reconciled checkout. All 31 non-overlapping files main gained since bef5115a retain main's bytes. The candidate-to-carry diff has 34 paths: only the newer main content plus release/lock reconciliation. No candidate repair is missing.

CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and setup-migrations.test.mjs are byte-identical to main. The setup migration test discovers shipped migration names dynamically, so it requires no static 0081 expectation line. carry-receipt.json, CARRY-REVIEW.md, product.diff and candidate-to-carry.diff retain inspectable proof.

## Clause accounting

Before → after is unchanged: Core 60 done / 129 partial / 50 missing (239); Agent surface 0 / 0 / 5 (5); Later 0 / 0 / 0; full target 60 / 129 / 55 (244). No Status, Gap or Evidence edits.

CLAIM INCIDENT-001 PARTIAL points=none
CLAIM NOTIFY-006 PARTIAL points=none

## Validation results

- Local rer setup completed with the fleet owner and no external provider credentials. Its private sign-in output is intentionally excluded from the public packet.
- Repository agent-bootstrap.sh stopped at its passwordless sudo prerequisite; no product check was hidden. The toolchain instead supplies pinned Node 22.20.0 and pnpm 10.12.4; workerd 1.20260907.1 and Chromium /usr/bin/chromium were exercised directly. A preliminary data: navigation probe was blocked by browser policy; a page.setContent probe passed. The actual localhost history journey passed.
- pnpm check:contract-docs, pnpm source:check, pnpm validate:release, node --test tests/auth-adoption/setup-migrations.test.mjs and pnpm typecheck passed.
- Candidate public selection passed: PUBLIC_SELECTION records=50 unique=50 expected=50 pages=1 private_disclosures=0. This proves 50 public records on page one despite one internal record in the newest source window. The parent HIST-001 journey passed all Older traversal, unique coverage, permalink, native API and feed paging assertions.
- History and public-selection screenshots were captured at 1440 and 390; archive index and mixed-month screenshots were also captured at both sizes.
- Initial touched-suite execution encountered ERR_ADDRESS_IN_USE during the existing release-rebuild test's worker restart. The isolated rerun passed, and the complete verifier's fresh public suite passed 7/7, including this same rebuild case. All logs are retained.

## Independent gate boundary

Migration 0081 remains subject to the fleet's independent required gate and publication scan. The earlier gate's R3 full-size-fixture row is diagnostic-only on this carry head; this builder does not claim to re-score private gate material. Product push/READY custody and evidence publication are separate; neither is landing or hosted acceptance.

## Product custody and touched checks

Product commit: 280a76e1d89edba472a118024d9e17134cf25aff, sole parent 429a46081ce68bab2dbdae46b8402b8ccce3ee2a; one ordinary commit, zero merge commits. First and only product push succeeded on its first attempt through cloud-push.py. Every candidate identity and trailer was inspected: fleet author and committer, no trailers. No published history was rewritten and no default branch was written.

Draft PR for the lane: https://github.com/just-every/run-lamp/pull/383. The exact-SHA push Verify run is 43632972316 (https://github.com/just-every/run-lamp/actions/runs/43632972316). It was observed in_progress, not yet green.

Touched suite: 13 tests, 12 initially passed and one failed only with ERR_ADDRESS_IN_USE on a local restart. The isolated original PAGE-005 case then passed (1/1). Thus all 13 touched cases have passing execution evidence. The initial failure is retained explicitly in touched-tests.log and the successful retry in rebuild-retry.log. No product edit or weakened assertion was needed.

The full local rer verify completed with exit 1. All 24 planned commands ran: 23 passed; test:composer failed only its existing THEME-001 request-budget assertion. All nine build checks, ownership, portability, imports, mail, site, public, channels, subscriber delivery, runtime, publishing, demo and baseline commands passed. The full verifier's public suite passed 7/7, including a fresh PAGE-005 rebuild run, HIST-001 selection/paging and retained archive checks. Thus the initial touched-suite port collision also has passing execution evidence in the complete verifier, beyond its isolated retry.

The theme failure reproduced with exactly the same five resources on unmodified main 429a4608 under the required system Chromium. This is recorded as an existing baseline failure, not hidden or fixed outside the carry lease. validation-receipt.json and local-shards/*.json preserve the actual command results; full-verify.log preserves the complete non-secret verifier output.

Exact-SHA push Verify run 43632972316 was last observed in_progress at 2026-11-14T20:06:33Z, after seven REST reads at five-minute spacing (including discovery). One PR creation API write was also made; the remaining two task API calls were reserved for failure-job diagnosis. No green CI conclusion has been observed. Product custody is PUSHED, not READY or landed. The lane must check the exact SHA and independent 0081 gate before landing.

## Broader verifier theme diagnostic

The full verifier's existing THEME-001 full-capacity theme test failed under required system Chromium 154.0.8037.57: the browser requested status-page.css, theme-header, mark.svg, status-page.js and favicon.svg, exceeding a four-request assertion. The unchanged isolated test reproduced the same failure on candidate 280a76e1 and on current main 429a4608 in a detached worktree, using the same pinned dependencies and browser. Main's tracked tree remained unchanged. This failure predates the carry; no assertion or product behavior was modified. The initial result, isolated retry and main baseline logs and receipt are retained. Full local verification therefore must not be reported as entirely green. Required touched tests and the full verifier's fresh selection/rebuild/history cases passed.

## Final preservation and report return

Core migration file inventory: 79 before → 80 after, adding only 0081 (the numbering has an existing gap). All prior migration bytes remain main's bytes. No contract status, gap, evidence, generated view or count changed. No semantic carry conflict remains.

The actual report packet, full plan, carry review, structural receipts, command logs, CI observations, draft PR receipt and screenshots remain under work/sd-lamp-qgrowth-tick-2-fix1-c1/packet. Publication selects explicit regular files only and sends them solely to refs/heads/evidence/sd-lamp-qgrowth-tick-2-fix1-c1. Private setup/sign-in output, injected credentials, environment dumps and held-out fleet gate material are excluded. Product and evidence publication have separate commits and refs. The product was pushed once; the evidence publisher does not change its checkout, HEAD or index.

All browsers and server children started by the verifier and isolated tests have exited. Only generated, untracked fixture screenshots may remain under .tmp in the product checkout; the tracked product tree is unchanged from the pushed commit.
