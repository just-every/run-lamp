# Independent read-only carry review

Scope: working tree reviewed against base `bef5115afc3972d78962fbb899a2a32433f5f3a6`, candidate `8bc4c80dfa69b4371c2d913f87227570df2007ed`, and current main `429a46081ce68bab2dbdae46b8402b8ccce3ee2a`.

The candidate net diff has 30 paths. Twenty-seven files are byte-identical to the candidate, including every runtime repair source, migration 0081, candidate public-selection/browser helper, and all its other tests except prior-backup.test.mjs. The latter retains the complete candidate and adds only the exact three-line incident_list_counts assertion main gained after the base. No repair content is missing.

`RELEASE.json` JSON comparison proves it equals main after removing only its appended final migration object; that object is byte-value-equivalent to the candidate’s 0081 object. Main’s 1.11.16 header, priorVersion, release text, contractChanges, and existing 0079/0080 entries remain intact. No new changelog section or version bump was introduced.

Main gained 34 paths from the candidate base. Only RELEASE.json, sources.lock.json, and tests/e2e/prior-backup.test.mjs intersect the candidate’s 30 paths. All other 31 main paths remain byte-identical to main. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md, CHANGELOG.md, package.json, seed.json, and release-history records specifically remain main’s bytes. The working-tree change set has no path outside the candidate’s 30-file lease.

The setup-migrations test in current main discovers the full shipped migration list dynamically. It needs no static 0081-line reconciliation and remains unchanged from main; migration-ledger execution remains builder verification work.

The source lock was intentionally restored from main and awaits builder regeneration last. This review does not claim source:check or runtime/test success, nor migration-gate qualification. R3 full-size fixture scoring is independent diagnostic-only fleet work. No semantic carry conflict or missing candidate repair was found.

| Candidate path | Carry result |
| --- | --- |
| `RELEASE.json` | Main v1.11.16 retained; exact candidate 0081 object appended only |
| `docs/public-page.md` | Byte-identical to candidate |
| `migrations/core/0081_scheduled_work_indexes.sql` | Byte-identical to candidate |
| `sources.lock.json` | Restored main lock pending required regeneration; not yet reviewed as final |
| `src/core/features/channels/subscriber-events.repository.ts` | Byte-identical to candidate |
| `src/core/features/incidents/reminders.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/archive.repository.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/archive.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/feeds.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/history.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/native-api.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/public-api.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/renderer.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/repository.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/routes.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/service.ts` | Byte-identical to candidate |
| `src/core/features/public-snapshot/templates/parts.ts` | Byte-identical to candidate |
| `src/core/features/reports/repository.ts` | Byte-identical to candidate |
| `src/core/features/reports/service.ts` | Byte-identical to candidate |
| `src/core/features/scheduled-work/repository.ts` | Byte-identical to candidate |
| `src/core/features/subscribers/incident-lifecycle.repository.ts` | Byte-identical to candidate |
| `src/core/features/subscribers/limits.repository.ts` | Byte-identical to candidate |
| `src/core/platform/blobs/retained-bundle.ts` | Byte-identical to candidate |
| `tests/e2e/helpers/public-history-flow.mjs` | Byte-identical to candidate |
| `tests/e2e/helpers/public-history-selection-flow.mjs` | Byte-identical to candidate |
| `tests/e2e/helpers/snapshot-release-rebuild-flow.mjs` | Byte-identical to candidate |
| `tests/e2e/helpers/status-journey.worker.ts` | Byte-identical to candidate |
| `tests/e2e/prior-backup.test.mjs` | Candidate retained plus exactly main’s 3-line incident-list-count backup assertion |
| `tests/e2e/snapshot-retained.test.mjs` | Byte-identical to candidate |
| `tests/e2e/update-reminders.test.mjs` | Byte-identical to candidate |
