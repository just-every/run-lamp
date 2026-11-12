# Lamp readable records — main-lamp-readable-records-1

Repository: just-every/run-lamp
Product branch: cloud/main-lamp-readable-records-1
Initial main: 26cd67a3e41c0b12c7011348ae792e4007071bbc
Latest fetched main: b2ba93174222d086693aa6e137c598ff7b51c951

## Requested outcomes and changes

Removed subscribers retain anonymous delivery history, but the desk no longer prints the storage tombstone or its internal subscriber ID as a destination. One display helper covers the main directory, notification deliveries and subscription email history. No storage, deletion, retention or consent behavior changed.

The authenticated incident report resource includes the result of the existing Reports owing service. The incident panel uses that server result for its summary, optional report prompt and reminder waiver availability. A saved draft still indicates whether the report is owed. Published reports and waived reminders retain their prior display and behavior. The replaceable severity/seven-day policy itself is unchanged.

The intent is recorded in DIVERGENCE.md. CONTRACT.md, its clause statuses, Gap/Evidence cells and generated views are untouched. No DONE claim is made.

## Reproduction

Before editing the relevant source, launched through rer setup and rer dev with the private local owner entry, completed the first-run public setup, then added and locally confirmed ops@harbourcart.example through Subscribers / Delivery log. Removing it through the confirmation dialog erased its address, but the directory displayed deleted:<internal ID>. The before directory screenshots record the result.

A native incident claiming only Degraded performance was published and resolved through ordinary authenticated HTTP routes. Reports owing excluded it, while its incident panel said a report was owed and offered a waiver. Before screenshots and reproduction.json record this independent mismatch.

## Verification scope

The browser assertions run at 1440. The changed directory, delivery history and resolved report panel are shown at 1440 and 390. Screenshots use synthetic records and expose no private owner entry, session or injected credential.

Extended existing registrations only:
- Local owner subscriber journey: remove confirmed page and incident subscribers through the UI, check no removed address parts, subscriber IDs or tombstones in the visible desk, and compare retained non-identifying delivery facts. The deleted personal incident subscription remains absent, as under the existing erasure behavior.
- Existing operator publication journey: newly resolved severe and minor incidents offer optional drafting without an owed reminder action; webhook erasure leaves no private address or subscriber ID in visible desk text.
- Existing report reminder journey: minor incident stays excluded while both severe incidents cross the seven-day boundary; the incident report resource and Reports owing agree before/at that boundary and after publication/waiver; minor reminders stay silent. Existing weekly, waiver, historical import and publication assertions remain.

Baseline inventory: 89 registered cases + 10 executable assertion gates = 99 checks. Expected final inventory: unchanged, within the 200 cap. Contract counts before: done 60 / partial 129 / missing 55 / total 244. Clause statuses before: SUB-011 partial; HIST-003 done. No clause status changes requested.

## Plan and defaults

PLAN.md contains the full plan. Used the shipped polish essentials and kept the existing layout, field borders, condensed rows and control labels. No new icon-only controls or font sizes were introduced. The fleet lander owns the full publication scan and landing; this cloud writes neither main nor inbox files.

## Final custody

Initial product head: 016bb893f9a6f1e1c621527aec2442b2b16ae56e. Rebased onto b2ba93174222d086693aa6e137c598ff7b51c951 before the initial product commit and push. Source lock was regenerated last and its check is green; contract generator write reported zero changed documents and its check is green. All candidate authors/committers are the fleet identity; no trailers. Product push succeeded on attempt 1 through the fleet guard. Exact-head Verify run 43268652793 was discovered queued. PR and final CI conclusion will be recorded here before evidence publication.

The three touched journeys pass (3/3); the final subscriber journey repeats green (1/1) after adding its assertion that deleted personal incident subscriptions remain absent. A provisional additional test had assumed those subscriptions stayed visible; that assumption was corrected without changing product erasure or removing any original assertions. The actual investigation and final receipts are retained.

On the committed candidate, an additional browser check used the native historical-publication door to create a Major outage resolved more than seven days earlier. The incident resource and Reports both marked it owed. The reasoned UI waiver cleared both, retained its reason and left optional drafting available. The owed and waived states are shown at 1440 and 390, with owed-browser-receipt.json recording the result.

Before/after inventory: 89 registered cases + 10 assertion scripts = 99 checks, unchanged. Before/after contract totals: done 60 / partial 129 / missing 55 / total 244, unchanged. SUB-011 remains partial; HIST-003 remains done. No DONE claim or status edit.

## Builder claims (not status edits)

CLAIM SUB-011 PARTIAL points=3 tests=tests/e2e/maintenance-timezone.test.mjs#SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications; tests/e2e/publishing-browser.test.mjs#INCIDENT-001 INCIDENT-004 UPDATE-002 UPDATE-004 UPDATE-005 UPDATE-006 UPDATE-011 UPDATE-013 DRAFT-002 DRAFT-003 DRAFT-004 HIST-002 AGENT-005 SETUP-001 NOTIFY-019 — compiled visual edits and the operator publication journey
CLAIM HIST-003 PARTIAL points=1 tests=tests/e2e/update-reminders.test.mjs#AUTO-004 HIST-003 — both severe incidents become report-due at seven days and reviewed publication or reasoned waiver stops weekly reminders
DEFAULT SUB-011: Keep existing erasure and anonymous retained history exactly; render tombstones as a plain removed-subscriber label.
DEFAULT HIST-003: Use the existing replaceable Reports owing service, including the seven-day boundary and publication/waiver exclusions.
GAP SUB-011: This scoped round does not rejudge every operator-view acceptance point or change the existing partial status.
GAP HIST-003: This builder makes no DONE promotion; the existing done judgment is retained unchanged.


## CI correction and final candidate

The first exact-head Verify (43268652793 on 016bb893f9a6f1e1c621527aec2442b2b16ae56e) completed red in build, with only source:check failing. Its full failed-job log was downloaded once via the permitted gh archive command. Build, typecheck, contract docs and site build succeeded, but shards did not run.

Cause: the source-lock resolver uses tracked files, so generating the lock before staging the new display helper omitted its entry even though the pre-staging check passed. The committed-tree check reproduced the failure and the changes command identified only that missing entry. After merging updated main f1d878b (without rebasing published history), regenerated the lock against tracked files. The correction adds exactly that helper entry; the check now passes on the committed tree.

Final product head: 7bfb459185882497098b4fed00155f248874ce81.
Final exact-head Verify: 43269791457, in progress at discovery.
The final guarded product push succeeded on attempt 1. All three candidate commits, including the merge and its side ancestry outside main, passed fleet author/committer and trailer inspection. No feature source or touched journey source changed between the original passing local/browser proofs and this final head; the final receipt records that comparison.

The first workflow failed before shards, so its red result is not being reported as green. Final workflow result and PR custody follow below.
