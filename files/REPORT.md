# Lamp readable copy — main-lamp-readable-copy-1

Repository: just-every/run-lamp
Product branch: cloud/main-lamp-readable-copy-1
Product commit: 54ac16e2e892b9b914508cb3d5dfc241e582ab1d
Base main: ccc4f7a2f1c18223078b2f5e03440fd413d1575d
PR: https://github.com/just-every/run-lamp/pull/331

## Plan and scope

The complete plan is PLAN.md. Configure fleet identity, launcher credentials and commit hooks; launch main through documented rer setup/dev and native local owner entry; reproduce the three named screens with synthetic Northwind Payments data; make the narrow display and hint changes; extend only the existing maintenance journey; run that journey, typecheck and source/document checks; synchronize main and regenerate the source lock last; commit and guard-push only the named branch; open its PR; collect exact-head browser evidence and exact-SHA Verify; publish only explicitly selected non-secret report files on the evidence ref; stop owned processes and delete the pushed clone.

No other stranger findings or other parallel rounds were included. No CONTRACT.md Status, Gap or Evidence, generated ACCEPTANCE.md/docs/CLAIMS.md, release IDs, dependencies, migrations or workflow definitions were edited.

## Public-door reproduction

Used `cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`, followed by `rer dev` on loopback port 8899. Followed the native local owner link and the actual /setup UI, skipped the optional website, entered synthetic Northwind Payments page details and opened Lamp. Created only a synthetic Payments API component and a synthetic example.test subscriber via the authenticated operator API. No external account or mail provider was required; local mail remained suppressed.

`reproduction.json` records the original observations. Overview's initial HTML exposed raw ISO UTC times. After hydration it changed to relative “just now”; neither was the requested readable absolute app format. Reports displayed “1 current subscribers”. In current main, fully entered valid maintenance dates already replaced the ordering hint with the automation summary, while equal and reversed dates disabled scheduling and displayed the ordering warning. The stranger's persistent warning for a completed valid window did not reproduce on this main. Before-state desktop screenshots retain those actual observations; no claim is made to have reproduced a failure that did not occur.

Initial probe retries corrected automation of the asynchronous native owner entry and setup hydration; a legacy sign-in-link helper did not enter the native development door. The successful reproduction used the documented native rer entry. No browser profile, real-session transplant or external mailbox was used.

## Changes

- Overview LiveStrip uses the existing `useOperatorTime` formatter for publication and page/form check times, so both initial HTML and hydrated UI use the configured page zone and UTC offset.
- Maintenance renders the ordering hint only when both endpoints resolve to comparable instants. Incomplete fields keep scheduling disabled without presenting a misleading ordering warning; a daylight-saving parse failure retains its specific error. Equal/reversed endpoints show the ordering hint; valid endpoints show the existing automation summary.
- Reports chooses subscriber for exactly one and subscribers otherwise. The app had local, unexported plural functions in unrelated components, but no shared plural helper; the existing count-equals-one convention is used without introducing a new abstraction.
- DIVERGENCE.md records the presentation intent. The source lock was regenerated last and checked.

## Local validation

The existing registration in tests/e2e/maintenance-timezone.test.mjs passed: “MAINT-009 PAGE-020 — operator schedules, reschedules and publishes maintenance in its configured zone, then a customer subscribes by keyboard”. It now checks hint visibility and scheduling state for incomplete, equal, reversed, corrected and cleared inputs; it retains successful schedule/reschedule, exact configured-zone instants, DST rejection, component-history and incident times, and the existing keyboard and public accessibility journey. No wording assertions or new test registrations were added.

Touched journey: 1 passed, 0 failed, 0 skipped; 68.05 seconds. Typecheck passed. `node scripts/edition-authoring/cli.mjs check`, verification-plan inventory, `git diff --check` and `node src/base/contract-docs.mjs check` passed. `cloud_run npx -y @runeditrun/rer build` passed on the pushed commit. Full local verify was not run, as instructed; branch Verify is the full wall.

`local-checks.json` records commands, results and hashes of the touched source/test files. Tests ran on the same source/test bytes committed in this head; the candidate browser proof and build record the actual full commit identity. Logs are retained as actual files rather than described as unavailable receipts.

