# Local check and product push receipt

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-c-f189-c1
Product head: 429823ba1e3094719a8646182465f060bafb8c40
Base main: 33ba19fdf501e4af972ebd8d633f0d48f56e136a
Proof blob: 3fb049d35c188742bfec5d08e12b74c1dc75d61c
Recorded UTC: 2026-11-21T13:05:27Z
Runtime: Node v22.20.0, pnpm 10.12.4, system Chromium 154.0.8037.57

Typecheck: pnpm run typecheck exited 0.
Contract views: generator write and check exited 0; zero files written.
Source lock: edition-authoring lock and check exited 0.
Diff whitespace and feeder helper byte comparison: pass.
Candidate authors, committers, and trailers: one candidate, fleet identity for both roles, no trailers.
Product push: first attempt accepted. The remote advertised the exact product SHA.

Initial channels attempt: Playwright could not find its default Chromium in two existing browser helpers. The passing run used a task-local browser path pointing those helpers at system Chromium and pinned Node.
The changed private-channels journey and typecheck had passed at push time. The other cases in the channels file finished after the push.

pnpm run test:channels, exit 0

```text
ok 1 - INTEG-002 SUB-014 SUB-015 NOTIFY-011 NOTIFY-012 UPDATE-013 — Private channels deliver the selected publication once with literal text and punctuated links
ok 2 - INTAKE-005 INTAKE-006 INTAKE-007 INTAKE-008 — Authenticate monitor evidence, retain private drafts and reconcile saved Uptime mappings
ok 3 - INTAKE-001 INTAKE-005 — Connect Another tool and send its copied sample request
ok 4 - AUTO-001 INTAKE-014 INTAKE-011 INTAKE-016 INTAKE-010 INTAKE-009 INTAKE-008 INTAKE-005 INTAKE-006 INTAKE-007 UPTIME-008 UPTIME-009 — Connect monitors, review private alert drafts, publish and recover with durable integration evidence
ok 5 - Development ingress proofs are single-use and expire after five minutes
ok 6 - Development ingress refuses a forgotten proof once a full nonce set evicts it
ok 7 - Development ingress keeps serving new proofs while its nonce set is full
ok 8 - Development ingress holds exactly 10,000 nonces however many proofs it has accepted
# tests 8
# pass 8
# fail 0
# cancelled 0
# skipped 0
# duration_ms 888408.742577
```
