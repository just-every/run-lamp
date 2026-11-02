import fs from 'node:fs';
const P = 'lamp/proof/results/';
const before = JSON.parse(fs.readFileSync(P + 'states-before.json')), after = JSON.parse(fs.readFileSync(P + 'states-after.json'));
const setupB = JSON.parse(fs.readFileSync(P + 'setup-before.json')), setupA = JSON.parse(fs.readFileSync(P + 'setup-after.json'));
const source = (name) => name.startsWith('Pick ') && name.endsWith(' colour') && !['Pick accent colour', 'Pick background colour', 'Pick text colour'].includes(name) ? 'src/core/features/page-settings/ui/theme-settings.tsx' : ({
  'Remove component': 'src/core/features/incidents/ui/affected-components.tsx',
  'Update options': 'src/core/features/incidents/ui/update-options.tsx', 'Close options': 'src/core/features/incidents/ui/update-options.tsx',
  'Close panel': 'src/core/app/client/ui/drawer.tsx', 'Pick background colour': 'src/core/features/page-settings/ui/public-resources.tsx', 'Pick text colour': 'src/core/features/page-settings/ui/public-resources.tsx',
  'Pick accent colour': 'src/core/features/page-settings/ui/brand-card.tsx, src/core/features/setup/ui/found-card.tsx',
})[name] ?? '?';
const collect = (data, before = false) => { const m = new Map(); for (const [view, rows] of Object.entries(data.views)) for (const r of rows) for (const c of r.controls ?? []) { const k = before && c.cls.includes('chip-remove') ? 'Remove component' : c.ariaLabel; const e = m.get(k) ?? { name: k, tag: c.tag, tooltip: true, describedby: false, title: false, states: new Set(), views: new Set(), count: 0 }; e.tooltip &&= c.tooltip; e.describedby ||= !!c.describedby; e.title ||= !!c.title; e.states.add(r.name); e.views.add(view); e.count++; m.set(k, e); } return m; };
const b = collect(before, true), a = collect(after);
const rows = [...new Set([...b.keys(), ...a.keys()])].map(name => ({ source: source(name), nameBefore: b.has(name) ? (name === 'Remove component' ? 'Remove <component name>' : name) : null, nameAfter: a.has(name) ? name : null, tooltipBefore: b.get(name)?.tooltip ?? null, tooltipAfter: a.get(name)?.tooltip ?? null, states: [...(a.get(name) ?? b.get(name)).states], views: [...(a.get(name) ?? b.get(name)).views], describedByAfter: a.get(name)?.describedby ?? false }));
const totals = d => Object.values(d.views).flat().flatMap(r => r.controls ?? []);
const out = { seedCommit: '71bbf96d9499f3c305b6d459e96b127fb9eb8a8a', renderedStatesWalked: Object.fromEntries(Object.entries(after.views).map(([v, r]) => [v, r.length])),
  instancesBefore: totals(before).length, withTooltipBefore: totals(before).filter(c => c.tooltip).length, instancesAfter: totals(after).length, withTooltipAfter: totals(after).filter(c => c.tooltip).length,
  nativeTitlesBefore: Object.values(before.views).flat().reduce((n, r) => n + (r.titles?.length ?? 0), 0), nativeTitlesAfter: Object.values(after.views).flat().reduce((n, r) => n + (r.titles?.length ?? 0), 0),
  setup: { before: setupB.map(r => ({ view: r.view, controls: r.iconOnly })), after: setupA.map(r => ({ view: r.view, controls: r.iconOnly })) },
  distinctControls: rows, notInRenderedWalk: [{ name: 'Open Run Edit Run', source: 'src/editor/editor-widget.ts', note: 'Shadow-root launcher mounts only when management is enabled; before: native title + aria-label, no tooltip; after: shared layer in its shadow root (proved through the real module in behaviour-checks.json)' }] };
fs.writeFileSync('lamp/proof/control-inventory.json', JSON.stringify(out, null, 1));
const md = ['# Control and source inventory', '', `Seed ${out.seedCommit}. Rendered states walked (1440/390): ${JSON.stringify(out.renderedStatesWalked)}; Settings panes with every section open, drawers, sheet, menus, chips, setup's found card.`, '',
  `Icon-only control instances found: before ${out.instancesBefore} (with a tooltip ${out.withTooltipBefore}); after ${out.instancesAfter} (with a tooltip ${out.withTooltipAfter}). Native \`title\` on an operator control: before ${out.nativeTitlesBefore}, after ${out.nativeTitlesAfter}.`, '',
  '| Control (accessible name) | Source | Tooltip before → after | Name before → after | Row context | Seen in |', '|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.nameAfter ?? r.nameBefore} | ${r.source} | ${r.tooltipBefore} → ${r.tooltipAfter} | ${r.nameBefore ?? '-'} → ${r.nameAfter ?? '-'} | ${r.describedByAfter ? 'aria-describedby = the chip\'s component name' : '-'} | ${r.states.slice(0, 3).join(', ')} (${r.views.join('+')}) |`),
  `| Open Run Edit Run (✦ launcher, shadow root) | src/editor/editor-widget.ts | native title only → shared layer | Open Run Edit Run → Open Run Edit Run | - | mounts only with management enabled |`, '',
  "Setup (isolated install, found card, Accent colour row): `Pick accent colour` — tooltip false → true at both widths (results/setup-before.json, setup-after.json).", '',
  '## Source scan', '', 'Every `button`, `Button`, `a`, `Link`, `summary`, colour/checkbox/radio input in the 168 operator, setup and editor source files was parsed (results/static-scan-*.json). Controls with no literal text child were reviewed by hand: all but the ones above carry visible text (Menu, Sign out, Edit, Remove, Close, Done, Previous, Next, Copy, row titles), or are checkboxes/radios inside text labels. A visible text label needs no tooltip and keeps its name. Row-context names such as `Remove row 1` or `Edit rule X` sit on text buttons and were left as they are. No icon-only control is ever `disabled` (grep of the five sites), so no disabled-hover case exists in Lamp.',
  '', 'Shell and owner menus: the rail items, Menu, Settings pill, View your page and Sign out all carry visible text; the brand link shows "Lamp".'];
fs.writeFileSync('lamp/proof/control-inventory.md', md.join('\n') + '\n');
console.log(JSON.stringify({ ...out, distinctControls: rows.length }, null, 0).slice(0, 600));
