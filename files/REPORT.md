# Lamp Sorry import order disclosure

Run Edit Run fleet, 20 November 2026 UTC. Task sd-lamp-l9-sorry-order-1.

## Plan and scope

1. Reproduce the missing warning through the signed-in Move in upload and review API on a fresh depth-one, blobless clone of main. Apply the reviewed export and read the public HTML.
2. Account for displaced standalone components in the ordinary changed-record report and update the reason on their supplied position fields. Preserve the native records and public sorting.
3. Exercise the same route with interleaved and trailing standalone components, validate the full imports command and the ordered build shard, and check contract generation and the source lock. Push the single candidate and check Verify for its exact SHA.

## Reproduction and result

Main 30a345772f5e4c0aa613060120b83f62599a41aa read and imported 14 components plus two groups. The dry run said Website and Mobile app were imported and their order carried over. It reported zero changed components. The public HTML put Customer services and Platform first and put Website and Mobile app in Other services.

The source fixture places Website before the Platform heading and Mobile app between that heading and its first member. A standalone component after the final group member is already at the end of the group order. The normalizer uses an explicit position when supplied and the response index as fallback. Response order breaks tied positions.

The candidate names both displaced components as changed with the following reason.

> Lamp lists groups first; this component moves to Other services after the groups.

Their position fields carry the same explanation. The saved job retains the reviewed changed-record rows. The source still produces 14 native components and two groups. The report changes from zero to two changed components. The all-trailing control has zero order changes. The mixed control reports a component before the first group and leaves the trailing component imported. Both revisions serve the same public order in the fixture.

## Contract

MOVE-001 point 2 requires the dry run and saved Sorry job to account for supplied field paths with reasons and next actions. This round supplies partial proof for the grouping-related position change through the existing Move in reconciliation test. The broader provider-input, complete dry-run accounting and subscriber-cap evidence gaps remain. Preserving interleaving in Lamp belongs to COMP-011.

MOVE-001 remains partial. The generated full-target totals remain 65 done, 124 partial and 55 missing out of 244. The existing reconciliation registration was extended without adding a test registration.

## Verification

Candidate branch cloud/sd-lamp-l9-sorry-order-1, head 32002fea2df5112d3b296134cb6ddfbb5bd3e83a. The local checked tree matches the pushed tree. Local tooling used Node 22.20.0 and pnpm 10.12.4.

- The complete import command passed 13 tests across 10 top-level registrations. This includes the documented Sorry field-accounting test, the Sorry reconciliation and lifecycle tests, and the four-provider Cutover browser journey.
- The signed-in reconciliation test passed again from the exact candidate checkout and confirmed the saved job and public page results.
- The Move in browser confirmation asserted the two changed rows at a 1440-pixel viewport and captured the changed-record panel at 1440 and 390 pixels.
- The build shard passed, in order, check:contract-docs, source:copies, source:check, typecheck, check:syntax, validate:release, verify:visual:source, build:app and build:site.
- The documented contract write and check ran successfully after rebasing on current main. The source lock was regenerated last and passed its check. The official publication scan is the fleet lander's gate.
- The pinned checkout also completed the exact-head rer build command with exit 0.
- GitHub Verify run [44644090478](https://github.com/just-every/run-lamp/actions/runs/44644090478) completed successfully for the exact pushed head. It was observed complete at 00:28:43 UTC on 20 November 2026.

DEFAULT MOVE-001: Show standalone components' loss of position across groups in the Sorry dry run. Preserving interleaving belongs to COMP-011.

GAP MOVE-001: The clause still needs complete evidence across the named provider inputs, no-write accounting for every source category, and capacity handling across channels.
