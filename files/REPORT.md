# Lamp AUD-005 public-host refusal

## Candidate

Branch `cloud/sd-lamp-c-f199` advertises `8e677b278745824c3b80a639b2798926765cdb68`. Its parent was main at the candidate push, `9d35f872ac5d654f1cfcd1cc41698e7363254b0c`. Main at report time advertises `9d35f872ac5d654f1cfcd1cc41698e7363254b0c`.

Exact candidate Verify is in_progress as of 2026-11-21T18:37:38Z. Run 44936069690 was triggered by the candidate push. [Verify](https://github.com/just-every/run-lamp/actions/runs/44936069690)

The full-history publication scan and the candidate’s main Run site remain with the guarded lander. For candidate `8e677b278745824c3b80a639b2798926765cdb68`, scan complete, historyScanned and findings are unestablished. The base had successful push Verify 44934802705 and Run site 44934802741.

## Plan and scope

1. Read AUD-005, its status row, the plan extract and DONE-RIDERS. Trace host dispatch, protected routing and page-scoped storage.
2. Extend the existing AUD-001 publishing journey with populated artifacts for Staff and Acme. Probe the same paths on the public host using both methods and three credential combinations.
3. Keep the existing refusal, ordinary public delivery and restore controls. Check the touched suite, typecheck, contract views, source lock and first-party profile. Push the exact candidate and record Verify separately from the evidence transfer.

The planner-return row for AUD-005 in sd-lamp-replan-43 has leased progress on acceptance 2. The remaining acceptance 1 inventory and future access, audience and subscriber isolation paths stay held under AUD-001 through AUD-004. The recorded AUD-001 outage remainder, adoption, release and UI prerequisites stay with their existing owners.

## Runtime proof

The existing test at `tests/e2e/publishing-contract.test.mjs:1274` loads `tests/e2e/helpers/audience-pages-flow.mjs`. Lines 324–354 publish distinct incident and maintenance data and assert populated roots, Atom and RSS feeds, history and component feeds, SVG and JSON status badges, component status and uptime badges, and native status, summary, component, incident and maintenance APIs. The 32 authenticated operator responses have expected content, a served snapshot version and positive object reads. Lines 109–141 assert the matching public-host responses. The matrix has 192 refusals across GET and HEAD, using the protected version-derived validator, the live synthetic operator cookie, and both together. Each response is 404 with zero object reads, no protected payload markers or full artifact bytes, and no ETag or snapshot metadata. HEAD has an empty body. The protected routes supply a version header. The journey follows the existing convention of wrapping that version as a weak If-None-Match validator when the response has no ETag.

The existing wrong-host Staff root, anonymous and revoked sessions, ordinary public feed with a protected validator, and native archive restore controls remain in the same journey. The new named-page maintenance is included in the existing notification silence inventory.

The read-only trace shows the host comparison before protected dispatch in `src/core/app/host-dispatch.ts:77` and the immediate 404 in `src/server.ts:98`. On the operator host, session and page checks precede reads in `src/core/features/public-snapshot/protected-routes.ts:21`. Page-specific object and retained-cache scope are assigned in `src/core/features/public-snapshot/scoped-service.ts:11` and `:28`.

## Acceptance and inherited duty

| Item | Result | Evidence |
| --- | --- | --- |
| Acceptance 1 | Held | Existing Staff isolation and public notification silence controls cover part of the requirement. The all-private-field fixture, private membership, private subscriber, and full public delivery inventory remain held. |
| Acceptance 2 | Leased scope passed locally | Positive and negative host paths in the existing publishing journey, helper lines 109–141 and 324–354. See the receipt for exact candidate Verify. Future AUD-002 through AUD-004 paths stay held. |
| BASE-ROLE-001 authority duty | Passed in the scope exercised | Active operator reads the scoped artifact. An operator cookie on the wrong host, anonymous request, revoked session and source session after restore cannot read it. Helper lines 109–141 and 376–405. |

## DONE-RIDERS

| Row | Result | Evidence |
| --- | --- | --- |
| 1 | Open for DONE | Acceptance 2’s leased host matrix runs. Acceptance 1 and the future doors named above remain held. |
| 2 | Pass for the lease | Native incident and maintenance fixtures, positive reads, and public refusals with zero object reads. Helper lines 109–141 and 324–354. |
| 3 | See receipt | The publishing tests are registered in the existing publishing shard. See exact candidate Verify, push event, in the receipt. |
| 4 | Pass | The receipt binds the local checks to the candidate source and tests. |
| 5 | Pass | BASE-ROLE-001 is cited by AUD-005 at `CONTRACT.md:2569`. |
| 6 | Open for DONE | Contract regeneration and freshness checks passed. The existing judgment and counts stay recorded pending the lander. |
| 7 | Pass | The candidate does not change acceptance text or the Status table. |
| 8 | Pass for the lease | Operator reads are positive and public and revoked-session requests are denied without reading objects. Helper lines 109–141 and 376–385. |
| 9 | No external proof claimed | Live provisioned audience and subscriber behaviour lies outside the lease. The publishing journey uses its existing synthetic provider edges. |
| 10 | No policy decision required | The existing host boundary and session policy define the tested result. |
| 11 | Pending guarded landing | Candidate is branch-only. Main equality, complete full-history scan and main Run site are for the Mac lander. |

## Before handoff

The first publishing-file run passed 11 of 12 cases. Its maintenance cancellation case needed an explicit Chromium path. That case passed on the exact candidate when rerun with system Chromium. The exact-candidate AUD-005 journey and typecheck also passed.

The diff extends the active test and refreshes only its source-lock entry. The notification inventory includes the added maintenance fixture. Existing assertions are preserved. The host refusal and revoked credentials are exercised through HTTP. The fixture also retains the existing source-session refusal after restore. Erasure and replay are outside this lease. There is no UI change, migration, provider-account action, or evidence file on the product branch.

Recorded counts remain 66 done, 123 partial and 56 missing out of 245. AUD-005 remains recorded MISSING, with a PARTIAL claim scoped to acceptance 2. The test inventory remains 119 registrations and 10 assertion scripts.

CLAIM AUD-005 PARTIAL points=2 tests=tests/e2e/publishing-contract.test.mjs#AUD-001 — native publication is visible only on selected status pages and silent for public subscribers when private

GAP AUD-005: Acceptance 1’s complete private-field, membership, subscriber and delivery inventory and acceptance 2’s future AUD-002 through AUD-004 paths remain held.

Run Edit Run fleet, 2026-11-21.
