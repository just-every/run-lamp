# gr-mt-lamp-code-16 — correct CodeQL-flagged e2e helper operations

Author: Run Edit Run fleet (Codex), 2026-11-15.

Repository: just-every/run-lamp
Product branch: cloud/gr-mt-lamp-code-16
Candidate: 660000e4d9f72db7ec0bc36aee8242370fc5c10d
Base: f495b89afd9f6832e4d4807018d91fa4c4670147

## Scope and implementation

CodeQL alert 31 identifies a regular expression in tests/e2e/helpers/theme-flow.mjs that checks sanitizer removal-description strings. It never sanitizes HTML. The patch replaces the three regex checks with literal array membership for script-element removal, p onclick removal and img src removal. The original assertions that unsafe markup and attributes are absent, invalid writes preserve saved settings and browser script does not execute remain intact.

CodeQL alert 30 identifies regex tag stripping followed by manual entity replacements in tests/e2e/helpers/status-journey.mjs. The result is used only for readiness substring assertions. The replacement parses once with the existing parse5 dependency and recursively concatenates text nodes, matching nearby test conventions. Quoted delimiters and character references now follow parser semantics; escaped literal tags remain literal text and doubly encoded references remain encoded. No result is inserted into an HTML sink.

Production sanitization already uses parse5 and allowlists in src/core/features/page-settings/theme-html.ts. This change does not modify that boundary, product behavior, dependencies or public UI. sources.lock.json is regenerated and includes only the two changed helper hashes. No fleet reports, receipts, keys or helper tools enter the product commit.

Both reported code patterns are removed. Neither alert established an exploitable production source-to-HTML sink. Provider-side alert closure has not been claimed; CodeQL must analyze the landed change.

## Plan executed

The full plan is retained in PLAN.md. Fleet identity, credential helper and forwarding commit hooks were installed; only the declared repository was cloned with full history. Repository guidance, callers and production sanitization were inspected. An independent read-only boundary investigator reviewed the paths before editing; a fresh read-only candidate reviewer inspected the patch after focused checks and reported no concrete surviving bypass or introduced regression. Changes were committed with fleet author/committer and no trailers. The source lock was generated last and its check passed.

## Ordered verification

1. Syntax: node --check on both changed helpers passed. git diff --check passed. pnpm typecheck passed under Node 22.20.0 and pnpm 10.12.4.
2. Focused behavior: text-extraction-probe.mjs passed 11 controls: linked prose, a greater-than sign inside a quoted attribute, escaped literal markup, numeric references, single-pass entity decoding, comments, malformed and nested tag-shaped input, Atom, RSS and existing widget wording. The original helper failed five of these controls; the parser version passes them. The probe and its actual output are retained.
3. Existing status journeys: node --test --test-concurrency=1 tests/e2e/publishing-contract.test.mjs passed all 9 tests, with zero failures or skips. This includes actual native incident publication and the real widget route, maintenance identity and feeds, scheduled publication, Slack/Teams publication, report publication and notification reach.
4. Existing theme journey: the THEME-001 selection in tests/e2e/publishing-browser.test.mjs ran under /usr/bin/chromium with --no-sandbox. It passed the changed sanitizer-removal assertions and proceeded through owner theme settings. It failed later because Chromium requested /assets/favicon.svg as a fifth asset against the existing four-request budget. The identical command on unchanged origin/main reproduced the identical five-asset failure. No assertion was weakened or skipped to hide it. The first harness import attempt also failed before tests; the external harness was corrected and both actual attempts are retained. The harness changes browser launch options only and is outside the product tree.
5. Source integrity: node scripts/edition-authoring/cli.mjs lock and check passed. CONTRACT.md and its generated views were untouched.
6. Publication: Base's scanner is available in pinned @runeditrun/rer 0.2.108. Pinned Gitleaks 8.30.1 was installed. The first full-history scan hit its default 300-second deadline and returned INCOMPLETE. The completed second invocation scanned local setup artifacts and used incorrect destination arguments. It returned FAIL and was retained as publication-scan-local-artifacts.json. The corrected invocation used a clean copy with all 2,308 source files verified byte-for-byte against the candidate, the committed project ID just-every/lamp, and the declared repository URL. This exact-tree scan returned COMPLETE/PASS with zero findings across 1,147 selected/public-base commits in 372.545 seconds. All three actual scan receipts are retained; none was used to bypass a gate.

## Counts and clause judgments

Two flagged operations before, zero retained after. Test registrations are unchanged: the touched selections contain nine status tests and one theme test before and after. No new registered test, skipped test, deleted assertion or dependency is introduced.

Contract counts before and after: Core 60 DONE, 129 PARTIAL, 50 MISSING (239); Agent 0 DONE, 0 PARTIAL, 5 MISSING (5); full target 244 clauses. No clause Status, Gap, Evidence or acceptance text changes. This maintenance patch makes no new DONE/PARTIAL claim.

## Local limitation

System Chromium reproduces the pre-existing favicon asset-budget failure on main and candidate. The entire local theme journey is therefore not reported as passing. Native changed assertions passed; the remaining gate is exact-SHA Verify with its declared browser/runtime. Full local verify was intentionally left to branch CI as instructed. No deployment, release, merge or main push is authorized or attempted.

## Publication custody

The guarded product push succeeded on attempt 1 for cloud/gr-mt-lamp-code-16 at 660000e4d9f72db7ec0bc36aee8242370fc5c10d. Candidate authors, committers and complete messages passed the fleet identity/trailer check. No default branch was pushed or rewritten. Exact-SHA Verify discovery/wait is underway; no CI success or landing has been claimed.

Draft PR: https://github.com/just-every/run-lamp/pull/395. Exact-head push Verify: https://github.com/just-every/run-lamp/actions/runs/43751482949. Discovery found it in progress on the candidate SHA. One watcher waits at least 300 seconds between REST reads; completed/success is required before READY.

## Terminal result and handoff

Implementation is complete and publicly preserved on the named product branch. Draft PR #395 remains for lane review. Exact-head Verify run 43751482949 was still in_progress with no conclusion at discovery and all three permitted subsequent polls, each separated by at least 300 seconds. Five explicit PR/CI API commands were issued; required publication reference reads and launcher authentication also consume shared access. Polling stops at a conservative budget boundary with room for mandatory failed-job diagnostics. No failed run or completed assertion failure was observed in CI, so no failed-job archive was requested. This is PUSHED custody, not READY or acceptance. The fleet must re-read the exact run before any landing.

Both target code operations are changed, but the provider's alert state has not been read or claimed closed. The local theme limitation is retained rather than hidden; untouched main reproduces it. No clause status change is proposed. The full main/default-branch verification and landing remain the fleet's responsibility.

The exact product SHA is 660000e4d9f72db7ec0bc36aee8242370fc5c10d. Product push receipt, publication receipts, PR receipt, CI responses, validation receipt and result.json are retained in this packet and selected explicitly for report-only evidence publication. The final EVIDENCE line names the transport head separately from this product SHA. There is no unpushed product work and no real publication blocker. No production deployment or default-branch write occurred.
