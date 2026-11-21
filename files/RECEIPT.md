# Build and probe receipt

Run: sd-lamp-c-f181
Repository: just-every/run-lamp
Product branch: cloud/sd-lamp-c-f181
Product head: a843e8c8551872a67174172e2b8a3a94f571a138
Base and remote main at publication: bafb632174ace2da2191b88bb186d0364e1415c7

The product push succeeded on attempt one. An independent remote ref read matched the full head. The candidate range contained one commit with the fleet author and committer and no trailers. Its only paths are the maintenance calendar serializer, the snapshot model type annotation, the existing publishing journey and the regenerated source lock.

## Commands and local results

- Negative control: the extended maintenance test with the base renderer failed at the exact scheduled DESCRIPTION comparison. The parsed event contained the title and component names and omitted both customer wording lines.
- `pnpm run typecheck` exited zero using Node 22.20.0 and pnpm 10.12.4.
- `pnpm run build:app` exited zero and emitted the production Worker configuration used by the two built-Worker cases.
- `pnpm exec rer check --profile first-party --json` exited zero with 966 checks and zero failures.
- Before the production build, the changed maintenance journey passed. Two existing journeys required the production Worker configuration. After building, the browser case also required the system Chromium path. Both existing journeys passed after those prerequisites were supplied.
- `git diff --check origin/main...HEAD` exited zero. The added text was checked for email-shaped strings and bare owner and repository tokens. The contract source and both generated views matched main.

- On the clean committed head, `node --test --test-concurrency=1 tests/e2e/publishing-contract.test.mjs` with the built Worker and system Chromium passed. The test summary was:

  ```text
  # tests 11
  # pass 11
  # fail 0
  # skipped 0
  # duration_ms 179971.209114
  ```

- Pinned rer setup prepared a credential-free local production preview. Once the one-use native owner entry had finished exchanging its fragment, authenticated native writes and the unauthenticated public calendar read passed. The local result was:

  > Local production preview passed native authenticated schedule and reschedule, exact public calendar descriptions, same UID and revised sequence and UTC window.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Point 6 proof

The existing subtest at `tests/e2e/publishing-contract.test.mjs:894` uses native operator write routes and authentic public calendar reads.

| Lines | Observations |
| --- | --- |
| 962–978 | Find the scheduled event by its UID. Parse exact title, public components, affected audience and customer impact. Check UTC start and end, confirmed status and sequence zero. |
| 983–1007 | Reschedule with a new pair of statements and both new times. Find the same UID at sequence one, with exact current DESCRIPTION and neither old statement. |
| 1041–1043 | Extend the in-progress window without submitting wording. Sequence two preserves the UID and the already revised description. |
| 1076–1094 | Regenerate through a later public native schedule. The internal-only window and internal component details stay excluded and the legacy event has the original two description lines. |
| `tests/e2e/helpers/calendar-assertions.mjs:5` | Every calendar read checks CRLF and a 75-octet maximum per physical line before parsing with ical.js. Exact text matching covers escaped punctuation, embedded newlines and multibyte text. |

## Remote verification

Candidate Verify was started by push as run 44880255296. The integration base had completed successful Verify 44876986189 and Run site 44876986360. Candidate Run site and publication scanning are lander checks.

Final REST result for push Verify 44880255296 was completed and successful at the full product head. The published branch still matched the product head. Terminal remote main was 96b1d1ca2deb70b9e225ee217a3431ad7d16acc1. Main equality with the candidate, the full-history publication scan and candidate Run site are pending guarded landing.
