# Update Lamp

Before changing source, keep a copy of the current source revision and use the
appropriate [backup and recovery procedure](backups-and-recovery.md) for the
installation you are updating. Preserve applied migration history and apply
later migrations in order.

## Update a local installation

Keep the existing local data in place. Follow the backup and restore sequence
if moving to another checkout. Stop the active
development server with `rer dev --stop` or the production preview with
`rer preview --stop`. For a checkout cloned from Lamp's Run page or README,
run this from the `run-lamp` folder to switch to the latest published release.

```sh
LAMP_TAG=$(curl -fsSI -o /dev/null -w '%{redirect_url}' https://github.com/just-every/run-lamp/releases/latest | sed -nE 's|.*/releases/tag/(v[0-9]+\.[0-9]+\.[0-9]+)$|\1|p') && test -n "$LAMP_TAG" && git fetch origin "refs/tags/$LAMP_TAG:refs/tags/$LAMP_TAG" && git switch --detach "refs/tags/$LAMP_TAG"
```

For a customised checkout, integrate the release into your branch before
adopting it. Then run `rer install`, `rer setup` and `rer verify` from
the updated source, check the owner workflows affected by the update, and
resume local work with `rer dev`. The [local guide](../RUN-LOCALLY.md) has the
exact recovery commands.

## Update a Cloudflare installation

Keep the deployment's private input file outside source control. Before
changing source, take a backup of the deployed data. From the Lamp folder that
deployed it, with Node 22 or later on your PATH (see
[Backups and recovery](backups-and-recovery.md#back-up-a-hosted-installation)):

```sh
node scripts/export.mjs --remote --environment production --env-file "$HOME/.config/lamp/production.env" --out "$HOME/lamp-backups/before-update-$(date +%Y%m%d-%H%M)"
```

Also download your page data from **Settings → Export and restore** in the app. Then update the source
(`git pull --ff-only`, or check out the release you chose), stop any local
development server with `rer dev --stop` or production preview with
`rer preview --stop`, and from the updated source run:

```sh
rer install
rer deploy --environment production --env-file "$HOME/.config/lamp/production.env"
```

Substitute your environment and input-file path. The deploy keeps the original
session, subscriber and webhook signing secrets, applies new migrations in order,
builds, publishes and checks health; run `rer verify` separately for source and
browser checks. Then check the public page, operator sign-in and configured
delivery paths. A source verifier pass does not establish live provider
acceptance.
