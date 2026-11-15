# Lamp mail-off first-run fix

Run Edit Run fleet, 15 November 2026.

## Product custody

Repository: just-every/run-lamp.
Branch: cloud/main-lamp-mail-off-1-c1-fix1.
Head: b0162c2c961b38c1f42de12e28af8501c483d664.
Draft PR: https://github.com/just-every/run-lamp/pull/393.
Starts from the prior mail-off head 5e532d8ccf7bd122e74edbef4e803379d48d20e9. Main remained f495b89afd9f6832e4d4807018d91fa4c4670147 at the pre-publication fetch. No rebase or merge was needed. Two product commits were pushed, each successfully on its first guard attempt: 1b15506835b108bd8e200bba660948c6332953ee fixes the schema and journeys; b0162c2c961b38c1f42de12e28af8501c483d664 adds the existing hydration wait to the Settings assertion and regenerates the source lock. All six candidate commits (including all reachable parents outside main) have the fleet author and committer and no co-author trailers. Neither new head has a skip marker. No published history was rewritten.

## Plan and implementation

The complete working plan is PLAN.md. The sequence was to reproduce the gate's native seed through public setup and Settings doors, fix the shared cause, extend existing journeys without registrations, run only the named tests and typecheck, regenerate/check the source lock last, publish the named branch, obtain exact-SHA Verify and return the non-secret packet separately.

Native setup intentionally persists an empty string as the absent sender on MAIL_PROVIDER=none installations. Both first-run and Settings resubmit that value. The shared Zod schema previously accepted only an email address or omission, so both doors refused the installation's own initial state. The schema now accepts the existing empty representation as absence. Non-empty values continue through the same email validator. No migration, fabricated sender, provider credential, setup bypass or authentication change is introduced. DIVERGENCE.md records the requirement, and sources.lock.json was regenerated after the final source edits.

Across the two commits, this fix round changes only DIVERGENCE.md, src/core/shared/schemas.ts, tests/e2e/rer-mail.test.mjs and sources.lock.json. It retains the earlier round's changes, including deliberate mail-off selection, honest unavailability and pending alert work, guarded rer signin custody, rer 0.2.118 and canonical setup manifest. No version bump, release history, CHANGELOG, VPAT, generated view, contract judgment, deployment or external repository was changed.

## Reproduction and results

Before the fix, the extended built production Worker journey reached /setup with the native setupPageSettingsStatement(deploymentConfig(env)) seed, clicked Skip then Open Lamp, and received HTTP 400 Invalid page settings on mailFromAddress. The corresponding native Settings API save returned the same error. The actual expected-failure logs are before-first-run.log and before-settings-api.log.

After the fix, the existing built-screen journey creates a fresh migrated database for each of four cases: mail off after Skip; mail off after Read website; Resend after Skip; Resend after Read website. It seeds page settings using the native statement and never inserts setup_readiness. Only the established signed-in owner's native session is fixture authority; existing deployment/sign-in tests still prove the guarded rer signin flow. The browser presses the real completion button, receives Settings PUT 200, arrives at /app, checks durable first-run completion, opens /app, /app/incidents and /app/maintenance, changes Page name through Settings autosave and receives another PUT 200 with Saved status and no validation alert. Mail off stores no address (the native empty value); Resend retains its valid sender. A non-empty invalid Resend sender is refused with HTTP 400 at mailFromAddress, preserving the valid stored sender. Website and DNS responses are substituted only at the network boundary; no live mail or website/provider requests are required.

The existing mail-off API journey now uses the native setup statement and completes first-run through its ordinary Settings and first-run endpoints before its unchanged unavailability, pending-alert, publication, maintenance and hosted-auth refusal checks. Direct page_settings and first-run completion insertion were removed from that journey.

