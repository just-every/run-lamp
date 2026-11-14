# Lamp subscriber CSV component names

Tag: main-lamp-import-component-names-1
Repository: just-every/run-lamp
Branch: cloud/main-lamp-import-component-names-1
Candidate: 7dd366bb066ad4887a8e6e50f6c092695c5065db
Starting main: 429a46081ce68bab2dbdae46b8402b8ccce3ee2a (Lamp 1.11.16)

## Plan and result

The full execution plan is in PLAN.md. The assignment was reproduced before editing through the native authenticated owner CSV preview HTTP door. For `sam@copperleaf.example`, a components cell containing `Payments` yielded 0 created / 1 refused and the combined destination/contact/components reason. An exact identifier and a blank selection each yielded 1 created / 0 refused. reproduction.txt retains the actual responses.

Implemented visible component name matching without regard to case or surrounding spaces, using only the same visible components accepted by the existing intake. Exact identifiers take priority over component names and keep their existing selection. Unknown, internal-only and ambiguous component names refuse their own row and identify the supplied value. Email, phone, webhook URL, contact email and component-count failures each report their own cause. Language, format, duplicate and capacity decisions remain in place.

The import page explains names, identifiers, semicolon separation and the blank all-components selection beside the input. Its expandable list shows the installation's visible component names and identifiers, including the fallback for duplicate names or delimiter-containing names. Existing components delimiters are retained. The CSV textarea references that help for assistive technology. No stylesheet or other screen was redesigned.

Resolved selections are part of the review fingerprint. A name moving from one already-visible component to another therefore requires a new review rather than silently changing an owner's reviewed selection.

Import storage, pending consent, explicit invitations, capacity review and export implementations are unchanged. DIVERGENCE.md records the requested behavior; the source lock was generated with the documented command after integrating current main. CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md were not changed.

## Proof and preserved guarantees

Existing journeys were extended with no new registration:

- subscriberCsvFlow: a mixed CSV accepts a case/space-varied visible name and an identifier, refuses malformed email, unknown name, ambiguous name and an internal-only name, skips the duplicate, and imports exactly two pending subscribers with precisely the selected component. An identifier-like visible name cannot steal an exact identifier. The preview and stale-review refusal leave all application tables and mail unchanged. Changing the component resolved by an existing name invalidates a review. Existing confirmation, publication delivery, reporting, full-table erasure, batch authority and capacity assertions remain active and pass.
- subscriberHundredRowCsvFlow: the 100-row file mixes names and identifiers in a component cell, still creates exactly 97 independently reconciled pending subscriptions and refuses exactly three malformed rows with separate email, webhook URL and contact-email reasons. Existing owner-only invitation refusal, 50/47/0 batching, public consent, export parity and actor attribution assertions remain active and pass.
- subscriberIntakeBrowserFlow: the built operator app lists component names and IDs, reviews two name-selected rows and a refused unknown value, displays the value in Row decisions, and applies exactly the two valid rows as pending with exact component selection and no invitations. The second batch still uses identifiers. Existing selectable durable batches, isolated explicit invitations and downloaded export parity pass. Assertions run at 1440; changed import review is visually inspected at 1440 and 390 with the component list expanded. Existing accessibility, overflow and hydration checks pass.

Actual local outputs are csv-journey.txt, hundred-row-journey.txt, browser-journey.txt, typecheck.txt, source-lock-check.json and contract-docs-check.txt. Browser proof is browser/subscriber-import-review-1440.png and browser/subscriber-import-review-390.png. Build completed successfully through cloud_run npx -y @runeditrun/rer build; no full local rer verify was run, as instructed.

The initial inline Node launch (`--input-type=module`) stalled Miniflare's synchronous binding acquisition. Running the same journeys from ordinary script files resolved it; local tests used the repository's Node 22.20.0 with Chromium /usr/bin/chromium and --no-sandbox. Temporary diagnostic changes and launch files were removed; none enter the product commit.

Before/after counts: 93 registered cases + 10 assertion scripts = 103 checks in both states, below the default cap of 200. 35 routine files and 8 test shards remain unchanged. The reproduced name row changes from 0 created / 1 refused to accepted; the mixed browser file yields 2 created / 1 refused, and the 100-row flow remains 97 created / 3 refused.

## Claims and custody

CLAIM SUB-017 PARTIAL points=1,2,3,6 tests=tests/e2e/helpers/subscriber-csv-flow.mjs#subscriberCsvFlow; tests/e2e/helpers/subscriber-csv-flow.mjs#subscriberHundredRowCsvFlow; tests/e2e/helpers/subscriber-intake-browser-flow.mjs#subscriberIntakeBrowserFlow

Clause status changes: none. SUB-017 stays done and SUB-023 stays partial under existing judgments. No DONE claim is made. SUB-023 capacity assertions executed unchanged through subscriberCsvFlow.

Product push succeeded on its first attempt through cloud-push.py, after inspecting every candidate author, committer, trailer and full commit message. The final commit has no skip-ci marker and no co-author trailer. product-push.txt and commit-identities.txt retain actual sanitized custody output. No main/default branch was pushed and no published history was rewritten. Current main was fetched and the unpushed checkout rebased with an identity-controlled autostash before the only product commit.

Exact-SHA Verify: run 43646491387, https://github.com/just-every/run-lamp/actions/runs/43646491387. ci-discovery.json and the later CI-RESULT.json contain actual REST observations. Full publication scanning and landing belong to the fleet; cloud evidence publication is report-only and is not a landing signal.

Final CI status and PR custody are recorded below when observed.

Final observed result: Verify 43646491387 completed/success on 7dd366bb066ad4887a8e6e50f6c092695c5065db. PR 384: https://github.com/just-every/run-lamp/pull/384 (open against main, exact head confirmed). No CI failures or reruns were needed. Task GitHub API calls: 6 (one discovery, four run polls, one PR creation). No blockers remain. Product custody is READY; no main/default branch write or landing was performed.
