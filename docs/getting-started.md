# Getting started

To try Lamp on your computer, paste the launch command from the [Run page](https://run-lamp.com/run) into your terminal. On a Mac, open Terminal in Applications → Utilities. On Windows, open your WSL2 distribution.

Git is required. Rer brings Node and pnpm.

The command installs `rer`, clones the latest published Lamp release into `run-lamp`, installs dependencies and prepares a local owner. When it is ready it prints `RER_READY` with the app's address and `RER_OPEN`, your private one-click owner entry link. Open it on the same computer and keep it private. Local Lamp suppresses outgoing email.

If the installer prints a line that puts `rer` on your PATH, run that line too. To start Lamp again later, run `cd run-lamp && rer dev`. `rer dev --stop` stops it.

Next: [Run it locally](../RUN-LOCALLY.md) explains the local addresses and backups, and [Deploy to Cloudflare](deploy.md) puts Lamp online.
