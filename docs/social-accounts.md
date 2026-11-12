# Connect social accounts

Open **Settings → Connected tools → Social accounts**. Choose the social
network, enter an **Account name** (your label inside Lamp), and optionally a
**Post prefix**. Get the selected provider's credential below, paste it in the
password field, then choose **Connect social account**. Lamp encrypts the saved
credential and never shows it again. Connecting saves it; it does not prove
that the provider has accepted a post.

Only connect accounts you are allowed to post from. Keep passwords, tokens and
OAuth responses private. Provider account approval, API access, limits and costs
still apply; Lamp does not create a provider account for you.

## X

The field asks for an **X OAuth 2.0 user token (tweet.write)**. An app-only Bearer
Token, API key, client secret or OAuth 1.0 access token will not work. You need
an X developer account and an app with access to create posts.

1. Open the [X Developer Console](https://console.x.com/) and create or select
   your app. In its authentication settings enable **OAuth 2.0**. For the
   one-time flow below choose the public-client app type **Native App** or
   **Single page App**. Register an HTTPS callback URL on a website you control,
   and enter any required website details. Use a callback without analytics or
   query logging; it will receive a short-lived authorization code. Lamp has no
   X OAuth callback, so do not invent a callback endpoint in Lamp.
2. Copy the OAuth 2.0 **Client ID** from **Keys and Tokens**. The flow requests
   `tweet.read users.read tweet.write`; `tweet.write` grants posting. If you
   instead use a confidential **Web App, Automated App or bot**, follow X's
   token guide for its client-secret authentication; the public-client helper
   below is not for that app type.
3. Use your own OAuth client, or save the following Python 3 helper as
   `lamp-x-token.py` on your computer and run `python3 lamp-x-token.py`.
   It generates PKCE and state, prints an authorization URL, and exchanges the
   returned code. It needs no Python packages. Enter the Client ID and the
   **exact** registered callback URL when asked.

```python
import base64
import hashlib
import json
import secrets
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import Request, urlopen

client_id = input("OAuth 2.0 Client ID: ").strip()
redirect_uri = input("Registered HTTPS callback URL: ").strip()
if urlsplit(redirect_uri).scheme != "https":
    raise SystemExit("Use your registered HTTPS callback URL.")
verifier = secrets.token_urlsafe(48)
challenge = base64.urlsafe_b64encode(
    hashlib.sha256(verifier.encode()).digest()
).rstrip(b"=").decode()
state = secrets.token_urlsafe(32)
params = dict(response_type="code", client_id=client_id,
              redirect_uri=redirect_uri, scope="tweet.read users.read tweet.write",
              state=state, code_challenge=challenge, code_challenge_method="S256")
print("Open this URL privately in your browser and approve the intended X account:")
print("https://x.com/i/oauth2/authorize?" + urlencode(params))
returned = input("Paste the full callback URL from your browser address bar: ").strip()
expected, actual = urlsplit(redirect_uri), urlsplit(returned)
if (actual.scheme, actual.netloc, actual.path) != (
    expected.scheme, expected.netloc, expected.path
):
    raise SystemExit("Callback address differs from the registered URL.")
query = parse_qs(actual.query)
if query.get("state") != [state] or len(query.get("code", [])) != 1:
    raise SystemExit("Authorization denied or state/code invalid; start again.")
body = urlencode(dict(grant_type="authorization_code", code=query["code"][0],
                      client_id=client_id, redirect_uri=redirect_uri,
                      code_verifier=verifier)).encode()
request = Request("https://api.x.com/2/oauth2/token", data=body,
                  headers={"Content-Type": "application/x-www-form-urlencoded"})
try:
    with urlopen(request, timeout=30) as response:
        token = json.load(response)
except HTTPError as error:
    raise SystemExit(f"Token exchange refused (HTTP {error.code}); start again.")
print("Paste only this access_token into Lamp; keep it private:")
print(token["access_token"])
print("Expires in seconds:", token.get("expires_in", "see X documentation"))
```

4. Open the authorization URL in a browser signed into the X account that
   should post. Approve the requested permissions. After X redirects, promptly
   copy the full address from the address bar back into the helper. Your
   callback page need not exchange the code itself; even a page error can leave
   the returned address available. Do not share that address or terminal output.
5. Paste only the returned `access_token` into Lamp's X token field. Choose
   **Connect social account**. X access tokens normally expire after two hours.
   Lamp does not store refresh tokens or renew X tokens, even if you request
   `offline.access` using another OAuth client. When a token expires or is
   revoked, use **Remove** on that account and connect again with a fresh user
   token. Remove the old account first to avoid duplicate posts.

Provider references: [OAuth 2.0 authorization code with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
and [obtaining a user access token](https://docs.x.com/fundamentals/authentication/oauth-2-0/user-access-token).
Your X API access and costs apply.

## Bluesky

Bluesky uses an **app password**, not a developer app or an OAuth token here.

1. Sign into the Bluesky account that should post and open
   [App passwords](https://bsky.app/settings/app-passwords). Choose **Add App
   Password**, give it a name such as Lamp, and create and copy the password.
   Lamp does not need direct-message access; leave that permission off.
2. In Lamp choose **Bluesky**. Enter your full **Bluesky handle** without `@`
   (including your custom domain if you use one) and the new **Bluesky app
   password**. Do not use your main account password.
3. Leave **Bluesky service** empty for `https://bsky.social`. If your account
   uses a different personal data server (PDS), enter that server's public
   HTTPS origin, as supplied by your PDS host. `https://bsky.app` is the web
   client, not the service endpoint.
4. Choose **Connect social account**. To stop access, remove the connection in
   Lamp and revoke the named app password in Bluesky's App passwords page.

Provider references: [Bluesky's app-password guidance](https://bsky.social/about/blog/5-19-2023-user-faq)
and [posting through the API](https://docs.bsky.app/docs/advanced-guides/posts).
The app password permits account actions including posting; there is no separate
`tweet.write` scope to select.

## Mastodon

Use a **user access token** on the same Mastodon instance as the posting account.
A developer application is registered on that instance, not on a central
Mastodon developer site.

1. Sign into your account on your own instance. Open **Preferences →
   Development**, or go directly to `/settings/applications` on that instance
   (for example, `https://mastodon.social/settings/applications`). Choose
   **New application** and name it Lamp. These are the standard Mastodon web
   controls; customized instances may label them differently.
2. Keep the personal-token redirect URI `urn:ietf:wg:oauth:2.0:oob`. Under
   **Scopes**, select **write:statuses** for creating posts; clear broader
   permissions you do not need. Submit the application and open its details.
3. Copy **Your access token**, not its client key or client secret. This token
   acts as the signed-in account. If your instance provides only an OAuth
   authorization flow, use the provider's user-authorization guide below with
   `write:statuses`; a client-credentials app token cannot publish user posts.
4. In Lamp choose **Mastodon**, enter the **Mastodon instance** as its public
   HTTPS origin (for example, `https://mastodon.social`), and paste the token
   into **Mastodon access token (write:statuses)**. Choose **Connect social
   account**. The instance and token must belong together.
5. To stop access, remove the account in Lamp and revoke the application's
   access on your Mastodon instance. Reconnect with a new token if it expires
   or is revoked.

Provider references: [register an application](https://docs.joinmastodon.org/client/token/),
[user authorization](https://docs.joinmastodon.org/client/authorized/) and
[the status-posting permission](https://docs.joinmastodon.org/methods/statuses/).

## Choose what gets posted

**Post by default** controls whether new incident updates initially select
**Social accounts**; review that choice on each update before publishing. It
does not send a test post. Expand **Social delivery log**, when present, to see
queued posts and their outcomes. A saved connection is not a provider-delivery
receipt. These guides do not claim a live provider account has been tested.
