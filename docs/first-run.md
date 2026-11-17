# First run and sign-in

After installing Lamp, open your owner entry link. Setup reads your website and lets you choose what to call your page and which time zone to use, with a suggestion from your browser. Search by city to change it. Your page name appears in your workspace, tab and sign-in card; change it in Settings → Page. You can upload a wide logo and a separate optional square icon there, or during setup. Maintenance forms use your chosen local time and link back to that setting. This replaces the previous setup rule that kept the installed time zone without asking. — sd, 2026-11-17.

If your site links to a status page you run on Statuspage, Instatus or Better
Stack, or one that names your site answers at `status.<your domain>`, the card takes that page's own
components and groups from its public feeds instead of guessing them from your
site's menus, and says where they came from. Edit them as one list per group.
**Bring its incident history too**, off unless you choose it, imports the page's
past incidents with their updates and times as resolved history through
[Move in](moving-in.md#from-setup-without-a-key). No one is notified. Subscribers
need the page's API key; move them in later from Settings → Move in.

Lamp reads only public addresses, follows at most five redirects, and runs
nothing from the site. Settings → Page can read the site again later.

Before you share the address, decide whether the page is ready for readers: while
it is not, turn on [Pre-launch](subscribers-and-notifications.md#before-you-launch)
in Settings → Notifications. It hides every subscribe form, refuses subscriptions
and asks search engines to stay away until you turn it off.

## Nothing else to set up

Every change republishes your public page. Lamp checks the page and its
subscribe form after each publish and every minute, and a hosted sender with
your mail provider when it changes and daily. Overview shows one line: where the
page is live, when it was published and checked. It turns amber with the fix
when a check fails. **Review page** opens Settings → Page; your deployment address is
the public address unless you add a custom domain.

A verified sender does not mean a message reached an inbox. Local mail is
silently suppressed.

## Sign in

Operators use email sign-in links. Locally, the development server opens a
private one-click owner entry address. For a deployed installation, request a link from the sign-in page and
open it from the same host.

The hosted owner can also use `rer signin` from the deploying checkout with the
original Cloudflare credentials and environment. It prints a single-use link
without sending email; follow [terminal entry](operators-and-sign-in.md#terminal-entry-for-the-hosted-owner).
Optional OpenID Connect
through Auth, Google, Microsoft or Okta can be linked and enabled by an owner;
email links remain available. SCIM and role synchronization are not supported.
