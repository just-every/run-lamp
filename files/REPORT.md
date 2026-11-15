# sd-lamp-run1-faults-2 results

Repository: just-every/run-lamp. Branch: cloud/sd-lamp-run1-faults-2. Base: 9b4ec5e7f84715ef4cbed54c8a51ece72c6303ea.

## Problem and changes

Three independently reproduced defects are corrected:

1. A 1,305-character incident update imported through the native review/apply door previously appeared as a mid-word `processin…` cut, with the continuation in Additional details and the end discarded from the native fields. Statuspage and Sorry now store a bounded whole-word prefix and read the full original message from the applied import journal. The native detail/list and public current/archive readers use the same projection, so the shared renderer receives one complete message. Immutable native fields must match their sealed import value, and only unreversed, unerased applied provenance may supply it. Existing retained journals are supported without schema changes or duplicate source metadata. A native backdated update with real separate details keeps them, including beside imported history retained by conditional undo.
2. Statuspage maintenance previously imported zero of the synthetic window's three source messages. Sorry retained messages but rendered every lifecycle as Imported update. Both retain source message lifecycle in the existing source_states JSON column. The operator, permanent public page, monthly history and overview templates share Scheduled / In progress / Completed wording; Verifying maps to In progress. A Sorry management message whose authored lifecycle is absent stays neutral even when normalization can project its timeline from notice times. Old source_states arrays have no authored lifecycle field and keep the neutral label. No lifecycle notices are created and no historical notifications are sent.
3. A completed local owner's new session and direct setup document request already reached /app, but client history navigation to /setup reopened Welcome. The shared operator server loader now applies the same durable first-run completion guard as the document preflight. Fresh setup still completes through the existing full website/history journey; completed owners land on /app through local sign-in, GET/HEAD setup requests and client history navigation.

No migrations, homepage edits, click-to-set-up changes, release metadata, provider writes, company-instance changes, generated acceptance/claims edits or clause judgment edits were made. DIVERGENCE.md records the intended behavior; sources.lock.json is regenerated last.

## Plan and evidence

PLAN.md contains the full executed plan. Reproductions and after-results are actual non-secret files in this packet: incident-before/after.log; maintenance-before/after.log; sorry-maintenance-before.log; owner-reproduction.json, owner-after.json, OWNER-LANDING.md, owner-initial-test.log and owner-touched-test.log. The first setup suite attempt timed out in its existing history-completion wait while import edits were active; a stable full retry passes and preserves every assertion. Its failure diagnostics now include the actual save-message text.

The synthetic 1,203-character public browser fixture shows one complete incident message and three separately labelled maintenance messages. import-browser-receipt.json records public-door input size, counts and observed text sizes. The changed incident and maintenance public screens were viewed at 1440 and 390: wording 14px and document widths exactly match each viewport, with no clipped words or horizontal overflow. maintenance-operator-receipt.json and its two screenshots show the expanded operator maintenance timeline after real local sign-in and review/apply (15px labels, 13px bodies). owner-browser-receipt.json and the two owner-after screenshots show the admin landing at both widths (heading 40px/32px). Automated layout assertions are at 1440; the 390 screenshots are visual proof.

## Verification and custody

The full touched import suites passed 9/9 tests (308 seconds); the full setup journey passed 1/1; typecheck, source integrity and generated-document checks passed. Actual outputs and commands are recorded in test-receipt.json and its referenced logs. Product commit 65c6779fc0a4ead9eea1300785a4d372ce6a9047 was pushed successfully on the first attempt; PR https://github.com/just-every/run-lamp/pull/389 targets main. Exact commands/statuses are recorded in test-receipt.json and product-receipt.json. The initial Verify run was superseded by a follow-up test-only commit, 02ee8ab2b6f5a96eb49935d41d099d95975b4924. Final exact-SHA CI evidence is in ci-receipt.json. No broad local verifier or unrelated test suite is run; CI is the full wall.

Core counts remain 60 done / 129 partial / 50 missing / 239 total. Full target remains 60 done / 129 partial / 55 missing / 244 total. Agent surface remains 0 / 0 / 5 / 5 and Later 0 / 0 / 0 / 0. contract-counts.json records before/after. No clause is claimed DONE, so no held-out gate is claimed or requested. Builder claims: MOVE-002 PARTIAL points=none; MAINT-015 PARTIAL points=none; SETUP-002 PARTIAL points=none.

The Mac lander owns publication scanning and landing; this cloud pushes only its named product branch and a separate report-only evidence ref. Release lock Lamp 1.11.17 remains a landing constraint per the brief. Evidence publication is independent of READY/PUSHED and does not establish acceptance or landing.

## Large retained-journal regression

Final review expanded the existing incident regression with large, undocumented synthetic provider metadata. The native door retains a 13-chunk journal shared by multiple incidents and still reads complete source wording, separate owner details and conditional-undo history correctly. The committed reader already deduplicated job reads; no production change was needed. Actual probe output is chunked-journal-probe.log. The final follow-up commit only adds this regression coverage and its regenerated source-lock hash.

The production source tree in the final test-only commit is identical to the fully tested initial candidate. Public import browser proof was captured again on the final SHA; operator maintenance and owner landing captures remain from the identical production sources at the initial SHA. Source and test receipt filenames preserve actual observations; no CI success is inferred from local checks or another SHA.
