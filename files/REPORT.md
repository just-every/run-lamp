# Lamp notification provider settings

Product repository: just-every/run-lamp
Branch: cloud/main-lamp-notification-providers-1
Candidate: b56e150a97150f0582fbc0973aff867924f98ca5
Base after pre-publication rebase: b2ba93174222d086693aa6e137c598ff7b51c951
PR: https://github.com/just-every/run-lamp/pull/342

## Reproduction and changes

A fresh local installation was prepared with the required rer setup command and launched through rer dev. The one-click owner entry and first-run UI created an invented Harbour Cart page. Settings → Notifications reproduced both reports: Email delivery said Primary provider: SendGrid while the actual transport suppressed local email, and email/SMS setup pointed only to unnamed hosting settings. The initial API returned a provider name without local or credential availability. The actual reproduction receipt and 1440px/390px screenshots are retained in this packet.

Email settings now receive the already-composed runtime sender's availability and local mode. A local suppressed sender exposes local=true and primaryProvider=null. A hosted sender without required credentials exposes local=false and primaryProvider=null. A configured hosted sender retains its actual primary provider, including the transport's implicit Resend selection when applicable; an extension is identified as a custom adapter rather than a built-in default. No sending, routing, retry, receipt or suppression logic changed.

Email delivery names MAIL_PROVIDER, MAIL_FROM_ADDRESS, MAIL_DKIM_SELECTOR and MAIL_PROVIDER_API_KEY, plus MAIL_SECONDARY_PROVIDER and MAIL_SECONDARY_API_KEY for a secondary. Managed and custom adapter installations receive their respective configuration locations. SMS delivery names TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN, plus TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE. The cards explain that these belong in the deploy's private input file or environment and require redeployment. Only variable names are displayed.

Three links reach on-site email, secondary email and Twilio guide sections. The subscriber guide now covers the private input file, provider-specific details, redeployment, status verification, managed/custom mail, SMS sender registration, callbacks and consent. Its existing unrelated guidance remains intact. DIVERGENCE.md records the presentation intent; sources.lock.json was generated with the documented command and checked last.

## Verification and counts

The existing local subscriber journey was extended, without adding a registration. It checks the authenticated Settings API and rendered local mode, follows provider links to real public guide sections, resolves linked deploy-step anchors, then performs the existing real public subscription, local confirmation, publication and suppressed delivery-log flow. New provider-state assertions use machine-readable state rather than fixed UI wording.

The existing hosted provider fallback journey now checks the actual configured primary, rejects a name without credentials as an active primary, verifies configured email/SMS states in the built operator UI, and follows the same real guide links. It retains owner selection persistence, three secondary-provider edge fixtures, frozen-envelope/reconciliation assertions and real primary acceptance in the delivery log. All provider traffic in those journeys is intercepted at the network edge; no real mail or SMS was sent.

- Typecheck: passed.
- Production build: passed, including a build on the candidate commit.
- Extended local subscriber journey: passed on the exact candidate.
- Extended hosted provider fallback journey: passed on the exact candidate, including the built-Worker browser flow.
- Contract document generation check: passed, current, zero prose errors/warnings.
- Source lock check: passed; source lock generated, never hand edited.
- Verification inventory: 89 registrations + 10 assertion scripts = 99 checks before and after, cap 200. No test-budget.json is present.
- Browser proof: changed Notifications screens at 1440px and 390px, local and configured-hosted cases. Final captures were collected on the exact candidate.
- Local view horizontal overflow: absent at both widths.
- Publication: the guarded product push succeeded on the first attempt. The fleet runs the full publication scan and landing gates.

Before/after: local active provider labels 1 → 0; actionable provider guide destinations 0 → 3; registered checks 99 → 99; contract status changes 0 → 0.

## Contract claim and boundaries

CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged. No DONE claim or clause status/gap/evidence edit was made. SETUP-001 point 7 is proven by the complete local publication and suppressed delivery journey. The local-sender half of point 8 is also covered; this round does not independently claim its database-free public-reading half.

CLAIM SETUP-001 PARTIAL points=7 tests=tests/e2e/maintenance-timezone.test.mjs#SETUP-001 SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications

This round does not qualify live mail, Twilio registration or carrier delivery, provider account authorization, other stranger findings, or unrelated clause rounds. No credentials, environment dumps, held-out material or screenshots are in the product commit. The report packet is published separately on evidence/main-lamp-notification-providers-1.

## CI custody

Exact candidate push Verify: 43267868089.
PR Verify discovered: 43267918226.
Discovery also returned PR automation run 43267910157.
One watcher observed the push Verify via REST at intervals of at least 300 seconds. Five GitHub calls were used in total (PR creation, discovery and three run observations), within the ten-call budget. Final outcome: completed/success on b56e150a97150f0582fbc0973aff867924f98ca5, recorded in ci-run.json and RECEIPT.json. READY requires completed/success on the exact candidate; evidence publication is not a landing signal.

Full implementation and publication plan: PLAN.md. Actual reproduction, test logs, lock check, inventory, identity audit, PR and push receipts, browser captures and candidate diff are explicitly selected for evidence publication.

## Execution notes

The initial new guide helper assumed every navigation returns a Response. Same-document anchor navigation returns null; this helper was repaired before the candidate commit, and both extended journeys passed afterward. An exploratory standalone browser-helper invocation stalled and was stopped by its recorded PIDs; the ordinary registered hosted journey then passed on the exact candidate. A diagnostic printed a private local dev sign-in link; the local server was stopped after proof, synthetic session state removed, and private launch logs excluded from this packet. The product and evidence contain no private sign-in links.

## Terminal product result

Exact-SHA Verify 43267868089 completed successfully. No blockers remain. All browser instances and the locally started development server were closed, and the product checkout was clean. The pushed checkout is retained only until the separate evidence transfer completes, then removed as requested. The fleet owns final publication scanning and landing; evidence publication itself makes no acceptance or landing claim.

READY branch=cloud/main-lamp-notification-providers-1 head=b56e150a97150f0582fbc0973aff867924f98ca5
