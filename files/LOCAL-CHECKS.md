# Local checks receipt

Candidate `120746a7f36f4f3a054a2bd57b4f9f2dd6a5b807` against `3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb`.
Node 22.20.0 and pnpm 10.12.4. Browser cases used system Chromium.

Command `node --test --test-concurrency=1 tests/e2e/publishing-contract.test.mjs`, exit 0.

```text
ok 1 - INCIDENT-001 INCIDENT-002 INCIDENT-003 INCIDENT-004 INCIDENT-005 INCIDENT-006 INCIDENT-007 INCIDENT-008 INCIDENT-009 INCIDENT-013 HIST-005 HIST-008 NOTIFY-015 UPDATE-001 UPDATE-002 UPDATE-003 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-007 UPDATE-008 UPDATE-009 UPDATE-011 UPDATE-012 UPDATE-013 COMP-006 HIST-001 HIST-002 HIST-003 AGENT-005 AUTO-004 UPTIME-009 — reviewed incident from private template to immutable updates, recovery, report and audited deletion
# PROBE UPDATE-005 4: save the prior Monitoring wording with the consumed draft version -> HTTP 409, no draft and identical committed updates
ok 2 - INCIDENT-013 — every explicit impact choice overrides higher and lower derived impact and clearing restores components
ok 3 - INCIDENT-013 — each set and clear appends the exact acting operator and before and after values to private history
ok 4 - INCIDENT-013 — every impact set and clear preserves complete component states, overall status, populated uptime days and current uptime
ok 5 - MAINT-001 MAINT-002 MAINT-003 MAINT-004 MAINT-005 MAINT-006 MAINT-007 MAINT-009 MAINT-013 — owner schedules, announces, starts, extends and completes maintenance without losing window or calendar history
ok 6 - UPDATE-006 — reviewed scheduled publication meets its deadline after complete public and subscriber silence
ok 7 - INCIDENT-012 — linked operators run a whole private incident draft, preview and explicit publication through signed Slack and Teams
ok 8 - AGENT-005 HIST-002 — cited report reconciles the retained record, requires human explanations and publishes immutable text
ok 9 - NOTIFY-015 — update outcomes and incident reach reconcile retained recipients and deliveries across publication, suppression and failure
ok 10 - Maintenance reminders respect the lead time and skip recent announcements
ok 11 - Maintenance cancellation is reviewed and the same window can be reinstated for its subscribers
# tests 11
# suites 0
# pass 11
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 184282.600525
```

The first unconfigured full-file run passed the UPDATE-005 probe and 10 of 11 cases. The maintenance-cancellation case needed a Chromium executable. The recorded rerun configured the system Chromium and exercised all 11 cases. The focused native probe under the pinned toolchain passed again after committing, on the exact candidate SHA.

- `pnpm run typecheck`, exit 0.
- `pnpm exec rer check --profile first-party`, exit 0.
- `node src/base/contract-docs.mjs write`, exit 0, wrote zero contract documents.
- `node src/base/contract-docs.mjs check`, exit 0, no prose errors or warnings, documents current.
- `node scripts/edition-authoring/cli.mjs lock`, exit 0.
- `node scripts/edition-authoring/cli.mjs check`, exit 0.
- `git diff --check`, exit 0.
- Verify 44845638824 (push) was in_progress. https://github.com/just-every/run-lamp/actions/runs/44845638824
