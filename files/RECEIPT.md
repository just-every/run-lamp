# NOTIFY-017 runtime and mechanical receipt

The new proof is `internalStandingClaimSilenceFlow` in `tests/e2e/helpers/component-notification-flow.mjs`, registered at line 46 of `tests/e2e/delivery-contract.test.mjs` under the Subscriber consent, selected publication, channel delivery, export and erasure journey. Verify's public shard invokes `pnpm run test:delivery`.

| Read or action | Evidence |
| --- | --- |
| Native webhook creation, live confirmation URL and independent operator listing | Helper lines 278–295. The active subscriber has all-components mode, no narrowed identities and only component changes selected. |
| Native session, standing-claim commit and history read | Helper lines 297–332. One exact attributable transition is appended and the initial row is preserved. |
| Component event, delivery and outbox inventory | Helper lines 334–374. The visible transition creates one event, one delivered webhook and one completed dispatch command with the same event identity. |
| Receiver authentication and correlation | Helper lines 375–387. Exactly one request has the native delivery identity, expected component body and valid raw-wire HMAC. |
| Internal claim before and after dispatch | Helper lines 389–394. The four inventories have zero additions after the internal claim commits and again after the real scheduled dispatch runs. |
| Native implementation | `src/core/features/components/service.ts` lines 167–183, `src/core/features/components/repository.ts` lines 287–292 and `src/core/features/deliveries/component-notifications.repository.ts` lines 6–39. |

PROBE NOTIFY-017 4: native standing claim Operational → Major outage on an internal component -> one matching native history transition and zero new component events, deliveries, outbox entries or receiver requests before and after ordinary dispatch, with one matched signed visible delivery as the control.

A focused execution of the helper under Node 22.20.0 passed. A second run with only the visibility guard removed from the disposable esbuild output failed at the pre-dispatch inventory comparison with the message “the committed internal transition creates no event, delivery, outbox entry or receiver request.” That diagnostic used an in-memory loader and changed no tracked file.

MECHANICAL lock=`node scripts/edition-authoring/cli.mjs lock` and `node scripts/edition-authoring/cli.mjs check` exit=0; views=`node src/base/contract-docs.mjs write` and `node src/base/contract-docs.mjs check` exit=0; ledger=none, migrations unchanged.

`pnpm run typecheck`, `pnpm exec rer check --profile first-party` and `git diff --check` exited 0. The generated views were restored from main and the source lock records only the changed test bytes. The delivery file retains eight registered tests.

## Product custody and local suite

Product repository `just-every/run-lamp`, branch `cloud/sd-lamp-c-f190`, HEAD `ab062b028dca385c35624f712104e50787b9557a`.

Base `9ea011e0fe99033bc4e3d09fd6b6f96252c55324` passed push Verify 44899481148 and Run site 44899481252. The branch was advertised at the exact candidate SHA after push.

`pnpm run test:delivery` exited 0. Node 22.20.0, pnpm 10.12.4 and system Chromium ran the delivery file. The existing native subscriber consent journey and the entire file passed.

- tests 8
- pass 8
- fail 0

The focused probe also exited 0 after checkout of the exact committed candidate.

## Exact-SHA CI

Push Verify 44900292147 completed successfully on `ab062b028dca385c35624f712104e50787b9557a`. [Verify run](https://github.com/just-every/run-lamp/actions/runs/44900292147)

At handoff the product branch advertised `ab062b028dca385c35624f712104e50787b9557a` and main advertised `b6d1d051f754d8bc331658d496566450562de8ac`. The publication scan and main-only Run site await guarded landing.
