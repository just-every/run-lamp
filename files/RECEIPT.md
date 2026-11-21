# Local and product transport receipt

Candidate 268e93422a0ff044c720273e05da0eb74090a108
Branch cloud/sd-lamp-c-f160
Base 3c814ba060047b1f2f0908c42dfcbe0f4f9a8adb
Node 22.20.0 and pnpm 10.12.4

- Pinned setup and its production Worker build succeeded. The tested implementation bytes match the candidate.
- The first touched-file run reached the UPDATE-005 probe. Its maintenance browser case could not find the bundled Playwright Chromium. Re-running the touched file with the supported system Chromium option gave the result below.
- Command `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium cloud_run perl -e 'alarm 1200; exec @ARGV' -- node --test --test-concurrency=1 tests/e2e/publishing-contract.test.mjs` exited 0 with 11 passes, zero failures and zero skips. The full TAP output accompanies this receipt.
- Command `pnpm typecheck` exited 0.
- Command `cloud_run pnpm exec rer check --profile first-party` exited 0.
- Contract generation wrote zero changed documents. Its check passed with zero errors and zero warnings both before and after commit.
- Source lock regeneration ran after generation and restoration of the views. Both subsequent `node scripts/edition-authoring/cli.mjs check` runs exited 0 with ok true.
- Full-history clone. Candidate identity and trailers checked for all candidate commits. There was one commit and zero trailers. Added text checked for email-shaped and bare owner and repository tokens. No matches.
- Product push guard succeeded on attempt one. Git confirmed the exact product SHA advertised on the named branch at 2026-11-21T00:11:40Z. Main still advertised the base immediately before the push.
