# Incident query measurement continuation

Completed: 2026-11-14T02:48:31.232661+00:00
Baseline: 1516f70a710d21775b8498c0357ea26a76f164d1 (current main)
Candidate: c65066509dc724bdd5e09c45f17f18d1758bc796

Plan: copy the unchanged size-check.json and agent-surface.json from cloud/sd-lamp-sizecheck-3 (2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1) to detached scratch worktrees only; build the actual emitted Workers; run published @runeditrun/rer 0.2.115 under the retained 200 MiB SQLite logical-size guard; after the unchanged full fixture guard stops, rerun the prior explicitly smaller incident diagnostic with the same incident expressions, counts, HTTP doors and three-request warmed measurement. Preserve all attempts and actual receipts; remove owned scratch worktrees after completion.

The untouched full fixture attempts both crossed the unchanged 209,715,200-byte guard. Current main reached 211,640,320 logical bytes; candidate reached 213,938,176. Both owned size process groups stopped (child exit 143, guard exit 2). The guard samples every 0.5 seconds and measures page_count × page_size including committed WAL pages. The cap was never raised or bypassed. These are guarded cancellations, not full fixture acceptance.

The follow-up diagnostic omits unrelated subscribers and component_state_history populations. It retains 644 components and monitors; 90/9,000 incidents and incident attachments; 270/27,000 updates; and one future maintenance item, using the declaration's original SQL expressions. The size declaration and ceilings are unchanged, and no adoption file entered the product branch.

| Flow | Main small | Main large | Candidate small | Candidate large |
|---|---:|---:|---:|---:|
| Incident list | 1,805 | 180,005 | 959 | 959 |
| Incident detail | 1,317 | 1,343 | 1,317 | 1,343 |

Every diagnostic HTTP response was 200. Each door ran three requests; the last warmed request supplies the count. Large list reads fall 99.47% and candidate small-to-large growth is zero. Detail reads are unchanged. Candidate diagnostic logical database peaked at 21,708,800 bytes; baseline at 19,410,944, both below the same guard. Independent gate remeasurement remains required.

Baseline's first diagnostic used VM Node24.19.0; it was rerun under repository-pinned Node22.20.0 and produced identical reads. Original artifacts remain under initial-node24-*. The baseline full guard used VM Node24; all candidate measurements and the final baseline diagnostic used Node22.20.0. pnpm remains pinned10.12.4. The first candidate guard attempt refused a missing scratch production build before any fixtures because its preceding build had accidentally run from the product checkout at the same candidate SHA. That build changed no tracked files. The refusal is retained under initial-missing-build-*; the correct scratch build and both candidate measurement passes followed.

MEASUREMENTS.json contains the comparative counts and actual guard receipts. measurement-inputs.json records declaration provenance, hashes and runtime detail. baseline-incident-diagnostic.json and incident-diagnostic.json retain complete non-secret diagnostic results; selected emitted statements omit settings, identity, session and token SQL. size-*.json retain the actual cancellations/stdout. No secret values, environment dumps, credentials, authority-bearing archive or private gate material is included.