All 10 requested tests passed on pinned Node 22.20.0 without screenshot delays after the final test correction: tests/e2e/rer-mail.test.mjs (5), tests/e2e/independent-release.test.mjs (1), tests/auth-adoption/dependencies.test.mjs (4). Typecheck, production app build, contract-document check, source-lock check and verification inventory passed. No full local rer verify was run. Initial post-fix test work had a fixture-only failure because the new website case lacked DNS responses and expected an unnormalized host label; both were corrected before the passing complete rerun. That actual diagnostic is retained in initial-touched-tests.log. The first candidate then passed locally with browser proof enabled but failed CI because the new test filled a server-rendered Settings input before React was ready. The same failure was reproduced locally without screenshots (ci-repro-no-screenshots.log). The second commit uses the existing operatorHydrated helper and waits for the Settings inert guard to clear before editing. The full 10-test rerun without screenshots passed, followed by a fresh passing browser-proof run; typecheck also passed again on Node 22.20.0. No assertion was removed or timeout increased. Logs: final-touched-tests.log, final-typecheck.log and final-browser-proof.log.

Before/after counts: 5 → 5 mail registrations; 101 → 101 registered cases across the seed; 10 → 10 assertion scripts; 111 → 111 total checks. No registration, skip or weakened user-visible assertion was introduced.

Browser proof in browser/ shows first-run after Skip and Read website, the opened Overview and saved Settings at 1440 and 390. Assertions run at 1440; phone captures add no second assertion width. The existing sender-readiness wording and warnings remain unchanged, as the gate's C1–C3 follow-ups are outside this fix round. The fixture's public address answers synthetic HTML; the screenshot's subscription-form warning is fixture readiness, separate from Settings validation. No proof, receipt, report or screenshot enters the product branch.

## Clause claims and remaining gates

CLAIM ACCESS-001 PARTIAL points=3 tests=tests/auth-adoption/dependencies.test.mjs#ACCESS-002 mail-off rer signin follows native deployment custody and rer deploy --rotate-secret INSTALLATION_KEY preserves access while retiring the old key
DEFAULT ACCESS-001: Mail-off owner access keeps the existing guarded rer signin flow from the original deploying checkout with its deployment authority; email sign-in and invitations remain unavailable.
GAP ACCESS-001: This round retains the prior partial terminal-access claim; it does not claim all terminal-link acceptance points, live provider/deployment proof, or DONE.

Clause status changes: none. No Status, Gap or Evidence cell was edited. ACCESS-001 and SETUP-002 remain partial. Generated ACCEPTANCE.md and docs/CLAIMS.md are untouched; their check passed locally. The source lock was generated last and its CI check passed. Full publication scan and the required Opus re-gate remain the fleet lane's work before landing; evidence transfer is neither a landing decision nor a product READY signal.

CI: initial exact-SHA push Verify 43745111748 failed on 1b15506835b108bd8e200bba660948c6332953ee. Build and seven shards passed; imports failed only the new Settings autosave wait in tests/e2e/rer-mail.test.mjs, with the aggregate verify job failing consequently. The completed job archive was read once using gh run view 43745111748 --repo just-every/run-lamp --job 132906966142 --log-failed; transport succeeded. The failed log and job receipt are retained. Because it touched this round's test, the cause was corrected in a real second commit rather than rerunning the old jobs. The first final-candidate read at 2026-11-15T18:48:40Z found both Verify runs completed/success on b0162c2c961b38c1f42de12e28af8501c483d664: push run 43747447829 (https://github.com/just-every/run-lamp/actions/runs/43747447829), completed at 18:46:46Z, and PR run 43747453572 (https://github.com/just-every/run-lamp/actions/runs/43747453572), completed at 18:47:12Z. Six of ten GitHub calls were used; no old-SHA result or generic PR check was substituted for Verify. Final custody is READY for the fleet lane, subject to its required Opus re-gate and publication scan. The actual discovery and latest-run receipts are verify-discovery.json and verify-latest.json.

Product blockers: none. No real deployment or live provider account was requested or used. No ruling was needed. C1–C3, D1, D2, E1 and Lamp 1.11.19 release work remain outside scope.
