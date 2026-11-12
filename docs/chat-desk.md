# Slack and Teams incident desk

Use **Settings → Connected tools → Chat links** to link your own operator
identity. An installation owner first registers a separate Slack app or Teams
bot for this Lamp installation. There is no shared Lamp app to search for in a
provider's app store. Choose [Slack](#slack) or [Teams](#teams) below.

This is the private operator incident desk. For status-page visitors receiving
notifications in a channel, use [subscribers and notifications](subscribers-and-notifications.md).

## Before you start

You need permission to install custom apps in the workspace or tenant, and a
hosted Lamp with a public HTTPS **app host**, not the public status-page host.
The endpoints are `https://<LAMP_APP_HOST>/api/chat/slack` and
`https://<LAMP_APP_HOST>/api/chat/teams`. Provider servers cannot reach your local
`127.0.0.1` address. [Deploy Lamp](deploy.md) first if you only run it locally.

The required bindings below belong to the app Worker. After deploying, open
**Cloudflare dashboard → Workers & Pages → your app Worker → Settings → Variables
and Secrets → Add**. Add the named binding as a **Secret**, then deploy the
change. Use the app Worker name recorded by your deploy (normally
`lamp-production`), not its `-page` Worker. Keep these values in your private
installation records for recovery. These chat bindings have no Settings form;
putting them into a social account or subscriber destination does not configure
the command endpoints.

## Slack

1. Open [Your Apps](https://api.slack.com/apps), choose **Create New App → From a
   manifest**, and select the workspace where you will use Lamp. Copy the JSON
   from the repository's [Slack manifest](chat-desk/slack-manifest.json).
   Replace both `https://app.example.test/api/chat/slack` URLs with your own app
   endpoint. Review and create the app. Use a distinctive app name if the
   workspace already has a Lamp installation.
2. In the app's **Slash Commands**, confirm `/lamp` has that **Request URL**.
   In **Interactivity & Shortcuts**, confirm interactivity is on and its
   **Request URL** is the same endpoint. The supplied manifest configures both;
   Lamp does not require Socket Mode, an Events API subscription or the issued
   bot token. In **OAuth & Permissions → Scopes → Bot Token Scopes**, confirm
   `commands` is present; if absent choose **Add an OAuth Scope → commands**.
   The supplied manifest requests this permission so Slack can install `/lamp`.
3. In **Basic Information → App Credentials → Signing Secret**, reveal the
   secret. Add it to your Lamp app Worker as `SLACK_SIGNING_SECRET`, as described
   above. `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` are for subscriber OAuth,
   not this incident desk.
4. Choose **Install App → Install to Workspace** and approve the installation.
   If Slack requires workspace approval, an administrator must allow the app
   before the command can be used.
5. Return to **Chat links** in Lamp and choose **Create link code**. In Slack,
   open a private conversation, such as your conversation with yourself, and
   send the displayed `/lamp link CODE` command. Select the `/lamp` command
   belonging to the app you just installed. A slash command works from a
   conversation; send the slash command, not an ordinary message to the bot.
6. In Lamp, choose **Refresh chat links**. A Slack entry with your workspace and
   user identifiers confirms the link. If the command is unknown, check the
   workspace and installation; if Lamp says signing is not configured, check
   the binding on the app Worker and its deployed version.

Provider references: [create from a manifest](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests/),
[install an app](https://docs.slack.dev/app-management/distribution/) and
[slash commands](https://docs.slack.dev/interactivity/implementing-slash-commands/).

## Teams

1. In the [Azure portal](https://portal.azure.com/), create an **Azure Bot**
   resource for your organization. For a new registration choose **Single
   Tenant** and create or select its Microsoft App ID. Record the application
   (client) ID. Existing supported registrations may already have an ID; do not
   substitute your tenant ID, app package ID or client secret for it.
2. Open the Azure Bot's **Configuration**, set **Messaging endpoint** to
   `https://<LAMP_APP_HOST>/api/chat/teams` and apply the change. In **Channels**,
   add **Microsoft Teams** for your organization's cloud. Lamp uses the public
   Bot Framework token service; sovereign-cloud endpoints are not configured.
3. Add `BOT_FRAMEWORK_APP_ID` to the Lamp app Worker, with that application ID as
   its value. Lamp verifies incoming Bot Framework tokens against this ID.
   `BOT_FRAMEWORK_APP_PASSWORD` is reserved; Lamp's incoming command desk does
   not use it to send outbound messages.
4. Copy the repository's [Teams manifest](chat-desk/teams-manifest.json) into a
   file named `manifest.json`. Replace the example app `id` with your app's GUID,
   and both `botId` values with the Microsoft App ID. Replace
   `app.example.test` in `validDomains` with your app hostname (no scheme),
   and replace the developer name and website, privacy and terms URLs with your
   own real details. Include `color.png` (192 × 192) and `outline.png` (32 × 32)
   matching the manifest. ZIP those three files at the archive root, not inside
   a folder. The bot's `personal` scope gives each operator a private chat.
5. In Teams, choose **Apps → Manage your apps → Upload an app → Upload a custom
   app**, select the ZIP, then **Add** and **Open**. Your tenant must permit
   custom app uploads; if the option is absent, ask its Teams administrator to
   allow or publish the app for your organization. Find it again by the name
   you set in the manifest, in Apps or your chat list.
6. Return to Lamp's **Chat links** and choose **Create link code**. Open the
   installed app's personal chat in Teams and send `link CODE` exactly as shown
   in Lamp. Use the Teams identity and tenant you intend to link.
7. Choose **Refresh chat links** in Lamp. The Teams entry, with its tenant and
   user identifiers, is the confirmation. Lamp does not send a separate bot
   chat reply for this message; a silent chat alone does not mean it failed.
   If no entry appears, check the installed bot ID, messaging endpoint, Teams
   channel and Worker binding before making a new code.

Provider references: [Azure Bot configuration](https://learn.microsoft.com/en-us/microsoftteams/platform/teams-sdk/teams/azure-configuration),
[app package requirements](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/apps-package)
and [upload a custom app](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/deploy-and-publish/apps-upload).

## Link codes and access

A code expires after ten minutes and works once. Create it only after the
provider app is installed. Use **Hide link code** when finished. If it expires,
create another and send the new command. Each signed-in operator creates their
own code; Lamp never links people by matching email addresses.

**Remove chat link** revokes that identity. Revoking an operator also removes
their chat links. Linked operators retain their Lamp role's permissions.
Drafts stay private; preview and publication are separate actions, attributed
to the linked operator. Publishing sends the update to the status page; it
does not select subscriber notifications.

## Current limits

The command handlers have been exercised with recorded request shapes and
locally signed examples, not a live Slack workspace or Teams tenant. The setup
steps above describe provider registration, not a claim of live-provider
verification. Follow your organization's app approval policy.

Link codes, preview approvals and replay receipts expire after ten minutes.
Before transferring an installation, wait for them to expire. Chat links travel
with the operator records; a restored operator must have active access before
a chat action is accepted.
