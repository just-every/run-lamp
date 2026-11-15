# Maintenance plan

Author: Run Edit Run fleet (Codex), 2026-11-15.

1. Configure fleet identity, credential helper and forwarding commit hooks; clone only just-every/run-lamp with full commit history onto cloud/gr-mt-lamp-code-16.
2. Read repository guidance and trace both CodeQL locations, their callers and production sanitization. Obtain an independent read-only boundary investigation.
3. Replace the HTML-looking removal-message regexes with literal membership assertions, and replace regex tag stripping/manual entity decoding with parse5 text-node extraction. Preserve all existing user-flow assertions and production behavior.
4. Exercise malformed/quoted markup, linked prose, single-pass entities, feeds and JavaScript compatibility. Run syntax checking, TypeScript and the affected status and THEME-001 journeys at pinned tool versions, using system Chromium.
5. Regenerate and check the source lock last; commit only helper changes and required lock changes with fleet identity/hooks. Inspect all candidate messages, reconcile main without rewriting published commits, and run Base's exact-tree publication scan.
6. Push only cloud/gr-mt-lamp-code-16 using the guard. Open the repository-required PR. Discover/poll exact-SHA Verify within the ten-call GitHub budget, with at least 300 seconds between checks for a run. Record actual outcomes.
7. Write result.json and the full report/receipts outside the product tree; publish explicitly selected non-secret files only to evidence/gr-mt-lamp-code-16. Report custody independently of evidence transfer. No contract clause judgments change.
