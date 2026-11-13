# Lamp 1.11.15 metadata plan

Prepared at 2026-11-13 UTC for just-every/run-lamp, branch cloud/sd-lamp-release-1-11-15.

1. Confirm current main, exact-SHA Verify and Run site success; ensure v1.11.15 is absent and no active peer release PR exists.
2. Review actual v1.11.14 metadata and every product change between its immutable tag and current main. Inventory migration changes separately.
3. Preserve v1.11.14 release metadata and contract snapshot as immutable history. Bump existing release-version references to 1.11.15; write matching public CHANGELOG and RELEASE.json notes, no contract IDs or internal proof claims. Keep rer 0.2.108 pinned and migrations empty if the actual diff adds none.
4. Make README, installation and existing local release guidance evergreen. Update only the existing VPAT version header and an honest edition note, preserving the original evaluation and limitations.
5. Run affected release metadata validation, contract document consistency and typecheck only. Add or run no behavior tests or full suite for this metadata change.
6. Fetch/rebase current main before the first product push. Regenerate the source lock last and run its check. Inspect the complete candidate diff, identities and trailers, commit with fleet identity and preserved hooks, and push only the named cloud branch through the fleet guard.
7. Leave a PR to main for the lane, and observe exact-head Verify with REST under the ten-call budget and 300-second polling interval. Do not tag, sign, publish a release or land main.
8. Save actual checks, CI, product custody, report and receipts outside the product clone. Publish explicitly selected non-secret packet files only to evidence/sd-lamp-release-1-11-15. Remove the successfully pushed scratch clone/dependencies after evidence publication and retain report files.

Acceptance scope: no target clauses, no clause status/gap/evidence changes; generated views, product code, tests and homepage remain unchanged. Full-history publication scan belongs to the guarded Mac lander.
