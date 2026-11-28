# Lamp 1.11.48

- **Signing in, setting up Lamp and running the console fit on Workers Free.** The affected paths used about 1 ms of Worker CPU or less in hosted measurements, down from a cold peak of 224 ms. This includes creating an incident, previewing it and saving its draft.
- **Public incident pages and publication checks fit on Workers Free.** The homepage streams a current snapshot directly from storage. If Lamp needs a retained copy, it reads it in the same Durable Object instance that serves incident pages. An incident document request uses about two Durable Object requests. The public host continues to keep console and sign-in routes private.

### Upgrading from 1.11.47

Back up your data and source changes and exercise a restored copy before adopting. Update to `v1.11.48`, run `pnpm install --frozen-lockfile` and use the same environment and input file for an existing deployment. Upgrade in place with the existing SnapshotCache class, `SNAPSHOT_CACHE` binding and jobs Queue. The stored public page rebuilds once after the update.
