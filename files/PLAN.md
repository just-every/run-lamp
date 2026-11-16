# Lamp 1.11.20 release metadata plan

Author: Run Edit Run fleet. Date: 2026-11-16 UTC.

1. Refresh fleet credentials through the authorized launcher, install fleet Git authentication and commit hooks, and clone only just-every/run-lamp onto cloud/sd-lamp-release-1-11-20.
2. Read current main and its release rules. Confirm v1.11.20 has neither a tag nor a GitHub Release. Compare v1.11.19 with main and verify the package and lock agree on the existing rer pin.
3. Update existing package, seed, RELEASE.json, CHANGELOG and VPAT version metadata. Preserve the immutable v1.11.19 release record and exact released contract snapshot as required by the existing predecessor-chain validator. Do not create absent RELEASE.md or package-lock.json. Preserve buyer backup, restore, deployment-identity and earlier migration instructions. Make no product, homepage, README or contract judgment changes.
4. Fetch fresh main and rebase only while unpublished. Regenerate sources.lock.json last using node scripts/edition-authoring/cli.mjs lock and run its check. Validate release metadata, contract views, frozen dependencies and typecheck. No new tests or UI work are needed.
5. Commit with explicit fleet author and committer environment and active hooks. Inspect every candidate author, committer and trailer, then push the named branch through cloud-push.py. The cloud cannot run the Mac publication scan; the fleet must do that before landing. Never create a tag or Release.
6. Observe exact-SHA Verify using REST within ten GitHub calls, at least 300 seconds between calls for the same run. Open a PR under the seed's contribution rules. Publish explicitly selected non-secret reports and receipts only to evidence/sd-lamp-release-1-11-20, retain product provenance, and remove the successful product clone at completion.
