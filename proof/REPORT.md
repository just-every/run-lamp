# Lamp L20 — tooltips on every icon-only control

Seed: `71bbf96d9499f3c305b6d459e96b127fb9eb8a8a` (fresh `main`, unchanged at push). Branch `cloud/uip-lamp-l20-tooltips-1`. Builder: Sonnet 5.5.
Status: **Done.** No inherited-launcher blocker: the editor launcher lives in this repository (`src/editor/editor-widget.ts`, tracked and editable under AGENTS.md "Ownership") and is covered.

## What changed

- **Same accepted source, not a new tooltip.** `src/core/app/client/ui/tooltip/{tooltip.ts,tooltip.css,README.md}` are byte-for-byte the H19 files from public `just-every/run-happytohelp` commit `3710a4b4bf06b83246463c76024917e3ade1870f` (read through raw.githubusercontent.com at that commit; the source repository was not cloned). `PROVENANCE.md` records the three SHA-256s, which equal the Base manifest. The only Lamp-side code is integration:
  - `ui/tooltip-layer.tsx` calls `installTooltips(document)` in an effect and returns its cleanup; `src/routes/__root.tsx` mounts it once in the root document (operator app, setup, sign-in).
  - `src/editor/editor-widget.ts`: the ✦ launcher lives in a shadow root, so it gets its own `installTooltips(root)` (cleanup called in the widget's teardown), the module's CSS in that root, `tooltip('Open Run Edit Run', 'left')` for name + marker, and its native `title` is removed.
  - `ui/tokens.css`: Lamp's colours and type through the documented `--tooltip-*` properties (ink pill, `--on-ink`, 13px `--text-small`, Lamp's pill shadow); `styles.css` imports `tooltip.css`.
- **Controls** (all through `tooltip()`; no `title` anywhere, so no double tooltip):

  | Control | Source | Name / tooltip |
  |---|---|---|
  | Drawer close ×  | `ui/drawer.tsx` | Close panel (unchanged name) |
  | Composer `+` | `incidents/ui/update-options.tsx` | Update options (unchanged name) |
  | Options-sheet close | same | Close options (unchanged name) |
  | Affected-component chip × | `incidents/ui/affected-components.tsx` | `Remove component`, with `aria-describedby` = the chip's component name (was `Remove <name>`) |
  | Accent / background / text / palette colour pickers | `page-settings/ui/{brand-card,public-resources,theme-settings}.tsx`, `setup/ui/found-card.tsx` | Pick … colour (unchanged names, 3–4 words) |
  | ✦ editor launcher | `src/editor/editor-widget.ts` | Open Run Edit Run (unchanged name) |

  Text-labelled controls (Menu, Sign out, Edit, Remove, Close, rail links, …) need none and were not touched. The shell and owner menus have no icon-only control. `control-inventory.md/json` and `results/static-scan-*.json` hold the full inventory: 168 source files scanned by AST and every rendered state walked at 1440 and 390 (32 + 34 states: every Settings pane with all sections open, drawers, sheet, menus, chips, setup).
- No React remount, form reset, action, route or style change besides the tooltip itself. No contract, status, schema, migration, test or registration change.

## Named outcomes — before → after, with the public-door probe for each

All probes drive the real app (`rer demo` on a scratch clone, one-click owner entry, headless Playwright with real HOME, `--use-mock-keychain --password-store=basic`, fresh context, 1440×900 and 390×844). Scripts: `proof/scripts/`; every exit code is in `results/commands.txt`.

1. **Mounted once, cleaned up, no remount, no double tooltip.**
   Before: no layer; 0 `.ui-tooltip`. After (`behaviour.mjs`, exit 0): exactly 1 layer per document; a DOM marker on `.operator-main`, a typed form value and focus in the composer survive hovering/focusing every tooltip; Update options still opens on click; the editor launcher's own layer is created in its shadow root and removed with the host at teardown (real `mountEditor` module on a loopback config, no management server); `[data-tooltip][title]` count 0 (native titles in the operator DOM: 0 before and after, the launcher's was the only one).
2. **Every icon-only control has a tooltip with the same accessible name.**
   Before (`states.mjs before`): 51 icon-only control instances in the walked states, 0 with a tooltip. After (`states.mjs after`, exit 0): 51 of 51, 0 missing. Setup (isolated install, first-run page, found card, Accent colour row; `setup-proof.mjs`, exit 0): `Pick accent colour` false → true at both widths. `control-inventory.md` lists each control, source and name before/after.
