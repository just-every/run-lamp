# Lamp port-race carrier

Repository: just-every/run-lamp  
Branch: cloud/sd-lamp-port-race-1-c2  
Fresh base at publication: b6d1d051f754d8bc331658d496566450562de8ac  
Source fix: 444322d07628c9ca5b94d6e3e84e248df4a7d7ce  
Candidate: 553d1cdf26c3f491e23334727c250717881b9f56

## Plan

1. Fetch Lamp main and the previous carrier. Branch from main and cherry-pick the single named fix using the fleet identity and hooks.
2. Confirm a linear candidate and compare the fixture patch with the previous carrier. Recompute the source lock against the new base.
3. Run the directly changed browser suites, the shared ingress fixture through an end-to-end consumer, the typecheck, and a forced collision against a real Vite process.
4. Audit candidate identity and trailers and push the named product branch. Confirm the exact-SHA Verify result and publish the report and receipts to the evidence ref.

## Replay and counts

- Main advanced during local verification. The unpublished replay was rebased onto the new main. The only differences between the tested tree and the rebased tree were the source lock and main’s separate incident-brief test. The candidate has one commit and no merge commits. The test patch has the same stable patch ID as the source fix. The replay kept main's UPDATE-012 publishing-refusal assertions.
- Regenerating the source lock produced the same bytes as the cherry-picked lock after Git merged in main's newer entries. The lock check and contract document check passed.
- The carrier adds zero test registrations and removes zero, relative to the fresh main. The three edited browser suites contain 13 cases before and after. Contract counts before and after are 66 done, 123 partial, and 56 missing out of 245 clauses. Core is 66 done, 123 partial, and 51 missing out of 240. Agent surface is 5 missing. Later has zero clauses.

No contract clause claimed; this is test-infrastructure maintenance.

## Product push

The named branch advertised the exact candidate SHA after the guarded push. The first transport attempt returned an authentication error and the second succeeded after the launcher refreshed the credential bundle. This was one accepted product push.

## Verification and handoff

All 13 cases in the changed browser suites have a passing local execution. The complete publishing invocation with the CI-pinned headless shell passed seven cases and hit a loopback fetch error in operator roles. The isolated operator-role retry passed on the published commit. The supplemental shared-ingress cases passed after the local toolchain was corrected.

Verify run 44903840279 completed successfully on the exact candidate SHA on attempt 1. The preceding carrier’s reference Verify was run 44898638320, attempt 2.

Run Edit Run fleet, 2026-11-21T12:41:35Z.
