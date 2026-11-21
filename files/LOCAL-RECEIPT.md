# Local verification receipt

Codex, 2026-11-21. Candidate c97c8e17ffce8b565164da5ceb42d7575863f50b on branch `cloud/sd-lamp-c-f194`. It was advertised by the remote after the guarded push. Main was d7dc4bff90e12f86fc4c60dfbd3abe130eab2102 at the time of that check.

| Check | Actual result |
| --- | --- |
| Fleet candidate history | One candidate commit relative to main. Author and committer passed the identity policy. No trailers. |
| Touched native Slack and Teams helper | Node 22.20.0 and Chromium at `/usr/bin/chromium` with `--no-sandbox`. 1 passed, 0 failed, exit 0. |
| Browser captures | Slack and Teams signed-out management pages captured at 1440 and 390 after consent before edits. All four files were visually reviewed. Each shows its correct channel and the expected enabled defaults. The assertions ran only at 1440. |
| Negative control | A local Playwright response override kept the Maintenance checkbox visibly checked and changed only its submitted value for the synthetic response. The Slack test rejected it at the initial form serialization assertion on line 29. Exit 1 was expected. |
| Typecheck | `pnpm typecheck` with Node 22.20.0, exit 0. |
| First-party check | `pnpm exec rer check --profile first-party`, exit 0. |
| Contract documents | `node src/base/contract-docs.mjs write` and `node src/base/contract-docs.mjs check` both exited 0. The generator wrote zero documents. |
| Source lock | `node scripts/edition-authoring/cli.mjs lock` and `node scripts/edition-authoring/cli.mjs check` both exited 0. Lock check was repeated at the committed candidate with Node 22.20.0. |
| Contract rows and generated views | Exact diff against main is empty for the contract and both generated views. |
| Diff hygiene | `git diff --check origin/main...HEAD` exited 0. Changed lines and selected text files reviewed for address strings and ambiguous slash tokens. |
| Initial channels suite attempt | 6 passed and 2 exited before their assertions because bundled Chromium was absent in the VM. The independent focused run uses the provided system Chromium. The repeat of the suite selects system Chromium for all of its existing drivers. |
| Complete channels suite | `pnpm test:channels` with Node 22.20.0 plus a temporary preload selecting system Chromium for every Playwright launch. All 8 tests passed, exit 0. This includes the registered private-channel journey. |
| Exact-SHA Verify | Push event, completed successfully, run 44909548719. |
| Ref check after Verify | The cloud ref still advertised the candidate. Main had advanced to f3cd0d1fdf9b89245e266e17d2cbd6e7f53fe915 after the candidate push. |
| Guarded landing gates | Candidate publication scan, main equality and Run site await the lander. |

Verify run https://github.com/just-every/run-lamp/actions/runs/44909548719
