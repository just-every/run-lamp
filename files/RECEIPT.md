# Local verification receipt for SUB-009

Product candidate `2b52a97df43e97224b62a303e105d97e63c1b870` on `cloud/sd-lamp-c-f136`. Node v22.20.0, pnpm 10.12.4, system Chromium 154.0.8037.57. The native delivery tests use a disposable Worker with real migrations and synthetic provider edges.

- Standalone `statuspageWebhookFlow` exited 0 on the clean candidate. It exercised the existing browser journey, the Statuspage receiver and the two-key Lamp and Slack receiver, including exact wordings and public component reconciliation.
- Standalone `webhookReceiverDeadlineFlow` completed at 2026-11-18 05:33:33 UTC on the clean candidate. Direct cloud execution ran the committed helper through the real Worker Queue outside push Verify. Exit 0.
- `pnpm typecheck`, `pnpm exec rer check --profile first-party`, `node scripts/verification/check-plan.mjs`, and `git diff --check origin/main...HEAD` exited 0 on the candidate.
- The source lock was regenerated after staging the touched files. The lock check and generated-view check passed again on the exact commit. The generated documents matched main.
- Both reachable candidate commits had fleet author and committer identities and zero trailers.

## Standalone deadline output

> Webhook receiver acknowledged in 62 ms, timed out in 30009 ms, ignored a 2xx at 30100 ms and refused a redirect without following it.

## Public-door probes

PROBE SUB-009 1: Native webhook subscriber POST and emitted confirmation URL -> one pending identity became active in the subscriber directory.

PROBE SUB-009 2: Published incident through the real signed webhook receiver -> independently verified both keys over the same delivery ID, timestamp and complete body bytes, and verified that both fail after appending one byte.

PROBE SUB-009 3: Native publication with a changing public component, unchanged public attachment and an internal attachment -> exact retained incident, complete updates and public component state pairs on each request, with internal identity and subscriber contact absent from the body.

PROBE SUB-009 4: Real Worker Queue to timely, unanswered and redirecting receivers -> 204 delivered in 62 ms, unanswered attempt failed after 30,009 ms, 204 after 30,100 ms preserved the failure, and the 307 target saw zero requests.

PROBE SUB-009 5: Captured Slack incoming webhook for distinctive published wording -> bracketed URL with punctuation outside, nonempty URL-labelled rich-text links and all fields reconstructed.

PROBE SUB-009 6: Captured Lamp webhook for three independently submitted publications -> exact committed identity, published instant, wording, lifecycle and next update.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Registered delivery-suite output

`pnpm test:delivery` exited 0 on the exact candidate at 2026-11-18 05:44:34 UTC.

> Webhook receiver acknowledged in 57 ms, timed out in 30006 ms, ignored a 2xx at 30100 ms and refused a redirect without following it.

```text
1..7
# tests 7
# suites 0
# pass 7
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 700726.741953
```
