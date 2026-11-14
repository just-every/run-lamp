# Lamp subscriber migration inventory continuation

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-qgrowth-subscribers-2
Product head: 4767e8943a310ac825cf652e41bc47f397cc60eb
PR: https://github.com/just-every/run-lamp/pull/368
Gate: required, because this candidate includes an index migration. The independent migration gate and complete publication scan remain fleet responsibilities before landing.

## Plan and scope

PLAN.md contains the full executed plan. This continuation started at the published subscribers-1 head 21500d4b8032db437098a7c1e8cd1b175cea144d. Current main was 4271d1caa8f044a0265eb287c660e1777bd5b942, already an ancestor of that head; both explicit merge attempts reported already up to date. Main was fetched again before the candidate commit. No published ancestry was rewritten. Main's highest migration is 0078_vendor_dependencies.sql, so no renumbering was necessary.

The only new product edits relative to subscribers-1 are the RELEASE.json migration inventory object and the source-lock entry regenerated from it. Version remains 1.11.15; package.json, seed.json, changelog, release prose, historical release records, contract and generated views are unchanged. The existing release prose still describes the preceding metadata round; its version and wording are owned by the separate release round and were outside this narrowly authorized inventory edit.

The subscribers-1 query repair, migration and tests are retained byte-for-byte. The complete branch diff against main contains the existing subscriber repository/service/route changes, directory flow extension, setup-migration assertion correction, migration 0079, this release inventory entry and regenerated sources.lock.json. No size harness, evidence, credential, helper or unrelated feature file enters the product tree.

## Failure diagnosis and inventory design

The prior evidence report was read through the repository API. Run 43540987750's completed failed build job 132281289372 was retrieved exactly once with:

gh run view 43540987750 --repo just-every/run-lamp --job 132281289372 --log-failed

The actual log is prior-build-failure.log. It reports “RELEASE.json migrations must exactly match newly introduced migrations/core in apply order”, with actual [] and expected ['0079_subscriber_directory_order.sql'].

Current RELEASE.json and the retained v1.11.14/v1.11.15 structures were inspected along with schema/RELEASE.schema.json, scripts/validate-release.mjs and scripts/release-metadata.mjs. The current release object is the working delta after the retained predecessor chain. The validator requires every migration after that chain's prefix, exactly once and in filename order. Its migration object requires id and buyerSteps; there is no separate next-version inventory field.

The new entry names 0079_subscriber_directory_order.sql and tells the owner to apply it after 0078 through the normal runner before starting the updated Worker. It explains that the index preserves subscriber records, consent and delivery history and needs no account or credential. No validator was changed, no version bump was introduced, and no changelog section or extra release field was added. The release validator now passes.

## Product and migration behavior

The inherited migration remains exactly SHA-256 c17148f4bb9b6e47cc154948715141d10126c9b8ec7c1fcef56ddd7d103b3e92. It executes only CREATE INDEX IF NOT EXISTS subscribers_directory_order_idx ON subscribers(created_at, id). It changes no existing migration, table, trigger or stored row. A scratch SQLite probe applies all preceding migrations, inserts a synthetic subscriber, snapshots all 199 tables, applies 0079 twice and compares every table value after each application. Both comparisons pass. EXPLAIN uses subscribers_directory_order_idx and has no temporary B-tree sort. The first scratch probe named an unsupported confirmed_at fixture field and failed before migration replay; the corrected probe passed. This did not require a product edit.

The inherited query uses the deterministic oldest-first created_at/id index and fetches limit+1 to determine hasMore, hydrating only displayed rows. Existing explicit offsets, page bounds, whole-directory capacity aggregates, consent, component selection and deactivation data remain intact.

## Validation

Actual command results and filenames are recorded in validation-receipt.json.

- Setup completed through cloud_run with the required fleet owner and noninteractive flags. Private installation state and setup output are excluded from the published packet.
- Release validator, typecheck and production build pass.
- The existing subscriberDirectoryFlow passes through native owner/public HTTP doors. It checks 106 identities across page sizes, ordering, complete and nonduplicated coverage, selected components, consent/deactivation facts, full-directory eligible counts, empty pages, rejected invalid bounds, erasure and revoked/anonymous authority.
- The setup-migration test passes, including an incomplete apply that reports 0061-0079 and a complete rerun ledger.
- Existing identity forward-upgrade cases pass, preserving subscriber authority and history while destroying legacy credentials and respecting kept/erased/revoked setup operators.
- The technical archive test passes: a failed owner upgrade rolls back, corrected replay runs once, empty-target restore preserves owner rows/relationships/triggers and refuses a populated destination.
- The previous-release native archive import passes, comparing retained history, consent, rows, images, foreign keys and post-restore auditing.
- These targeted commands report 9 passing cases, zero failures, cancellations or skips. The additional baseline installation-restores-and-upgrades check passes its single case, including prior/current migration ledgers, preserved owner/component data, archive recovery and duplicate-delivery protection.
- Contract-document check, source-lock check and whitespace check pass. The lock was regenerated last after staging the inventory change, before the commit.
- No tests or assertions were removed, skipped or weakened. No new registration was added. Existing test source is identical to subscribers-1, whose recount was 92 registrations plus 10 executable assertion scripts = 102.
- No full local verify or full suite was run. Exact-SHA branch Verify is the full CI wall. No UI source changed, so no new browser layout proof is claimed.

## Scratch size measurement

The size-check.json, agent-surface.json and hosted-check.json bytes were read from cloud/sd-lamp-sizecheck-3 at 2f20c96d83d9c4c0a350cf9e8fc7978a89d55fe1 into scratch only. Published @runeditrun/rer@0.2.115 ran the ordinary size command against the candidate's unchanged production build. measurement-provenance.json records exact declaration and emitted Worker hashes and equality of the measured subscriber source/migration bytes. No harness file, pin, fixture, threshold or exemption was committed or changed.

