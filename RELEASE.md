# Lamp 1.11.46

- **Status updates fit on Workers Free.** In local measurements, saving page branding, adding a component or publishing an incident used a few milliseconds of Worker CPU per save, down from more than 100 ms. The existing SnapshotCache Durable Object handles these signed-in saves and the existing Queue publishes the page. The Queue now batches for up to one second.
- **Slow publishing keeps a save intact.** Lamp confirms a stored save even when the Queue refuses it or publication takes more than ten seconds. The Queue or the next scheduled run publishes the saved change without creating a duplicate.
- **Fresh setup works after removal.** Lamp cleans up resources from an interrupted setup and waits for Cloudflare to release the deleted storage bucket name so the next setup can reuse it.

### Upgrading from 1.11.45

Back up your data and source changes and exercise a restored copy before adopting. Update to `v1.11.46`, run `pnpm install --frozen-lockfile` and use the same environment and input file for an existing deployment. This release requires no new bindings or migrations. The stored public page rebuilds once after the update.
