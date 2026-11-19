# Lamp SETUP-001 · sd-lamp-c-f148

Codex · 2026-11-19

The local setup journey now checks that publishing to two confirmed subscribers records suppression without a provider acknowledgement. SETUP-001 stays PARTIAL. The proposed plan update applies to the SETUP-001 row from replan 32 in the Next campaign.

- Product branch `cloud/sd-lamp-c-f148` at `69af4dfce9acc31f4f224589fbde2c1b39fee20b`.
- Main base `8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b`.
- Recorded counts before and after are 65 DONE, 124 PARTIAL and 55 MISSING out of 244. Existing journey registrations are unchanged.
- Changed the journey helper and its generated source-lock entry. The delivery repository and routes were inspected read-only. The contract, its generated views and the application UI were outside the changes.

## Plan and results

1. Read the lease, the SETUP-001 acceptance and recorded gap, the related mail duty in BASELINE.md and the DONE riders. No policy change or new ruling was needed.
2. Follow the existing native publication and Notifications journey. Its public forms create a page subscriber and an incident follower. Owner confirmation activates both. It publishes an incident update to email and reads back deliveries by the committed update ID.
3. Reconcile the complete result set against those two subscriber IDs. Check the corresponding destinations, active state, email channel, committed update identity, suppression and recorded times. Require explicit null acceptance time and accepting provider, and require the provider outcome to be absent or null. The Notifications screen continues to show both active subscribers and the incident reference with “Not sent locally” and no acceptance label.
4. Run the touched test file and typecheck, generate and check the contract views, restore the main views whole, regenerate and verify the source lock, and run the first-party check. Audit every candidate commit's identity and trailers and push the named branch. Bind the runtime and browser receipts and Verify status to the pushed SHA.

The operator delivery route at `src/core/features/deliveries/routes.ts:44` forwards the incident update filter and returns the repository rows and a pagination flag. The ordinary delivery projection reads acceptance time only from an attempt with a provider message ID and no error. It reads the accepting provider from the mail route. The optional provider outcome comes from the SMS projection. The journey checks those fields directly on the suppressed email rows. See `src/core/features/deliveries/repository.ts:166` through line 197.

## Acceptance coverage

| Point | Result | Door and evidence |
|---|---|---|
| 1 | Held | Rendered public-page and subscription-form checks after publication and each minute. |
| 2 | Held | Hosted sender provider authentication after a change and on its daily cadence. |
| 3 | Held | Overview address, publication and check times, review page and change address links. |
| 4 | Held | Address-specific failed checks with the corrective action. |
| 5 | Held | Default deployment address and optional custom domain. |
| 6 | Held | Local owner entry and broader local mail and inbox behavior. Existing controls run in the journey. |
| 7 | Local pass | Native publication and delivery read at `tests/e2e/helpers/local-subscribers-flow.mjs:111` through line 128. Notifications readback at lines 130–139. Registered at `tests/e2e/maintenance-timezone.test.mjs:209` by the composer shard's `test:composer` command. |
| 8 | Held | Local sender and database-free public reading. Existing local sender assertions run in the journey. |

## DONE riders

| Row | Result | Evidence |
|---|---|---|
| 1 | Partial | The local public-door journey proves point 7. The planner holds points 1–6 and 8. |
| 2 | Pass for the lease | The real local Worker reads two nonempty, exact subscriber rows for the committed update. An extra, missing, inactive or misattributed record, or a reported provider acknowledgement, fails the new assertions at lines 113–128. |
| 3 | Pass | The named journey runs through `test:composer` in the push Verify plan. |
| 4 | Pass for the lease | The post-commit local receipt identifies the tested head. |
| 5 | Pass for the lease | `CONTRACT.md:177` cites BASE-MAIL-001, whose distinction between local and provider outcomes is supported here by the explicit negative acknowledgement checks. |
| 6 | Partial provenance | The generator's write and check passed. The recorded Gap, Evidence and judgment provenance remain the main judgments for this partial clause. |
| 7 | Pass | The contract and generated views match main byte for byte. |
| 8 | Pass for the lease | The preserved anonymous confirmation denial, confirmation replay refusal and erasure readback run at lines 84–88, 140–141 and 201–238 of the helper. The provider outcome assertions use the authorized operator read only. |
| 9 | Pass for the lease | Local suppression alone is established. Hosted authentication, real provider proof and adoption and release prerequisites stay held. |
| 10 | Pass | No policy default was adopted. The existing transport and routes are exercised as shipped. |
| 11 | Pending guarded landing | Main remains at the base SHA. Exact-candidate full-history publication scanning and Run site await the Mac lander. |

Existing assertions remain active. Browser assertions ran at 1440 pixels and the same Notifications screen was captured once at 1440 and 390 pixels. The proof capture masks subscriber destinations. No UI code changed. The diff contains no new email-shaped values or bare slash terms. The source lock is current.

CLAIM SETUP-001 PARTIAL points=7 tests=tests/e2e/maintenance-timezone.test.mjs#SETUP-001 SUB-002 NOTIFY-001 NOTIFY-004 — Local owner confirms public subscribers and inspects unsent incident notifications

GAP SETUP-001: Acceptances 1–6 and 8 remain held. Hosted sender, adoption and release prerequisites remain with their existing owners.

PROBE SETUP-001 7: Publish to the active page subscriber and incident follower, then read the committed update's deliveries and Notifications -> two suppressed email rows for the exact identities, explicit null provider acceptance time and identity, no provider outcome, and two visible “Not sent locally” rows.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Local checks

The touched file passed all three tests. On the committed SHA, the named subscriber journey passed again with Node 22.20.0, pnpm 10.12.4 and system Chromium. The pinned build, typecheck, first-party check, contract generation and source-lock checks passed. The privileged seed bootstrap could not install system packages in this VM. The cloud setup used the available Chromium, installed the exact Node pin for the candidate receipt and successfully initialized the isolated local seed.

The packet includes the exact-head journey TAP, check receipt and the two address-masked Notifications captures. Assertions used the original subscriber destinations. The capture mask was applied only when taking the pictures.

Replan 32 row for SETUP-001 · PARTIAL. Point 7 now has native and Notifications proof. Points 1–6 and 8 remain held under the existing lease. NOTIFY-001 and NOTIFY-004 keep their recorded scopes.

## Verify

Push Verify 44554172864 was completed with conclusion success on the exact product head `69af4dfce9acc31f4f224589fbde2c1b39fee20b`. [GitHub Actions](https://github.com/just-every/run-lamp/actions/runs/44554172864)

The observed main SHA was `8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b`. Base Verify 44548523701 and Run site 44548523753 completed successfully on `8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b`. The candidate's full-history publication scan and Run site are pending in the guarded landing workflow.
