# Lamp schema observation — SD-IV-2

Date: 2026-11-13T18:44:00Z
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-schema-observation-1
Product head: b310b7c75e5bea6b093f967dccbbb447887de5e1

The implementation adds buildVersion from the compiled package version and schemaObservation v1 to the existing /health response. DB.rer_migrations is observed through SELECT only. The reader returns completeCount, partialCount, and the rer-migrations-v1 SHA-256 of UTF-8 JSON.stringify of all complete [name, lowercase hash] pairs, sorted with JavaScript ordinal comparisons. No expected inventory is inferred from source or migration filenames.

Actual ledger inspection confirmed DB and rer_migrations(name, sha256, applied_at). Lamp scripts/platform-ledger.mjs and read-only Platform cloudflare-migrations.ts / migration-batch.ts agree. Platform writes partial identities as file.sql#start-end; these stay out of the complete digest. No payload/digest correction was necessary. Numeric marker ranges must be safe integers with end greater than start; this does not validate them against expected SQL statements.

The observation reads at most 2049 ledger rows and accepts at most 2048. It bounds returned names to a 1025-character sentinel and hashes to a 65-character sentinel, rejecting oversized values rather than hashing truncations. A 500 ms observation deadline prevents a slow binding from indefinitely holding /health; D1 exposes no query cancellation, so an in-flight SELECT may finish after that deadline. Missing binding, absent ledger, read error, malformed rows, overflow and timeout have distinct fixed reason codes, with all unavailable metrics null. No row names, SQL, provider identifiers or raw errors enter the response.

Health/liveness and schema observation are independent. Existing 200/503 statuses, dependency names, no-store behavior and nullable sourceSha/fingerprint/versionId semantics remain. Package version never substitutes for deployment provenance, and managed artifact hashes are not mapped to legacy fingerprints. Schema metadata is additive on healthy and unhealthy responses. No ledger creation or writes occur in application code. No Settings, business-settings, migrations, homepage, platform, UI or deployment changes were made.

## Plan and execution

The full plan is retained in PLAN.md. Source inspection preceded implementation; the focused reader owns all new ledger queries. The public-door proof extends the existing resilience journey, and tests/health-version.mjs also exercises the production compiled Worker through the existing real-D1 fixture. Production proof covered existing-empty, absent, populated and reordered inventory, uppercase hashes, separate partial ranges, hash changes, malformed rows, malformed marker ranges, exact 2048-row inventory, 2049-row overflow and real D1 column-read errors. The resilience journey also proves that a missing DB binding in its existing failure fixture reports db_missing while the response stays 503 with the original database dependency. Ledger rows are unchanged by observation, and an absent ledger stays absent. The built app/page host journey now asserts compiled version and schema metadata through both public health doors; full CI runs that journey.

Local build, compiled /health proof, existing resilience journey, typecheck, source-lock check, test recount and diff whitespace check passed. See RECEIPT.json and actual logs. The initial publication attempt returned INCOMPLETE/public-base-rejected; explicit fetching of the same public refs succeeded, and the required scanner was repeated without policy changes. A second scan reached the default 300-second deadline during the full-history walk. The same unmodified scanner was rerun with its supported 1200-second timeout; publication and CI terminal results are recorded below when complete. Temporary setup state and built output were moved outside the product clone before the working-file scan; no private local settings are selected for evidence.

Before/after: 91 registered cases + 10 assertion scripts = 101 checks; unchanged. No CONTRACT.md, generated views, or clause Status/Gap/Evidence cells changed. The source lock was regenerated last after all source/test edits. Candidate rebased onto current origin/main before publication; Settings/version work from other branches was not duplicated.

CLAIM BASE-OPS-001 PARTIAL points=none
DEFAULT BASE-OPS-001: Adopt the accepted schemaObservation v1 payload and rer-migrations-v1 digest; unavailable schema metrics do not change liveness.
GAP BASE-OPS-001: This round does not prove the entire baseline one-second liveness guarantee or installed/provider acceptance. No deployment, release, tag, landing or schema-application claim is made.

## Custody

Publication scan, product push, PR, exact-SHA CI and evidence transport are separate. Evidence files are selected explicitly for the report-only evidence ref and contain no credentials or private gate material. Product custody is recorded in RECEIPT.json and the final report; the fleet owns landing and independent checks.

Publication finished PASS/complete on b310b7c75e5bea6b093f967dccbbb447887de5e1 with zero findings. The source scan used the checkout-pinned Base implementation through publish-check.sh on the full-history clone, with run-lamp#main as public base and just-every/lamp as edition identity. Earlier incomplete scan receipts are retained. Every candidate author/committer and trailer was checked before the guarded push, which succeeded on attempt 1.

PR: https://github.com/just-every/run-lamp/pull/359
Product branch: cloud/sd-lamp-schema-observation-1
Product SHA: b310b7c75e5bea6b093f967dccbbb447887de5e1
Exact-SHA Verify: run 43487312050, initially in progress. The watcher uses REST with at least 300 seconds between discovery/status requests; no dispatch or rerun was requested. No product READY claim is made until that exact run succeeds.

## CI failure and corrected candidate

The first pushed head b310b7c75e5bea6b093f967dccbbb447887de5e1 failed Verify run 43487312050. Build job 132099116533 failed only source:check with “Stale lock or source/tool integrity mismatch”; contract document generation, typecheck, syntax, release validation and both builds passed. The aggregate verify job failed because build failed, and the test shards were skipped. This is not the generated-view exception and no READY claim is made. The failed build archive was read once with gh run view --job --log-failed; the downstream aggregate failure had no independent assertion to diagnose, and the ten-call GitHub budget is exhausted.

The source lock had been generated before the new reader was staged. A local check on the committed first head reproduced the failure. Current main then landed the previously pending Settings version repair. Its newer complete tests/health-version.mjs was preserved, with the schema proof added to that existing managed-artifact journey; the shared proof moved to tests/e2e/helpers/health-schema-proof.mjs so routine resilience tests do not execute the standalone browser script. Main's Settings source is preserved exactly. No published history was rewritten.

The merge/fix candidate is 066a09fdc8c27308cf941f02e5d1422e911b949c on cloud/sd-lamp-schema-observation-1. Its tracked-source lock was regenerated last and source:check passed again after the merge commit. Typecheck, production build, the real managed-artifact Settings/version plus health/schema journey, and the existing resilience journey all passed again. Counts remain 91 + 10 = 101; contract status cells and generated views remain unchanged. The current candidate's publication scan requires one extra GitHub request beyond the brief's ten-call limit, for which approval has been requested. The candidate is retained locally and in a verified recovery bundle while approval is pending.
