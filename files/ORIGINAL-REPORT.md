# Lamp deliberate mail-off adoption

Author: Run Edit Run fleet (Codex), 2026-11-15.
Repository: just-every/run-lamp. Product branch: cloud/main-lamp-mail-off-1.

## Plan

1. Configure fleet Git identity, refresh the launcher, install bundle-only Git authentication, push guard and clone-local forwarding commit hooks.
2. Clone current Lamp main, adopt sd's rer 0.2.118 dependency change, and read Lamp's native deployment, runtime, auth and mail journeys together with Base's published mail-off contract and foundation facade.
3. Carry explicit MAIL_PROVIDER=none through native configuration, deployment preflight, setup/deploy declarations, setup choices, management resource plans and runtime. Preserve input checks for enabled providers and reject contradictory sending credentials. Never infer none from an absent/deferred selection.
4. Keep Base operator-auth's honest unavailable email/invitation result, explain guarded owner-terminal sign-in on the existing sign-in screen, and retain pending operations alerts without blocking status operations.
5. Extend existing public-door journeys, exercise configuration/preflight refusal cases, incidents/maintenance/public page and private operator protection. Prove rer signin with the fake Cloudflare edge and actual ownership receipts. Run touched tests and typecheck; capture the sign-in screen once at 1440 and 390. Do not run full local rer verify or a real deployment.
6. Merge fresh main after the published save, preserving newer source judgments and generated views. Regenerate the source lock last, check it and commit the final candidate without a skip marker. Inspect every candidate author, committer and trailer before guarded pushes.
7. Open the repository-required PR, discover/poll exact-SHA Verify using the REST API within the ten-call budget, and report only that SHA's actual result. Publish actual non-secret reports and receipts on the separate evidence ref.

## Scope and policy

No release version bump, CHANGELOG, VPAT or release-history change. CONTRACT.md statuses, gaps and evidence remain with the fleet lander. No hosted local-dev entry or hosted token disclosure. No real mail, provider account or deployment used. No evidence is committed to the product branch. Existing mail-dispatch and scheduled-update worker loops are retained; no required delivery loop is reclassified as optional.

## Source reading

- rer 0.2.118 cli/README.md, production-mail.mjs, signin.mjs and deploy-kit/owner-signin.mjs.
- Foundation facade: runeditrun/base, foundation/template/src/mail.server.mjs, read through gh api. It returns no sender for explicit none; Lamp adopts that behavior through its native UnavailableMailSender.
- Lamp AGENTS.md, CONTRACT.md, ACCEPTANCE.md, deployment ownership and native mail/auth/management code.

## Results

Candidate: `46fa4e5275960b72f895611b9cacab3539839c62` on `cloud/main-lamp-mail-off-1`, based on main `f495b89afd9f6832e4d4807018d91fa4c4670147`. Product version remains 1.11.18; rer moved from 0.2.108 to 0.2.118. Published save: 481f21271d15fe39cbe4dbb47f1407e4bc3c1c76. Application/proof commit: aa6335e987950bb1f80be13d70b1db4e687b9191. Final metadata/lock commit: 46fa4e5275960b72f895611b9cacab3539839c62. All three product pushes succeeded on the guard's first attempt.

All 9 tests in the two touched files passed with no skips. Native and management TypeScript checks passed. Production build, local setup, complete native mail-off deployment dry run, contract-doc check, verification-plan check and regenerated source-lock check passed. No full local rer verify ran. The dry run made no Cloudflare request and changed nothing remotely.

Test inventory: 98 → 101 registrations, plus 10 assertion scripts, hence 108 → 111 total checks (cap 200). Clause status counts remain 60 done, 129 partial and 55 missing; no clause Status, Gap or Evidence was edited. No generated ACCEPTANCE.md or docs/CLAIMS.md was committed.

### Proof items

