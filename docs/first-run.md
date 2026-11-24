# First run and sign-in

After installing Lamp, open your owner entry link. Setup reads your website and lets you choose what to call your page and which time zone to use. It keeps your saved time zone, with a suggestion from your browser only when the saved zone is invalid. Search by city to change it. Your page name appears in your workspace, tab and sign-in card; change it in Settings → Page. You can upload a wide logo and a separate optional square icon there, or during setup. Maintenance forms use your chosen local time and link back to that setting. — sd, 2026-11-17.

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

The first-run card has two ways in. **Read website** fills the card from your
site. **Skip, I'll fill it in** (shown only before a website has been read or skipped) opens the
same card empty: fill in the page name, tagline, accent colour and components.
Either way, finish with the button at the bottom: **Open Lamp** after Skip, and
**Looks right, open Lamp** after a website was read.

Before you share the address, decide whether the page is ready for readers: while
it is not, turn on [Pre-launch](subscribers-and-notifications.md#before-you-launch)
in Settings → Notifications. It hides every subscribe form, refuses subscriptions
and asks search engines to stay away until you turn it off.

## Set-up order and first check

The public page shows the company's components, so set Lamp up after the tools
whose components it shows, and keep one component for each of them. Lamp does not
probe services: a component's state comes from an operator or from a monitoring
tool you connect in Settings → Connected tools
([alerts](alerts-from-monitoring-tools.md)), which you can do once Lamp is up.

Lamp's first check is the page itself. Open the public page address in a
signed-out window: it shows the overall status and a Components section with
every component you did not hide. A page with no visible components has no
Components section at all, so a missing section means no component is visible.

## Nothing else to set up

**Open Lamp** keeps setup open while Lamp publishes your components. If a
component fails, Lamp names it and lets you retry from the same draft.
Setup agents can poll `GET /setup/state` until `state` is `claimed`.
Lamp records that state after the public snapshot includes the setup changes.

Every change republishes your public page. Lamp checks the page and its
subscribe form after each publish and every minute, and a hosted sender with
your mail provider when it changes and daily. Overview shows one line: where the
page is live, when it was published and checked. It turns amber with the fix
when a check fails. **Review page** opens Settings → Page; your deployment address is
the public address unless you add a custom domain.

A verified sender does not mean a message reached an inbox. Local mail is
silently suppressed.

## Sign in

Operators use email sign-in links when email is enabled. For a deployed
installation, request a link from the sign-in page and open it from the same
host. Locally, `rer dev` prints a private one-click owner entry address on the
`RER_OPEN` line of its terminal output.

The hosted owner can also use `rer signin` from the deploying checkout with the
original Cloudflare credentials and environment. It prints a single-use link
without sending email; follow [terminal entry](operators-and-sign-in.md#terminal-entry-for-the-hosted-owner).
When an agent sets up a hosted Lamp through Run Edit Run Business, it takes the
first-owner HTTPS link from the `rer signin` terminal output and passes it only
as `tools[i].sign_in` in `session.report`. Keep the link out of chat and files.
Optional OpenID Connect
through Auth, Google, Microsoft or Okta can be linked and enabled by an owner;
email links remain available. SCIM and role synchronization are not supported.
