# Lamp PAGE-001 acceptance 3

Run Edit Run fleet · 2026-11-18 UTC · sd-lamp-c-f141-lin-1

Repository `just-every/run-lamp`  
Product branch `cloud/sd-lamp-c-f141-lin-1`  
Candidate `add81eb73e607bc57718f262387679d269f10878`  
Main base `ee4f9e01762dd11ad3df31bb7842b336ce9443a8`

## Plan and replay

1. Fetch current Lamp main and both feeder branches. Inspect the continuation's ancestry and isolate the work absent from main.
2. Cherry-pick the feeder onto main. Resolve the public contract test conflict by retaining all current-main code and adding the maintenance journey. Resolve the source-lock conflict by regeneration.
3. Regenerate and check the contract documents, restore the generated views from main, then regenerate and check the source lock. Prove the committed SHA with the ordered Verify build shard and the touched browser journeys. Capture the public listing and permalink with scripting disabled at widths 1440 and 390.
4. Fetch and rebase onto main immediately before the guarded push. Confirm the tested SHA, candidate identity, and linear history. Observe exact-SHA branch Verify and publish this packet on the evidence ref.

The ancestry scan found one round-owned non-merge commit, `a0aa52ef4b8c3e76cd560a1fc2286b9ed80fad03`. The continuation tip `f6138a6eb6cbe223968819b0f8a426997d97cb41` is a preservation merge. Its second parent is already on main. Its remerge delta changes the maintenance journey and the source lock. The cherry-pick resolution carries the strengthened journey from that merge into one ordinary commit. Main's native history aliases and conditional RSS assertions remain intact. The candidate changes only the public contract test and its source-lock entry.

## Local results

- The contract generator wrote zero documents and its check passed. Contract source and generated views match main. The source lock was regenerated last and passed its check.
- All nine build steps passed in order on the candidate SHA. See `build.json` for the exact order and exit codes, including the typecheck, application build and site build. The fleet CLI application build also exited zero.
- The anonymous response was proven at two snapshot generations. The later generation contains both active windows, the scheduled window one millisecond inside the horizon, and the window starting at exactly fourteen days. The following millisecond is excluded from the listing. All five native permalinks resolve on the same generation. The proof also checks the exact inventory, date ranges, lifecycle, affected component and published customer impact.
- The four screenshots show the listing and the boundary entry's permalink at desktop and phone widths. The browser follows the published link from the listing at each width.
- The existing public catalogue journey also passed on the candidate. It served byte-identical native Atom and RSS aliases and refreshed RSS from the old validator in 165 ms, retaining 24 prior GUIDs. See `public-history.json`.
- Lamp's test inventory goes from 112 to 113 registered cases. With the existing ten assertion scripts, the total goes from 122 to 123 checks. The touched file goes from six to seven registered cases.
- Clause counts remain 64 done, 125 partial and 55 missing, for 244 total. PAGE-001 remains partial. This round supplies proof for point 3.

CLAIM PAGE-001 PARTIAL points=3 tests=tests/e2e/public-contract.test.mjs#PAGE-001 — initial HTML lists all active maintenance and includes the fourteen-day boundary

GAP PAGE-001: Acceptances 1, 2 and 4 remain held, covering the complete component inventory, unresolved incident timelines, and per-component uptime records.

## Publication and CI

The pre-push fetch and rebase kept the tested SHA on current main. Candidate ancestry and identity checks passed. The guarded push advertised the product branch at 22:01:16 UTC. Exact-SHA Verify completed successfully, observed at 22:21:49 UTC. See `verify.json`. [Verify 44407417512](https://github.com/just-every/run-lamp/actions/runs/44407417512)

The cloud checks are complete. The Mac lander owns the publication scan and landing.
