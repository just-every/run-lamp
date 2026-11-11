# sd-lamp-pagehost-route-1 — BLOCKED on R5 ownership semantics

Repository: just-every/run-lamp
Branch: cloud/sd-lamp-pagehost-route-1
Checkout HEAD and fresh origin/main: ccc4f7a2f1c18223078b2f5e03440fd413d1575d
Product commits: 0. Product push: none. PR: none. CI run IDs: none.
CLAIM: none. No clause status changes.

## Blocking finding and requested ruling

The inline strategy card explicitly requires the builder to stop if “R5 would change an owner-edited value in a way the code shows owners rely on.” That exit applies here.

Exact builder blocker message: R5 unconditional deploy synchronization would replace a hostname accepted from an owner through the settings API and used as the theme origin.

This is a source-level finding, not an observed failure from an attempted deployment. No deployment was attempted, and no actual installation or owner data was read.

Evidence in R5-SOURCE-EVIDENCE.md:

- src/core/shared/schemas.ts:27 includes a required hostname in the page-settings input.
- src/core/features/page-settings/routes.ts:33 accepts PUT /api/app/page-settings, validates that schema and calls service.update. It does not require hostname to equal the deployment binding.
- src/core/features/page-settings/service.ts:124 persists the supplied hostname. Lines 90 and 108 derive the theme validation origin from the stored/supplied hostname. The code therefore both accepts an owner-supplied hostname and relies on that value.
- src/core/features/page-settings/ui/settings-form.ts:13 carries the stored hostname through the settings form. The current PageSettingsTab and PageHero show the address without a hostname editing input. Thus the supported API write is established; a visible current hostname editor is not claimed.
- docs/public-page.md:9 explicitly advertises hostname editing in Settings. That prose may predate the current UI; it supports the ownership concern but is not the sole evidence.
- scripts/ops-config.mjs:300-303 currently leaves an existing row unchanged on ordinary setup; scripts/setup.mjs:82 executes it on each deploy. An unconditional hostname update would change the existing preservation behavior and override a hostname supplied through the API.

Default taken: preserve existing owner-supplied hostnames and stop before implementing an unconditional overwrite. The designer must decide whether the deploy binding is authoritative even over API edits, or define a migration/synchronization rule that preserves those edits. No unprovided ruling was assumed.

## Full implementation plan, held at the blocking review

1. Refresh launcher; install the decrypted-bundle Git helper, cleanup, push guard and commit hooks; clone full history with --filter=blob:none; branch from fresh origin/main; read repository rules and inline card.
2. Inspect R5's ownership semantics before changing setup persistence. STOP at the explicit card exit if overwriting a supported owner-edited value would change behavior it relies on. This review is blocked as described above.
3. Once an explicit ruling exists, add the paired route-zone/target settings and R3 refusals in ops-config, preserving the default rendering byte for byte. Prove both renderings and diff the default against v1.11.10.
4. Add injectable DNS resolution in route-mode readiness: bounded CNAME-chain or complete A/AAAA-set matching, not-pointed skip, retained checks when pointed, and persistent EAI_AGAIN failure. Pass mode/target from deploy and update its terminal message.
5. Implement only the approved R5 behavior in the setup statement or its runner and prove that other page settings survive a changed-host deploy.
6. Complete the R6 docs and at most three new cases in existing test files. The four-file R6 draft is complete but has not been committed; it describes planned behavior that does not exist yet.
7. Run touched tests and typecheck sequentially with hard timeouts. Run pinned Wrangler 4.129.1 deploy --dry-run --outdir against generated route-mode config with no credentials; stop if it rejects the cross-zone pattern. No provider deployment, DNS change or subscriber action belongs to this builder.
8. Generate/check contract views only as required by source changes and restore them from main. Regenerate/check sources.lock.json last. Inspect identity, trailers and publication hygiene, merge any updated main, commit only leased product/docs/lock changes, and push the named cloud branch with the guard.
9. Open a PR under the repository's contribution rule; discover/poll exact-SHA Verify via REST within the stated budget/cadence. Report READY only after the actual candidate succeeds. Publish reports separately through the evidence ref.

