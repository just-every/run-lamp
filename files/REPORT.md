# Public snapshot sanitization maintenance

Run Edit Run fleet, 2026-11-17. Repository: just-every/run-lamp.

## Plan

1. Initialize fleet Git identity, decrypted-bundle credential helper, publication guard and preserving commit hooks; read launcher and repository instructions.
2. Inspect alert 2's historical location and current public snapshot service, renderer, retained replica, edge cache and routes. Read CodeQL alert details if permitted.
3. Replace markup-rewriting regular expressions in the stale-label path with the runtime HTML parser and bounded insertions into generated XML, preserving titles and encoding label text. Keep the original outage policy, screens and clause judgments.
4. Extend the existing native Worker resilience journey with quoted body attributes, escaped feed titles, RSS and simultaneous R2/replica failure. Run the touched tests and typecheck with pinned tools; verify that original code fails the new behavioral assertion.
5. Record intent, regenerate and check the source lock last, and commit. Inspect all candidate identities/trailers and scan the exact committed tree with Base's publication scanner. Repair missing scanner prerequisites without weakening inspection.
6. When the publication gate passes, push only the named cloud branch through the fleet guard, open the required contribution PR and observe exact-SHA Verify within the API budget. Publish complete non-secret reports separately to the evidence ref.

## Code and data flow

The October alert location is the Atom title replacement in `src/core/features/public-snapshot/routes.ts`. Public routes read generated immutable artifacts from R2, a durable retained replica or the fallback edge cache. The snapshot service validates and normalizes generation timestamps. The renderer already escapes customer text; the stale-label function is a presentation transformation rather than a general HTML sanitizer.

The HTML regular expression nevertheless parses body attributes incorrectly when a quoted attribute contains `>`. Its inserted notice can become part of the attribute and disappear from the document. The new regression reproduces that failure on the original code. The change uses `HTMLRewriter` to insert the notice into the actual body element and escapes its message. Atom retains the whole title instead of matching and rebuilding a tag; RSS replaces only the known generated channel-description content. Both feed labels use XML escaping. JSON, widget, cache headers and the outage policy retain their behavior.

Files changed:

- `src/core/features/public-snapshot/routes.ts`: parsed HTML insertion; escaped feed labels; no tag-rewriting regular expressions in stale labeling.
- `tests/e2e/snapshot-retained.test.mjs`: extend the existing resilience journey, including RSS, quoted attributes, exact escaped title preservation and edge fallback when both storage sources fail.
- `DIVERGENCE.md`: signed intent record for preserving retained-document markup.
- `sources.lock.json`: regenerated source identities.

No CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md changes; no clause status changes. No release, deployment or application-identity changes.

## Local verification

Node 22.20.0 and pnpm 10.12.4. Frozen dependencies installed. `npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive` succeeded through the subreaper; it built the local Worker and applied local migrations. No provider deployment occurred.

- `pnpm typecheck`: passed.
- `node --test --test-concurrency=1 tests/e2e/snapshot-retained.test.mjs`: 2 passed, 0 failed.
- Original route implementation with the updated resilience journey: failed the quoted-body-attribute assertion (`a ><aside role=` instead of `a > b`). Fixed implementation passes.
- `node scripts/edition-authoring/cli.mjs lock`: succeeded; its `check` returned `ok: true`.
- `node scripts/verification/check-plan.mjs`: 102 registrations plus 10 assertion scripts = 112 before and after; 2 touched registrations before and after. Eight test shards and one shared build remain unchanged.
- `git diff --check`: passed before commit.
- Native public-route browser proof at 1440 and 390: HTTP 200, stale header, one accessible body notice containing the retained generation instant, zero page errors. Browser contexts, browser and Miniflare were closed. Screenshots and exact-commit receipt are included.

The first regression attempt changed only R2 while the replica still held the original document; its fixture was corrected to exercise the actual edge-cache fallback with both R2 and replica unavailable. No product assertion was weakened.

## Alert visibility and limits

`gh api repos/just-every/run-lamp/code-scanning/alerts/2` returned HTTP 403, `Resource not accessible by integration`, on all five attempts with refreshed injected credentials and 15/45/90/150-second backoff. No other credential was sought. The source location and data flow were investigated from Git history and current source. CodeQL alert closure has not been verified, and this report does not call an inaccessible alert dismissed or a false positive.

Publication, product custody, PR and exact-SHA CI outcomes are recorded below when complete. Evidence publication remains separate from product readiness and landing.

Contract counts before and after: 244 clauses, comprising 60 done, 129 partial and 55 missing. All judgments remain unchanged.

Publication tooling preparation: installed the scanner's pinned Gitleaks 8.30.1 after verifying its official archive checksum; hydrated main and release-tag history in bulk. The default 300-second scan deadline was insufficient, so the same scanner was rerun with its supported 1,800-second limit. A complete scan then reported only a destination-context error caused by my invocation (a bare repository slug and short project name); the next invocation uses the committed canonical project ID and full repository URL. Product metadata and scanner policy were not changed. Intermediate scan receipts are retained.

Final publication scan: COMPLETE/PASS with zero findings on commit `a2e46d5883feba6d1269c6d18e804bae86906c1d`, tree `2acce871b9f631d117c6240e12a7698969871911`. Base scanner 0.2.121 with pinned Gitleaks 8.30.1 inspected 1,164 commits, 1,147 trees, 8,818 blobs, 1,164 commit messages and 33 tag messages. The independently fetched public main and release tags account for the scanner's separately classified pre-existing records. No scanner policy or source identity was changed.

The three stale-label regex tag rewrites are now zero. Live CodeQL alert counts remain unverified because the API grant does not include code-scanning alert access.

## Product custody and CI

Branch `cloud/gr-mt-lamp-code-5`, full head `a2e46d5883feba6d1269c6d18e804bae86906c1d`, was pushed successfully on the first guard attempt. All candidate authors and committers are Run Edit Run fleet with the fleet address; commit messages have no trailers. The committed product tree is clean.

PR: https://github.com/just-every/run-lamp/pull/402

Exact-SHA push Verify: https://github.com/just-every/run-lamp/actions/runs/44069615104 (run 44069615104). Discovery at five minutes and a second read 300 seconds later both returned in_progress with no conclusion on this exact head. There is no green or failed conclusion to report. The available GitHub budget has been used: five bounded alert requests, two complete scans' bulk reference resolutions, two CI reads and one PR creation. No workflow was dispatched or rerun.

Terminal product status is PUSHED, not READY. No code blocker remains from the touched checks; full Verify is pending and the fleet must observe its conclusion. CodeQL alert closure remains unverified under the current API grant. No main branch update, landing or deployment was performed.
