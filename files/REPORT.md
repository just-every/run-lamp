# Lamp hosted managed-mail sender diagnosis and repair
Date: 2026-11-13 (UTC)
Tag: sd-lamp-hosted-mail-sender-1
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-hosted-mail-sender-1
Head: 4b798a0f28b030af1121a8fc9d93427affcb8dfa
Base: ecb56522a4a95ab8373551a5e7cde05f7148bb03
PR: https://github.com/just-every/run-lamp/pull/356

## Diagnosis (a): cause
Lamp owns this fault. Its owner-facing check was trying to treat the managed relay as a direct mail provider. The selected provider is rer, but the checker rejected every provider outside sendgrid/resend/mailgun/ses/postmark and demanded MAIL_PROVIDER_API_KEY. The production services pass that direct-provider key to the checker, while the managed relay transport uses its distinct installation credential MAIL_API_KEY. Even supplying a direct key would not have made rer pass that provider allow-list.

Evidence on this head:
- src/core/app/services.ts:259 supplies the direct-provider check inputs.
- src/core/app/mail.ts:14 resolves the platform-assigned MAIL_FROM; :31 constructs RerMailSender with MAIL_API_KEY, MAIL_FROM and MAIL_RELAY_URL.
- src/core/features/overview/sender-check.ts:75 is the repaired verification boundary; origin/main's same function contained the unsupported-credential error.
- src/core/features/overview/live-status.ts:72 stores either sender evidence or sender-failed evidence and caches it for a day; :105 exposes that state through the live owner API.
- src/core/features/overview/routes.ts exposes GET /api/app/overview and /api/app/overview/live. Settings Notifications uses SenderStatusLine; Settings Page uses YourPageFacts. Overview already had a managed-relay presentation exception, so that exception did not fix the underlying stored state or every display.

The supplied LAMP-SIGNIN-1 read-only receipt reports the exact false failure on a managed installation while its sign-in message actually arrived, plus an accepted subscriber confirmation. This task made no stage, production or provider request.

## Diagnosis (b): would subscriber and incident mail send?
The cached sender verification failure labels the owner view; it is not a gate in Lamp's sending path. A configured managed relay can submit subscriber confirmation and incident/maintenance mail despite that label. This is established by the send-path code and the synthetic public-door mail journey, not by an unperformed live send:
- src/core/features/subscribers/service.ts:95 requires a configured mail adapter, sender address and subscriber-token support; :270 submits confirmation through that adapter.
- src/core/features/deliveries/service.ts:178 requires a configured adapter, freezes the message, and :222 submits it. :380 suppresses notifications when the subscriber is not active.
- src/core/platform/mail/rer.ts:15 requires the installation credential, assigned sender and relay endpoint. :19 refuses an incomplete transport. The adapter uses Base's managed relay contract and retains rejection/uncertain-submission, durable idempotency and provider receipt handling.
- modules/mail/README.md:128-155 says the platform assigns the public sender/endpoint and private installation credential; managed owners do not enter them. The relay owns sender and installation identity; requests cannot choose an arbitrary From.
- The new public-door test proves a recent obsolete failure becomes managed/verified without sending a check message and that public /subscribe can submit its confirmation to the synthetic relay edge. Missing managed or direct credentials remain failed with an instruction and cause no mail submission.
- The existing public-door mail journey still proves sign-in, subscriber confirmation, published incident notifications, frozen retries, maintenance notices and unsubscribe for rer, resend and sendgrid.

The pending subscriber in the supplied stage receipt would not receive incident notifications until confirmed. The existing confirmation, recipient-authority, configuration, relay authorization, provider authentication and delivery/idempotency gates have not been relaxed. A configured relay status is platform-authentication provenance, not a fresh credential-health probe or a claim of inbox delivery. Direct providers continue to run their domain-authentication checks; their provider retains sending authority.

## Diagnosis (c): fix owner and comparison
Fix owner: Lamp (lane sd). No Base or platform provisioning change is needed for this false status. A genuinely missing/revoked managed connection still belongs to the hosting administrator/platform and remains subject to the relay's authorization and send result.

