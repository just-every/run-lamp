# Lamp 1.11.14 release metadata plan

1. Confirm current main and its exact-SHA Verify and Run site are green; check that 1.11.14 and a live peer are absent.
2. Compare published v1.11.13 with main and retain its exact release record and contract snapshot in release-history. Identify all current version references without changing historical prose.
3. Prepare 1.11.14 metadata and honest buyer-facing notes, keeping rer 0.2.108, migrations, product, tests, contract judgments and generated views unchanged.
4. Install frozen dependencies; run the release validator, metadata consistency checks and typecheck only. Fetch/rebase main before the first commit/push, regenerate source lock last and check it.
5. Inspect every candidate commit identity and trailer, push cloud/sd-lamp-release-1-11-14 using the fleet guard, open a PR under repository rules, and observe exact-SHA Verify with the bounded REST budget.
6. Save actual reports/receipts outside the product checkout, publish them only on evidence/sd-lamp-release-1-11-14, then delete the disposable clone/dependencies after successful custody transfer. The Mac owns full-history publication scanning, landing, tagging, signing and release publication.
