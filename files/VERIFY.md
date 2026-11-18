# Verify receipt

- Workflow run [44256779165](https://github.com/just-every/run-lamp/actions/runs/44256779165) completed on `b39e82f55c6ec44f99006ce21a269e943ef7960a`.
- Plan job `134640254513` succeeded. Build job `134640298569` stopped at `node src/base/contract-docs.mjs check`. GitHub reported: "ACCEPTANCE.md: generated content differs; run contract-docs write." The raw candidate reproduced this exact result locally.
- The build stopped before writing its completion artifact. Shards job `134640454471` was skipped. Aggregate job `134640452547` failed while requiring results for the aborted build and skipped shards.
- The candidate protocol accepts this generated-view failure. Local generation followed by the check passed. Main's generated views are committed by the lander.
