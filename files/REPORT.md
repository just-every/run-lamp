# Lamp design rulings

Run sd-lamp-design-calls-1. Run Edit Run fleet, 2026-11-18 UTC.

## Plan

1. Build fresh main at ecd9b50c6af3b65bb68b231d942d6a5f51aeb43c. Check each ruling in the source and in Chromium at 1440 and 390 pixels.
2. Fix only the visible gaps. Preserve stored state values, component maintenance semantics, and delivered notifications. Check the exact timezone offset wherever a user opens Time details.
3. Extend the existing browser journeys to cover the changed behavior and rerun the relevant tests and build steps. Generate and check the contract views locally, then restore main's copies and regenerate the source lock.
4. Check candidate history and identity, push the named product branch, and inspect the exact-SHA Verify run. Publish the report, receipts, and browser proof to the evidence ref.

## Findings and implementation

| Ruling | Fresh main | Candidate |
| --- | --- | --- |
| D16 | Local Settings showed a Copy link button and reported suppressed email. | The local result explains the browser-only invitation and removes Copy link. The pending row retains the same-browser sign-in action. Hosted email is sent during a new invitation with mail enabled. The copy asks the owner to invite from that hosted instance. |
| D12 | The new incident picker already started blank. It combined Slow and Partly down, and a new attachment could not choose the partial state without a template. Attached choices and several customer surfaces displayed storage names. | A shared label mapping gives Working, Slow, Partly down and Down in the same order. The picker starts blank for a fresh choice. Partly down persists as the existing Partially unavailable state. Existing attached and template choices retain their actual values. Maintenance displays separately, and legacy manual maintenance remains available in Details. Overview, component lists and history, previews, alternate layouts and embeds read the same labels. |
| D8 | The new and existing draft composers used “What customers see” and “What customers see now”, respectively. | Both empty draft editors use “What customers will see next”. The published update label retains its role. |
| Time zones | The default public page and owner Overview showed numerical UTC offsets, including in the generation tooltip. Some planning controls named the city. | Owner and customer timestamps use the configured zone's name. Settings, public records and generation details disclose exact offsets. Delivery and feed output retain their absolute times and offsets. |

The implementation spans the operator invitation panel, incident composer, component settings and history, Overview, page settings, public snapshot renderers and the shared state and timezone formatters. Browser receipts record the state options and Draft, Overview and public status readings. PNGs use disposable fixtures and show the changed screens at 1440 and 390 pixels.

## Contract and counts

PAGE-009 retains its Partial judgment. Its text records named zones and offset disclosure on public screens, with absolute delivery and feed times retained. The release validator required one PAGE-009 change entry in RELEASE.json. The version and release history are untouched. CONTRACT.md generates the acceptance and claims views successfully. The Mac lander owns the checked-in generated views and final publication scan.

| Scope | Before | After |
| --- | --- | --- |
| Core | 60 Done, 129 Partial, 50 Missing | 60 Done, 129 Partial, 50 Missing |
| Agent surface | 5 Missing | 5 Missing |
| Full target | 60 Done, 129 Partial, 55 Missing | 60 Done, 129 Partial, 55 Missing |
| Test registrations added or removed | 0 | 0 |

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

## Verification and custody

The branch `cloud/sd-lamp-design-calls-1` is published at `d245ba342734095775ed5730dab1c850a841a6fb`. The follow-up commits preserve the legacy vendor mapping assertion inside Details and update the Brief and Suggestions assertions for the visible state labels. Each push passed the author, committer and trailer checks for every candidate commit.

On Node 22.20.0 and pnpm 10.12.4 the ordered build checks, Worker build, site build and source lock check passed. Local Chromium proof covered the four rulings at both requested widths. Existing passing journeys include local invitation, 390-pixel publication and recovery, owner incident communication, maintenance scheduling and accessibility, vendor mapping, and the public catalogue, live refresh and retained-history paths. All 19 public, publishing and retained-snapshot tests passed. Broader browser attempts had startup, hydration and response timeouts. RECEIPTS.json names the completed cases and records the unsuccessful attempts.

Verify runs 44239700783 and 44240163820 both concluded failure at `contract-docs.mjs check` because main’s generated ACCEPTANCE.md was retained. The build receipt was absent and the downstream shards skipped. The latest head has its own Verify result in RECEIPTS.json. The 10-call GitHub budget limited the latest observation. The lander regenerates the view and reruns Verify at landing.

- [Verify for the first published SHA](https://github.com/just-every/run-lamp/actions/runs/44239700783)
- [Verify for the second published SHA](https://github.com/just-every/run-lamp/actions/runs/44240163820)
- [Verify for the final exact SHA](https://github.com/just-every/run-lamp/actions/runs/44241680242)
