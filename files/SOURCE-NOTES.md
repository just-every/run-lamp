# Read-only source observations

The failed delivery shard is `test:channels`, not package script `test:delivery`: scripts/verification/plan.mjs maps delivery to test:channels and public to test:delivery.

Original assertion: tests/e2e/helpers/automation-rules-browser-flow.mjs:175, called by tests/e2e/channels-and-presets.test.mjs:491 (registration starts at :482).
Message: `the ended change is no longer offered for Undo`
Operator: strictEqual. Expected 0, actual 1.
The preceding steps click Undo, wait for the success message, read the native rule run and assert undoneAt and undoneByOperatorId. The failure is the immediate Playwright locator count for the ended run's Undo button.

src/core/features/intake/ui/alert-rules.tsx:87-88 awaits the undo POST, then calls runs.refresh() and immediately sets the success message. The active list at :124 filters cached runs by !releasedAt. src/core/app/client/ui/api.ts uses a nonce-triggered effect to fetch refreshed data. Thus the success message may be visible before the list refresh has completed. This is a source-supported observation-order hypothesis, not proof of root cause or a proposed weakening of the behavior assertion.

Candidate and observed main 75da4a858c901d96d103648d78dfba38eeb650ab have byte-identical test registration, automation browser helper, Verify workflow and verification plan, as recorded in source-comparison.json. No main reproduction is claimed from source equality.

Existing Verify exposes workflow_dispatch without inputs and always executes its plan; it has no single-test or arbitrary-command door. Other workflows perform independent release, release journeys, managed release, demo or site work, with no permitted single-test main reproduction input. GitHub-hosted ubuntu-24.04 jobs use disposable runners; job rerun preserves the original candidate SHA. The installed heavy-slot stand-in executes locally in this cloud VM and cannot access the ended hosted runner. A conditional main reproduction therefore needs the fleet's existing targeted runner/controller facility; this VM alone is not same-runner evidence. No other repository was cloned or modified, no remote-run controller was installed, and no full Verify was dispatched to work around that limitation.
