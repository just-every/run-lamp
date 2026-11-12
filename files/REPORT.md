# Lamp incident corrections replay

Repository: just-every/run-lamp
Branch: cloud/main-lamp-incident-corrections-1-c1

## Plan
1. Initialize fleet identity, decrypted-bundle Git authentication, push guard, and commit hooks. Read launcher and repository instructions and the shipped builder rules.
2. Start from current origin/main with full history. Fetch the previously resolved incident round and squash its net change, keeping main's newer behavior, tests, and divergence entries.
3. Keep CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md identical to main. Preserve every existing test assertion, add no registration, inspect the staged diff for credential-shaped values, and generate/check sources.lock.json last.
4. Install pinned toolchain and dependencies. Run touched tests, incident correction journey, typecheck, and browser proof at 1440 and 390.
5. Fetch main immediately before publication; replay onto newer main only while unpublished and rerun affected checks if required.
6. Create one product commit with fleet identity and no AI trailer; inspect every candidate identity and message; push with the cloud guard.
7. Open the contribution PR required by AGENTS.md. Discover/poll exact-SHA Verify through REST within the ten-call budget and 300-second interval.
8. Save actual non-secret reports and receipts outside the product repository and publish them to the separate evidence ref. Report exact provenance, claims, counts, CI and any limitations.

## Scope
Only incident reopening, corrections, next-draft reset, Notify-panel persistence, their public presentation, documentation and existing journey assertions. No clause status edits or DONE claims. No credentials or proof artifacts in the product tree.

## Defaults
Use shipped polish essentials; no new design direction is needed for a replay of the already selected interface. The cloud adaptation reserves full publication scanning and landing for the fleet. Never push main, force-push or rewrite published history.

## Results
- Product head: `0243c1212ac5251e44328138a49c0f272db5695d`; parent/current main at publication: `535776d40a7882ee0a651f31095c4eb25224ab11`.
- PR: https://github.com/just-every/run-lamp/pull/350
- Exactly one product commit, no merge commit, 16 changed files, 238 insertions and 49 deletions. First guarded push succeeded; no retry, rebase or force-push occurred.
- Squashed the resolved incident round from `4c61115fc723a76510852ca315ae8b327c11fc5d`, based on `ea67141c5d0c37550400a10cbbcba044ea08d17f`. Only sources.lock.json conflicted; it was generated rather than hand-resolved.
- The application and document files match the previous round. The current publishing test preserves main's newer audit-label registration and all its assertions; its only round additions are the correction helper import, INCIDENT-005 in the existing journey name and the helper invocation.
- DIVERGENCE.md retains every main entry and adds the round's entry once. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are byte-identical to main.
- The resolved-state helper updates the three old assertions that required hiding the resolved composer to assert the explicitly requested replacement behavior: retained composer and preview, empty consumed draft and disabled empty Publish. This is the intended behavior change recorded in DIVERGENCE.md.
- All five relevant/publication-adjacent registrations passed in the original six-registration browser file: audit labels, roles/permissions, the full operator publication journey including incident corrections, phone smoke, and upstream-report Settings.
- The sixth, unchanged THEME-001 registration initially failed because its helper does not read the executable-path environment setting and Playwright's own browser was absent. A cloud-only preload selected /usr/bin/chromium without editing any test or assertion. That retry reached the existing theme asset limit and failed with five requests (stylesheet, header image, mark, script and favicon). No theme code was changed to conceal this local failure. Exact-SHA CI remains the full acceptance wall.
- Typecheck passed with pinned Node 22.20.0; contract generation check and generated source-lock check passed. The initial Node 24 typecheck passed too; the pinned run is authoritative.
- The independent browser probe passed through the built production Worker, using ordinary API creation/publication and the shipped incident correction helper. Assertions use 1440. Twelve screenshots cover six changed screens at 1440 and 390: resolved and active operator/public corrections, incident permalink and Notify after publication. The probe also proves a subsequent ordinary publication has no correction target and the open Notify region survives publication. Browsers and fixtures closed.
- Test inventory: 90 registered cases + 10 assertion scripts = 100 before and after; six registrations in the touched file before and after; no added registration; cap 200.
- Contract summary before/after: Done 60 / Partial 129 / Missing 55 / Total 244. Clause status changes: none. INCIDENT-004 remains partial; INCIDENT-005 remains done. The requested PARTIAL claims below report only this run's evidence and do not change those source judgments.
- SEC-3 added-line inspection found zero credential-shaped candidates. Fleet author and committer were inspected across every candidate commit; there are no trailers. No reports, screenshots or credentials are committed to the product branch.
- Full fleet publication scanning, landing, main Verify and release delivery remain the fleet's responsibility under the cloud adaptation.

## Claims
CLAIM INCIDENT-004 PARTIAL points=2,3 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM INCIDENT-005 PARTIAL points=1,2 tests=tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 INCIDENT-005 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey

## Receipt handling
The initial GitHub response sanitizer removed query URL suffixes using a pattern that also consumed JSON delimiters. The PR was created successfully, but its first saved receipt was malformed. The complete sanitized original is retained as pr-receipt.malformed.txt; a repaired sanitizer and a fresh PR read produced pr-receipt.json. The first CI discovery response could not be parsed. Its call is recorded in github-calls.json; the replacement watcher waits until 300 seconds after that discovery before any new CI read.

## CI
Exact-SHA branch push Verify 43315248266 completed successfully on 0243c1212ac5251e44328138a49c0f272db5695d:
https://github.com/just-every/run-lamp/actions/runs/43315248266

The environment briefly returned to starting while the watcher slept. Files and pushed product provenance survived; the old watcher process had exited. A single replacement watcher read the known run after the required interval and observed completed/success. No duplicate watcher or early API poll was started.

The unchanged local theme asset-budget failure did not recur under the repository's CI browser setup: the full exact-SHA Verify passed without weakening an assertion. No required-check exception was used.

## Custody and blockers
Product branch was pushed once, on the first guarded attempt, with one real commit and no skip-CI marker. PR #350 remains open for the fleet lane. No main/default branch push, merge or force-push occurred. No blocker remains. READY identifies the verified product head; evidence publication is separate and does not land or accept the product. The clone will be removed after evidence publication; the packet remains outside it.
