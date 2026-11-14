# SMS subscriber-flow sanitization maintenance

Repository: just-every/run-lamp
Branch: cloud/gr-mt-lamp-code-14
Commit: 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0
Tree: 25aeb97d4bd932802aa9ca5fb0d0aa8856ddf60d
PR: https://github.com/just-every/run-lamp/pull/377
Custody: PUSHED; this task did not land or deploy.
Blockers: No product blocker; exact-SHA Verify remains pending and no READY is claimed.

## Plan carried out

1. Refresh the fleet launcher, configure the fleet Git identity, credential helper and preserving commit hooks, and clone the declared repository with full history.
2. Read AGENTS.md, CLAUDE.md, TESTING.md and the relevant SMS contract requirements. Trace the three reported assertions and their inputs.
3. Keep the change in the SMS subscriber-flow helper. Parse HTML text and complete URL identities, exercise escaped text in its existing public-door flow, and preserve production behavior.
4. Install frozen dependencies and the exact Node 22.20.0 / pnpm 10.12.4 toolchain. Run only touched checks and typecheck locally. Regenerate the source lock last and validate it.
5. Fetch main and rebase the unpublished candidate; it was already current. Commit with fleet author and committer identities and active hooks. Require COMPLETE/PASS publication inspection on the exact committed tree and inspect every candidate identity, message and trailer before pushing only the named branch through cloud-push.py.
6. Open the required PR and use one exact-SHA REST watcher, with at least 300 seconds between requests. Return the full non-secret packet through the separate evidence ref and preserve the requested local result.json.

## Changes and alert disposition

Product changes: tests/e2e/helpers/sms-subscriber-flow.mjs and its sources.lock.json identity. No dependency, production source, UI, CONTRACT.md or generated view changes.

- Alert 18: fixed. Replace regex tag removal with parse5 text-node traversal. The existing incident publication now contains an ampersand and literal angle-bracket text; its permanent public page must reproduce that exact decoded wording.
- Alert 19: fixed. The HELP assertion extracts URL tokens, excludes the fixture serializer's final sentence period and compares the complete parsed support URL. A host substring is no longer accepted.
- Alert 20: fixed. The shortened SMS must retain the exact permanent URL for that incident. Every other extracted URL must equal the complete help-article URL; partial or lookalike destinations cannot satisfy this assertion.

The reported expressions are assertions over synthetic messages and real local Worker responses. They neither sanitize nor authorize production input. These source changes do not establish production exposure or claim server-side CodeQL alert closure.

## Validation and counts

- Existing smsSubscriberFlow passed, including incidentFollowSmsFlow and smsDeliveryReceiptsFlow, through the real local Worker, D1, R2 and signed callback doors. Only the documented Twilio HTTP edge is faked.
- pnpm typecheck, node --check on the touched helper, source-lock generation/check and git diff --check passed.
- Actual commands, exact source identity and logs are in checks.json, sms-flow.log, sms-runner.mjs and typecheck.log.
- Before/after: 93/93 registered cases, 10/10 assertion scripts, 103/103 total checks. No registrations added, removed, skipped or weakened.
- Three reported assertion expressions corrected. Clause status changes: none. No acceptance-point promotion is claimed.

The VM initially selected Node 24. Final checks used the exact Node 22.20.0 pin. Initial local runtime runs with inherited proxy variables stalled and their owned processes were stopped. Removing proxy variables only for the credential-free local test allowed it to run. One completed attempt exposed the HELP sentence period; the extraction was corrected and the full affected flow passed.

## Publication and CI

Base publication scanner: rer 0.2.108, Gitleaks 8.30.1. Final result: COMPLETE/PASS, zero findings, environment matching enabled, source commit 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0, tree 25aeb97d4bd932802aa9ca5fb0d0aa8856ddf60d. It inspected 1,122 commits, 1,105 trees and 8,529 blobs plus the clean working tree. The default 300-second attempt timed out; a complete attempt then identified incorrect destination invocation arguments. The corrected --project just-every/lamp --repository https://github.com/just-every/run-lamp invocation passed. Both earlier actual reports and the final full value-free report are retained.

Product push: first-attempt success through cloud-push.py, only cloud/gr-mt-lamp-code-14. Every candidate author and committer is Run Edit Run fleet <fleet@runeditrun.com>; the commit has no trailers or CI skip marker.

Exact-SHA push Verify: 43604878280 still in progress; no green claim on 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0.
Run: https://github.com/just-every/run-lamp/actions/runs/43604878280
The watcher made 4 REST calls. Its first discovery had no advertised run; it waited the full interval before discovering the push run. Additional observed runs are recorded in the actual discovery receipt, including PR Verify 43604884040 and the successful PR #377 dynamic check 43604880392. No green claim is inferred from another SHA.

## Defaults, limits and preservation

No live Twilio credentials were supplied or used. Local fake-edge delivery proof is not live provider delivery, production deployment, CodeQL closure or landing proof. Existing clause judgments and generated summaries remain untouched. No UI browser proof was needed for this test-helper-only change.

The verified full-history bundle receipt is in bundle-receipt.json; the bundle itself is outside the clone and is not included in public evidence. The requested maintenance result.json is retained locally and copied byte-for-byte into this packet. Evidence publication uses only explicitly selected regular report/receipt files, a report-only tree and refs/heads/evidence/gr-mt-lamp-code-14.
