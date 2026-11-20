# Lamp MOVE-011 · sd-lamp-c-f154

Candidate `8f5e831c4bff0508cbf46bdc000312de11a6bd70` is advertised on `cloud/sd-lamp-c-f154` in just-every/run-lamp. Main at the push was `173e93d259f968daffd0148365c2b9a26c62e3e6`. Base Verify 44671292824 and Run site 44671292988 both completed successfully on that main SHA. The candidate introduces zero tests and leaves the contract totals at 65 done, 124 partial and 56 missing, 245 clauses in all.

Candidate push Verify [44781838226](https://github.com/just-every/run-lamp/actions/runs/44781838226) was in progress at the reporting cutoff. The exact-candidate local journey passed all three cases. Run site follows landing.

## Plan and result

1. Map the existing MOVE-011 continuity assertions and follow the reviewed import to the authenticated native report read.
2. Write the expected summary independently of the imported Markdown and HTML, then compare the full native response field. Inspect conversion and attachment for any correction required by this assertion.
3. Run the touched suite, typecheck, first-party check and source checks. Preserve the existing contract judgments and generated views. Push the candidate and return the receipt on the evidence ref.

The first native report read after import returned HTTP 200. The assertion in `tests/e2e/helpers/postmortem-template-import-flow.mjs:124`–148 checks exact wording and empty lines throughout, decoded ampersand and accented letter, each heading, paragraph and list-item boundary, both link destinations, the literal image name and source URL, and the 800 repetitions followed by the final sentinel. It uses a literal expectation with an independently specified tail. Any changed code point, dropped block, relocated newline or shortened tail fails equality. The old substring checks are subsumed by equality. The other journey assertions retain their existing paths and conditions.

Inspection of `src/core/features/statuspage-import/rich-text.ts` and `src/core/features/statuspage-import/postmortems.ts` found that the existing conversion and report storage produce the expected retained string for the fixture. This candidate changes only the existing journey helper and its source-lock entry. The imports Verify shard invokes the test via `scripts/verification/plan.mjs:7` and `package.json:53`. The test is registered in `tests/e2e/statuspage-import.test.mjs:27` and calls the helper at line 323.

PROBE MOVE-011 2: owner reviews and applies a synthetic Statuspage import and opens the published incident's first native report GET -> HTTP 200 and exact full plain-text summary.

MECHANICAL lock=node scripts/edition-authoring/cli.mjs lock and node scripts/edition-authoring/cli.mjs check exit=0; views=node src/base/contract-docs.mjs write and check exit=0; ledger=none exit=0

## Acceptance and inherited duties

| Point | Outcome | Candidate result |
|---|---|---|
| 1 | Silent publication at original time even with source notification requested | Held. Line 127 retains original-time evidence. Exact notification absence for this report remains outside the lease. |
| 2 | Exact plain text with headings, paragraphs, lists, URLs and image reference | Local pass at lines 124–149. Direct image request and embedding proof is held. The existing HTML check remains in the journey. |
| 3 | Summary mapping, omission of empty sections and published treatment under HIST-003 | Summary mapping passed at line 148 and existing empty-field storage control survives at line 150. Renderer omission and report-owing outcome are held. |
| 4 | Draft private in preview and every public surface | Held. Existing private-report checks remain active. |
| 5 | Legacy address reaches a script-free report and native public API contains it | Held. Existing redirect, HTML and public response checks remain active. |
| 6 | Complete reviewed dry-run, apply, replay and undo accounting | Held. Existing reconciliation and undo checks remain active. |
| HIST-002 | Original published report storage | Existing native publication timestamp and summary controls remain active. Full acceptance 1 proof is held. |
| HIST-003 | Report counted as published in the report-owing logic | Held with acceptance 3. |
| MOVE-007 and MOVE-008 | Same rules for their source readers | Held by their own clauses. |
| MOVE-014 | Edited-template handling | Continues under the existing shared journey and its separately owned clause. |

## DONE-RIDERS

| Row | Result | Proof or reason |
|---|---|---|
| 1 | Partial | Native report exact-text proof passes at lines 124–149. Direct image proof and the other acceptances are held as above. |
| 2 | Pass for leased proof | Existing populated synthetic incident is reviewed and applied before the authenticated native GET. Expected text is independent at lines 129–147. |
| 3 | In progress | The existing imports shard invokes the journey on push. No UI surface changed. |
| 4 | Pass | The receipt records the exact product SHA for the local runtime journey. |
| 5 | No new inherited duty | The clause already names HIST-002, HIST-003 and the other source readers. |
| 6 | Mechanical pass | Generator write and check passed before the unchanged main views were restored. Status, Gap, Evidence, counts and judgment provenance stay with the lander. |
| 7 | Pass | CONTRACT.md diff is empty. |
| 8 | Outside leased proof | No report authority, erasure or replay code changed. Existing privacy and replay checks run on their prior paths. |
| 9 | Outside leased proof | The journey uses a synthetic import. No provider qualification claimed. |
| 10 | Outside leased proof | No policy choice adopted. |
| 11 | Pending landing | The product SHA is advertised on the named branch. The Mac lander owns exact main equality, Run site and the full-history publication scan. |

Publication scan status for `8f5e831c4bff0508cbf46bdc000312de11a6bd70`: complete unknown, historyScanned unknown, findings unknown. The hosted publication scan was not run in cloud. Added lines contain no email-like text or bare slash tokens. UI proof is inapplicable to this native read assertion. No homepage, documentation-site, brand or visual files were changed.

## Plan row to return

MOVE-011 remains PARTIAL. Record the first-read exact native summary proof in acceptance 2. Hold direct image network and embedding verification and acceptance 1 and 3–6 obligations named above. No other campaign row moves.

CLAIM MOVE-011 PARTIAL points=none tests=tests/e2e/statuspage-import.test.mjs#SUB-019 MOVE-001 MOVE-002 MOVE-003 MOVE-004 MOVE-005 MOVE-009 MOVE-011 MOVE-012 MOVE-013 MOVE-014 SUB-023 ACCESS-001 — owner reviews provider history, imports silently, keeps public readers, invites deliberately and conditionally undoes

GAP MOVE-011: Acceptance 2 still needs direct image-request and embedding proof. Acceptances 1 and 3–6 retain the held silent-publication, rendered-section and HIST-003, private-preview and public exclusion, legacy permalink and API, and complete reviewed dry-run, apply, replay and undo proof.