1. `tests/e2e/rer-mail.test.mjs#A deliberate mail-off deployment passes native configuration and Base preflight; enabled and contradictory inputs still refuse`: no sender, key or DKIM is needed with explicit none; generated runtime provider is none; missing/deferred selections remain enabled/refused; each enabled native provider still refuses a missing key; contradictory sending inputs refuse. `DEPLOY-DRY-RUN.log` records the complete actual rer deploy dry run passing with no mail input.
2. `tests/e2e/rer-mail.test.mjs#Mail-off keeps email unavailable, operator alerts pending and status work usable without exposing hosted sign-in shortcuts`: known and unknown email-link requests return identical 503 mail_unavailable; first and repeated invitations return identical unavailable results, never a sign-in token or sent claim; operator alert dispatch is visible as unfinished failure; no mail provider is contacted.
3. The same native journey creates/publishes an incident, creates and starts maintenance, reads both titles from the public page, advances scheduled work and reads protected operator APIs. This also proves mail-off runtime metadata, no local subscriber confirmation and no local-dev routes.
4. `tests/e2e/rer-mail.test.mjs#The built hosted mail-off sign-in screen offers guarded owner guidance and protects private documents`: real production Worker redirects signed-out private documents to sign-in, exposes no email-link or token input, and names rer signin. Behavioral assertions run at 1440; screenshots show the changed screen once at 1440 and 390. Both actual PNG files are included.
5. `tests/auth-adoption/dependencies.test.mjs#ACCESS-002 mail-off rer signin follows native deployment custody and rer deploy --rotate-secret INSTALLATION_KEY preserves access while retiring the old key`: real rer CLI against the fake Cloudflare network edge, using native Lamp deployment ownership records. Missing/wrong deploying credentials, missing records, wrong account/project/environment/Worker, incomplete receipt and replaced live Worker refuse. A grant signs in the recorded owner once, only a digest is stored, issuance creates no account/session and consumption creates a native Base session. The existing session and dependency-key rotation assertions remain. Empty credential replacements clear any old sending credentials rather than preserving them on a Wrangler redeploy.

### Limits

Synthetic local Worker and Cloudflare-edge proof only; no hosted installation, live mailbox or provider account was used or qualified. No Base change was needed. Required dispatcher and scheduler loops remain enabled; no required mail operation is declared successful while email is off. The existing source contract describes the older session-secret terminal flow, so only overlapping acceptance point 3 is claimed here for guarded rer signin. The lander retains clause judgments and runs the required gate and full publication scan.

CLAIM ACCESS-001 PARTIAL points=3 tests=tests/auth-adoption/dependencies.test.mjs#ACCESS-002 mail-off rer signin follows native deployment custody and rer deploy --rotate-secret INSTALLATION_KEY preserves access while retiring the old key
DEFAULT ACCESS-001: Explicit none uses Base's guarded owner-only rer signin with deploying credentials and recorded deployment ownership; missing/deferred provider selection never disables email.


### Final metadata correction

The final follow-up commit removes the last contradictory “hosted mail must be configured” description in seed.json and records the authorized behavior in DIVERGENCE.md. Application code and tests did not change after the 9/9 run. The source lock was regenerated and checked again after these metadata-only edits. The earlier Verify run 43727957572 on aa6335e987950bb1f80be13d70b1db4e687b9191 was superseded without a READY claim. Final candidate Verify is 43728430669 on the SHA named above.

Draft PR for the required fleet gate: https://github.com/just-every/run-lamp/pull/391, targeting main with product head 46fa4e5275960b72f895611b9cacab3539839c62. No merge or main push was performed.

## Terminal CI result and blocker

At 2026-11-15T15:31:15Z, exact-SHA push Verify [43728430669](https://github.com/just-every/run-lamp/actions/runs/43728430669) completed with **failure** on `46fa4e5275960b72f895611b9cacab3539839c62`. The ten permitted GitHub calls were exhausted: three source-read attempts (one wrong-repository 404, then the correct Base tree and facade), two exact-SHA run discoveries (the first application candidate was superseded by the final metadata correction), one PR creation and four status polls. Every status poll for the final run was at least 300 seconds apart, with one watcher.

Failing job and step are **unknown**: no failed-job listing or log archive was read because the API budget was exhausted on the terminal status call. No failed job was retried; its touched/untouched scope could not be diagnosed. No cause is inferred from the successful local checks. This result is not green and does not qualify READY, including under the generated-view exception, which cannot be established without the failure details.

Product custody: all three commits are pushed to cloud/main-lamp-mail-off-1, head 46fa4e5275960b72f895611b9cacab3539839c62. Draft PR: https://github.com/just-every/run-lamp/pull/391. No main push or merge was performed. All local touched checks and the synthetic native dry run passed; the exact-SHA CI failure remains a real landing blocker. The lane needs a fresh-budget job/log diagnosis and the required gate before it may land this candidate. The source checkout is clean and all product work is preserved on the remote branch. Evidence publication conveys reports only, not READY, acceptance or landing.

BLOCKED branch=cloud/main-lamp-mail-off-1 head=46fa4e5275960b72f895611b9cacab3539839c62 Verify=43728430669 failure; ten-call GitHub budget exhausted before failing-job/log diagnosis.
