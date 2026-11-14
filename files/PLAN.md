# Plan

1. Start cloud/sd-lamp-tz-release-fix-2 from current origin/main, 189bfd82e39799b16fbabb4f8a48f65f3b5d22f0. Retain one linear product commit and no merge commits in the candidate range.
2. Apply the existing timezone change from bd1615809f016c3d29c0889a4efe77eadc9aaef0 as a patch, excluding its old sources.lock.json. Preserve current clause judgments, status, gap and evidence. Copy SETUP-002's changed entry verbatim from origin/cloud/sd-lamp-tz-release-fix-1. No version bump, migrations, new tests, incident, tick or size work.
3. Install frozen dependencies and run noninteractive rer setup with fleet owner. Run release validation, typecheck, documented contract generation and check, and the existing website-onboarding test at 1440. Capture the changed screens at 1440 and 390 without adding product tests.
4. Restore generated ACCEPTANCE.md and docs/CLAIMS.md from origin/main. Regenerate sources.lock.json last, then run its check. Confirm only authorized files differ, unchanged contract judgments and counts, and one-parent candidate shape.
5. Commit under fleet identity with fleet hooks active. Inspect every candidate identity, trailer and message, then publish only the named product branch using cloud-push.py. Verify the remote-tracking RELEASE.json contains SETUP-002.
6. Record terminal product provenance and available exact-SHA Verify/PR information, preserving the distinction between pushed work and CI readiness. Keep report files outside the product tree and publish the explicitly selected non-secret evidence packet to evidence/sd-lamp-tz-release-fix-2.