## Counts and clause judgments

Before → after: 78 → 78 test registrations; 10 → 10 assertion scripts; 88 → 88 total checks, below the 200 cap. Contract totals: DONE 57 → 57, PARTIAL 132 → 132, MISSING 55 → 55, TOTAL 244 → 244. Zero clause status, gap or evidence changes. No DONE claim or complete acceptance-point promotion is made by this narrow copy round. The touched screens relate to SETUP-001, maintenance scheduling and HIST-007; their broader proof gaps remain as judged on main.

## Git and publication custody

The single product commit uses Run Edit Run fleet <fleet@runeditrun.com> for both author and committer, with no co-author trailers and no skip-CI marker. Repository hooks remained active. Fresh main was fetched and rebased before the first push; main had not advanced and the rebase was clean. Re-lock/check after synchronization left no differences. All origin/main..HEAD identities, trailers and messages were inspected before the guarded push; the first attempt succeeded. No main/default branch was pushed or rewritten.

Product push receipt and PR receipt are separate from evidence publication. The fleet Mac owns its publication scan and landing; this cloud cannot run that scan under the task's adaptation. Evidence files and screenshots are excluded from the product commit. This report makes no acceptance or landing claim from evidence transport.

## Browser and CI completion

`browser-receipt.json` and eight candidate screenshots show Overview, maintenance with a valid and invalid window, and Settings → Reports at 1440 and 390. All observations name this pushed head. Overview uses Australia/Brisbane and UTC+10:00 even with the browser in America/Los_Angeles. Both readable timestamps fit at both widths; each screen has equal viewport and document scroll width, and no browser page errors were observed. The one-subscriber summary reads “1 current subscriber”. Valid windows enable scheduling and show no ordering warning; reversed windows show the ordering warning and disable scheduling. These are visual observations, not additional wording tests. `count-and-ssr-observations.json` additionally records “0 current subscribers”, “1 current subscriber” and “2 current subscribers” after explicit Refresh report, plus the readable initial HTML timestamps. The first population probe revisited the already-open Reports route and retained its cached count, as documented by the existing Settings design; `count-observations-before-refresh.json` retains that observation. Using the public Refresh report control read the new native totals correctly. Only this run’s synthetic subscriber addresses were changed; anonymized erased rows were preserved.

The production build passed. The preview native-entry probe did not reach the operator screen; final browser proof uses the documented `rer dev` door on the same committed candidate. Preview also reported an unavailable local scheduled-trigger endpoint, outside these named UI changes; no scheduled-job claim is made. Development and preview processes belong only to this run and are stopped by recorded PID.

Verify run 43011534745 targets exactly 54ac16e2e892b9b914508cb3d5dfc241e582ab1d. Discovery and the first poll (at least 300 seconds later) found it in progress. The third poll (again at least 300 seconds after the preceding poll) returned completed/success on that same exact SHA. `ci-verdict.json` records READY product custody from the actual successful run, and `ci-poll-3.json` retains the REST result. Run URL: https://github.com/just-every/run-lamp/actions/runs/43011534745. Seven explicit task gh calls were used in total; no workflow was dispatched or rerun. No scoped product blocker remains.

## Constraints and unavailable references

The inline brief and RULES.md, launcher AGENTS.md and repository AGENTS.md govern this work. Additional platform playbook reads through gh api returned HTTP 404; no other repository was cloned or written. The supplied inline UI essentials were followed. Those unavailable historical references did not require a ruling for these three specified changes. No held provider credentials or private gate material were read or copied into evidence.

## Return and cleanup

The complete explicitly selected packet is published only to refs/heads/evidence/main-lamp-readable-copy-1 in just-every/run-lamp. The publication command prints the evidence head separately for the terminal report; its manifest records the exact product branch/head and every selected file hash. After publication the report tree and all file hashes are fetched and verified, then the successfully pushed product clone and dependencies are removed. Native entry logs and temporary browser states were removed; no credentials, profile files or private gate material are selected. The final lane POST names the branch, full SHA, PR, unchanged clause counts and green Verify run.
