# main-lamp-connect-guides-1

Repository: just-every/run-lamp
Branch: cloud/main-lamp-connect-guides-1
Candidate: 1d7f5db4e6429864d8aa553a5356c4c2c9f325b0
Pull request: https://github.com/just-every/run-lamp/pull/341

## Outcome

Chat links now offers an underlined on-site setup link. Each Social network
selection offers its own guide anchor: X, Bluesky or Mastodon. Detailed provider
instructions stay behind these links, in the existing Markdown docs site and
index; the cards retain their existing fields, actions and layout.

The chat guide now explains how an owner registers a self-hosted Slack app or
Teams bot, installs it, sets the actual Worker bindings and endpoints, finds the
correct command/private chat and confirms a one-time link in Lamp. The Slack
manifest now explicitly declares the commands Bot scope and bot-user feature.
This repairs a prerequisite the original manifest left implicit; Lamp still
requires no bot token and makes no Slack Web API call for these commands.

The new social guide covers X developer-app registration and a complete public
client PKCE helper to obtain the required user access token; Bluesky app-password
creation and PDS selection; and Mastodon instance registration, write:statuses
and personal user tokens. It distinguishes user tokens from client credentials,
explains X expiry without automatic refresh, and points to provider references.

## Reproduction and provider research

The authorized checkout was installed with rer setup using fleet owner entry,
then launched through rer dev. First-run setup was completed through the actual
browser with synthetic Harbour Cart details. Settings > Connected tools was
visited at 1440 and 390 before edits. Chat links and all three social selections
had zero setup links. The old chat guide incorrectly said Settings did not exist.
No provider account, live chat installation or live social delivery was used.

Current public provider documentation was checked independently against local
handlers and manifests. provider-sources.json records URLs, facts and limits.
Slack's commands scope reference led to the second real commit: explicitly
requesting the Bot scope and correcting the install instructions. Authenticated
provider consoles were not traversed. Mastodon guidance names the standard UI,
states that customized instances can differ, and links to official OAuth steps.

## Plan and execution

PLAN.md holds the full plan. Work followed these stages: native public-door
reproduction; provider research; existing docs/Settings edits; local focused
verification and browser proof; fresh-main integration and generated lock;
fleet commits and guarded branch publication; PR/exact-SHA CI observation;
separate report-only evidence publication.

The initial commit was immediately pushed as required for cloud preservation.
Before it, main was fetched and an identity-wrapped auto-stash rebase reported
up to date. Before the substantial Slack manifest correction, main was fetched
and merged (up to date), preserving the already published history. The source
lock was regenerated using node scripts/edition-authoring/cli.mjs lock and its
check after each product change. No force push or main push occurred. All
candidate commits were inspected, including reachable side parents; both new
commits use the fleet author and committer with no co-author trailers. Commit
hooks stayed enabled.

## Counts and clause status

- Chat setup links per view: 0 → 1.
- Social provider setup paths: 0 → 3.
- Published docs pages: 32 → 33 (existing chat guide expanded; one social guide added).
- Test registrations: 89 → 89; assertion scripts: 10 → 10; total: 99 → 99, below the 200 cap.
- New providers, runtime linking/posting changes and test edits: 0.
- Clause Status, Gap and Evidence changes: none. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged. No DONE claim is made.

This is newcomer guidance for the existing chat/social connections, not a new
acceptance claim for INCIDENT-014 or INTEG-002. The full publication scan remains
the fleet lander's responsibility; no cloud publication-scan result is claimed.

## Validation

- Final pinned-toolchain typecheck: pass (typecheck-final.log).
- Existing docs compiler and internal route/file/anchor checks: pass; 33 pages (docs-link-check.json). The docs runtime journey independently matched every published Markdown page.
- Source lock regeneration and check: pass (source-lock-write.json and source-lock-check.json).
- Final production build through cloud_run npx -y @runeditrun/rer build: pass (build-final.log).
- Existing operator/chat identity journey: pass. It creates codes in Settings, redeems Slack and Teams identities through signed synthetic provider edges, refreshes/reloads, rejects replay, removes both links and checks accessibility/overflow/hydration.
- Existing built-docs/runtime journey: pass. It visits the docs index and every page, verifies source-driven contents/navigation, and retains Hono/auth/public-host boundaries.
- Existing channels/social journey: pass on its environment-corrected retry. The first attempt stopped at a missing default Playwright browser executable; no product assertion failed. The expected executable now resolves to /usr/bin/chromium outside the clone. The unchanged retry exercises social account creation, credential concealment, defaults, explicit deselection, removal, delivery/thread/retry behavior and accessibility/overflow. All provider network edges are synthetic.
- Browser proof on the exact final product head: Chat links, each social choice and both guides at 1440 and 390; 12 observations, no page errors or horizontal overflow. All four setup links reached their selected on-site guides/anchors and the docs index lists both guides. browser-proof.json binds the 20 before/after screenshot files by SHA-256.
- No new test registration, wording assertion, disabled hook, skipped test or full local verify was added/run. CHECKS.json records exact commands and initial/retry results.

## Scope and retained limits

All eight changed product paths are listed in product-provenance.json. No fleet
report, receipt, screenshot, credential, environment file or test registration
was committed to the product branch. Screenshots and reports live outside the
clone and return only through evidence/main-lamp-connect-guides-1.

Live provider registration and delivery remain unexercised. The guides state
that saving a social credential does not validate a post; Teams link confirmation
is Refresh chat links because Lamp does not send an outbound Connector API
reply; X access tokens expire and Lamp does not refresh them. These existing
runtime boundaries are documented without changing their implementation.

## CI and final custody

Push Verify run **43267894583** completed successfully on
**1d7f5db4e6429864d8aa553a5356c4c2c9f325b0**, observed at 2026-11-12T17:38:08Z.
The PR Verify run **43267908323** also completed successfully on that exact SHA.
The final product branch is pushed and eligible for READY under the stated
cloud contract. PR #341 remains open for the fleet; no main push, merge to main,
production deploy or publication-scan claim was made.

The earlier f9bba166685b93ea6d05c8f5ce06d4e055369b2d discovery recorded push Verify
43267125888 and PR Verify 43267194975 in progress; those are superseded and are
not claimed as the final result. The final-head watcher made four status polls,
with at least 300 seconds between observations. Total GitHub API invocations:
9 (PR creation; two discoveries; four final-push polls; final PR Verify status;
PR description update). No failed CI log downloads or reruns were necessary.

Blockers: none. Live provider-account proof remains outside this guidance brief.
The complete packet is published separately to
refs/heads/evidence/main-lamp-connect-guides-1. Evidence transport does not claim
acceptance or landing. The product clone can be removed after that publication;
the external packet and pushed product/evidence refs retain the work.
