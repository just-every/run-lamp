# Lamp per-audience notification branding

Branch `cloud/sd-lamp-notify-aud-1`

Base `224a64b472f11c2d9d8b7c8d8bde8812aa0286a7` and final product `2e4b6592ea289b60b990ecbf5767bddae950503b`

Contract totals before and after were 66 done, 123 partial and 56 missing out of 245. NOTIFY-019 and NOTIFY-022 both retain partial status.

## Plan and results

1. Read NOTIFY-019, NOTIFY-022 and their Gap cells on fresh Lamp main. Both clauses are partial. This round covers point 4 of NOTIFY-019 and the audience-specific settings portion of NOTIFY-022. The brief assigns point 5 to prior receipt f183. The live inbox boundary and the other held points remain pending under their existing judgments.
2. Reuse the AUD-001 status-page path and owner/admin authority. An additive table stores an independent branding record for each protected page. A page with no record inherits Public branding. Its Settings form can save a page-specific record, switch back to inheritance and preview the saved result. Logo URLs come from the page's existing uploaded asset. The preview uses the shared email renderer.
3. Add a postal address line to the shared renderer. The provider-edge journey checks that a fresh Public message includes the line in both parts after the custom footer is cleared and excludes the named audience's wording and logo. It retains the existing checks for status, management and unsubscribe destinations, provider list headers, threading and frozen retries.
4. For audience settings, test that the managed relay refuses Reply-To and a custom From with its named reason and preserves the prior settings. Test the configured sender display name and Reply-To in the audience sample on the direct-provider path. Record the supplied ct ruling in the requirement and beneath points 1 and 3 without changing the clause judgments.
5. Stage the new migration before regenerating the source lock. Verify the contract after generating, restore the generated views from main, and check the source lock on a clean checkout. Inspect the changed Notifications Settings at 1440 and 390. No icon-only controls were added or changed.

## Gaps and custody

- AUD-001 supplies page records and publication selection. AUD-004 remains missing on fresh main. There is no protected-page subscription and confirmation door, no subscriber-to-page identity available to dispatch, and protected-only incident publications do not queue ordinary subscriber notifications. The lease excludes the incident preview and delivery wiring. The scoped sample is available in Notifications Settings. An update reaching a confirmed Staff or named-audience recipient, and its appearance in the existing incident Email preview, are unproved.
- The managed relay wire format omits From and has no sender display-name field. The saved audience display name can be shown in the direct-provider sample. The managed sample shows the deployment's sender identity. Managed sender display-name delivery remains unproved.
- The 1440 and 390 PNGs show the same scoped Settings card without recipient or sender addresses. Test assertions run at 1440. Both existing registrations were extended, with 10 browser and 5 mail registrations before and after.
- The inline UI playbook essentials were available. The separate playbook retrieval returned HTTP 404. The guarded lander owns the full publication scan.

DEFAULT NOTIFY-019: A status page with no branding record inherits Public branding.
DEFAULT NOTIFY-022: Audience settings expose branding fields only. Required destinations and list headers continue to come from delivery.
GAP NOTIFY-019: AUD-004 subscriber confirmation and audience-targeted delivery are absent. The existing incident preview is Public-only and the managed relay has no sender display-name field.
GAP NOTIFY-022: Public provider-edge delivery retains links and list headers after a footer change. Those outcomes still need a confirmed Staff or named-audience recipient.

Signed Run Edit Run fleet, 21 November 2026 UTC.

## Verification

The first published checkpoint omitted the new migration from the lock because the lock tool only enumerates tracked files. The second commit records the migration, strengthens the inherited-branding assertion with a nonempty Public prefix, and passes the lock check on the committed tree. Both commits retain fleet identity.

Local typecheck, production build, the AUD-001 browser journey, the provider-edge mail journey, generated-contract validation before restoring the generated views, and the final source-lock check passed. The final candidate contains the same product and provider-test bytes as the provider-edge run.

CLAIM NOTIFY-019 PARTIAL points=none tests=tests/e2e/publishing-browser.test.mjs#AUD-001 — an operator configures status pages and publishes to the selected pages
CLAIM NOTIFY-022 PARTIAL points=none tests=tests/e2e/rer-mail.test.mjs#BASE-ACCESS-001 BASE-ACCESS-002 SUB-001 SUB-002 SUB-003 SUB-005 SUB-006 SUB-008 NOTIFY-001 NOTIFY-002 NOTIFY-003 NOTIFY-004 NOTIFY-005 NOTIFY-006 NOTIFY-007 NOTIFY-008 NOTIFY-009 NOTIFY-010 NOTIFY-019 MAINT-005 MAINT-009 UPDATE-008 — Sign in, confirm a reader, publish, recover frozen mail, inspect receipts, notify maintenance and opt out

The existing Public incident Email preview and compiled operator publication journey also passed locally on the candidate.

| Push Verify | Product SHA | Result |
| --- | --- | --- |
| 44947061024 | 70a09cb1df1b4d0a1ef5f29d5af68dc383497387 | The contract check flagged generated ACCEPTANCE.md. The build receipt and shards were absent. |
| 44947379507 | 2e4b6592ea289b60b990ecbf5767bddae950503b | The build archive shows the generated ACCEPTANCE.md check as the initiating failure. The dependent shard job skipped and the summary reported missing artifacts. This meets the brief's generated-view exception. |

The browser and provider journeys ran locally. The build precheck prevented GitHub from running the candidate's shards. The generated contract check passed locally after regeneration. The generated view is restored from main in the branch so the guarded lander can regenerate it at landing.
