# Lamp setup replay

Recorded 2026-11-18T02:29:42Z for just-every/run-lamp.

## Plan and results

1. Verify the two historical refs and create the branch from the latest Lamp main. The original round ref resolved to aab0f2e95fae28ff7c968ace7321f26a85664991, and the previously green linear candidate resolved to 8863365f299cc5202384df08e4bd0b49e2ef1531. Fresh main was d67ebd9edde4f39afd80fed797b3364f944894b5.
2. Replay the setup and native-auth commits as ordinary non-merge commits. The resulting branch is cloud/sd-lamp-design-setup-3 at e1590cb8c9b8efe7537034897623ec91f54330dc. The replay preserves newer main's local accent picker behavior and invitation layout, incident component choice, maintenance reminders and cancellation, and public maintenance notice rendering. The candidate updates the maintenance drawer assertion from a raw IANA identifier to the Brisbane time-zone link and its Settings destination. The following UTC checks are preserved. The first-round shared Run-page Bash guidance and page-only icon export are outside the replay.
3. Run the seed's `adapt-base src/base/lobby.ts` acknowledgement command. The lobby Base revision, Base bytes, local bytes and file mode match the previous candidate. The complete command receipt is in `lobby-acknowledgement.json`. No Base refresh ran.
4. Regenerate and check the contract views, restore the tracked views from main and regenerate the source lock last. Both commits use fleet author and committer identities without trailers. The candidate contains no merges and changes no contract clauses, generated views or release metadata. Full target counts are 60 done, 129 partial and 55 missing across 244 clauses before and after. Core is 60/129/50 across 239 clauses, and Agent surface is 0/0/5 across 5.
5. Run the nine Verify build steps in order on the exact local candidate. All passed with Node 22.20.0 and pnpm 10.12.4. `receipt.json` lists the commands and timestamps.
6. Apply the brief's clause-meaning stop gate before journeys, publication and exact-SHA Verify. The product branch was held locally. The candidate has no CI run or PR, and the 1440 and 390 browser captures were not run. Historical Verify runs 44137039509 (failed), 44156174371 (passed), and 44184294891 (passed) refer to earlier candidates.

## Release contract blocker

`CONTRACT.md:306`, PAGE-012 acceptance point 4, requires the favicon to combine the configured logo with a mark for the current overall state. Main uses the configured logo in the favicon. The replay's `src/core/features/public-snapshot/branding.ts:28` chooses the optional square icon for the favicon or renders a letter mark when there is no square icon. `tests/e2e/public-contract.test.mjs:449` explicitly expects that letter mark when the owner configured only a logo. The status mark and Open Graph status rendering remain in place.

The changed-entry rule in `scripts/release-metadata.mjs:783` applies to a published clause whose meaning changes. `validate:release` passed against the unchanged clause text and release metadata. A decision is needed to keep a configured-logo favicon fallback or authorize the clause and release metadata change for the independent icon fallback.

No contract clause claimed; these are owner-journey design fixes (DIRECT 87).

The local candidate is preserved in a verified incremental Git bundle over d67ebd9edde4f39afd80fed797b3364f944894b5. The bundle's absolute path and SHA-256 are in `receipt.json`.
