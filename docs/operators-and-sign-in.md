# Operators and sign-in

In **Settings → Operators**, enter your colleague’s name and email, choose a role and invite them. On your local copy, use the link in their pending invitation to open Lamp as that person in this browser. To invite someone on another computer, [put Lamp online](deploy.md) with email turned on, then invite them from the online copy.

Removing access revokes sessions and sign-in links. Erasing personal data is a
separate, irreversible action; it removes the operator's personal values while
keeping the opaque audit attribution.

## Change your owner account

As a signed-in Owner, open **Settings → Team → Operators → Owner account**.
Edit your own name or sign-in email, then choose **Save owner details**. A
name-only change takes effect as soon as you save.

If Lamp asks you to confirm your identity before saving an email change, open
the link sent to your current address in the same browser session, then save
again. With hosted mail off, start from a fresh
[`rer signin` session](#terminal-entry-for-the-hosted-owner).

An email change stays pending for up to 10 minutes. Open the link sent to the
new address in the same session that requested the change. For a handover, the
person receiving that email gives the confirmation link to the current Owner.
Locally, use
**Open Owner confirmation link**. With hosted mail off, the installation Owner
runs `rer signin` again and opens the new one-time Owner link in the same
session. On the confirmation page, choose **Confirm email change**. You can
cancel in Owner account while the change is pending. The current address stays
active until you confirm. With mail enabled, Lamp then notifies the previous
address and records both addresses in the audit log.

For a handover, leave **Sign out all sessions and revoke minted credentials and
linked sign-ins** checked. Confirmation ends every previous session, including
the one that confirms, and revokes management credentials, linked
identity-provider sign-ins and local passkeys. When email sign-in is available,
Lamp sends a separate sign-in link to the new address. If your installation
requires a sign-in provider, the new Owner signs in with that provider.

With mail off, Lamp cannot verify who holds the new address. Check it before
confirming. After confirmation, Lamp shows the one-time Owner sign-in link to
the signed-in current Owner as their session ends. They must hand that link
directly to the holder of the new address, who opens it to sign in.

Turn revocation off only for a rename that keeps existing access. Lamp shows
the choice at confirmation and records it in the audit log. The account ID,
Move in history and outstanding invitations to other operators stay with the
account.

Base 0.2.133 accepts recent step-up proof across actions, including proof
completed for another action or a recent email-link sign-in. On a
Business-provisioned installation, update the RER grant signer to name the
new stored Owner email. Business reads return HTTP 403 `invalid_grant` until
the signer uses that address.

Take a new backup after a handover. Restoring an earlier archive restores
the previous Owner address and linked identities from that archive. Business
grants must then name that restored address.

## Terminal entry for the hosted owner

With the checkout's pinned `@runeditrun/rer`, the hosted owner can enter without
receiving email. The pin is in `package.json` under `devDependencies`;
`rer --version` shows the installed CLI first and the checkout's pin second.
From the checkout that deployed Lamp, use the same Cloudflare account, deployment
environment and [private input file](deploy.md#step-1-make-a-private-input-file):

```sh
rer signin --environment production --env-file "$HOME/.config/lamp/production.env"
```

The command uses `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from that file
or the calling shell. It issues a link for the recorded deployment owner, so it
does not take an email address. The link works once, expires within 15 minutes
and is printed only to this terminal; `rer` does not save it. Open it privately.
Its use is recorded in the installation's audit log.

Keep the deploying checkout and its deployment records. If the command refuses
a missing record, wrong installation or missing owner-sign-in table, correct that
condition before trying again. After updating older source, redeploy to apply its
migrations, including `0023_owner_signin.sql`. `rer signin` checks the recorded
app Worker and its live ownership receipt. It does not repair a failed owner
claim: name a new copy with `--environment` and leave `LAMP_RESOURCE_PREFIX`
unset, because a custom prefix and `rer deploy`'s owner claim do not mix until
rer follows the recorded Worker. The compatibility command in the
[technical sign-in reference](../OPERATIONS.md#shared-operator-authentication)
can issue a link for an existing active operator; it cannot create a missing
owner claim.

Hosted Lamp can deliberately turn email off with `MAIL_PROVIDER=none`. The
deploying owner uses `rer signin`; email links, invitations and subscriber email
messages are unavailable. Other operators need a configured identity provider
or enabled mail. See [mail-off setup](deploy.md#or-deliberately-turn-email-off).

For enabled mail, Managed hosting includes it without an owner provider account
or mail key: RER fills and hides `MAIL_PROVIDER=rer`, `MAIL_FROM`, `MAIL_RELAY_URL`
and private `MAIL_API_KEY`. Free and Assisted hosting retain your own Resend or
SendGrid account with `MAIL_FROM_ADDRESS`, `MAIL_DKIM_SELECTOR` and
`MAIL_PROVIDER_API_KEY`.

## Optional single sign-on

Single sign-on lets an already invited operator use a supported identity
provider. Linking a provider does not invite people or give them Lamp access.
Email sign-in stays available. SCIM and role synchronization are not supported.

### Set up Google or Okta in Lamp

Google and Okta are set up in the app, with no file to edit and no redeploy.
Only the owner can do it, with fresh email confirmation.

1. In the provider, create the application. For Google, create an OAuth client
   ID for a web application in Google Cloud. For Okta, create an OIDC web app,
   keep **Client authentication** as **Client secret** and assign the people who
   will use Lamp.
2. Open **Settings → Team → Sign-in**. If it shows **Confirm my identity**, choose
   it, open the emailed link in the same browser, then return to the tab.
3. Choose **Set up Google** or **Set up Okta**. Copy the redirect URI Lamp shows
   into the provider. Paste the client ID and secret (and, for Okta, your Okta
   domain such as `acme.okta.com`) and choose **Save**. Lamp checks that the
   provider answers and pins it. The row then reads **Saved, not tested**.
4. For Okta, list each person: choose them beside their Okta user ID, which you
   find in Okta under **Directory → People** and which starts with `00u`. Okta
   signs in only the people listed. Each ID and each person can be listed once.
5. Turn on **Let invited people sign in with Google or Okta**, then choose **Test
   sign-in**. The provider's real flow runs and you return to the pane with one
   plain result. **Working** appears only after the provider accepted Lamp's
   client secret. An account that is not invited, or an Okta user who is not
   listed, still proves the credentials: it reads *Google accepted Lamp, but that
   account isn't invited here*.

Lamp keeps the client secret sealed in its own database and never shows it again,
exports it or returns it in a page. **Replace secret** and a changed client ID or
domain pin the provider again, so people signed in with it sign in again.
**Disconnect** signs them out, lifts any sign-in rule for an email domain that named
the provider, and deletes the registration; email sign-in links keep working. A
backup omits the secret: after a restore the row reads **Needs its client secret**
and is not offered until you paste it again. Managed hosting has no outbound
connection yet, so Settings says so and Save is refused there.

Microsoft Entra and Run Edit Run Auth are still set up on the identity settings
page (`/auth/settings/identity`, linked at the foot of the Sign-in pane) and as
described below. Microsoft Entra cannot be finished from that page: Lamp links each Microsoft
person by the subject Microsoft issues to the app, which the Entra admin center
does not show. Use the steps below only if your identity administrator can give you
each operator's subject.

### Register Google, Microsoft or Okta in the deploy file

The deploy-file path below still works for Microsoft and for anyone who prefers
it. A provider set in the deploy file **wins per ID**: Settings then shows it as set
in your deploy settings, reads its state and offers only the redirect URI and
**Test sign-in**; Save is refused for that ID until you remove it from the file.

The person deploying Lamp needs permission to create an application in the
identity provider and change Lamp's private deployment inputs.

1. Register a confidential **Web application** in the provider's admin console.
   Use its authorization-code flow with the `openid email` scopes. Create a
   client secret and retain the client ID. These are application credentials,
   different from an operator's password.
2. Register the exact callback address on Lamp's **operator** host. For the IDs
   below, use `https://ops.example.com/auth/oidc/google/callback`,
   `https://ops.example.com/auth/oidc/microsoft/callback` or
   `https://ops.example.com/auth/oidc/okta/callback`. Replace `ops.example.com`
   with your actual operator hostname. Use the same provider ID in the JSON.
3. Prepare the corresponding provider entry below. For Microsoft and Okta, ask
   the identity administrator for the operator's exact OIDC **subject** (`sub`)
   for this application. Add it to `subjectEmails`, mapped to that person's
   already invited Lamp email. Do not substitute the display name or assume a
   directory object ID is the application's subject.

| Provider | Registration and values |
| --- | --- |
| Google | In [Google Auth Platform → Clients](https://developers.google.com/identity/protocols/oauth2/web-server#create-authorization-credentials), create a Web application client and its authorized redirect URI. Configure its audience and test users as needed. Lamp trusts a verified Gmail address or a verified Workspace address with a matching hosted-domain (`hd`) claim; other addresses need an explicit `subjectEmails` map. |
| Microsoft | In [Microsoft Entra → App registrations](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app), register for your single tenant, add the Web redirect URI, then create a client secret under Certificates & secrets. Use the application/client ID, secret **value** and Directory/tenant ID. Lamp requires that specific tenant, not `common`, `organizations` or `consumers`, and an explicit subject map. |
| Okta | In [Okta Admin → Applications → Create App Integration](https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/), select OIDC and Web Application, set the sign-in redirect URI and assign the operators. Use the exact issuer shown by its authorization server (including any path), client ID and secret. Set client authentication to match `client_secret_basic`; an explicit subject map is required. |

Use one or more entries in a single JSON array. These examples contain
placeholders, not usable credentials:

```json
[
  {"id":"google","preset":"google","clientId":"your-google-client-id","tokenAuthMethod":"client_secret_post","clientSecret":"your-google-client-secret"},
  {"id":"microsoft","preset":"microsoft","tenant":"your-tenant-id","clientId":"your-application-id","tokenAuthMethod":"client_secret_post","clientSecret":"your-client-secret-value","subjectEmails":{"exact-operator-subject":"operator@example.com"}},
  {"id":"okta","preset":"okta","issuer":"https://your-org.okta.com","clientId":"your-client-id","tokenAuthMethod":"client_secret_basic","clientSecret":"your-client-secret","subjectEmails":{"exact-operator-subject":"operator@example.com"}}
]
```

### Configure Lamp and check sign-in

1. Put the selected JSON array on **one line** as `AUTH_PROVIDERS=[...]` in your
   existing [private deployment input file](deploy.md#step-1-make-a-private-input-file).
   Include only the providers you registered; replace every placeholder. The
   array contains client secrets and must stay outside Git and shared logs.
2. Add `OIDC_TRANSACTION_SECRET` to the same file: a separate random value of at
   least 32 characters, different from `SESSION_SECRET`. To append one without
   printing it, run this once before that key exists in the file:

```sh
printf 'OIDC_TRANSACTION_SECRET=%s\n' "$(od -An -vtx1 -N32 /dev/urandom | tr -d ' \n')" >> "$HOME/.config/lamp/production.env"
```

3. Stop any local development or preview server, then validate and redeploy:

```sh
rer deploy --dry-run --environment production --env-file "$HOME/.config/lamp/production.env"
rer deploy --environment production --env-file "$HOME/.config/lamp/production.env"
```

   A redeploy keeps the `OIDC_TRANSACTION_SECRET` the Worker already holds, so
   sign-ins in progress survive it. A page first deployed by Lamp 1.6.0 or
   earlier holds it empty, and the deploy says it kept it. The first time you add
   it to the file on such a page, deploy with
   `--rotate-secret OIDC_TRANSACTION_SECRET` so the Worker takes your value.

4. As the setup owner, open **Settings → Team → Sign-in**.
   Turn on **Let invited people sign in with Google or Okta**. This permits the configured
   providers; the checkbox alone does not establish a connection.
5. Keep your current owner session open. In a separate private browser window,
   open Lamp's sign-in page and choose the provider. Complete sign-in as an
   invited operator. A real sign-in that reaches the operator app checks the
   registration, callback, credentials, provider response and Lamp membership.
   A saved setting or discovered provider alone does not check all of these.

If the provider is missing or sign-in fails, check that the deployed values
contain the registered ID, callback, client secret and correct issuer/tenant.
For Microsoft and Okta also check the exact subject map and active invitation.
Use email sign-in while correcting the configuration. Previously linked
providers keep their pinned registration when configuration changes: an owner
must approve a re-link; see the [technical provider controls](../OPERATIONS.md#identity-provider-configuration).

### Connect a Run Edit Run Auth installation

`IDENTITY_PROVIDER` is for an installed Auth provider that supports RER's
`oidc-provider@1` link protocol. It is not a place to paste a Google, Microsoft
or Okta sign-in URL. The deployer sets it to the Auth installation's HTTPS
origin and redeploys. The Lamp owner then confirms their identity by email and
approves that exact Auth origin locally; the Auth owner separately approves
Lamp's exact operator origin and callback addresses. The completed link creates
its client registration and server key automatically. No manual client secret
is needed for this path.

The checkbox cannot perform that link. Give the [Auth linking procedure](../OPERATIONS.md#identity-provider-configuration)
to the person operating the two installations, then enable provider sign-in and
check a real invited-operator sign-in as above. A restored installation needs
fresh link approval and starts with provider sign-in disabled.

<!-- Run Edit Run fleet, 2026-11-16: clarify the checkout rer pin and installed CLI version. -->

<!-- Run Edit Run fleet, 2026-11-16: deploy-fault documentation follow-up. -->

<!-- Run Edit Run fleet, 2026-11-17 -->
In Settings → Operators, choose a role before inviting someone. Communicator is
the default: they can write and publish updates without managing settings or
other operators. The form explains every role, and pending invitations show the
chosen role. The invitee receives exactly that role. Releases before 1.11.23
had no role choice: an Owner's invitation made every invitee an Owner, so on an
installation older than that, lower the role in Settings → Operators after the
invitee's first sign-in (or update first). In Settings → Look, pick an accent colour or type a value such as
#1F3A5F; invalid text stays in the field with help, while the swatch keeps the
saved colour until you correct it.
