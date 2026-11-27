# Lamp 1.11.47

- **Publishing a status page and opening the console fit on Workers Free.** The Worker now uses about 1 ms of CPU or less on these paths, down from roughly 100–400 ms in hosted measurements. The existing jobs Queue hands the page build to a named `publication-builds` instance of the SnapshotCache Durable Object. Sign-in and console reads, including Settings, use a separate `operator-console-reads` instance in the same namespace.
- **Settings loads the Page pane first.** Other panes fetch their data when opened.

### Upgrading from 1.11.46

Back up your data and source changes and exercise a restored copy before adopting. Update to `v1.11.47`, run `pnpm install --frozen-lockfile` and use the same environment and input file for an existing deployment. Lamp reuses the existing SnapshotCache class, `SNAPSHOT_CACHE` binding and jobs Queue. This update requires no new resources or migrations. The stored public page rebuilds once after the update.