## Actual results against R1–R7

| Requirement | Actual result |
| --- | --- |
| R1 default unchanged | Runtime/config sources untouched. Rendering comparison and deploy-behavior proof not run because implementation stopped. |
| R2 route output | Not implemented or proved. |
| R3 refusals | Not implemented or proved; no refusal messages fabricated. |
| R4 readiness (a), (b), (c) | Not implemented or proved; no fake resolver/fetch logs fabricated. |
| R5 stored hostname | BLOCKED by the explicit ownership exit. Source evidence retained. |
| R6 docs | Drafted the requested SaaS section, provider-zone fallback origin, proxied AAAA 100:: target, TXT certificate validation, owner TXT then DNS-only CNAME, CAA issuers, both setting rows, operations correction, and 1.11.11 unreleased changelog entry. Saved as R6-DRAFT.patch only. |
| R7 small tests | 0 new cases. Repository inventory: 78 before and 78 after; 10 assertion scripts, 88 total checks. No test deleted, skipped, weakened or added. |

The inventory uses the repository's own scripts/verification/inventory.mjs with its TypeScript 5.9.3 import resolved from an isolated /tmp install. No product dependency or pin changed. These are static inventory counts, not test passes.

Contract progress before/after: Core 57 done / 132 partial / 50 missing / 239 total; Agent surface 0 / 0 / 5 / 5; full target 57 / 132 / 55 / 244. CONTRACT.md, ACCEPTANCE.md, docs/CLAIMS.md and sources.lock.json are unchanged. No public-door acceptance was newly proved.

## Commands and mechanical status

- Global and repository fleet identities configured; commit hooks installed and preserved. No commit command was run in the product clone.
- Full-history clone completed successfully; is-shallow-repository=false. Branch starts from fresh origin/main.
- git diff --check: exit 0.
- git log origin/main..HEAD with author, committer and trailers: exit 0, empty (no candidate commits).
- Static inventory: 78 registered cases + 10 assertion scripts = 88 checks. Actual inventory saved in test-inventory.json.
- The cloud toolchain setup was saved and sourced. It selected Node v24.19.0 and pnpm 10.12.4; the provided shim treats the Node pin as a minimum. No runtime test qualification is claimed from that version.
- rer setup/build/verify, touched runtime tests, typecheck and pinned Wrangler dry run: NOT RUN after the card's mandatory stop. No Wrangler acceptance or rejection is claimed.
- MECHANICAL lock=not-run (blocked before product implementation) exit=not-run; views=not-run (CONTRACT unchanged) exit=not-run.
- Product push/PR/Verify: NOT RUN. There is no candidate to declare READY or PUSHED, and no CI result from a different SHA is substituted.
- No UI source changed, so no browser proof was made.

The current main changes since v1.11.10 are listed completely in main-since-v1.11.10.txt: ccc4f7a2f1c18223078b2f5e03440fd413d1575d (Regenerate source lock), and 2ecdbf6 (Adopt rer 0.2.108, installer PATH step).

## Scope and preservation

Only the four leased documentation files were drafted. Runtime sources, pins, migrations, homepage and source lock are untouched. The instance checkout, any provider accounts, DNS, the former provider and subscribers were not accessed or changed. No email address was added to the draft.

The complete draft is preserved in R6-DRAFT.patch with its SHA-256 in RECEIPT.json. The full report, source excerpts, actual command receipts and inventory are published through refs/heads/evidence/sd-lamp-pagehost-route-1 only. Evidence publication does not signal product readiness or acceptance. Once that transfer and patch restoration check succeed, the clone can be deleted as the brief requests; the actual packet remains outside it.

The switch runbook, live instance checkout, and delta folder were not shipped in this cloud task. They were not read from nonexistent paths; the inline card was the available authoritative spec. No INBOX.md or STATE.md was read or written. The blocker above follows the explicit shipped card and requires a new ruling rather than one of those unavailable files.
