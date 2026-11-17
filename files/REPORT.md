# Lamp settings owner journeys
Author: Run Edit Run fleet
Date: 2026-11-17 UTC
Tag: sd-lamp-settings-1
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-settings-1

The two requested owner journeys are fixed. Settings → Operators asks for an
invitation role and explains all five choices. Communicator is the default,
the least role that can publish updates. The selected product role is saved
in the native invitation transaction before mail is sent, and acceptance keeps
it. Owner/Admin restrictions and removal/erasure checks remain in place.

Settings → Look explains how to enter the accent colour beside the field.
Invalid text stays editable, exposes an accessible field error after leaving
the input, preserves the saved swatch and offers no ineffective Retry.
Typing a valid colour or using the picker saves normally and survives reload.

## Plan and scope

The full execution plan is PLAN.md. Read the launcher, inline builder rules,
Lamp AGENTS.md, contract and generated acceptance context, local launch
instructions, auth composition and affected settings. Reproduced both faults
on the built main app at 1440 and 390 before changing them. Implemented only
the invitation-role and accent-field journeys, extended their public-door
checks, documented the behavior in one short owner paragraph, then typechecked,
checked the contract views and regenerated the source lock last. All reports
and browser artifacts stay outside the product tree.

Existing fixtures now request their intended privilege explicitly:
the recovery Owner, the channel-managing and audit-reading Admins, and the
shared administration/attribution actors. The reminder journey keeps its invited
Communicator and switches to the original owner only for the audit read.
Their existing security, erasure, attribution and history assertions remain.

## Before and after

Both original widths reproduced an Owner invitation and accepted Owner session.
Both now show Communicator by default, Communicator on the pending row and
Communicator after acceptance; the colleague has no remove/erase controls.
The built journey proves the default role can publish an update but cannot
remove or erase the owner. Separate selected-role cases prove Viewer,
Responder, Admin and Owner survive invitation acceptance and reload; an Admin
cannot issue an Owner invitation. Omitting the API role also defaults safely.

Both original widths showed the raw schema name and Retry for “navy blue” and
changed the swatch to black. Both now show help next to the field, keep the
saved swatch, expose no Retry and retain #1F3A5F after correction and reload.
Both changed screens fit at 1440 and 390 without horizontal overflow.
before-receipt.json and after-receipt.json retain the actual observations.
PNG files retain the built-page proof.

## Checks and counts

local-checks.json contains the commands, actual outcomes and relevant log names.
The repository inventory counts 102 → 103 test registrations plus 10 unchanged
assertion scripts (112 → 113 total). One existing invitation journey is extended;
one new accent recovery registration is added. There are no copy pin tests.
Contract counts remain 244 clauses: 60 done, 129 partial, 55 missing.
Clause status changes: none. CONTRACT.md and its generated views are untouched.
No release/version metadata, rer pin, tags, or unrelated product areas changed.

## Limits and custody

The optional 12ui hosted helper required an account sign-in, so it produced
no design kit. These narrow functional changes retain the existing app styles.
The built fixture's brand preview images did not load before or after; this
is outside the two assigned findings and was not changed.
GitHub also reports 12 existing default-branch dependency vulnerabilities
(10 moderate, 2 low); this round does not change dependencies.
The cloud adaptation delegates the full publication scan and landing to the
fleet machine. No main/default-branch push, deployment, self-submission,
force-push, or inbox file write is authorized or performed.

Product SHA: 82d9833d8b6fe34a4e439ec5f27f1a9cb4951b21
PR: https://github.com/just-every/run-lamp/pull/405
Exact-SHA push Verify run: 44090059079 failed on the first candidate.
CI-CORRECTIONS.md explains the implicit-Owner fixture failures and their
corrections. All four failed jobs were read once. github-budget.json records
10/10 calls used; the corrected head must be reported PUSHED, without a READY
claim, because its Verify result cannot be observed within this task.
The terminal receipt records the corrected product SHA and local outcomes. Evidence publication is
report transport only and does not claim acceptance or landing.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).

## Corrected candidate result

The fixture correction is committed and pushed as
82d9833d8b6fe34a4e439ec5f27f1a9cb4951b21. All five previously failing
journeys passed locally with their original assertions. The final typecheck,
regenerated source lock/check, committed build and 1440/390 built-page proof
passed. corrected-receipt.json and corrected-*.png bind the final browser proof
to this head; earlier after-* files retain the first candidate's proof.

The first exact-SHA Verify failed on implicit-Owner fixtures. Their corrections
are described in CI-CORRECTIONS.md and retained failed-job logs. The final
candidate is PUSHED, without a READY claim: its exact-SHA Verify result is
unobserved because the ten-call GitHub budget has been used. No known local
check remains red. The remaining gate is successful exact-SHA Verify on the
corrected head, followed by the fleet machine's publication scan and landing.

No contract clause claimed; these are owner-journey fixes (DIRECT 87).
