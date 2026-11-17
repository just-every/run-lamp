# Lamp deployment fault follow-ups

Run Edit Run fleet, 2026-11-16 UTC. Tag: sd-lamp-deploy-faults-1.
Repository: just-every/run-lamp. Branch: cloud/sd-lamp-deploy-faults-1.
Candidate: 14646dbd7d4087885cb776587aeaad2a0722bbb1.
PR: https://github.com/just-every/run-lamp/pull/398.

No contract clause claimed; these are deploy-fault follow-ups.

## Results and boundaries

1. **One command resumes migration application.** Previously setup invoked Wrangler once and immediately stopped if its ledger was incomplete. The pinned Wrangler 4.129.1 implementation iterates pending files individually; inspection found no fixed migration-count cap, and the original live provider clean-exit cause cannot be established from the shipped report alone. Setup now retries a clean partial apply within the same command, reads the ledger each time, requires progress and permits at most five passes. Each apply has a 180-second timeout, each ledger read 30 seconds. Every extra pass prints a plain continuation sentence. Failure names every missing migration and the no-progress or budget reason. Owner migrations and page settings only follow a complete core ledger. Existing migrations are untouched.

   The existing fake-edge journey now runs through `pnpm run setup:cloudflare`, with the real setup code and this checkout's 80 shipped migrations. A fake clean return after 56 applies resumes to 80 in the same command; a stalled apply stops at 0/80, and a small progress batch reaches the five-pass budget at 65/80. Both failures leave page settings unwritten. This is public setup command proof against a fake provider/Wrangler boundary, not a live Cloudflare deploy.

2. **Custom-prefix owner lockout prevented.** Lamp's rer deployment hook refuses a nonempty LAMP_RESOURCE_PREFIX that differs from lamp-<environment> before it can start a deployment subprocess. The diagnostic says to remove it and name the copy with --environment. A same-target prefix is harmless and remains usable; dry runs remain available. Documentation explains that a custom prefix and rer's deploy-owner claim cannot be combined until rer follows the recorded Worker. Base was not edited. A hook-entry refusal probe confirms zero deployment commands started. An additional full CLI probe with a network-denying preload stopped in its pnpm prerequisite probe; it is not claimed as full CLI refusal proof.

3. **Public settings and source adoption.** Installed exact @runeditrun/rer 0.2.121 with pnpm. Refreshed copied Base source from f2737d02a5f77be042cfdfd237a7dce4689cbe2f using the one permitted public read-only blobless Base clone; no REST-per-blob refresh. Declared MAIL_PROVIDER and LAMP_RESOURCE_PREFIX public with defaults and optional transport, including the actual native adapter declarations hosted-check.json and hosted-check-managed.json. Wrangler's public MAIL_PROVIDER default and native configuration now agree on none. The prior implicit Resend default is intentionally replaced by the brief's explicit mail-off default; enabled providers still require credentials and contradictory none-plus-credentials inputs still refuse. `rer check` exits zero. The synthetic dry run exits zero and prints lamp-faultsproof, lamp-faultsproof-db, lamp-faultsproof-files and lamp-faultsproof-jobs. No provider request occurs in this dry run.

4. **Mail-off presentation and guidance.** Overview says “Email is off for this installation” without flagging deliberate mail-off as a failure; the email subscription readiness check is omitted. Published pages omit the unusable email form and say email subscriptions are unavailable, preserving other available channels. Existing mail journeys cover disabled mail, enabled-provider validation, pending operator obligations, protected hosted pages, first-run Skip/Read website and Settings. The production browser journey passes, with Overview/public proof at 1440 and 390. Native sign-in security and provider checks remain in place.

   Docs now use --environment to name a copy, describe the one-minute cron, use version-free wording for the repository's pinned CLI, and explain mail-off hosted owner access and the prefix limitation. Deploy step 2 already listed Workers Scripts, D1, Workers R2 Storage and Queues, each Edit, on fresh main; retained. RUN-LOCALLY.md and parts of deployment-reference.md already had the version-free pin wording; retained. Removal remains resumable rather than adding a new removal retry loop: docs explicitly say that a second identical run may be needed while Worker deletion or a large R2 purge becomes visible to immediate readback. Native removal code was not changed.

5. **Fault 8:** still open for R2 snapshots/<version>; SnapshotCache already replaces its current retained generation transactionally. R2 writes new version prefixes without deleting old ones. A safe fix needs bounded cursor-based retention that preserves current/in-flight generations and protects ongoing publication/reads; it is beyond a few-line change and was not implemented here.

## Counts and contract

Registered cases: 101 before, 101 after. Assertion scripts: 10 before, 10 after. Total: 111 before and after. No new registrations, no pin tests. Contract status unchanged: 60 done, 129 partial, 55 missing, 244 total. No CONTRACT.md, ACCEPTANCE.md or docs/CLAIMS.md edits. No round-owned version, CHANGELOG, RELEASE.json, seed.json or tag changes relative to fresh main; the merge retains main's release 1.11.20 metadata.

## Verification and custody

