# sd-lamp-installed-version-1

Report updated: 2026-11-13T18:04:49Z
Repository: just-every/run-lamp
Branch: cloud/sd-lamp-installed-version-1
Product head: b51f9c5ac05153d731f6367cd59e2b8944b9246d
PR: https://github.com/just-every/run-lamp/pull/358

## Result and scope

Lamp now shows its own compiled package version as plain text under the existing Settings → Page heading. GET /api/app/page-settings also returns that package version to authenticated operators. This checkout builds package version 1.11.14; the emitted managed artifact's API and browser both show that exact value. Both source imports select package.json's version field, so there is no fabricated literal, template pin, external request, or deployment-binding fallback.

The implementation changes only src/core/features/page-settings/routes.ts, src/core/features/page-settings/ui/settings-page.tsx, tests/health-version.mjs and generated sources.lock.json. It preserves health, business settings, migrations, sender status, homepage and deployment configuration. /api/version remains the existing 404; the requested existing Settings surface is the version door. The work was based on fresh main at 4b798a0f28b030af1121a8fc9d93427affcb8dfa, preserving the landed sender work. Main was fetched and the unpublished branch rebased before publication; it was already current. No published history was rewritten. No platform edit or deployment was performed.

## Cause and owner

Lamp owned the missing in-app software version. Its Settings UI previously had no software identity text. The first implementation's API-only field was absent from Settings' preloaded service snapshot, which the browser proof caught as “Lamp version” without the value. The final UI imports the real package field into its own build, while the authenticated API imports it into the Worker. The final public-door proof passes on the committed head and confirms both match the independent package input.

For deployment identity, the retained Base helper at src/base/deployment-health.ts reads RER_DEPLOY_SOURCE, RER_DEPLOY_FINGERPRINT and RER_VERSION.id directly. It is unchanged from its recorded Base revision 73923a8d0a5e5a2cd7f0cb204ec97b227d73b4bf. Pinned rer's deploy-kit/render.mjs supplies the two plain-text bindings and version_metadata binding RER_VERSION; Lamp's direct-deploy recipe supplies the same identity. Missing values correctly remain null.

Managed packaging has a distinct identity door: scripts/delivery/rer-entry.template.mjs reads RER_RELEASE_DIGEST and RER_VERSION_METADATA.id at /__rer/release. These are reserved for delivery authority by the vendored delivery producer. They cannot truthfully stand in for a legacy source SHA or fingerprint. The source proves no Lamp dropping of those legacy fields; it does not establish what the named running installation was actually given.

Owner/followup (owner/version answer due 14 November 2026 at 12:00 UTC): pr must inspect the named installation's non-secret presence and provenance for RER_DEPLOY_SOURCE, RER_DEPLOY_FINGERPRINT, RER_VERSION versus managed RER_RELEASE_DIGEST and RER_VERSION_METADATA, and compare /health and /__rer/release with its retained deployment source/artifact receipt. If managed delivery promises legacy health provenance, pr owns supplying those missing inputs; otherwise pr must state the authoritative managed metadata door and its contract. Report binding presence and expected public identity only, never private values. sd's independent display repair is complete.

Installed-stage proof remains NOT RUN: no installation origin or authenticated owner session was supplied. The bz installed-v1.11.14 observation is brief context, not a new measurement. Neither this branch nor its local proof repairs or certifies an existing hosted deployment.

## Plan and validation

The full executed plan is PLAN.md and the read-only diagnosis is DIAGNOSIS.md. The sequence was: trace the existing paths before editing; add a narrow package-derived version in existing Settings; package and boot the emitted Worker with the actual managed producer; bootstrap a synthetic owner; read the authenticated version; assert the rendered screen at 1440 and capture it at 1440 and 390; typecheck; fetch/rebase; stage the proof, regenerate source lock last and check it; commit with fleet identity, inspect all candidate identities and trailers, push the named branch with its guard, and open the required PR. Exact-SHA CI is still pending; report-only evidence return records the completed work and actual pending receipts.

Local results:

- TypeScript: PASS (pnpm run typecheck).
- Production build: PASS (npx -y @runeditrun/rer build through cloud_run; pinned rer selects its Node 22.20.0 build toolchain).
- Source lock: PASS (node scripts/edition-authoring/cli.mjs lock and check, after staging the new proof).
- Public-door proof: PASS (node tests/health-version.mjs <packet> through cloud_run on b51f9c5ac05153d731f6367cd59e2b8944b9246d). It boots the emitted production Worker packaged by the actual managed producer, uses native synthetic owner bootstrap, proves anonymous Settings access is refused, reads the package version through authenticated Settings, and asserts visible text at 1440. Browser captures show that same screen at 1440 and 390. It refuses external network effects and closes its browser/runtime.
- Health compatibility: the packaged proof asserts 200, ok=true and no-store; missing legacy identity remains three nulls even with managed identity supplied. The separate managed release receipt remains readable with its synthetic expected identity. This does not claim the complete database/storage/queue failure or timing guarantee.
- Syntax and whitespace: PASS. Candidate worktree clean; author/committer fleet identity; no trailers. One guarded push attempt succeeded.

The standalone version proof is intentionally task-scoped and is not added to routine CI commands. Routine inventory stays 91 registered cases plus 10 assertion scripts = 101 checks before and after (34 routine files, 8 test shards). The new proof adds no test registration and does not remove or weaken an existing assertion. CI remains the full existing wall.

Contract source and generated views were not edited. Counts remain 244 clauses: 60 done, 129 partial, 55 missing. Clause status changes: none.

CLAIM BASE-OPS-001 PARTIAL points=none tests=tests/health-version.mjs#installedVersionPublicDoorProof
GAP BASE-OPS-001: This task proves preserved healthy output and missing-identity behavior, not every dependency-failure and one-second timing obligation. Installed-stage provenance proof remains pending with pr.
DEFAULT BASE-OPS-001: Keep absent legacy deployment bindings null and preserve the existing health body; use real compiled package metadata for the seed release label.

## CI and custody

Push Verify run: 43476440293 (exact b51f9c5ac05153d731f6367cd59e2b8944b9246d).
PR Verify run: 43476516891 (exact b51f9c5ac05153d731f6367cd59e2b8944b9246d).
Status: both runs still IN_PROGRESS at the third scheduled poll, about fifteen minutes after discovery. Eight of the ten API calls were used (one PR creation, one discovery, six status reads); the sole watcher stopped. No green or failure conclusion has been reported. Final custody is PUSHED, never READY, under the brief’s budget-short pending-CI rule. Details are in ci-receipt.json, ci-state.json and github-calls.json.

Product custody: PUSHED branch and PR #358; CI pending, not a READY claim; no main push, landing or deploy. Publication scan is NOT RUN in cloud by instruction; the fleet Mac performs its publication and exact-main gates before landing. Missing installed-stage evidence is an explicit followup, not hidden by a fallback.

Evidence custody is separate: the selected complete non-secret packet is published only to refs/heads/evidence/sd-lamp-installed-version-1. Its manifest binds report bytes, hashes and product branch/head. No fleet evidence is committed to the product branch. The terminal EVIDENCE line identifies the actual evidence commit after publication.

Terminal followup: the fleet must observe completed/success Verify on this exact SHA before admitting the candidate. No product blocker is identified locally; pending CI is not green. The clone is deleted only after successful evidence publication; all actual reports and receipts remain in the external packet.
