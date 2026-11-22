# Getting started

To try Lamp on your computer, paste this command into your terminal. On a Mac, open Terminal in Applications → Utilities. On Windows, open your WSL2 distribution. You can also copy the command from the [Run page](https://run-lamp.com/run).

Git is required. Rer brings Node and pnpm.

```sh
curl -fsSL https://runeditrun.com/install.sh | sh && LAMP_TAG=$(curl -fsSI -o /dev/null -w '%{redirect_url}' https://github.com/just-every/run-lamp/releases/latest | sed -nE 's|.*/releases/tag/(v[0-9]+\.[0-9]+\.[0-9]+)$|\1|p') && test -n "$LAMP_TAG" && git clone --branch "$LAMP_TAG" --single-branch https://github.com/just-every/run-lamp.git run-lamp && (cd run-lamp && RER_OWNER_READY_TIMEOUT_MS=300000 "$HOME/.local/bin/rer" dev)
```

The command installs `rer`, clones the latest published Lamp release into `run-lamp`, installs dependencies and prepares a local owner. When it is ready it prints `RER_READY` with the app's address and `RER_OPEN`, your private one-click owner entry link. Open it on the same computer and keep it private. Local Lamp suppresses outgoing email.

If the installer prints a line that puts `rer` on your PATH, run that line too. To start Lamp again later, run `cd run-lamp && rer dev`. `rer dev --stop` stops it.

[Run it locally](../RUN-LOCALLY.md) explains the local addresses and backups. To move an existing checkout forward, see [Update Lamp](updating.md#update-a-local-installation). To put Lamp online, see [Deploy to Cloudflare](deploy.md).