The actual ordinary output is size-result.jsonl, with size-stderr.log and both emitted statement files. The runner exits 1 because seven previously known unrelated flows remain red. Subscriber-list passes at both sizes: HTTP 200, 156 statements, 1,109 total rows read, against its unchanged 5,000-row large ceiling and unchanged 10% + 200 growth rule. Growth is zero. The list statement reads 51 rows, capacity 1,003, and displayed operator attribution 50 at either size.

| Flow | Previous repair small/large reads | This continuation small/large reads | Result |
| --- | ---: | ---: | --- |
| component-list | 4,121 / 182,321 | 4,121 / 182,321 | unchanged failure |
| incident-list | 1,805 / 180,005 | 1,805 / 180,005 | unchanged failure |
| incident-detail | 1,317 / 1,343 | 1,317 / 1,343 | pass |
| component-history | 13 / 511 | 13 / 511 | unchanged failure |
| subscriber-list | 1,109 / 1,109 | 1,109 / 1,109 | pass |
| monitor-list | 653 / 653 | 653 / 653 | pass |
| maintenance-list | 13 / 13 | 13 / 13 | pass |
| minute-tick | 24,219 / 1,671,933 | 24,219 / 1,671,933 | unchanged failure |
| public-summary | 0 / 0 | 0 / 0 | unchanged HTTP 503 |
| public-history | 0 / 0 | 0 / 0 | unchanged HTTP 503 |
| public-feed | 0 / 0 | 0 / 0 | unchanged HTTP 503 |

The original pre-repair subscriber measurement was 4,299 / 325,059. This continuation confirms the repair's 1,109 / 1,109 result and preserves all unrelated measured flow reads and statuses. Four of eleven flows pass, unchanged from subscribers-1 and up from three before the repair. Public snapshots remain unavailable and native scheduled preparation retains its known exception; none is disguised as a pass or changed outside this lease.

Every declared table reads back its exact declared row count. This execution reports 6,783 small / 541,171 large total database rows, one more at each size than the earlier report's total; no declaration bytes changed, and no cause for that total-row difference is asserted. All per-flow rows-read figures agree exactly with the prior repair. This is synthetic local emitted-Worker/SQLite proof, not D1 provider or hosted qualification. Queue consumers remain held and unmeasured by the published runner.

## Counts and claim

Counts remain 244 clauses: 60 done / 129 partial / 55 missing, before and after. No contract, status, Gap, Evidence or generated view was edited. SUB-011 remains partial.

CLAIM SUB-011 PARTIAL points=1,3 tests=tests/e2e/helpers/subscriber-directory-flow.mjs#subscriberDirectoryFlow
DEFAULT SUB-011: retain explicit offset pagination, oldest-first ordering, the 100-row cap and whole-directory capacity aggregates with deterministic id ties.
GAP SUB-011: this backend continuation does not add fresh rendered operator-view proof or promote the clause; independent landing gates remain required.

## Publication and custody

The clone was expanded from shallow/filter=blob:none to full history. The exact committed-tree Base publication scan used public base https://github.com/just-every/run-lamp#main, edition id just-every/lamp and destination https://github.com/just-every/run-lamp. It reports INCOMPLETE, exit 2, scan.gitleaks-unavailable because pinned Gitleaks 8.30.1 is not installed in this cloud. publication-scan.json is the actual result; no complete fleet publication/privacy/environment scan is claimed. The fleet must run that independent scan and the required migration gate before landing.

All two candidate commits, including side-parent scope, pass the pre-push fleet author, committer and trailer checks; no co-author trailers are present. The cleanup hook stayed active. The first real continuation commit was pushed through cloud-push.py, succeeding on attempt one. There was one product push, no force push, and no main push, landing, tag, release or deploy.

PR #368 is left for the lane. CI run status and final report-only evidence custody are appended below after observation. Complete explicitly selected non-secret report files are transported only to evidence/sd-lamp-qgrowth-subscribers-2, separate from the product branch. Evidence publication is not product acceptance or landing.

## Exact-SHA CI result and final handoff

Verify run [43543599879](https://github.com/just-every/run-lamp/actions/runs/43543599879) completed **success** on product head **4767e8943a310ac825cf652e41bc47f397cc60eb**. ci-status-3.json is the actual REST receipt. The preceding discovery and status observations are retained, with every read more than 300 seconds after the previous read of the run. Total budget used: **8 of 10 GitHub command calls**. One watcher observed the run; no workflow was dispatched or rerun. The prior failed build-job archive was read once, as requested.

RELEASE.json migration inventory count changes from 0 to 1; the candidate's core migration inventory contains 79 files versus main's 78. This continuation leaves the previous product repair intact. Clause counts remain 60 done / 129 partial / 55 missing, with no status changes; tests remain 102 committed registrations/assertion scripts.

No product blocker remains. The exact-SHA success does not waive the fleet's complete publication scan or required independent migration gate. The product branch and PR are ready for those fleet gates, with no landing authorization exercised here. The selected packet is published separately through cloud_evidence.py; its exact EVIDENCE receipt is reported in the final message. Pushed clone cleanup follows successful report publication; actual reports stay under the task packet directory.

CLAIM SUB-011 PARTIAL points=1,3 tests=tests/e2e/helpers/subscriber-directory-flow.mjs#subscriberDirectoryFlow

READY branch=cloud/sd-lamp-qgrowth-subscribers-2 head=4767e8943a310ac825cf652e41bc47f397cc60eb
