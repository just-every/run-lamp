# Lamp setup-guide rer versions

Run Edit Run fleet · 2026-11-16
Task: main-lamp-stranger6-trips-1
Repository: just-every/run-lamp
Branch: cloud/main-lamp-stranger6-trips-1
Candidate: fa751697bd6ea6301dad830dd9f3483da57a1c98
PR: https://github.com/just-every/run-lamp/pull/396

## Plan and execution

1. Refresh the fleet launcher and install the supplied Git authentication,
   commit hooks, push guard and evidence entrypoint. Clone only the declared
   repository, set the fleet identity locally, and branch from current main.
2. Read AGENTS.md and the product contract, acceptance source and divergence
   records. Reproduce the reported version mismatch before editing. Inventory
   tracked Markdown guides, separating current checkout-pin statements from
   release history, adoption records and compatibility requirements.
3. Replace stale current-pin numbers with the source of truth:
   package.json devDependencies and pnpm-lock.yaml. Explain that rer --version
   prints the installed CLI first and this checkout's pin second, and that
   commands use the pin after dependencies are installed.
4. Build the run site to validate published Markdown links and anchors. Run
   the existing documentation journey and inspect every changed published
   docs page at 1440 and 390. Add no version-assertion tests.
5. Regenerate the source lock last and run its check. Fetch main, commit with
   the required identity and hooks, rebase onto origin/main, inspect every
   candidate identity and message, and check the diff for credential shapes.
   Push the first real commit through the fleet guard, with no skip marker.
6. Open a PR against main, observe exact-SHA Verify within the REST budget
   and five-minute polling interval, then publish the report and actual
   receipts only on the separate evidence ref. Delete the pushed clone after
   evidence publication; leave landing and the full publication scan to the fleet.

## Reproduction

Current main was 0315c508e0dfba37e7d5799fee11cd3aa79fb0b3.
Its package.json declared @runeditrun/rer 0.2.118. README.md's source/tooling
and deploy sections and RUN-LOCALLY.md said 0.2.108.
The currently published CLI, invoked from its own npm execution environment
inside the checkout, printed:

    0.2.120
    This checkout (...) pins rer 0.2.118 (package).

The local npm entrypoint printed 0.2.118 and the same checkout pin. Thus the
installed command, the declared project runtime and stale prose were three
distinct statements. reproduction.json and the two version text receipts
retain the actual non-secret observations.

## Changes and counts

Trip count: 1 reproduced, 1 fixed, 0 remaining in this assignment.
Stale current rer-pin statements: 11 before, 0 after.
Markdown files changed: 9. One generated source-lock file also changed.

- README.md: source/tooling and deploy instructions point to the declaration.
- RUN-LOCALLY.md: source of the pin, installed/project distinction and the
  dependency-install prerequisite.
- docs/install.md: same pin source and runtime distinction.
- docs/deployment-reference.md: replace the old pin and clarify the command reference.
- docs/operators-and-sign-in.md: remove the old pin from hosted-owner guidance.
- OPERATIONS.md: same correction in the technical sign-in procedure.
- DEMO.md: replace the obsolete current npm pin.
- HANDOVER.md: distinguish the current package pin from recorded Base origins,
  and remove the obsolete number from current sign-in instructions.
- DIVERGENCE.md: describe the 0.2.22 adoption as history rather than the
  current checkout pin; preserve the patch-removal record.

The repository-wide inventory retains release-tag history in CHANGELOG.md,
immutable source snapshots, historical adoption dates and recorded Base
comparison revisions. Feature-introduction and minimum-version statements
are not claims about the current checkout pin. Those remain unchanged.
remaining-version-references.json records the reviewed remaining references.

No rer adoption or pin change. No owner-reviewed homepage, runtime, test,
release metadata, contract judgment or generated contract view was changed.
Test registrations added/removed: 0/0.
Contract counts before/after: Core 60 done / 129 partial / 50 missing;
Agent surface 0 / 0 / 5; full target 60 / 129 / 55, 244 total.
Clause status changes: none. Claims: none.

## Validation

- Non-interactive rer setup with fleet owner: exit 0. The private installer
  log stays outside the public packet.
- Run-site build: exit 0, 38 pages and 63 files. Its docs builder validates
  Markdown links, anchors and selected sections.
- Existing DOCS-001 PAGE-020 public documentation journey: 1 passed, 0 failed.
- Browser proof: /docs/run-locally, /docs/install,
  /docs/deployment-reference and /docs/operators-and-sign-in each loaded
  successfully once at 1440 and 390. All eight visits had no horizontal
  overflow and no page errors. Full-page PNGs and a structured receipt retained.
  The initial standalone proof harness had a CommonJS import error; its
  import was corrected before the successful proof. Product code was unaffected.
- Source-lock regeneration and source check: both exit 0. Only the nine
  changed Markdown hashes moved.
- git diff --check: passed.
- Candidate author and committer: Run Edit Run fleet <fleet@runeditrun.com>.
  No trailers. One candidate commit, no side parents.
- Diff credential-shape review: passed. The fleet runs the full publication scan.
- Typecheck omitted because no code changed. No full local rer verify was run.

checks-receipt.json binds the commands and actual logs to the candidate.
browser-receipt.json binds each viewport visit to its screenshot.
pre-push-receipt.json and product-push.log retain product custody.
Evidence publication is a separate report-only transfer and makes no
acceptance or landing claim.

## CI and terminal result

Exact-SHA branch Verify run 43885139385 completed successfully:
https://github.com/just-every/run-lamp/actions/runs/43885139385
Head: fa751697bd6ea6301dad830dd9f3483da57a1c98
REST discovery plus four scheduled status reads and PR creation used six
GitHub calls in total. Reads were separated by at least 300 seconds.
No failed-job log read, rerun or product repair push was needed.
Product push count: one. The branch and PR are ready for the fleet's independent
publication scan and landing gates; no default branch was pushed or merged.
Terminal product result: READY.

## Limitations

Hosted installation, provider delivery and production deployment were outside
this docs-only assignment. No account or ruling was missing. The full
publication scan and landing remain fleet responsibilities.
