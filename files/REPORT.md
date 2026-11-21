# Lamp AUD-002 Staff network access

Run Edit Run fleet · 2026-11-21 UTC

The next-campaign AUD-002 row receives the leased CIDR slices of acceptances 2 and 3. The clause claim is PARTIAL. The recorded contract row remains MISSING before guarded judgment. The before and after contract totals are 66 done, 123 partial and 56 missing of 245. The test inventory remains 119 registered cases and 10 assertion scripts.

- Product branch: cloud/sd-lamp-c-f202
- Product commit: 5d323d1b466fae6402d75de955d51d6608d29049
- Product tree: 8547684eb2fdde004049c425451d4ca590bc57b0
- Integration base: b91609aa0124743225eff7eba664bad5384302b4
- Remote main at report: b91609aa0124743225eff7eba664bad5384302b4
- Candidate Verify: push workflow configured on the product branch. Run ID and conclusion unobserved after the ten-call GitHub budget for 5d323d1b466fae6402d75de955d51d6608d29049.
- Integration-base workflows: Verify 44936655191 and Run site 44936655200, both completed successfully at f275c4e4c7024d97bd1e26117905ade863ce5f2a. The newer integration base was merged after that observation.
- Superseded first push: 60e747fd8fd23804b0fda4bd17804d0d052c4a71, Verify 44936492427 last observed in progress. The final commit is a forward merge incorporating current main and a narrower denial response.
- Superseded Verify failure: [44938028064](https://github.com/just-every/run-lamp/actions/runs/44938028064) on 8b8fa2a3dc902ff01e1e4a3522eb240fa7bea8da. Portability job 136949212669 failed and summary job 136952677459 propagated it. Composer 136949212645 and runtime 136949212656 passed on that SHA.
- Candidate Run site: awaits the main push through guarded landing.
- Publication scan: commit=5d323d1b466fae6402d75de955d51d6608d29049 complete=unestablished historyScanned=unestablished findings=unestablished. This receipt belongs to the guarded lander.

## Plan and results

1. Use the Staff identity, page selection and healthy retained snapshot from AUD-001. Keep the ordinary active operator session as a reader credential. Existing public and named-audience requests remain covered by the native and browser controls.
2. Persist Owner-managed ranges in the Staff row with additive migration 0085. Existing rows start with an empty list. The Settings editor honors changes explicitly, validates IPv4 and IPv6 CIDR syntax, and retains prior settings after a rejected save. An Admin can edit presentation and cannot read or change the network rules.
3. Use the edge's connection address for Staff admission. Local development, absent edge metadata, Worker subrequests and Pseudo IPv4 overwrite addresses fail closed for the network method. Missing or unmatched addresses receive a private 401 with an escaped page name and sign-in link. The response contains zero snapshot bytes, and authorization completes before any snapshot lookup. The follow-up retains the generic denial for named audiences so the Staff display rule cannot disclose a named-audience label. Successful private responses retain private no-store. [Cloudflare HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip)
4. Extend the registered native and browser audience journeys. The native journey exercised the Cloudflare ingress contract with controlled metadata. The browser exercised the Settings save and independent reload, rejected an invalid entry, reopened the populated Staff editor, and observed the anonymous sign-in page after publication. The browser Settings and denial code stayed identical through the portability repair. The final native journey reran with the newer main public-host controls and passed.
5. Preserve the portable Page data format. The new column had been exported with the other status page fields, then the strict restore validation refused it. Limit network authority to the source installation for portable Page data. The existing portability journey now checks a filled source allowlist stays out of the download, an injected allowlist receives 409, and the restored Staff page opens with an empty allowlist. The portability journey at tests/e2e/page-data.test.mjs:125, :164, :199 and :208 proves this. The full native archive round trip still preserves the configured ranges.
6. Check contract views, migration and release inventory, first-party validation, lock and identities. Push only the named product branch. Attach the report, receipt and browser captures to the separate evidence ref carrying this product SHA.

## Verify repair

The exact portability shard command reproduced the CI assertion at the failed SHA with exit 1. The same test passed at the earlier verified main SHA. After removing the installation-specific field from the portable file, the complete portability shard passed with exit 0. The failed job archive was read with the specified mechanism. The local rerun kept the shard, Node pin, test command and CI-mode variables, with runner scratch paths mapped to this VM.

VERIFY_REPRODUCED
{"command": "LAMP_VERIFY_SHARD=portability pnpm run verify:app", "exit": 1, "failure": "The input did not match the regular expression /already holds/. Input: 'The file contains invalid status pages.'", "head": "8b8fa2a3dc902ff01e1e4a3522eb240fa7bea8da", "job": "shards (portability)", "job_id": 136949212669, "run": 44938028064, "test": "Page data restores verified consent and holds unverified addresses until confirmation"}

## Acceptance map

| Point | Outcome and evidence |
| --- | --- |
| 1 | Held. Private visitor OIDC, provider groups and SAML sign-in remain outside the lease. |
| 2 | CIDR branch passed locally. tests/e2e/helpers/audience-pages-flow.mjs:183 checks Owner save, both families and malformed values. At line 195, an invited Admin is denied and can still edit presentation. At line 233, an independent listing has both permitted ranges and the preserved tagline. tests/e2e/helpers/audience-pages-browser.mjs:53 checks invalid Settings input and readback after reload. Single-use emailed links remain held. |
| 3 | CIDR branch passed locally. tests/e2e/helpers/audience-pages-flow.mjs:421 compares healthy Staff root and permalink bytes for both allowed families against a populated authorized operator read. At line 104, each denied path asserts zero R2 calls, no generation or ETag, and private no-store. At line 438, unmatched, absent, forwarded, untrusted local and Worker addresses are denied. At line 465, Pseudo IPv4 and cleared ranges are denied, while the active operator remains admitted. Public and named-audience controls are adjacent. tests/e2e/helpers/audience-pages-browser.mjs:161 checks the denied rendered page. Other visitor methods remain held. |
| 4 | Held. SAML signature refusals need the corresponding sign-in path. |
| 5 | Held. Protected reads during D1 outage require authorization and isolated retrieval that survive the outage. |
| 6 | Private no-store passed for the leased allowed and denied reads at tests/e2e/helpers/audience-pages-flow.mjs:107 and :421. The private visitor session and full shared-cache matrix remain held. |

## Inherited duties and field proof

| Duty | Outcome and evidence |
| --- | --- |
| AUD-001 | Native publication keeps distinct Staff and Named audience snapshots and the Public surface. tests/e2e/helpers/audience-pages-flow.mjs:421 and :479 exercise the protected and public controls and revoked operator. |
| BASE-ACCESS-002 | Existing authenticated Settings route keeps its active session and Owner role requirement for the CIDR policy. tests/e2e/helpers/audience-pages-flow.mjs:195 proves the boundary. |
| BASE-SIGNIN-001 | Current active and revoked operator sessions are exercised by tests/e2e/helpers/audience-pages-flow.mjs:456 and :479. Private provider sign-in remains held. |
| BASE-ACCESSIBILITY-001 | Settings inputs and action names, and the denied page heading and sign-in link, are exercised at tests/e2e/helpers/audience-pages-browser.mjs:53 and :161. Full private-page accessibility conformance remains held. |
| R-80 | Held. No Okta field receipt. |
| R-81 | Held. No Entra field receipt. |
| R-82 | Held. No Google Workspace field receipt. |
| AUD-003 | Named-audience membership is held. Named-audience anonymous access retains its generic refusal at tests/e2e/helpers/audience-pages-flow.mjs:434. |
| AUD-004 | Staff and audience subscriptions are held. The existing public subscriber publication checks continue in the native registration. |
| AUD-005 | Full isolation proof is held. The leased network method is Staff-only. The newer main public-host refusal matrix passes at tests/e2e/helpers/audience-pages-flow.mjs:123. The native named-audience and public disclosure controls pass at tests/e2e/helpers/audience-pages-flow.mjs:434 and :461. |
| BASE-PUBLIC-001 | Private CIDR admission writes no visitor cookie. Its private responses retain no-store. Private session scope and full shared-cache conformance remain held. |
| SUB-005 | The public route remains a separate control. A matching Staff address receives the public snapshot at tests/e2e/helpers/audience-pages-flow.mjs:461. |

## DONE-RIDERS and safeguards

| Rider | Result |
| --- | --- |
| 1 | Not met as a whole. Points 2 and 3 have the scoped runtime proof above. The other acceptance branches remain held. |
| 2 | Passed for the lease. Populated healthy bytes and refusal with zero R2 are asserted at tests/e2e/helpers/audience-pages-flow.mjs:107 and :421. |
| 3 | Terminal Verify unobserved after the ten-call GitHub budget. The prior exact SHA passed both touched CI shards and failed portability. The journeys are registered at tests/e2e/publishing-contract.test.mjs:1337 and tests/e2e/publishing-browser.test.mjs:1076 in the runtime and composer shards. |
| 4 | Passed for the leased checks. The exercised route, UI and journey bytes match the candidate. The final native transfer assertion at tests/e2e/helpers/audience-pages-flow.mjs:489 and :495 compare the full restored setting with a fresh pre-export read. |
| 5 | Passed on placement inspection. CONTRACT.md:2531 cites the Base sign-in, access and accessibility duties. The receipt above distinguishes their leased scope and held provider proof. |
| 6 | Passed mechanical generation. Contract judgment, Evidence and Gap remain with the guarded lander. The current MISSING row supplies no completion evidence for the unbuilt branches. |
| 7 | Passed. No acceptance sentence or coverage map changed. |
| 8 | Passed for the lease. tests/e2e/helpers/audience-pages-flow.mjs:195 and :465 cover the Admin refusal, Owner revocation of network access and continued authorized reads. |
| 9 | Passed on scope reporting. The Cloudflare edge was simulated in the native runtime. No live provider or field proof is claimed. |
| 10 | Passed on placement inspection. The clause names the Owner and the CIDR access method. Explicit Owner save controls the Staff ranges and the empty migration default requires sign-in. |
| 11 | Guarded landing pending. Exact-SHA Verify, candidate Run site and full-history publication scanning are unestablished on the terminal candidate. |

The existing acceptance assertions are preserved, including the full export and restore comparison. The first local archive check exposed a stale expected timestamp after the new clearing and restore controls. The current test takes a fresh source read immediately before export and passed on rerun. The revocation proof covers a cleared network configuration and a revoked operator session. The leased read path creates neither a visitor record nor a replayable grant. Settings uses existing field styles, readable 13 px or larger copy, full field borders and labelled controls. The two edited or newly served screens were inspected at both widths, and the denied screen needs no snapshot asset request. [Desktop Settings](staff-cidr-settings-1440.png) · [Phone Settings](staff-cidr-settings-390.png) · [Desktop denial](staff-cidr-signin-1440.png) · [Phone denial](staff-cidr-signin-390.png)

PROBE AUD-002 2: Owner Settings PUT uses 192.0.2.64/26 and 2001:db8:4:180::/57 -> both saved and independently read back. An IPv4 prefix of 33 or IPv6 prefix of 129 receives 400 with preserved settings. An Admin attempting to clear the list receives 403.

PROBE AUD-002 3: Staff root and incident permalink with 192.0.2.127 or 2001:db8:4:1ff::10 -> same populated healthy responses as the operator. 192.0.2.128, 2001:db8:4:200::10, an absent address or a cleared range -> 401 with page name and sign-in, private no-store, no private content and zero R2 reads.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=node --test --test-concurrency=1 tests/auth-adoption/setup-migrations.test.mjs exit=0

CLAIM AUD-002 PARTIAL points=2,3 tests=tests/e2e/publishing-contract.test.mjs#AUD-001 — native publication is visible only on selected status pages and silent for public subscribers when private; tests/e2e/publishing-browser.test.mjs#AUD-001 — an operator configures status pages and publishes to the selected pages

DEFAULT AUD-002: Portable Page data leaves restored Staff network access empty until the destination Owner saves ranges.

GAP AUD-002: The other branches of points 2 and 3, points 1 and 4–6, private provider and accessibility proof, and R-80–R-82 remain held.
