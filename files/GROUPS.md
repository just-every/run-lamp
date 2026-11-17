# Recursive Sorry groups and source component metadata

Author: Run Edit Run fleet. Recorded: 2026-11-17T22:25:04.908652+00:00

Implemented plan:

1. Preserve Sorry parents once as recursive native groups, with native parent links and descriptions. Allocate all identities before writing parents in ancestry order; display order remains independent of write order.
2. Retain full original names, descriptions, states, positions, ancestry, creation/edit times and optional aggregate metrics in labeled source metadata on each native group/component row. Native fields remain editable; source facts remain labeled separately.
3. Expose the hierarchy and metadata through the existing owner component API and component screens. The reviewed bulk catalogue preserves and edits parent/description fields and rejects cycles or missing parents.
4. Protect incoming native and imported child groups in conditional undo. Catch-up can remove a parent or description, and undo restores the complete previous inventory.
5. Extend existing integration journeys instead of adding test registrations. Parent agent owns public snapshot integration, full build and final publication.

Migration: new migrations/core/0083_sorry_component_hierarchy.sql only. Adds component_groups.parent_id, description and source_metadata_json; components.source_metadata_json; parent/order index. No historical migration was rewritten.

Reconciliation proof:

Command: source /tmp/rer-cloud-toolchain.sh; cloud_run timeout 360 node --test --test-concurrency=1 tests/e2e/sorry-reconciliation.test.mjs
Latest run: PASS, 1 test, 0 failures, 29.6 seconds. Extends the existing test registration.

- Original synthetic case remains 16 source rows = 14 components + 2 groups, with zero unmapped warnings and zero unexplained verification differences.
- Nested case is 17 source rows = 14 components + 3 groups, with zero unmapped warnings. The former flattened nested group is now retained under its native parent.
- APIs retain a source name longer than 120 characters, a source description longer than 500 characters, original nonoperational group state, source position, ancestry and original edit instant.
- Repeat import leaves the entire API inventory unchanged.
- Catch-up removes an old parent and source description; undo restores the exact original hierarchy/metadata inventory.
- Conditional undo keeps an operator-edited child group, its original ancestor and an operator-created leaf.

Page-data proof extension is written in tests/e2e/page-data.test.mjs. It imports a realistic synthetic public Sorry export through the owner upload/plan/apply door, checks all six native metadata-bearing tables in the ordinary portable file, restores/re-exports it, checks a long sanitized body without import journals, and proves deleted native leaves/groups no longer export their source metadata. Its compiled application run passed after the parent agent's fresh ordered build: 1 test, 0 failures, 64.0 seconds. Actual output is PAGE-DATA.log; metadata and artifact hashes are in PAGE-DATA-RECEIPT.json. The April 2025 fixture is read through its public calendar path /history/2025-04 because the default history screen deliberately shows the last twelve months. The obsolete default-history assertion failure is retained in PAGE-DATA-calendar-assertion.log.

No clause Status, Gap or Evidence cells were changed by this work. No external provider or real customer data was used.
