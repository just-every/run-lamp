# Lamp incident publishing design round

Builder Run Edit Run fleet, DIRECT 87, 17 November 2026. Times in the receipts are recorded by the build and browser runs.

## Plan and implementation

1. Read the main revision that includes the manual-state resolution warning, customer email preview and timeline correction. Reproduce creation and publication with a thirty-minute commitment at 1440 and 390.
2. Add a confirmation row and a preview sourced from the published incident record. Check the customer permalink for the latest update and the newly published update before showing “Customers can see this now.” While the snapshot catches up or the permalink is unavailable, the row says “Published.” and the preview says “Published update”. Keep the next draft closed on the publication visit, with its own Page and Email preview when opened. Timeline corrections open that editor.
3. Leave new affected components unselected in both composers. Offer Working, Slow or partly down, and Down. Disable publication while a choice is pending and identify the component by name. Keep unselected choices out of preview and API payloads. Existing attached, saved and template states still load from the product.
4. Extend the existing owner and phone journeys for the selection gate, collapsed draft, published fields, deadline and permalink. Update the existing maintenance and notification journeys to make their choice explicit. Update the incident guide, regenerate the source lock last, then build and run touched checks before guarded branch publication.

## Browser proof

The synthetic incident concerned delayed inbox messages. The before run at both widths captured the newly added component prefilled as Major outage with Publish enabled. After publication, the operator preview showed Identified and an unset deadline while the customer page had Investigating and the saved deadline.

The candidate run at both widths captured a blank component state, the three choices in the select, disabled Publish and a preview without an invented degradation. After selecting the intermediate state and publishing, the confirmation appeared above the published Investigating update, the next draft was closed, and the public permalink showed the same incident wording and deadline. The receipts include the observed values and screenshots.

## Contract and custody

Published clauses before and after were 42 done, 65 partial, 0 missing, 107 total. Target and push-further clauses were 18 done, 64 partial, 55 missing, 137 total. Across the contract, before and after were 60 done, 129 partial, 55 missing, 244 total. The verification inventory stayed at 117 checks (107 registered cases and 10 assertion scripts).

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

The hosted 12ui improvement step required account sign-in. The prescribed UX decisions were implemented with Lamp's existing components and checked in the running application. The private platform polish playbook read returned HTTP 404. The inline playbook essentials supplied with the brief were used. The fleet Mac owns the public publication scan.

## Verification results

Baseline main was `c26d13c6df113fb79ac4b9d1480f15c16a06be51`. The guarded push created `cloud/sd-lamp-design-publish-1` at `277c1ebb6da89e7378f6bfb1bf13c61effddfffe`. A read of the remote ref confirmed the SHA. The product commit has the fleet author and committer and carries no trailers.

Node 22.20.0 and pnpm 10.12.4 built the product. TypeScript, the regenerated source lock, contract document generation check, verification inventory and diff check passed. The six passing publishing-browser cases include the compiled publishing journey, the phone smoke and the owner incident journey with manual resolution, customer email and timeline correction. All three maintenance-zone cases and the selected channels and social browser journey passed.

The theme asset-budget case in the publishing file initially lacked Playwright's default executable in this VM. A retry using system Chromium 154 recorded five asset requests, including the favicon, against the case's budget of four. The same retry on the unchanged main checkout produced the same five requests. Both receipts are included.

The browser runs used isolated local fixtures and captured the new-incident form, post-publication view and customer permalink at each requested width. Only the committed incident-flow tests use a fixed single width per journey.

[Verify run 44161946254](https://github.com/just-every/run-lamp/actions/runs/44161946254) reported in progress on the exact product SHA at 19:55:47 UTC. The task's GitHub call budget ended at this check. The branch is PUSHED and awaits a successful exact-SHA Verify.
