# Getting started

Lamp runs on your own computer first, which is the quickest way to try it. Open a terminal (on a Mac, Terminal in Applications → Utilities; on Windows, your WSL2 distribution), copy this line into it and press Enter:

```sh
curl -fsSL https://runeditrun.com/install.sh | sh && git clone --branch v1.11.26 https://github.com/just-every/run-lamp.git && (cd run-lamp && RER_OWNER_READY_TIMEOUT_MS=300000 "$HOME/.local/bin/rer" dev)
```

Git is required. Rer brings Node and pnpm.

The line installs `rer`, clones the published Lamp `v1.11.26` release into `run-lamp`, installs dependencies and prepares a local owner. When it is ready it prints `RER_READY` with the app's address and `RER_OPEN`, your private one-click owner entry link. Open it on the same computer and keep it private. Local Lamp suppresses outgoing email.

If the installer prints a line that puts `rer` on your PATH, run that line too. To start Lamp again later, run `cd run-lamp && rer dev`. `rer dev --stop` stops it.

Next: [Run it locally](../RUN-LOCALLY.md) explains the local addresses and backups, and [Deploy to Cloudflare](deploy.md) puts Lamp online.