Read-only comparison:
- HappyToHelp main, scripts/deployment/environment.mjs:41-53, explicitly distinguishes off/own/rer, removes outbound credentials for off, and returns rer without normalizing it into an owner-selected direct provider.
- The same file :71-80 validates managed inputs and assigned-address/version/endpoint constraints separately, returning before native direct-provider validation.
- scripts/installer/mail-deploy-policy.mjs uses that normalization for setup and requires the explicit own choice before binding owner credentials. This agrees with treating a managed installation credential differently from a direct domain-read credential.
- Base's vendored modules/mail/README.md:128-155 gives the same assignment/authority boundary. No Base source was changed. HappyToHelp was read only with gh api; it was not cloned or modified.
- comparison-receipt.json records SHA-256 identities of the two actual API-read sources.

## Implemented scope
Five files: the checker, live sender status, Settings sender wording, one focused public-door test registration in tests/e2e/rer-mail.test.mjs, and sources.lock.json regenerated last.
- Fully configured rer trusts the platform's assigned sender authentication and never requests its underlying provider-account credential.
- Managed evidence keys now include the managed trust boundary and configuration readiness, invalidating the obsolete cached failure immediately and preventing reuse across complete/incomplete configurations.
- Settings and the live owner API explicitly say authentication is managed by Run Edit Run and that this check does not confirm inbox delivery.
- Incomplete relay configuration and missing owner-supplied provider credentials remain failed and tell the owner what their hosting administrator must restore/set before redeploying.
- No send path, homepage, migration, contract status, gap, evidence cell or generated acceptance/claims view was changed.

## Plan and validation results
PLAN.md is the complete task plan. Its diagnosis, focused repair, public-door regression, touched checks, browser proof, lock generation, guarded push and PR steps are complete. Exact-SHA CI and report transfer are recorded separately in ci-receipt.json and the terminal evidence line.

LOCAL-RECEIPT.json contains actual commands and results; supporting logs are included.
- Regression against main production source: expected failure, actual state failed instead of verified.
- Candidate mail tests: 2 passed, 0 failed, 0 skipped. The new test is “Managed sender readiness clears an obsolete failure and enables subscriber mail; missing mail credentials remain actionable and unavailable”.
- TypeScript, JavaScript syntax, diff whitespace and source-lock checks: passed.
- Candidate production build: passed.
- Browser proof on the exact committed head: Settings Notifications for managed and missing-direct-provider configurations, plus managed Settings Page, at 1440 and 390. Six actual screenshots and browser-receipt.json; all external requests are denied, no external mail submitted.
- Before/after registrations: mail 1 → 2; repository 90 → 91. Including the ten assertion scripts, total checks 100 → 101, within the 200 cap.
- Clause status changes: none. Acceptance counts: unchanged. No clause claims.
- Product push: one real commit, without a CI skip marker; first-attempt success through the fleet guard. PR 356 remains for the lane; no merge or deployment.

## Custody and limits
The product head is pushed, not landed. Base's publication scan cannot run in this cloud task; the fleet Mac owns that independent exact-tree scan and landing gates. Branch Verify is tracked at the exact head only. No hosted installation was changed or live sending proven by this task. All test identities/transport credentials are explicitly synthetic, local session state is ephemeral, and every test runtime/browser is disposed. No production/provider contact, external mail, secret evidence or private gate material is included.



## Final CI and return receipt
Verify run 43464235673 (https://github.com/just-every/run-lamp/actions/runs/43464235673): completed/success on the exact product SHA; candidate READY. No CI exception was used.
Explicit GitHub API calls used: 8 of 10; one watcher, at least 300 seconds between polls. See ci-receipt.json and ci-watch.log.
PR 356 remains open for the lane. Product blockers: none identified by local checks; no deployment, landing or hosted acceptance claimed. Evidence publication is separate custody and is identified by its exact ref/head in the terminal report.
