# Lamp ACCESS-001 campaign report

Run tag `sd-lamp-c-f149`. Candidate `3db51500377b756a4d5a06f7b7b076f00e2e7b0c` on `cloud/sd-lamp-c-f149`. The product branch advertises that SHA.

ACCESS-001 remains PARTIAL. Before and after counts are 65 DONE, 124 PARTIAL and 55 MISSING (244 total). The revised plan row records measured progress on acceptance 1 and retains the held remainder.

## Plan and result

Read the ACCESS-001 acceptance text and status gap, trace the CLI and its Wrangler D1 subprocess, add the missing refusal to the existing ownership journey file, run the changed tests and required mechanical checks, then publish the candidate and this report packet. The plan extract's ACCESS-001 row is the only row addressed.

The new test calls the actual sign-in CLI as a child, with an isolated working directory, private local installation settings, a synthetic value, and an exact HTTPS test origin. Its explicit child environment excludes SESSION_SECRET and limits PATH to a marker-writing pnpm stand-in. The checks require a nonzero exit, a diagnostic naming the missing variable, empty standard output, no link in the diagnostic, and no subprocess marker. Neither the sign-in command nor its database adapter needed modification.

### Acceptance coverage

| Point | Evidence | Result |
| --- | --- | --- |
| 1, missing environment secret | `tests/e2e/auth-adoption-journey.test.mjs:68`, remote terminal sign-in refuses a missing environment secret before invoking Wrangler | Covered by this change. |
| 1, successful remote custody | The refusal cannot establish successful issuance using the deployed installation's environment secret. | Held by the lease. |
| 2, hashed twenty-minute single-use link, one stdout copy and creation audit | The existing local ownership journey consumes a link through the native confirmation door and rejects replay. Full hash, expiry, stdout and audit reconciliation was held. | Partial historical coverage. |
| 3, no operator or session on issuance and Base session on consumption | The existing local ownership journey checks a session after confirmation. Operator and session inventories at issuance were held. | Partial historical coverage. |
| 4, common refusal for unknown, deactivated and erased operators | This lease covers a missing environment secret before operator lookup. | Held by the lease. |

### DONE-RIDERS review

| Rider | Result for this partial claim |
| --- | --- |
| 1 | Missing-secret outcome covered through the CLI. Whole-clause proof remains incomplete. |
| 2 | Refusal is observable before Wrangler runs. The existing browser test covers local issuance and replay. Successful remote custody remains held. |
| 3 | Push Verify includes the ownership shard through `pnpm run test:ownership`. The exact candidate run is recorded below. |
| 4 | The CLI probe is bound to the candidate SHA. The receipt records the changed file and local checks. |
| 5 | The clause cites BASE-ACCESS-001, BASE-ACCESS-002 and BASE-SECRET-001 in `CONTRACT.md:179`. Local confirmation is relevant to sign-in and session continuity. This refusal is evidence for the missing-secret command boundary. |
| 6 | Contract write and check succeeded. Current main's status, gap, evidence cells and generated views are inherited. |
| 7 | The acceptance wording and recorded rulings stayed intact. |
| 8 | The scoped refusal precedes D1. The full actor-authority and session paths are held under points 3 and 4. Existing local assertions remain in the suite. |
| 9 | The proof used a subprocess stand-in and made no provider request. Successful hosted issuance remains held. |
| 10 | The existing remote custody rule was exercised. The test introduces no policy default. |
| 11 | The guarded publication scan, main equality and candidate Run site are the lander's checks. |

No existing assertion was removed or relaxed. Existing local replay and revoked-session assertions remain. Erased-actor refusal is part of the held point 4. There was no UI change, so no new screen proof was needed. The source lock was generated after the test edit. Added product lines and the packet were checked for email-shaped strings, and no bare repository-like prose token was introduced. No migration was changed.

## Candidate and CI

Exact-SHA Verify [run 44554761390](https://github.com/just-every/run-lamp/actions/runs/44554761390) observed as `in_progress` with conclusion `pending`. Event `push`.

The observed main tip is `8a2d2e8963f4ae9a84fe17cc6b1b6f7e2bafc64b`. The candidate is branch-only. Candidate Run site and the COMPLETE full-history publication scan are pending guarded landing.

At the base SHA, Verify 44548523701 and Run site 44548523753 completed successfully. Those runs apply to the base SHA.

The temporary local stash used the configured fleet identity without the explicit environment prefix. Both unpublished stash commits were inspected and had the fleet identity. The released candidate used the explicit prefix and passed the identity and trailer check.

CLAIM ACCESS-001 PARTIAL points=none tests=tests/e2e/auth-adoption-journey.test.mjs#remote terminal sign-in refuses a missing environment secret before invoking Wrangler

GAP ACCESS-001: Successful remote environment custody and the remaining exact issuance, expiry, audit, operator and session continuity and actor-refusal outcomes remain held.

PROBE ACCESS-001 1: node scripts/signin-link.mjs --remote with an exact HTTPS test origin, private local settings and SESSION_SECRET absent -> exit 1, SESSION_SECRET named, no link, no Wrangler invocation.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0
