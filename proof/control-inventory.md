# Control and source inventory

Seed 71bbf96d9499f3c305b6d459e96b127fb9eb8a8a. Rendered states walked (1440/390): {"desktop":32,"phone":34}; Settings panes with every section open, drawers, sheet, menus, chips, setup's found card.

Icon-only control instances found: before 51 (with a tooltip 0); after 51 (with a tooltip 51). Native `title` on an operator control: before 0, after 0.

| Control (accessible name) | Source | Tooltip before → after | Name before → after | Row context | Seen in |
|---|---|---|---|---|---|
| Remove component | src/core/features/incidents/ui/affected-components.tsx | false → true | Remove <component name> → Remove component | aria-describedby = the chip's component name | incident-new-chip, incident-new-options (desktop+phone) |
| Update options | src/core/features/incidents/ui/update-options.tsx | false → true | Update options → Update options | - | incident-new-chip, incident-new-options, incident-detail-1 (desktop+phone) |
| Close panel | src/core/app/client/ui/drawer.tsx | false → true | Close panel → Close panel | - | component-add-drawer, component-drawer, component-catalogue-drawer (desktop+phone) |
| Pick accent colour | src/core/features/page-settings/ui/brand-card.tsx, src/core/features/setup/ui/found-card.tsx | false → true | Pick accent colour → Pick accent colour | - | settings-look, settings-look-palette (desktop+phone) |
| Pick background colour | src/core/features/page-settings/ui/public-resources.tsx | false → true | Pick background colour → Pick background colour | - | settings-embeds, settings-look-palette (desktop+phone) |
| Pick text colour | src/core/features/page-settings/ui/public-resources.tsx | false → true | Pick text colour → Pick text colour | - | settings-embeds, settings-look-palette (desktop+phone) |
| Pick surface colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick surface colour → Pick surface colour | - | settings-look-palette (desktop+phone) |
| Pick links colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick links colour → Pick links colour | - | settings-look-palette (desktop+phone) |
| Pick operational colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick operational colour → Pick operational colour | - | settings-look-palette (desktop+phone) |
| Pick degraded performance colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick degraded performance colour → Pick degraded performance colour | - | settings-look-palette (desktop+phone) |
| Pick partially unavailable colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick partially unavailable colour → Pick partially unavailable colour | - | settings-look-palette (desktop+phone) |
| Pick major outage colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick major outage colour → Pick major outage colour | - | settings-look-palette (desktop+phone) |
| Pick maintenance colour | src/core/features/page-settings/ui/theme-settings.tsx | false → true | Pick maintenance colour → Pick maintenance colour | - | settings-look-palette (desktop+phone) |
| Close options | src/core/features/incidents/ui/update-options.tsx | false → true | Close options → Close options | - | incident-new-options, incident-detail-1-options, incident-detail-2-options (phone) |
| Open Run Edit Run (✦ launcher, shadow root) | src/editor/editor-widget.ts | native title only → shared layer | Open Run Edit Run → Open Run Edit Run | - | mounts only with management enabled |

Setup (isolated install, found card, Accent colour row): `Pick accent colour` — tooltip false → true at both widths (results/setup-before.json, setup-after.json).

## Source scan

Every `button`, `Button`, `a`, `Link`, `summary`, colour/checkbox/radio input in the 168 operator, setup and editor source files was parsed (results/static-scan-*.json). Controls with no literal text child were reviewed by hand: all but the ones above carry visible text (Menu, Sign out, Edit, Remove, Close, Done, Previous, Next, Copy, row titles), or are checkboxes/radios inside text labels. A visible text label needs no tooltip and keeps its name. Row-context names such as `Remove row 1` or `Edit rule X` sit on text buttons and were left as they are. No icon-only control is ever `disabled` (grep of the five sites), so no disabled-hover case exists in Lamp.

Shell and owner menus: the rail items, Menu, Settings pill, View your page and Sign out all carry visible text; the brand link shows "Lamp".
