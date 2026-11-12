# Lamp incident corrections and reopening

Tag: main-lamp-incident-corrections-1
Repository: just-every/run-lamp
Branch: cloud/main-lamp-incident-corrections-1

## Plan

1. Apply fleet identity, decrypted-bundle Git authentication, commit hooks and the pinned checkout toolchain. Read the repository and inline fleet rules.
2. Reproduce the resolved-composer, missing-correction-reference and stale-correction-state failures through the existing operator publishing browser journey before changing product code.
3. Keep the existing composer available on resolved records, including draft saving, preview and publication. Preserve immutable publications and the explicit Investigating lifecycle choice for reopening.
4. Render correction attribution from the persisted target identifier on the operator timeline, public timeline and incident permalink. Name and link the target lifecycle and publication instant without changing original wording or ordering.
5. Clear correction action feedback after publication so the next draft is ordinary.
6. Extend the existing publishing journey at 1440. Assert resolved correction, reopening, correction attribution, retained originals and chronology, and the next ordinary publication. Capture affected screens at 1440 and 390 outside Git.
7. Update incidents-and-updates documentation and the relevant divergence record. Leave CONTRACT.md judgments and generated views untouched. Regenerate and check sources.lock.json last.
8. Run the touched browser journey and typecheck, integrate fresh main before first publication, commit with fleet identity, inspect all candidate identities and trailers, and push the named cloud branch using the fleet guard. Require exact-SHA Verify; open the repository-required PR using REST.
9. Publish this complete non-secret report and actual receipts only to the separate evidence ref. Return clause PARTIAL claims, custody SHA, CI IDs and lane POST lines. Preserve any rejected unpushed work with a verified external bundle.

## Scope and defaults

No new correction rules, editing/deleting published updates, subscriber delivery work or other stranger findings. Corrections use the same explicit lifecycle decision as ordinary updates; Investigating reopens, while Resolved keeps the record resolved. Existing newest-first publication order is retained. Existing contract judgments are not edited and no DONE claim is made.

## Baseline inventory

99 checks: 89 registered cases plus 10 assertion scripts; eight test shards and one shared build. The existing registration is extended; no registration is added.

## Results

The final targeted browser journey passed (1 test, 0 failures, 157.064 seconds). Typecheck, contract documents, source lock integrity, test inventory and diff whitespace checks pass. Ten screenshots show the affected operator, public and permalink screens at 1440 and 390. All three reproduced failures are covered by the extended public-door journey. The product branch was pushed successfully on its first attempt; exact-SHA CI and evidence return are recorded below.

## Baseline reproduction

The existing compiled visual edits/operator publication journey completed with an external temporary probe before product edits. It observed:

- Trip 10: resolved composer publication button count = 0.
- Trip 11: correction target stored = true; public correction reference count = 0; operator correction reference count = 0.
- Trip 12: the next empty draft still displayed the correction message (count = 1).

The API was used only to reopen past the absent resolved composer so the probe could reach the active correction UI. The active correction selection and publication used the operator UI. The final regression journey uses the UI for resolved correction and reopening too.

## Implementation and integration

The operator composer is available regardless of the incident's lifecycle. The existing private save, preview, schedule and publish paths remain the authority. Resolved drafts still default to Resolved, requiring an explicit Investigating choice to reopen.

The public projection retains the published correction target. Shared public record markup renders a correction label and a link naming the original lifecycle and timestamp; built-in public-page templates share the same attribution. The operator timeline renders the same relationship with an in-page target link. Originals are untouched and newest-first timeline order remains unchanged.

Draft action feedback and the open options panel reset when publication advances the update generation. The existing server publication transaction consumes the saved draft, including its correction target.

The existing resolved-state assertions were changed to require the newly requested composer and preview, preserve the empty-draft publication refusal, and retain the incident's report and impact checks. No existing immutable-publication assertion was removed. No test registration was added.

The required pre-candidate fetch and rebase integrated origin/main b2ba931. Main's new subscriber import capacity proof and source lock were retained, with no conflicts or contract edits. The first extended test attempt caught a test-only mistake (expected publication HTTP 201; the existing endpoint returns 200); the assertion was corrected before publication.