- Typecheck: passed.
- `rer check`: passed (exit zero; normally silent).
- Existing setup/deploy tests: 8/8 passed; public-command migration retry journey also passed after its command-door update.
- Final touched mail tests: 4/4 passed, including production browser at the changed screens.
- Production build: passed. Local noninteractive setup: passed.
- Source lock regenerated last in each source commit and its check passed. Contract document check passed unchanged.
- Full `rer verify`: running at initial report creation; final result is in RECEIPT.json and the appended terminal results below.
- Exact-SHA branch Verify: run 43983067006 for ace110719656648dfe1bbe2b6844ea0f03fc5a55; duplicate PR Verify 43983073603. Earlier runs 43981586131/43981594816 (3d440dd), 43980726433/43980737286 (66aa0e9) and 43980508104 (dc5efca) are superseded; no green is borrowed from them. Final status is in RECEIPT.json and terminal results below.
- 9 product commits were pushed using the supplied guard with fleet authors/committers and no co-author trailers. The first save used [skip ci]; the candidate does not. Fresh main was fetched and merged after publication (already up to date); no rebase of published history, force push, main write, release or tag.
- This cloud does not perform the fleet Mac's publication/landing scan. The fleet reruns publication and exact-main gates before landing. Evidence publication is report transport only and is separate from product READY/PUSHED custody.

The dry-run proof initially found that only changing deploy.json left native resource names redacted; the actual adapter declarations were corrected and the rerun shows the names. An earlier browser attempt overlapped a rebuild and timed out on a subsequent navigation; the stable-output rerun passes. The mail-default assertion was updated for the explicitly requested none default while keeping enabled-provider and contradictory-input refusals.

The full ordered plan is PLAN.md. Actual detailed results and artifact hashes are in RECEIPT.json, counts.json, the selected logs, and browser-proof files. No live provider deploy/removal is claimed, and no provider credentials were used for proof.

## Final integration

Fresh main advanced to 626388f with release metadata. Merged it without rewriting published history, regenerated the source-lock conflict, and passed source/contract/structural checks. Release metadata changes belong to main; this round has no release metadata diff against fresh main. The native browser fixture now explicitly chooses locally suppressed enabled mail; the unchanged Cutover invitation journey passes (108.3 seconds). Existing direct-provider fixtures likewise select Resend explicitly. No assertion was deleted or skipped.

## Broader local verification findings

The original full local rer verify was stopped after its known failures rather than running redundant unrelated shards further; only its own descendant PIDs were signalled (local-verify-stop.json). It began before the fixture corrections and main merge, so it is not an exact-final-SHA green result. Mail-dependent native fixtures now explicitly select enabled mail. The fresh focused publishing rerun passes audit attribution and the complete operator publication journey with unchanged assertions (2/3). Its remaining failure is THEME-001: five own-origin requests (CSS, header image, mark, script, favicon) versus a four-request budget. The page's favicon link and theme budget assertion are unchanged from main; this is outside the deployment lease, and neither the assertion nor unrelated asset behavior was changed. It remains an unresolved verification finding, subject to final exact-SHA CI. Fresh build, scoped rer verify (ownership plus hosted-output checks), and final browser proof are being collected sequentially on the final head.

## Terminal results — 17 November 2026 UTC

Product custody: PUSHED, branch cloud/sd-lamp-deploy-faults-1, head 14646dbd7d4087885cb776587aeaad2a0722bbb1. PR #398 remains open. This is not READY: the final head's Verify has not been polled after the ten-call GitHub budget was exhausted.

The observed prior candidate 8d029bf50529cc9086992700ff983928475c4f54 has Verify run 43984818749 and PR Verify 43984825835. At the last jobs read, plan, build, ownership, imports, demo, portability, delivery and public succeeded, runtime failed, and composer was still running. Runtime job 133710922491 failed with `Undeclared public build variable: LAMP_RESOURCE_PREFIX`. Its failed log was retrieved exactly once with the required gh archive command. Both product packaging declarations now include that public variable; the existing packaged-installation journey passes with the corrected declaration bytes, proving artifact construction, bootstrap, publication, restart, retained reads and protected preview. That correction and a fresh source lock are in the final pushed head. No green result is borrowed from the old head, and no additional GitHub calls were made after call 10.

Final local checks: typecheck passed; rer check exited 0; Base copies verified offline; source lock and contract-doc checks passed. Scoped `rer verify` with LAMP_VERIFY_SHARD=ownership exited 0 on 8d029bf, including all ownership tests, hosted-output, section hydration and statement size/growth checks. The final production mail-off browser journey exited 0 on that rebuilt runtime and refreshed 1440/390 captures. Only packaging allowlists and their source lock changed between that runtime and the final head. The packaging regression then passed with the final allowlists (one existing registration, 12.1 seconds). Counts remain 101 cases plus 10 assertion scripts = 111, unchanged. Contract statuses and claims are unchanged.

The unchanged THEME-001 assertion also fails locally: five own-origin requests versus its four-request budget. Two other focused publishing cases pass after explicitly selecting enabled fixture mail. The favicon link and request-budget assertion are inherited from main; neither was altered in this deployment round. This is an unresolved out-of-scope finding for the lane, not a claimed fix or a green full local suite.

The first final scoped run was interrupted by an environment reconnection. Its orphaned processes became zombies; rer's PID check treated the dead operation as alive. Only this task's exact stale operation lock was removed, after verifying zombie state and inode identity. A subsequent scoped verification completed successfully. No live process was bypassed, no token was logged, and no Base code was changed for this VM issue.

No live Cloudflare deploy/removal or Mac publication/landing scan is claimed. The fleet must obtain successful exact-SHA required verification and its publication scan before landing. No default branch was pushed or fast-forwarded, and no release or tag was created by this round.

Fault 8: still open for R2 snapshot version cleanup; SnapshotCache already replaces its current generation. Safe bounded R2 retention must preserve selected and in-flight generations and is left for a separate fix.

No contract clause claimed; these are deploy-fault follow-ups.

An earlier standalone prefix-rotation probe timed out while the concurrent full verifier owned local state; the final successful scoped ownership verifier includes and passes that existing refusal assertion. The earlier direct setup and superseded CI/push logs are retained as history, not final-SHA green proof.
