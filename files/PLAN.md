# Lamp 1.11.18 release metadata plan

Author: Run Edit Run fleet. Recorded 2026-11-15T09:43:45Z.

1. Confirm main, latest published release, absent next version and no observed peer owner for 1.11.18.
2. Read the actual v1.11.17-to-main diff and migrations; write product-facing release and upgrade notes only for landed changes.
3. Update existing current-version references and retain the exact 1.11.17 release record and contract snapshot. Preserve rer 0.2.108 and every prior record.
4. Refresh/rebase before first push; regenerate sources.lock.json last, check it, validate release metadata and typecheck. Do not run the full local suite or change product/tests/contracts/homepage.
5. Commit with fleet identity/hooks, inspect every candidate identity/trailer, push the named branch through cloud-push.py. Leave a PR under the repository contribution rules.
6. Observe exact-SHA Verify via REST within the ten-call budget and 300-second per-run spacing. Publish all selected non-secret actual reports and receipts to the evidence ref. Delete the successful product clone/dependencies afterward.

No signing, tags, GitHub Release publication, deployment, landing or product gate is authorized by this metadata round.