TypeScript typecheck passed. The contract document generator check reports zero errors and zero warnings and confirms current generated documents. The candidate diff has zero credential-shaped matches; the full publication scan remains the fleet lander's gate.

## Proof mapping

- INCIDENT-004 acceptance 2: the extended operator publication journey publishes corrections on resolved and active incidents, checks each persisted target, and follows the public attribution link naming that target's lifecycle and publication instant. It checks attribution on the operator timeline, public main page and incident permalink.
- INCIDENT-004 acceptance 3: the same journey compares every retained original publication to its prior value and compares the public timeline's update identifiers to the service's newest-first publication order.
- INCIDENT-005 acceptance 1: the journey opens a resolved record, selects Investigating in its composer, saves the new wording and commitment, publishes through the ordinary button, and observes the reopened lifecycle.
- INCIDENT-005 acceptance 2: the public permalink retains resolution and reopening as separate entries, with their original lifecycle and publication datetime in publication order.
- Fresh ordinary draft: after resolved and active corrections, the journey checks empty message fields, no stored draft/target, no correction feedback and no open correction choice. A saved next draft and its subsequent publication have a null correction target; reload does not reintroduce correction mode.

Existing published edit/deletion refusal proof is outside this round's claim. INCIDENT-004 remains a PARTIAL claim for points 2 and 3. INCIDENT-005 is reported as a PARTIAL builder claim for points 1 and 2; this does not change its existing source judgment.

## Contract status and count custody

CONTRACT.md, ACCEPTANCE.md and docs/CLAIMS.md are unchanged. INCIDENT-004's existing partial judgment and INCIDENT-005's existing done judgment are retained. Before/after test inventory: 99 -> 99 checks (89 cases + 10 assertion scripts). This round adds zero test registrations and makes no DONE judgment.

The panel-reset refinement's first assertion counted the hidden select rather than its visibility. OptionPanel deliberately keeps closed controls mounted to preserve choices while an update is being composed. The assertion was corrected to require that the consumed correction panel is not visible; the final journey rerun checks the user-visible behavior without changing that panel contract.

## Product custody

Head: 56dc48869caa37051e382e58e348842c41abc593

The branch contains one real fleet-authored product commit, without a skip-CI marker or co-author trailer. The named cloud branch was pushed with the fleet guard; main was never pushed or advanced. The product worktree is clean. Source-lock generation and its check were the final source maintenance steps.

## Browser review

The actual final screenshots were reviewed at 1440 and 390. Correction references remain readable and wrap on the phone layout. The resolved operator page retains the existing composer and report controls. After publication, the ordinary next draft has no correction feedback or visible correction panel. The public page and permalink preserve both original and corrected publications.

PR: https://github.com/just-every/run-lamp/pull/344

Exact-SHA push Verify: https://github.com/just-every/run-lamp/actions/runs/43268843208 (last observed in progress at 2026-11-12T17:53:25.086096+00:00).

## Final CI result and handoff

Exact product SHA: 56dc48869caa37051e382e58e348842c41abc593.

Push Verify run 43268843208 remains in progress after thirty minutes. Seven exact-SHA observations used discovery followed by observations at least 300 seconds apart, from one watcher and its final continuation. Including PR creation, eight of the ten permitted GitHub invocations were used; two remain for completed-run failure diagnostics. The remaining budget is short for further polling together with those diagnostics, so this return uses the prescribed PUSHED custody. No completed/success conclusion is claimed, and no READY signal is issued. No failed-job logs were read while the run was in progress.

All requested product changes and local touched checks are complete. The outstanding gate is a successful exact-SHA Verify. The fleet owns the full publication scan and landing; main was not changed by this cloud run. The complete report and actual receipts are returned through refs/heads/evidence/main-lamp-incident-corrections-1, separately from product custody. The final evidence manifest binds all 25 selected files to this product SHA.

No contract clause status changed. PARTIAL builder claims are INCIDENT-004 points 2,3 and INCIDENT-005 points 1,2, as recorded in claims.txt. No provider-delivery claim or new correction policy is added. The existing incident lifecycle and immutable publication rules are retained.
