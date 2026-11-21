# Lamp SETUP-002 continuation

Fleet builder, 2026-11-21 UTC. Tag `sd-lamp-c-f172`.

- Product candidate `cloud/sd-lamp-c-f172` at `d59fcf780c2764aad927417b9dfa2d11af9582b0`. Its parent is `820ff8267db256927f5d95bad703f604b07197b5` and the handoff main ref is `820ff8267db256927f5d95bad703f604b07197b5`. The branch advertises the candidate SHA. Lamp uses its guarded branch landing, and branch pushes start Verify.
- Exact-SHA Verify 44866280564 ran on the push event. Result at handoff: in_progress, conclusion pending. https://github.com/just-every/run-lamp/actions/runs/44866280564
- Early follow-up requests returned HTTP 401. Launcher refresh and retry restored API access. Verify was still in progress at the handoff cutoff.
- The checked base had successful Verify 44863808440 and Run site 44863808379. Candidate Run site, full-history publication scan and main equality await guarded landing.
- Recorded clause counts before and after were 65 DONE, 124 PARTIAL and 56 MISSING, 245 total. SETUP-002 remains PARTIAL. Test registrations in the touched file remain one. Main's source contract and generated views match the candidate.
- The full-history publication scan for commit `d59fcf780c2764aad927417b9dfa2d11af9582b0` is pending the Mac lander. Complete, historyScanned and findings are unestablished.

## Plan and result

1. Inspect SETUP-002, the Status row, RL-5, RL-6 and Base input validation citation. Follow the leased browser-zone case from the previous branch and preserve both controls. The next campaign row is still the SETUP-002 continuation.
2. Replay the previous journey commit from `f7dceaf2bd9334d57a47ce9d1b2db5cb9f87adc2` onto current main. Inspect `src/core/features/setup/ui/first-run-page.tsx:33` and `src/core/features/setup/ui/time-zone.ts:3`. Setup accepts the first usable zone in saved-then-browser order and falls back to UTC. The read prepares a draft. Confirmation saves its zone through Page Settings. The existing product behavior passed.
3. Extend `tests/e2e/website-onboarding.test.mjs:60`. Seed an invalid stored zone independently of the browser, then open the recorded website in a New York browser. Assert the suggestion and read the existing public zone before confirmation. Confirm with the suggestion untouched, then compare operator Settings, authenticated settings API and unauthenticated public summary. The existing saved-UTC and both-invalid controls remain active. Verify runs the desktop case and the local phone run exercises the same assertions at 390 pixels.
4. Generate and check the contract views, restore main's view files, regenerate and check the source lock and run the focused browser checks, typecheck, build and first-party check. Push the checked product branch. Record exact-SHA CI and attach the separate packet.

## Acceptance and rulings

| Acceptance or duty | Evidence and disposition |
|---|---|
| 1. Gate the owner and restore setup after sign-in | The website journey enters from the operator app at lines 88–90. The complete signed-in document and signed-out return matrix remains held. RL-5 continues to govern entry. |
| 2. Public read, refusal and observed fields | The existing journey includes an observed website, reload without reread, script silence and selected destination refusal cases. The full read and redirect matrix remains held. |
| 2. Invalid saved zone and valid browser zone on website confirmation | Local PASS at 1440 and 390. Lines 63–102 independently establish the invalid saved zone, verify the browser zone and read the recorded site. Lines 105–116 confirm untouched, then reconcile the new saved zone and public timezone with the suggestion shown again in Settings. |
| 2. Valid saved zone and both-invalid controls | Local PASS. Lines 149–169 retain the both-invalid UTC control. Lines 208–219 retain the valid-saved-UTC preference in a New York browser. |
| 3. Provider and subdomain source choice | The recorded Statuspage control remains active. Complete provider and subdomain coverage under RL-6 remains held. |
| 4. Optional silent resolved history and exclusions | Existing resolved history and delivery silence assertions remain active. Full maintenance and subscriber exclusions under RL-6 remain held. |
| 5. Empty feeds and editable manual defaults | Existing empty-feed and blocked-site controls remain active. Complete omitted-site defaults and editability proof remains held. |
| 6. Persist edited setup and retain Settings editability | Scoped zone persistence is verified at lines 105–116. Full settings, mark, components and durable completion proof remain held. |
| 7. Post-completion routing and upgrade | Existing completed-setup routing assertions remain active. The complete upgrade and rerun matrix remains held. |
| BASE-INPUT-001 | Cited in `CONTRACT.md:178`. The zone chooser applies the existing validation sequence. This round covers the public-door outcome of the leased fallback, with the wider Base duty inherited. |
| UIP and release prerequisites | The preview and confirmation were reviewed at 1440 and 390. The visible actions on this review have text labels. The existing 12-pixel preview caption and status-source note remain a held visual item. No release or deployment was performed. |

## DONE-RIDERS and pre-READY checks

| Row | Result |
|---|---|
| 1 | PARTIAL. Local browser proof covers the leased part of point 2. The held acceptance outcomes still need proof. |
| 2 | PASS for the lease. Independently seeded storage and a real website response fixture drive lines 63–116. The test fails for a missing browser suggestion, an early write or publication, wrong persisted or public zone, or mismatching Settings readback. |
| 3 | Exact candidate push Verify 44866280564: in_progress, conclusion pending. The same journey is in `test:site` on the imports shard. |
| 4 | PASS. Both local browser runs, the build and typecheck bind to `d59fcf780c2764aad927417b9dfa2d11af9582b0`. |
| 5 | PASS on inspection. SETUP-002 cites BASE-INPUT-001 at `CONTRACT.md:178`. |
| 6 | Mechanical PASS. Write and check passed locally. Counts and Status cells carry the current main judgment. Final judgment provenance awaits landing. |
| 7 | PASS. Acceptance text, rulings and generated views match main. |
| 8 | The lease adds no authority verb. The existing sign-in and destination refusal controls remain in the journey. |
| 9 | The recorded website is a network-edge fixture. No live provider result is claimed. |
| 10 | No policy default was adopted. |
| 11 | Pending guarded landing. Main advertises `820ff8267db256927f5d95bad703f604b07197b5`. Candidate Verify 44866280564 is in_progress, conclusion pending. Candidate scan and Run site remain unestablished. |

No prior behavior assertion was removed, narrowed or placed behind the viewport selector. The published zone and saved zone checks still have an independent expected `America/New_York` established by the browser and operator readback. This lease introduces no credential revocation, erasure or replay path. The candidate diff passed the limited patch hygiene check for address and provider-key shaped additions. The publication scan is a separate Mac gate.

CLAIM SETUP-002 PARTIAL points=none tests=tests/e2e/website-onboarding.test.mjs#SETUP-002 — a fresh owner gives their website first; Lamp fills in the page from it, or from the status page it already runs, a site it cannot read leaves calm defaults, and the edited result is what customers see

GAP SETUP-002: The rest of acceptance 2's site-read and redirect matrix and the remaining acceptance 1 and 3–7 entry, vendor, history, defaults, editability and completion proof remain outside this lease.

PROBE SETUP-002 2: A local install with saved Etc/Unknown opens the recorded business website in an America/New_York browser at 1440 and 390 pixels -> setup suggests New York, leaves the old public UTC and invalid stored zone in place until Open Lamp, then Settings and the public summary both report America/New_York.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

The plan extract's SETUP-002 row can record the completed leased branch and the continuing held remainder. No clause promotion or scope ruling is requested.
