# Hostnames and your own domain

Lamp serves the public status page and operator app on two different hostnames.
The app host contains the landing page, sign-in and operator workspace; the
page host serves the public page and its feed and widget.

## Use a custom domain

The zones for both hostnames must be active in the Cloudflare account used for
setup. You can use one zone or separate zones. If another provider currently
hosts DNS, review and import its existing records into Cloudflare, then point
the registrar's nameservers to the nameservers assigned by Cloudflare and wait
for the zone to become active. The registrar can remain elsewhere; DNS authority
must be Cloudflare.

Set `LAMP_PAGE_HOST` and `LAMP_APP_HOST` in the private deployment inputs, using
distinct names, then follow [Deploy Lamp](deploy.md). Cloudflare provisions the
Worker custom domains and TLS certificates. After deployment, open the public
page and check `/health` on the app host.

For `workers.dev` hostnames, see the [deployment
reference's hostname lookup and examples](deployment-reference.md#find-your-workersdev-hostnames).
Both hostname inputs are still required and must match the Worker names under
the registered account subdomain. You do not need custom DNS for this mode.

## A page host whose DNS is in another Cloudflare account or elsewhere

Use this when the public page must stay on a name whose DNS zone you cannot move, such as
`status.example.org` in a zone another Cloudflare account (or another DNS provider) controls. The page host
is served through [Cloudflare for SaaS](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/):
a **provider zone** in the Cloudflare account Lamp deploys to (here `lamp-provider.test`) accepts the page host as
a custom hostname, and Lamp attaches the page host to the Worker as a Worker route on that zone instead of a
custom domain. Cloudflare does not allow a custom domain on a zone you do not own, which is why the default
setup stops with "Could not find zone" for such a name. The app host stays a custom domain in the deploy account.

1. **Enable Cloudflare for SaaS** on the provider zone (SSL/TLS, Custom Hostnames). Cloudflare may ask for
   billing details.
2. **Make a fallback origin.** Create a proxied record on the provider zone that exists only to be the target,
   for example `domains.lamp-provider.test` as `AAAA 100::` with the proxy on, then set that name as the zone's
   **fallback origin** (Custom Hostnames, Fallback Origin). Wait until it reports active.
3. **Add the page host as a custom hostname** (`status.example.org`) with TXT certificate validation and TLS 1.2
   or later. Cloudflare returns a TXT name and value for the certificate.
4. **Publish the owner's records.** In the page host's own DNS zone, the owner adds the TXT record from step 3
   (`_acme-challenge.status`). Wait until the certificate reports **active**. This changes nothing visitors see.
5. **Check CAA.** If the page host's zone has CAA records, they must allow the certificate authorities Cloudflare
   for SaaS issues from: Let's Encrypt (`letsencrypt.org`), Google Trust Services (`pki.goog`) and SSL.com
   (`ssl.com`). Add any that are missing. Without a CAA record nothing needs to change.
6. **Set the two settings** in the private deployment inputs, next to `LAMP_PAGE_HOST` (here `status.example.org`):

   ```
   LAMP_PAGE_HOST_ROUTE_ZONE=lamp-provider.test
   LAMP_PAGE_HOST_TARGET=domains.lamp-provider.test
   ```

   Both must be set together, with `LAMP_HOSTING` absent or `custom-domain`. The route zone and target must be
   bare lowercase hostnames, the target must be the zone or a name under it, and the page host must be outside
   the zone. Run `rer deploy`. The deploy attaches `status.example.org/*` as a Worker route on the provider
   zone. While the page host's DNS still points somewhere else, the deploy logs
   `Page host status.example.org does not point at domains.lamp-provider.test yet: skipped.` and completes; it
   ends with `Sign in at https://<LAMP_APP_HOST> (page host status.example.org does not point at
   domains.lamp-provider.test yet).`
7. **Switch the page host's DNS** to a **DNS-only** CNAME (grey cloud, not proxied) from `status.example.org` to
   `domains.lamp-provider.test`. Lamp serves the page as soon as the certificate is active and the record is
   published. To go back, point the record at its previous service.
8. **Deploy again.** Once the page host's CNAME chain contains the target (or its addresses equal the target's),
   the deploy checks the page like any other: it must answer with the retained snapshot or the deploy fails.

Every deploy also stores `LAMP_PAGE_HOST` as the page's hostname, so the public API's page hostname and the
theme's origin follow the name in the route. Leave both settings out for the ordinary case: they exist only for
a page host in a zone outside the deploy account.
