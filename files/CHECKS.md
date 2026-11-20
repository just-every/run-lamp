# Candidate verification receipt

Candidate `2d49a4617e43cc910a99ec7ab3d1074684b62f58`. Base `173e93d259f968daffd0148365c2b9a26c62e3e6`. Local test toolchain Node 22.20.0, pnpm 10.12.4 and system Chromium. Run Edit Run fleet (Codex), 20 November 2026.

| Check | Result |
| --- | --- |
| Direct execution of `subscriberExpiryFlow` | Exit 0. The helper was run in a standalone module importing the exact candidate bytes. The two successful accounting observations were captured in a separate trace-only pass in `pending-email-expiry.json`. |
| HIST-007 registered delivery journey | PASS, 328641 ms. Native subscription, scheduled processing, report and operator inventory ran within the existing journey. |
| `pnpm run test:delivery` | Exit 0. All 8 tests passed with zero failures, cancellations and skips. Wall-clock duration 723 seconds. |
| `pnpm run typecheck` | Exit 0. |
| `pnpm exec rer check --profile first-party` | Exit 0. |
| `npx -y @runeditrun/rer build` | Exit 0. |
| `node src/base/contract-docs.mjs write` and `check` | Exit 0. Zero documents written and contract prose had zero errors and warnings. Both views were restored from the fetched main. |
| `node scripts/edition-authoring/cli.mjs lock` and `check` | Exit 0. Lock regenerated last and matched committed HEAD. |
| History, identity, diff and trailer checks | Clone has full ancestry. The only candidate commit used the fleet identity for both roles and had no trailers. No added address-shaped strings or bare owner and repository text. |
| UI proof | This test and source-lock change has no UI surface. |
| Migration ledger | No migration changed. |

Main was independently observed at `173e93d259f968daffd0148365c2b9a26c62e3e6` after the branch push. Its successful push runs were Verify 44671292824 and Run site 44671292988. Main differed from the candidate. The Mac lander owns full-history publication scanning and the candidate's Run site receipt after landing.

Candidate Verify 44783192337 completed successfully on the exact SHA in a push run. https://github.com/just-every/run-lamp/actions/runs/44783192337

The candidate branch advertised the exact tested commit at evidence handoff. The remote main head was `173e93d259f968daffd0148365c2b9a26c62e3e6` at handoff. Candidate Run site awaits landing.

Publication scan on this commit is pending on the Mac lander. No cloud scan result, history measurement or finding count was recorded.
