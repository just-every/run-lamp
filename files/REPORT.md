# Lamp D13 / D14 owner journey fixes

Run Edit Run fleet, 17 November 2026 UTC. Tag: sd-lamp-design-notify-1.

Repository: just-every/run-lamp. Branch: cloud/sd-lamp-design-notify-1.
Candidate: aa25410deb9a5d8597c5a63779bff8ebcd20ee74.
Base: a6df8fc (fresh main; full base identity is in PRODUCT-RECEIPT.json).
Pull request: https://github.com/just-every/run-lamp/pull/411.
Exact-SHA push Verify: https://github.com/just-every/run-lamp/actions/runs/44120843965.
CI status: completed / success on the exact candidate SHA, observed 17 November 2026 at 16:21 UTC. Product READY custody is reported separately from evidence transport.

## Result

Overview now places the saved automatic maintenance plan under **Scheduled**, using the actual window bounds and configured page time zone. A future automatic start, completion or subscriber reminder creates no owner follow-up. Manual steps remain visible; a missed automatic start or completion appears with its saved time and a path to maintenance. The existing real scheduler still owns execution and recovery. No maintenance API, transition authority or notification delivery behavior changed.

Notifications now explains the actual sending state in plain language. The inactive From field is hidden; its saved address and all email/text deployment setting names sit in one collapsed **Details** section. The existing provider guide remains the setup destination. The quiet computer-only line appears only for a non-preview loopback public origin. A configured hosted email sender restores the From field and retains its provider preferences.

| Observed item | Before | After |
| --- | --- | --- |
| Follow-ups for a fully automatic window more than a day away | 3 future automatic items | 0; plan remains in Scheduled |
| Local inactive From field | Visible | Hidden; saved value in Details |
| Deployment setting names | Inline on provider cards | One collapsed Details section and the existing guide |
| Changed screens at 1440 and 390 | Captured | Captured; no horizontal overflow |
| Tests against fresh main | 105 registrations + 10 assertion scripts | 105 registrations + 10 assertion scripts |
| Contract totals | 60 done / 129 partial / 55 missing | Unchanged |

The initial checkout had 112 counted checks. Fresh main added three unrelated removal tests; this round adds no registration, so the correct round comparison is 115 to 115.

## Truthfulness decisions

Local mail is suppressed by the composed development transport. SMS readiness is independent: local email suppression does not guarantee that texts are off. The combined sentence therefore says “emails or texts” only when the SMS settings endpoint explicitly reports unavailable, otherwise it mentions only email. The future-email sentence refers to confirmed subscribers receiving published updates and says “can receive,” preserving consent, paused-effect and delivery-outcome boundaries.

The missed-start text directs you to maintenance rather than inventing a one-click Start action. An automatic window currently requires switching off auto-start before using the existing manual start door. The detailed code and runtime review is in BEHAVIOR-REVIEW.md.

Scope note: the existing SMS Support contact may still inherit the local placeholder sender address. That field/fallback predates this round and is left for a separately scoped change.

## Validation

Passed on the final source tree:

- TypeScript typecheck and production `rer build` through `cloud_run`.
- Existing AUTO-003/NOTIFY-006 public-door follow-up journey: future automatic start/end absent, saved Overview switches and times intact, missed automatic start/end present, real scheduler recovery removes them, manual steps and prior failure/dismissal/notification checks retained.
- Existing maintenance/time-zone browser journey: schedule with both automatic switches, inspect the actual saved bounds in Scheduled and an empty Follow-ups list at 1440, then preserve rescheduling, time-zone and public keyboard/accessibility checks. The same changed screen is captured at 390 for proof.
- Existing local subscriber browser journey: inactive From field absent, Details initially collapsed, provider-guide links resolve, and real local subscriber/notification/erasure behavior remains intact.
- Focused hosted notification browser probe using the existing helper without its unrelated incident-follow prelude: configured From field visible, setup guide reachable, secondary provider choice persists, real publication reaches the faked provider edge and its acceptance appears in delivery records. This is local network-edge proof, not a live-provider delivery claim.
- Existing compiled visual edits/publication browser journey, including the renamed Scheduled lookup: 1 passed, 0 failed.
- Source lock regenerated last and checked, including a clean post-test check; contract-document check: 0 errors, 0 warnings, generated documents current. CONTRACT.md and generated views are unchanged.

The initial maintenance assertion still waited for the future reminder removed by this change; it was corrected to await the empty Follow-ups state and passed. Initial local/hosted browser attempts overlapped source/build updates and encountered a connection reset and hydration timeout. The local unchanged-checkout rerun passed. A direct full hosted rerun hung during disposal and was terminated only by its own recorded PIDs; the focused stable-build notification probe passed. The committed full hosted journey remains intact, and the exact-SHA Verify workflow completed successfully. RECEIPTS.json retains these distinctions.

## Custody and scope

One product commit was created with the fleet author and committer, no trailers, active fleet/repository hooks, and no skip marker. All candidate identities and trailers were inspected before the first push. The guarded product push succeeded on its first attempt. Product work is confined to the leased Overview/Notifications code, focused existing tests, one short guide paragraph and regenerated sources.lock.json. Release metadata, rer pins, contract judgments and generated views were not edited. There are no merge commits.

Fresh main was rebased before the first commit. A redundant rebase attempt while the publication test temporarily changed its visual-edit fixture refused a dirty worktree; main had not moved, and the prior successful rebase already established the candidate base. The fixture restored itself, the final checkout was clean, and the terminal lock check passed. No published history was rewritten.

The full plan is in PLAN.md. Source hashes, product identity, browser observations, PR receipt and exact-SHA CI receipts are separate files in this packet. Fleet publication scanning and landing remain with the Mac lander; this cloud did not run that scan or push main. Evidence publication is report transport only and does not establish product acceptance or landing.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).
