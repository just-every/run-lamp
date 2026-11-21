# Lamp 1.11.25 release metadata continuation

Run Edit Run fleet · 2026-11-21 UTC · sd-lamp-release-1-11-25-c1

## Plan

1. Fetch main, the prior metadata branch and v1.11.24. Check that main passed Verify and review the tagged release delta.
2. Apply the prior release metadata on main. Change the VPAT version declaration and copy the predecessor's original release and contract bytes into the release-history directory.
3. Validate release metadata and generated contract views, check changelog parity and migrations, regenerate the source lock last, then check it. Verify the declared setup hash against the exact committed bytes.
4. Recheck main, verify the candidate commit's identity and trailers, publish the named branch, read back the advertised SHA and wait for Verify on that SHA.
5. Publish the report and receipts on the task's evidence ref. The fleet owns the publication scan and landing.

## Product

- Repository just-every/run-lamp. Branch cloud/sd-lamp-release-1-11-25-c1. Advertised head 19261bd230d989d6e890c47910fd40c45e5b4ce3.
- Latest main at push was d442dbb58d146eee3589c8880463d94d12b11981. Its exact-SHA Verify 44846800586 completed successfully. The release delta from tag v1.11.24 was nine commits, with the Sorry dry-run explanation and the rer 0.2.126 pin already covered by the first round's notes. Main's test-only changes are reflected in its verification coverage.
- Re-applied ac3972b416ba736a32d34aec31631cde1b6b3cfd and included the validator fixes in one ordinary commit with zero merge commits. The VPAT diff changes one line, Product version from 1.11.24 to 1.11.25.
- The v1.11.24 tag points to 3f1349f029fa8c8c59bf9adfe4e2ae59fd502842. The immutable tag stores that release's own RELEASE.json and CONTRACT.md at its root. The two files under release-history/ use those exact bytes, as specified by release-history/README.md. The committed snapshots match the tag's SHA-256 digests in PRODUCT-RECEIPT.txt.
- Changelog and RELEASE.json publicReleaseNotes agree. The existing upgrade instructions and known limits carry through. Package, seed, release and VPAT versions all name 1.11.25. The tracked pnpm lockfile keeps rer at 0.2.126. rer-project.json is identical to main, with setup.sha256 equal to SHA-256 of rer-setup.json at the advertised commit. The tag, main and candidate share the same migration tree of 82 SQL files.

| Revision | Done | Partial | Missing | Total |
| --- | ---: | ---: | ---: | ---: |
| v1.11.24 | 65 | 124 | 55 | 244 |
| Candidate base | 65 | 124 | 56 | 245 |
| Pushed candidate | 65 | 124 | 56 | 245 |

Main added missing target COMP-011 after v1.11.24. Clause status changes in this round are zero.

No contract clause claimed; this is release metadata.

## Local results

The frozen install, release validator, typecheck, contract generator and check, changelog parity, source lock regeneration and check, offline Base copy check, migration comparison, snapshot hashes and diff whitespace check passed. LOCAL-CHECKS.txt includes output tails from the pinned Node 22.20.0 and pnpm 10.12.4 run. PRODUCT-RECEIPT.txt records the Git ref, exact SHA, declared hash and snapshot readback.

The verification plan counts 115 registered cases and 10 assertion scripts on both main and the candidate, for 125 checks. A supplementary probe found that the standalone test path cited in the VPAT's October evaluation is absent from the current checkout. The required release validator ran on the current files and passed.

## Exact-SHA Verify

Observed 2026-11-21T02:02:48 UTC.

Verify 44852065021 completed with failure on 19261bd230d989d6e890c47910fd40c45e5b4ce3. The build job 136685522504 passed, including the current release validator. Eight test shards passed. In composer job 136685822345, THEME-001 timed out after 5 seconds waiting for the Theme heading at /app/settings#look. The document had finished loading with the operator shell still unhydrated and settings inert. The final verify job 136689641017 propagated the composer failure.

Both failed-job archives were retrieved. CI-RECEIPT.txt contains status and job conclusions. FAILED-JOBS.txt contains the relevant sanitized log output. The failure is in an existing browser flow outside this metadata lease. The exact-SHA Verify prerequisite remains unsatisfied.

[Verify 44852065021](https://github.com/just-every/run-lamp/actions/runs/44852065021)