3. **Hover, focus, touch, tap, dismissal, edges, dialogs, 60 s refresh, Tab, screenshots.** `behaviour.mjs` (47 checks, 0 failed), `extras.mjs`, `refresh60.mjs`, `clip.mjs`, `setup-proof.mjs` (all exit 0):
   - Hover: nothing at 120 ms, tooltip text equals `aria-label`, in-page timing 300–370 ms from pointer-over (`extras`). Focus: 0 ms from focus (keyboard Tab and Shift+Tab, composer, Settings Look, drawer).
   - Touch (390, real CDP touch events): a long press shows the tooltip and does not act (chip stays, sheet stays shut, drawer stays open); it clears itself after ~1.5 s; an ordinary tap still acts (sheet opens, sheet/drawer close).
   - Dismissal: Escape, leaving, a press and a scroll (tall page) each hide it.
   - Edges, dialogs, clipping: every shown tooltip is ≥8 px inside the viewport at both widths (flips: Close panel goes below, Close options goes left, accent picker is held 8 px from the left edge at 390); it shows above a modal `<dialog>` (top layer, popover-open while `:modal`); ancestors with `overflow`/`clip` do not clip it (`clip-ancestors.json`).
   - Tab: every icon-only stop in the composer, Settings Look and the 390 drawer shows its tooltip with its name; other stops show none.
   - 60 s: Update options menu open (1440) and the shell Menu panel open (390), scrolled to y=220, 13 samples over 60 s with `lamp:page-settings-changed` refreshes every 5 s (15 and 11 real `/api/app/` requests during the hold): menu stayed open, scroll stayed exactly 220, `.operator-main` was never remounted (marker kept), no "Loading" state, one tooltip layer.
   - Screenshots: `before/` and `after/` pairs (hover at 1440, long press at 390, setup, states); behaviour shots in `after/`.
4. **Existing behaviour preserved; checks.** No auth, data, contract, status or function change (diff is tooltip props, CSS tokens, one layer mount and the launcher's shadow root).

## Checks run (actual exits)

| Check | Result |
|---|---|
| `tsc --noEmit` (`pnpm typecheck`) | exit 0 |
| `node scripts/edition-authoring/cli.mjs lock`, then `check` (source lock regenerated last, after the proof files were staged) | exit 0 / exit 0 |
| `node src/base/contract-docs.mjs check` (CONTRACT.md untouched, generated listing current) | exit 0 "Contract documents are current." |
| `node scripts/validate-release.mjs` (release listing and migration inventory) | exit 0 |
| `node scripts/verification/check-plan.mjs` (registered test plan) | exit 0 |
| `rer check --profile first-party`, `node scripts/check-syntax.mjs` (277/277), `verify-base --offline` (`source:copies`) | exit 0 each |
| Touched existing tests, `node --test --test-concurrency=1 tests/e2e/publishing-browser.test.mjs tests/e2e/channels-and-presets.test.mjs` through `heavy-slot --remote auto` | run 1 on m1-runner, exit 1: 5 of 6 pass (channels, automation, composer/visual-edit, 390 phone desk, theme); the one failure, `TEAM-001…INCIDENT-014`, is `Vite did not emit the Start Worker configuration at dist/server/wrangler.json`, because that subtest reads a prebuilt `dist/` this isolated invocation never built (the plan builds once and shares it). Run 2: `pnpm run build` exit 0 (production client + SSR build, includes the editor widget's `?inline` CSS import), then `node --test --test-name-pattern=TEAM-001 tests/e2e/publishing-browser.test.mjs` exit 0, pass 1 fail 0 (local FIFO, tree dirty by this report). Logs: `results/existing-tests-run1.txt`, `results/existing-tests-run2.txt` |

No baseline or full local suite was run. No test was added, changed, weakened or deleted; no registration was added (the proof scripts live in `proof/scripts/` as the run record, not under `tests/`, and are not part of `check-plan`). Lamp is under its test cap.

## Handoff

- Mechanical: branch `cloud/uip-lamp-l20-tooltips-1` from `main` 71bbf96d, one commit plus this proof commit; fleet identity, `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. `sources.lock.json` regenerated last. `main` did not move, so no rebase was needed.
- Per POINT: outcome 1 → `behaviour.mjs` + `PROVENANCE.md`; 2 → `states.mjs`, `setup-proof.mjs`, `control-inventory.*`; 3 → `behaviour.mjs`, `extras.mjs`, `refresh60.mjs`, `clip.mjs`, screenshots; 4 → the checks table.
- Not claimed: hosted/deployed behaviour, Base packaging (a follow-up refresh), and the live `management` editor iframe (the launcher is proved through the real module with a loopback config; the iframe needs a management server).
- Notes for the gate: `proof/scripts/lib.mjs` has this run's scratch paths; run records only. The accessible name of the chip remove changed from `Remove <name>` to `Remove component` plus a description, as the brief asks; no test referenced the old name. A tooltip on a native colour input opens after hover and on focus; its click still opens the browser's picker (not exercised in headless).
