# Deploy to Cloudflare

**Or let Run Edit Run host it.** [Run Edit Run](https://app.runeditrun.com/?product=lamp&plan=assisted) can set Lamp up on your own Cloudflare account and keep it updated; sign-ups are by request for now.

- **Free:** you run Lamp's open source yourself in your own Cloudflare account,
  with no Run Edit Run charge. This page is that path, step by step.
- **Assisted:** Run Edit Run installs and maintains Lamp for you, while it stays
  in your own Cloudflare account and GitHub repository (early access).
- **Managed:** Run Edit Run hosts and runs Lamp for you, and provides its mail:
  you need no mail provider account, domain or key (waitlist only).

Compare them on [Run Edit Run plans](https://runeditrun.com/pricing).

A hosted Lamp can send sign-in links, invitations and subscriber updates through
your mail provider, or you can deliberately turn email off in step 6. On the
Free path, enabled mail uses your own provider and an authenticated sender
domain. Managed hosting can supply mail without your own provider account.

You need a Cloudflare account and the Lamp checkout selected by the
[Run page](https://run-lamp.com/run), which points to the latest published
release. Run each command from that checkout. If you choose another release,
use the deploy guide inside its checkout.
For enabled email, you also need a mail provider and an authenticated sender domain. Custom-domain hosting
needs domains whose DNS records you can change; workers.dev hosting does not.

After the curl install, if `~/.local/bin` is missing from your PATH, run the
installer's Bash line once to make the command available now and in future
terminals:

```sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && export PATH="$HOME/.local/bin:$PATH"
```

For another shell, `"$HOME/.local/bin/rer" cli path` prints its line.

Do the steps in order. Each step names the inputs it gives you; `rer deploy
--dry-run` lists any you have not set yet by the same names, in the same order.

## Step 1: Make a private input file

Your inputs live in one file outside the Lamp folder that only you can read. Run
these four lines once; the first also tells the later commands where the file is:

```sh
export LAMP_DEPLOY_ENV="$HOME/.config/lamp/production.env"
mkdir -p "$HOME/.config/lamp" && chmod 700 "$HOME/.config/lamp"
touch "$LAMP_DEPLOY_ENV" && chmod 600 "$LAMP_DEPLOY_ENV"
```

Open the file in any text editor. Each later step adds lines to it, one
`NAME=value` per line. Blank lines and `# comments` are allowed; do not add
`export`, quotes are optional, and a value cannot span lines. If you open a new
terminal later, run the first line again.

## Step 2: Cloudflare account ID and API token

`CLOUDFLARE_ACCOUNT_ID`: sign in at [dash.cloudflare.com](https://dash.cloudflare.com),
open **Workers & Pages**, and copy **Account ID** from the right-hand column (or
choose **Copy account ID** from the account's menu on **Account home**).

`CLOUDFLARE_API_TOKEN`: open [API Tokens](https://dash.cloudflare.com/profile/api-tokens),
choose **Create Token**, then **Create Custom Token**. Name it `Lamp deploy` and
add these four **Account** permissions, each set to **Edit**: **Workers Scripts**,
**D1**, **Workers R2 Storage** and **Queues**. Under **Account Resources** include
your account. If you will use your own domain (step 3), also add the **Zone**
permission **Workers Routes**: **Edit** for that domain's zone. Choose
**Continue to summary**, then **Create Token**, and copy the token: Cloudflare
shows it only once.

Put both values in your private deployment file, or export both in the shell
where you run `rer deploy`. If a credential helper injects the token, export
the account ID alongside it and remove any `CLOUDFLARE_*` and `CF_*` entries
from the private file.

```text
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=synthetic-your-cloudflare-api-token
```

## Step 3: Your two addresses

Lamp has two addresses: `LAMP_APP_HOST`, where you and your team sign in, and
`LAMP_PAGE_HOST`, where customers read your status page. Write them as bare
host names, with no `https://`, port or path.

**Quickest: Cloudflare's free `workers.dev` addresses.** In **Workers & Pages**,
the overview shows your account's subdomain as `<subdomain>.workers.dev`; if it
asks you to choose one first, choose it. For the `production` installation use:

```text
LAMP_HOSTING=workers-dev
LAMP_APP_HOST=lamp-production.<subdomain>.workers.dev
LAMP_PAGE_HOST=lamp-production-page.<subdomain>.workers.dev
```

Replace `<subdomain>` with yours. By default the names are `lamp-<environment>`
and `lamp-<environment>-page`; for `--environment staging` they start with
`lamp-staging`. For a new installation, an optional `LAMP_PAGE_WORKER=service-status`
selects just the public Worker: set `LAMP_PAGE_HOST=service-status.<subdomain>.workers.dev`
and keep the app hostname as above. Leave the option unset to preserve the
default public name and keep the same choice on redeploy. See the
[naming requirements](deployment-reference.md#find-your-workersdev-hostnames).

[//]: # (Native public Worker naming: Codex, 2026-11-15T03:50:49Z.)

The [deployment reference](deployment-reference.md#find-your-workersdev-hostnames)
also shows a command that prints your subdomain.

**Your own domain:** leave out `LAMP_HOSTING`, set two different names on a domain
whose DNS is on Cloudflare, such as `ops.example.com` and `status.example.com`,
and follow [Hostnames and your own domain](domains.md) first.

## Step 4: Your page

```text
LAMP_PAGE_NAME=Acme Status
LAMP_PAGE_TAGLINE=Service updates for Acme customers
LAMP_PAGE_TIMEZONE=Europe/London
LAMP_ACCENT_COLOR=#16794C
```

`LAMP_PAGE_NAME` is the page's title (up to 120 characters) and
`LAMP_PAGE_TAGLINE` the sentence under it. `LAMP_PAGE_TIMEZONE` is the time zone
your page shows times in, as a name from the
[time zone list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
such as `America/New_York`. `LAMP_ACCENT_COLOR` is your brand color: `#` and
six hex digits. You can change all four later in **Settings**.

## Step 5: You, the owner

```text
SETUP_OPERATOR_EMAIL=owner@example.com
```

`SETUP_OPERATOR_EMAIL` is the address you sign in with as the page's owner.
Give your display name with `--owner-name` for the first deploy and its dry run,
as shown in step 7. The checkout can reuse a name saved by `rer setup`.

## Step 6: Mail

<!-- Run Edit Run fleet (Codex), 2026-11-15: deliberate mail-off adoption. -->
### Or deliberately turn email off

`rer deploy` defaults `MAIL_PROVIDER` to `none`; set `MAIL_PROVIDER=none` in
your private deployment input file to make that choice explicit. Leave sender,
DKIM and all sending credentials unset, including managed relay settings and any
secondary mail provider. A deferred provider selection is refused. Supplying
sending credentials together with `none` refuses deployment.

With email off, email sign-in links, invitations and email subscriptions are
unavailable. Pending email alerts remain unfinished; Lamp never reports them as
sent. Incidents, maintenance and the public status page keep working. Private
operator pages still require authentication.

The deployment owner signs in with `rer signin` in step 8. Keep the checkout's
`.rer/deploy` records and the Cloudflare credentials that deployed that environment:
the command checks the recorded account, project, environment, Worker and live
ownership receipt. It refuses missing or mismatched records. Other operators
need a configured identity provider or an administrator to enable mail. The
hosted sign-in page provides no local-development entry or reusable token.

To enable email later, select and configure an enabled provider below and
redeploy with the same environment and ownership records.


Lamp sends mail through SendGrid or Resend from an address on a domain you have
authenticated there. Authenticate the exact domain of your sender address: for
`status@example.com` that is `example.com`; for `status@mail.example.com` it is
`mail.example.com`.

### Authenticate your domain at SendGrid

1. Sign in at [app.sendgrid.com](https://app.sendgrid.com) and open **Settings →
   Sender Authentication**. Under **Domain Authentication** choose **Get Started**
   (or **Authenticate Your Domain**).
2. Choose your DNS host (choose **Cloudflare** if your DNS is there), answer **No**
   to link branding, and choose **Next**.
3. Enter your sending domain. Leave **Use automated security** on and the DKIM
   selector as SendGrid offers it (`s1`). Choose **Next**.
4. SendGrid shows three **CNAME** records: `em…`, `s1._domainkey` and
   `s2._domainkey`. Add each at your DNS host with the name and value exactly as
   shown. In Cloudflare DNS, set each to **DNS only** (gray cloud), not proxied.
5. Add a DMARC record if your domain has none: a **TXT** record named `_dmarc`
   (on the same sending domain) with the value `v=DMARC1; p=none;`.
6. Back in SendGrid, tick that you added the records and choose **Verify**. DNS
   can take a few minutes; choose **Verify** again until every record is verified.
7. Open **Settings → API Keys → Create API Key**, name it `Lamp`, choose
   **Restricted Access**, set **Mail Send** to **Full Access** and **Sender
   Authentication** to **Read Access**, then **Create & View**. Copy the key:
   SendGrid shows it only once.

```text
MAIL_PROVIDER=sendgrid
MAIL_FROM_ADDRESS=status@example.com
MAIL_DKIM_SELECTOR=s1
MAIL_PROVIDER_API_KEY=synthetic-your-mail-provider-api-key
```

`MAIL_FROM_ADDRESS` is any address on the domain you authenticated; replies to
your emails go there. `MAIL_DKIM_SELECTOR` is the part before `._domainkey` in
the records SendGrid gave you (`s1`).

### Or use Resend

At [resend.com](https://resend.com), open **Domains → Add Domain**, enter your
sending domain and add the records it shows at your DNS host (one of them is a
**TXT** record named `resend._domainkey`), add the `_dmarc` record from step 5
above if you have none, then choose **Verify DNS Records**. Create a key under
**API Keys** with **Sending access**. Then set `MAIL_PROVIDER=resend`,
`MAIL_DKIM_SELECTOR=resend`, your sender address and the key. Set the provider
explicitly: leaving out `MAIL_PROVIDER` keeps `rer deploy`'s default of `none`.

### Or use Managed hosting

With [Managed hosting](https://runeditrun.com/pricing) Run Edit Run provides the
mail: you skip this step, and Run Edit Run fills `MAIL_PROVIDER=rer`, `MAIL_FROM`,
`MAIL_RELAY_URL` and the private `MAIL_API_KEY` for you.

Before it creates anything, a real deploy checks that a DKIM key answers at
`<selector>._domainkey.<your sending domain>` and a DMARC policy at
`_dmarc.<your sending domain>`, and says which record to fix if one is missing.
SPF at your sending domain is not required.

## Step 7: Check, then deploy

Stop the development server before the dry run; an active server owns the
checkout's local state and prevents deployment. From the Lamp folder:

```sh
rer dev --stop
```

If you are running a production preview instead, stop it with `rer preview --stop`.
Then check your inputs:

```sh
rer deploy --dry-run --environment production --env-file "$LAMP_DEPLOY_ENV" --owner-name "Alex Morgan"
```

Replace `Alex Morgan` with your own name in both commands. The dry run checks
the file and builds Lamp on your computer without contacting
Cloudflare. If an input is missing it lists each one by name with the step that
explains it; add them and run it again. When it passes, deploy:

```sh
rer deploy --environment production --env-file "$LAMP_DEPLOY_ENV" --owner-name "Alex Morgan"
```

The deploy creates Lamp's database, file storage and queue in your Cloudflare
account, uploads Lamp and checks it is healthy. With email enabled, it checks
your mail DNS. It ends by
naming the address to sign in at (your `LAMP_APP_HOST`). It generates the four
signing secrets `SETUP_TOKEN`, `SESSION_SECRET`, `SUBSCRIBER_TOKEN_SECRET` and
`WEBHOOK_SIGNING_SECRET` and keeps them in `.rer/deploy/production.secrets.env`
in the Lamp folder; a later deploy reuses them.

The last check reads your status page's public snapshot at `LAMP_PAGE_HOST`. A
hostname that is slow to appear in DNS is retried for about a minute. If the
hostname is not in DNS at all (a detached page host), the deploy prints
`Page host detached: skipped.` and completes; a host that answers but is not
serving the snapshot fails the deploy.

`--environment` names this installation; it defaults to `production`. Use
`--environment staging`, with its own input file and step 3 addresses, for a
second copy named `lamp-staging`. Leave `LAMP_RESOURCE_PREFIX` unset: it does
not work with `rer deploy`'s owner claim until rer follows the recorded Worker,
and a failed claim would leave the deployment owner unable to use `rer signin`.

The app Worker runs a one-minute cron (`* * * * *`) for scheduled status work,
notifications and snapshot maintenance. In `workers.dev` mode the separate
public Worker has no second cron.

## Step 8: Sign in

With email enabled, open `https://<LAMP_APP_HOST>`, enter your
`SETUP_OPERATOR_EMAIL` and open the link Lamp emails you. With email off, or to
enter as the deployment owner without waiting for mail, run this from the same
checkout with its deployment records and deploying account credentials. Open
the link it prints within 15 minutes; it works once:

```sh
rer signin --environment production --env-file "$LAMP_DEPLOY_ENV"
```

For an agent setting up Lamp through Run Edit Run Business, the first-owner
sign-in link is the URL printed after `One-time sign-in link for the owner`
by this command. Pass it only in `session.report` as `tools[i].sign_in`, with
the same HTTPS host and port as that tool's address. Keep it out of chat and files.

First-run setup then walks you through your components. Your public page is at
`https://<LAMP_PAGE_HOST>`. See [terminal entry](operators-and-sign-in.md#terminal-entry-for-the-hosted-owner)
for details of `rer signin`.

## After the first deploy

Hosted deploy and `node scripts/setup.mjs` maintain `rer_migrations` in the
`DB` database: each migration confirmed applied in D1 gets its filename and the
SHA-256 of its exact file bytes. Re-running either command backfills missing
entries for older installs and preserves recorded entries, including after a
partial apply. `/health` reports that observed inventory separately from
liveness, with the complete-file count and deterministic inventory hash; an
existing empty ledger reports count zero, while a missing ledger is unavailable.

<!-- Run Edit Run fleet, 2026-11-17: installed-health ledger follow-up. -->

Deploy again with the same command after you change inputs or update Lamp
([Update Lamp](updating.md) shows the backup to take first). A redeploy keeps the
`SESSION_SECRET`, `SUBSCRIBER_TOKEN_SECRET` and `WEBHOOK_SIGNING_SECRET` each
Lamp Worker already holds, so emailed Manage and Unsubscribe links and operator
sessions keep working, and the deploy says which it kept. The same holds for
`OIDC_TRANSACTION_SECRET` with [single sign-on](operators-and-sign-in.md#optional-single-sign-on).

**Keep the secrets with your input file.** To restore into a new installation
([Backups and recovery](backups-and-recovery.md)) you need the original values.
`.rer/deploy/production.secrets.env` holds the three that last:
`SESSION_SECRET`, `SUBSCRIBER_TOKEN_SECRET` and `WEBHOOK_SIGNING_SECRET` (the
setup token is used once, for the owner claim, and removed). Keep a copy of that
file with your input file, or generate all four into the input file before the
first deploy with this loop (it uses only `od` and `tr` and prints nothing):

```sh
for name in SETUP_TOKEN SESSION_SECRET SUBSCRIBER_TOKEN_SECRET WEBHOOK_SIGNING_SECRET; do
  printf '%s=%s\n' "$name" "$(od -An -vtx1 -N32 /dev/urandom | tr -d ' \n')" >> "$LAMP_DEPLOY_ENV"
done
```

To replace one on purpose (for example after a leak), put its new value in the
file and add `LAMP_REPLACE_SECRETS=SESSION_SECRET` (comma-separated names) for
that one deploy, or run `rer deploy --environment production --env-file "$LAMP_DEPLOY_ENV" --rotate-secret SESSION_SECRET`
for a value rer generated. Replacing `SUBSCRIBER_TOKEN_SECRET` ends every emailed
subscriber link; replacing `SESSION_SECRET` signs every operator out.

Instead of the file you can export the same names in your shell and run
`rer deploy` without `--env-file`; file values win over exported ones. Never
commit the file or paste its values into logs.

A healthy deploy does not prove email arrives. Subscribe yourself on the public
page, publish a test incident and check the email arrives. Without a provider
webhook key the delivery log's last status is **Accepted by SendGrid** (or
**Accepted by Resend**); to record delivered, bounced and complained, add
`SENDGRID_WEBHOOK_PUBLIC_KEY` or `RESEND_WEBHOOK_SECRET` and the provider webhook
described in [Owner inputs](../OPERATIONS.md#owner-inputs). Run `rer verify`
separately for Lamp's full source and browser checks; a deploy does not run them.
The [deployment reference](deployment-reference.md) lists every input, required
and optional.

## Remove an installation

Back up anything you want to keep first ([Backups and recovery](backups-and-recovery.md)).
The native command runs on Node 22 or later. The pinned rer CLI does not yet
expose `rer remove` for first-party projects; use the command below. Check with
`node --version`; if it is missing or older (the Run page's installer keeps its
Node private to `rer`), install Node 22 from [nodejs.org](https://nodejs.org/en/download)
or your package manager and open a new terminal. Then, from the Lamp folder that
deployed it, with the same environment and input file:

```sh
node scripts/remove-deployment.mjs --environment production --env-file "$LAMP_DEPLOY_ENV" --yes
```

The command removes the public page Worker, then the app Worker with its
database, files and queue. It verifies their removal, including the Durable
Object namespace. The command prints each resource it starts removing. It
allows up to 10 minutes per R2 bucket and can resume an active Cloudflare bulk
purge. If removal reports `remove-incomplete`, rerun the same command with
the same environment and input file until it says `read back: none remains`.
Each run resumes from the retained records. In custom-domain mode there is one
Worker. `rer deploy --remove
--yes` alone does not remove the separate public page Worker of a `workers.dev`
installation, so use this command.

Lamp keeps the current and previous published snapshot versions in the files
bucket so frequent publishing does not accumulate an unlimited archive. Cleanup
starts only after a successful publication and pointer readback, protects newer
concurrent builds by generation sequence, and drains older piles over successive
publishes (up to four pages of 256 objects, with a one-second scheduling budget).
A failed publication deletes nothing; a failed cleanup resumes on a later publish.
Deployment removal purges all snapshot versions with the rest of that bucket.
<!-- Run Edit Run fleet, 2026-11-17: bounded snapshot retention. -->

Removal only touches what its creation records prove this environment created;
it never matches by name. If an older installation has no creation records, the
command refuses; see the [removal limits](deployment-reference.md#removal-and-deployment-records).

<!-- Run Edit Run fleet, 2026-11-17: single-invocation removal follow-up. -->
