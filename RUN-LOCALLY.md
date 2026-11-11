# Run it locally

Lamp runs on your computer without a Cloudflare account or mail credentials;
development mail is silently suppressed. Start it with the same line as the
[Run page](https://run-lamp.com/run):

```sh
curl -fsSL https://runeditrun.com/install.sh | sh -s -- dev just-every/run-lamp
```

Git is required; the installer brings Node when needed and rer brings pnpm.
This clones `main` (development source, not a release tag) into `run-lamp` and
starts it. Already have Node 22 or later? Use this alternative:

```sh
npx -y @runeditrun/rer dev just-every/run-lamp
```

After the curl install, if `~/.local/bin` is missing from your PATH, run the
installer's Bash line once to make the command available now and in future
terminals:

```sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.local/bin:$PATH"
```

For another shell, `"$HOME/.local/bin/rer" cli path` prints its line. Run the
remaining commands from the `run-lamp` folder.

The checkout pins `@runeditrun/rer` 0.2.108, which every command here runs whatever
rer you installed; `rer describe` reports the commands and tooling in use.
The latest release tag, `v1.11.11`, pins rer 0.2.108; if you choose the tag, use
that checkout's own instructions. See
[source and tooling versions](README.md#source-and-tooling-versions).
rer selects the project's pinned Node 22.20.0 and pnpm 10.12.4, downloading its
Node version when needed even if your shell has a newer Node.

## Start Lamp

```sh
rer dev
```

On first launch, `rer dev` installs locked dependencies and prepares a local
owner automatically. When ready, it prints `RER_READY` with the app address and
`RER_OPEN` with your private one-click owner entry link. Open the `RER_OPEN`
link to work as the owner; no email is needed. Keep that link private.

Local mail is not sent or retained, and there is no local inbox. Test emailed sign-in and subscriber delivery on a hosted installation
with its real mail provider and mailbox.

The local addresses serve three different purposes:

- `RER_READY` names the operator app on the selected hostname (`127.0.0.1` by
  default). Use `RER_OPEN` to sign in.
- For the business's public status page, use `localhost` with the same app port.
  For example, if `RER_READY` is `http://127.0.0.1:8899`, open
  `http://localhost:8899/` for the public page.
  With `rer dev --host localhost --port 8899`, the app uses `localhost` and
  the public page uses `http://status.localhost:8899/`. Lamp prints both addresses.
- `RER_SITE` names a separate preview of Lamp's static run site: the product
  homepage and Run page. It uses the first free port above the app's port.
  It does not show the business's live public status page. Use the exact
  `RER_SITE` address printed by `rer dev`.

`rer dev --stop` stops development, including its run-site preview.
`rer preview --stop` stops the fixed production app preview. If a port is
already occupied, choose another with `--port P`.

## Back up and restore local data

Stop the active server before exporting, importing, transferring an archive or
resetting data. If `rer dev` is running, stop it with `rer dev --stop`; if
`rer preview` is running, use `rer preview --stop` instead. Export the archive
before any reset. The following sequence restores this checkout and signs back
in as the owner recorded in the archive:

```sh
rer dev --stop
rer export --output exports/lamp.rer
rer reset --yes
rer import --input exports/lamp.rer --yes
rer setup
rer dev
```

When `rer setup` asks, use the original owner's email from before the reset.
After an import, run setup before restarting Lamp so its local private settings
match that restored owner.

To move the archive to a fresh checkout, stop the source server before exporting.
Copy the archive into the destination checkout at `exports/lamp.rer` (create the
folder there if needed). On the destination, keep the local install empty: do
not run setup or create records before import. Then install the project, import,
run setup with the same owner, and start Lamp:

```sh
rer install
rer import --input exports/lamp.rer --yes
rer setup
rer dev
```

A backup from an earlier Lamp restores the same way, including one made before
Lamp 1.8.0: the restore adds the audit entry migration 0033 writes for each
earlier component state change, as updating that installation in place would.

These `rer export` and `rer import` commands move a local installation. To back
up the Cloudflare installation this checkout deployed as `production`, run
`rer export --target remote --output exports/hosted`; it writes Lamp's hosted
archive folder, which `node scripts/import.mjs` restores. See [Backups and
recovery](docs/backups-and-recovery.md) and the technical [Cloudflare archive
reference](OPERATIONS.md#portable-backups-and-restore).

Run `rer describe` for the installed command and flag reference.
