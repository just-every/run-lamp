# Lamp NOTIFY-001 linear replay

Codex, 2026-11-19 UTC, sd-lamp-c-f140-lin-1.

| Reference | Commit |
| --- | --- |
| Fresh main | 579466148ad2fa1e6cea795c1e8331d2fc8da984 |
| Feeder | 8f5dacaffef33c1b553ee6e485dc60da03188c57 |
| Gated continuation merge | a4a343a042fdef482aa8c4daba7476b4a67a81f7 |
| Linear product candidate | 846642aa7fba5def53977c81669fe71082836a37 |

## Plan and result

1. Fetch fresh main and both feeder refs. Enumerate the feeder-only non-merge commits and inspect the gated continuation's recorded merge resolution.
2. Carry the patch onto fresh main. The only feeder-only non-merge commit listed by ancestry was 8f5dacaf. Patch comparison marked it equivalent to main's 61760b6, which made a duplicate pick unnecessary. Main's 6944d65 already carried the continuation's notice and delivery checks and bound the captured provider request, mail body, receipt and stored attempt by idempotency key. Main's 5794661 had also recorded the passing NOTIFY-001 judgment.
3. Preserve the remaining distinct merge-resolution check. The final aggregate of four emails validates the total. Measuring the increase at each transition also confirms when that transition sends its mail. Restore the gated count at each transition, before checking repeated Cron silence. Retain main's newer pre-transition absence checks and its independent counts of requests and acceptances.
4. Generate and check the contract views, restore the checked-in main views, then regenerate and check the source lock. Commit the two scope files. Rebase immediately before the single product push. The refreshed main still matched the original base and the rebase preserved the exact tested SHA. The candidate has one ordinary commit and zero merge commits.
5. Re-prove the maintenance, incident and subscriber journeys on the exact candidate. Run the nine build steps in their declared order and verify the public maintenance permalink against the built Worker. The browser asserted the two public states at 1440 px and captured each state at 1440 and 390 px.
6. Confirm exact-SHA branch Verify, then publish this packet and its receipts as a child of the advertised candidate on the evidence ref.

## Per-file comparison

- `tests/e2e/helpers/maintenance-notices-flow.mjs` restores the gated merge's pre-transition window mail count and exact one-message increase at both start and completion. Main's capture reads the Resend request and ties it to the delivery via its idempotency header, replacing the old merge's inferred capture index. Main also explicitly checks that the next notice and delivery do not exist before the transition, and separately checks unchanged request and acceptance counts after repeated Cron. The notice, delivery, recipient, rendered status and timing assertions carry forward.
- `sources.lock.json` records the hash from the final maintenance helper bytes and inherits the rest of the lock from main. Main's newer contract and test hashes account for the other differences from the historical merge lock.
- `tests/e2e/publishing-contract.test.mjs` is identical to the historical merge. The maintenance proof extends the existing registered case.
- `tests/e2e/delivery-contract.test.mjs` inherits main's newer delivery inventory import and assertions in the failing-destinations journey. The subscriber consent and selected-publication test used by NOTIFY-001 carries forward.
- `CONTRACT.md`, `ACCEPTANCE.md`, and `docs/CLAIMS.md` carry forward main's recorded DONE judgment, evidence, empty gap and newer unrelated text.

## Counts

| Baseline | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| Main before its NOTIFY-001 judgment | 64 | 125 | 55 | 244 |
| Fresh main before this round | 65 | 124 | 55 | 244 |
| Candidate | 65 | 124 | 55 | 244 |

NOTIFY-001 was partial before the main judgment and is DONE on fresh main and the candidate. The candidate edits zero clause cells. Publishing and delivery retain 11 and 7 test registrations respectively, with zero new or removed registrations.

## Proof

- On start and completion, the existing maintenance journey reconciles one new native notice and one delivery against the exact captured request to the selected recipient. It verifies provider acceptance, the request message ID and the customer-visible state. Repeated Cron retains the exact notices and delivery rows, sends no more window mail and records no more provider requests or acceptances.
- Real Chromium follows the public permalink on a disposable installation of the built Worker. The two desktop assertions check the public state, title, matching timeline notice and customer impact. The packet contains both transition states at desktop and phone widths.
- The remote fleet lander performs the complete publication scan and applies its independent landing gates.

## Local results

All nine build steps passed in plan order with Node 22.20.0 and pnpm 10.12.4, including typecheck, the contract generator checks and the source lock check. The contract generator produced zero view changes. The nine build steps and the touched maintenance case passed before the push. The remaining local proof ran on the same commit while branch Verify was in progress. The focused NOTIFY-001 run passed all three named publishing and delivery cases. The complete publishing and delivery contract files passed all 11 and 7 cases, respectively. The public permalink browser proof yielded all four screenshots from the built Worker.

## Branch Verify

Verify run 44454230186 completed successfully on candidate 846642aa7fba5def53977c81669fe71082836a37. [GitHub Actions](https://github.com/just-every/run-lamp/actions/runs/44454230186)
