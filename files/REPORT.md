# sd-lamp-removal-1 result

Run Edit Run fleet, 2026-11-17 UTC.

Repository: just-every/run-lamp. Product branch: cloud/sd-lamp-removal-1.
Product head: e08997d6bd318805f8e8f3f73e8f9d3ec5602c2f. Based on main c77030f1bf9501975efca38be82a33d9611a9d5a.

## Delivered native removal

The native command remains:

```sh
node scripts/remove-deployment.mjs --environment production --env-file "$LAMP_DEPLOY_ENV" --yes
```

Lamp now owns a focused adaptation of the pinned helper in scripts/removal/owner-remove.mjs. It keeps the creation-record identity checks, pending-resource guards, schedule clearing, account boundary and per-target state lock. The public Worker is released before the app Worker. Successful delete steps poll readback with a growing delay, up to 60 seconds per readback. Workers, Worker-owned Durable Object namespaces, D1, the bucket and the queue must be absent before success. Missing resources are accepted, allowing a half-removed installation to complete. The last successful line says `read back: none remains.`

The R2 loop repeatedly reads the first remaining bounded object page instead of mutating the bucket while advancing a cursor. It checks the bucket's saved creation identity before every destructive operation, drains batches until empty and retries bucket deletion only when the provider reports not empty. Its shared purge/delete budget is 10 minutes per bucket and covers requests as well as retry waits. The output states the budgets. Large GB-scale buckets can take about five minutes; there is no live-provider timing claim from this cloud run. A failure names the remaining or unverified resource, stops with remove-incomplete, retains records and says running the same command again resumes.

## Item 2: BLOCKED for gr

Exact public refusal from the pinned rer CLI:

> The requested first-party capability is unavailable.
> remove: failed (exit 4)

The installed rer 0.2.121 cli/contract.mjs has a fixed first-party verb table without remove. cli/adapter.mjs builds capabilities from that table; cli/parse.mjs gives an unknown verb only common flags; cli/lifecycle.mjs ultimately refuses that first-party capability. Merely adding OPERATIONS.json commands.remove cannot install an executable, safely confirmed first-party verb. Uptime and Oncall OPERATIONS.json were read through gh api; neither declares remove. OPERATIONS.json, deploy.json, rer-project.json and rer-setup.json are unchanged. No rer pin or rer dependency file was edited. A safely confirmed rer remove, its dry-run and its business-run grant proof remain unavailable pending a rer capability supplied upstream. The native repair is independently delivered. A follow-up published commit also verifies the outer record’s named data resources when a creation record has already been retired: any surviving unrecorded data refuses removal; complete absence permits receipt cleanup without provider writes. The same tests cover both outcomes.

## Documentation and scope

Updated the short removal guidance in docs/deploy.md and OPERATIONS.md to explain one invocation, readback/purge budgets, large-bucket duration and resumability, while stating the rer limitation. No UI changes; no browser proof is needed. No release metadata, version, tag, deployment identifiers, source-release output or acceptance status was changed. All provider proof used the repository's network fake, with no Cloudflare credentials or real provider requests.

No contract clause claimed; these are removal follow-ups.

## Plan and checks

The full executed plan is PLAN.md. The focused process-door tests use the repository's version/deployment fake plus a deletion edge. They assert deletion-lag settling, multiple object pages, a late-visible object and not-empty bucket retry, a half-removed installation (including a retired page ownership record), refusal without confirmation, replaced Worker/bucket identities before destructive calls, retained records after a provider refusal and successful retry, and foreign Worker/database/bucket/queue/namespace preservation. No pin tests were added.

Focused test file: 7 -> 10 registrations. Repository inventory: 102 -> 105 registered cases, plus 10 assertion scripts: 112 -> 115 checks, below the 200-case default. No registrations were deleted or weakened. The routine plan remains eight shards and one shared build. Contract counts unchanged: published 42 done / 65 partial / 0 missing (107); target/push-further 18 / 64 / 55 (137); all 60 / 129 / 55 (244). Clause status changes: none.

The original unpublished commit was rebased once onto fresh main. Only sources.lock.json conflicted; main's newer content was retained and the lock regenerated. Contract generator write/check passed and the generated ACCEPTANCE.md and docs/CLAIMS.md were restored whole from origin/main, with neither view committed. sources.lock.json was regenerated last and checked. All candidate identities and trailers were inspected: two fleet-authored and fleet-committed candidate commits, no trailers. The first attempted guard invocation while the rebase was paused correctly refused a detached checkout before any transport; after completing the rebase, both product pushes succeeded on attempt 1, and published history was not rewritten.

Local validation on the final candidate is recorded in removal-receipt.json and checks-receipt.json, with complete command output in the selected packet files. Initial-head CI Verify run: 44070707242, superseded by the follow-up commit. Final-head CI Verify run: 44071530326 on e08997d6bd318805f8e8f3f73e8f9d3ec5602c2f (initially pending). Final status is recorded below. CI and PR disposition will be appended below.

## Publication boundary

The product branch contains only eight product/docs/test/source-lock files. Reports and receipts are kept in this packet and transferred solely on evidence/sd-lamp-removal-1. Fleet publication scan, independent acceptance gates and landing are owned by the Mac lander; this cloud run does not publish main, release or submit itself for landing.

## Pull request

PR #403: https://github.com/just-every/run-lamp/pull/403, open against main at e08997d6bd318805f8e8f3f73e8f9d3ec5602c2f. pr-receipt.json records the actual GitHub response.

## Terminal CI and custody

PUSHED branch=cloud/sd-lamp-removal-1 head=e08997d6bd318805f8e8f3f73e8f9d3ec5602c2f

Verify run 44071530326 remains in_progress on this exact head at the final permitted REST poll; conclusion is null. Ten GitHub calls were used: two read-only reference declarations, two exact-head run discoveries, five final-run polls at least 300 seconds apart, and one PR creation. No workflow was dispatched or rerun. READY is not claimed. The known functional blocker is item 2's unsupported first-party rer remove capability; native removal passed its local proofs. The Mac/lane must obtain successful exact-SHA Verify before treating this product head as READY or landing it. Initial run 44070707242 belongs to the earlier pushed head and is not used as proof for this candidate. PR #403 remains open.

Complete actual non-secret outputs and receipts accompany this report. The cloud clone is removed only after confirming the product and evidence refs; the packet remains under $HOME/rer-consolidation/work/sd-lamp-removal-1/packet. Evidence publication is report transport and does not establish product acceptance or landing.
