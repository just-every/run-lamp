# gr-mt-lamp-code-17: social settings CodeQL alert 34

Author: Run Edit Run fleet. Date: 2026-11-17.

Result: **no-change**. The reported `js/xss-through-dom` condition is a false positive for the current default-branch code. No product commit, contract edit, lock change, PR, product push or landing is necessary. This report does not dismiss or change the GitHub alert.

Repository: just-every/run-lamp. Inspected branch: `cloud/gr-mt-lamp-code-17`, created from `origin/main`. Inspected HEAD and fetched main: `4c90e6c8f35775e2a0287ab24ccba87d7a8d8485`. The product checkout is clean. No product READY/PUSHED claim is made; evidence publication is separate custody.

## Plan and completed work

1. Set the fleet identity, refresh the launcher, install the decrypted-bundle Git helper and push guard, and read launcher and repository instructions. Clone only the declared repository with complete commit history. Install the checkout-pinned dependencies and preserve its hooks through the fleet hook installer.
2. Inspect the reported component, its history, API/resource plumbing, error renderer and social repository/service/routes. Trace each untrusted value to its final React context. Query the alert only with the injected bundle credential, with bounded refresh/backoff after rejection.
3. Test actual owner Settings through Chromium and the local Worker. Persist a markup-shaped account name, reload, change the posting default, inject delivery read data and an error at the browser network edge, exercise the three network choices, and remove the account. Assert at 1440 and retain screenshots at 1440 and 390. Use no real provider credential or social request.
4. Run typecheck with Node 22.20.0 / pnpm 10.12.4. Fetch main again, confirm the inspected revision and clean tree, retain actual non-secret evidence and result.json, then publish only the report packet through the evidence ref. Stop the exact server processes started for this run.

## Source-to-render analysis

The supplied item contains no dataflow trace. The integration cannot read the alert API (HTTP 403, Resource not accessible by integration), including after the bounded refresh/backoff sequence. That prevents describing the original SARIF path or remote alert state. The following trace is from current source and exercised behavior, rather than a claimed reproduction of an inaccessible SARIF trace.

| Source | Path | Final context and evidence |
| --- | --- | --- |
| Account name entered in Settings | social-settings.tsx:52 -> JSON POST at :29 -> accountSchema in social/routes.ts:6 -> social/service.ts add -> repository -> GET /api/app/social -> useAppData at :14 | React `<strong>{account.name}</strong>` at :47; name-derived removal message at :36 -> `<p role="status">{message}</p>` at :61. Browser persistence, reload and real removal retained literal markup. |
| Delivery log values from saved names and provider receipts | social/repository.ts:60 returns bound database rows -> service.list -> routes GET JSON -> useAppData -> social-settings.tsx:62 | Each field is a JSX text child; post ID is a React fragment text child, not markup. Seven independent string fields containing an img/onerror payload remained text; the log contained just its existing li and no injected element. |
| API error string | app/client/ui/api.ts:22-28 -> ApiError.message -> component error state at :31/:37/:43 or resource.error | social-settings.tsx:60 -> FormError in app/client/ui/states.tsx:13-14 -> `<span>{children}</span>`. Browser saw the literal payload and no handler execution. |
| Network select DOM value | social-settings.tsx:51, options x/bluesky/mastodon -> network state | Reported line :57 constructs `/docs/social-accounts#${network}`. The fixed prefix keeps it a local documentation link. All three choices retained the expected local href. Its text comes from constant networkNames. |
| Other form values | DOM input.value -> React state -> controlled input value or JSON POST | No text-to-HTML operation. Values remain controlled form properties or JSON, not HTML. |

The full component contains no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML`, `DOMParser`, `createContextualFragment`, `textContent` or `innerText`. The same is true of the traced API, FormError and social service/repository/routes. `source-trace.json` records file SHA-256 values and both commits that ever changed this component (`81969468...` introduced it; `3b430ac6...` replaced setup guidance with the current local link). Both recorded component versions lack these DOM text/HTML APIs. The change at line 57 was documentation guidance, not a removed XSS sink.

This is a reviewed false-positive determination for the inspected default-branch tree, supported by React output contexts and browser behavior. It is not a determination of an unseen older or alternate-branch analysis. A maintainer with code-scanning access can compare the original analysis revision and trace before dismissing alert 34.

## Plan carried out

1. Establish fleet identity and isolated cloud branch from fresh main; read repository instructions.
2. Trace every potentially untrusted social setting value through storage, JSON, React state and the final output context; compare both component versions in history.
3. Probe the real Settings flow with markup-shaped account names, delivery fields, API errors and removal messages. Exercise successful and rejected mutations and verify the three documentation links.
4. Typecheck with pinned tools; retain actual browser receipts and desktop/phone images without owner-entry secrets.
5. Choose the explicit no-change outcome only after source review and browser proof; retain the maintenance result and publish the selected report packet on the evidence ref alone.

## Validation and actual receipts

- `pnpm install --frozen-lockfile`: PASS. Dependency versions stayed locked; no tracked changes.
- `cloud_run npx -y @runeditrun/rer setup --owner-email fleet@runeditrun.com --non-interactive`: PASS. The CLI selected Node 22.20.0, built as part of its setup, migrated the local database and prepared the fleet owner. Private setup output and owner-entry links are excluded from evidence.
- `cloud_run pnpm typecheck`, with the pinned Node directory ahead of PATH: PASS. Actual output is in `typecheck.log`. An earlier run also passed on VM Node 24; the retained final receipt is from Node 22.20.0.
- `cloud_run node .../packet/social-settings-probe.mjs`: PASS on exact HEAD `4c90e6c8f35775e2a0287ab24ccba87d7a8d8485`. Seven grouped behavioral assertions, no page errors, no injected elements or handler execution. Assertions run at 1440; screenshots observe the same screen at 1440 and 390. Actual executable probe and `browser-receipt.json` are retained.
- The browser used `/usr/bin/chromium` with `--no-sandbox` and a fresh in-memory context. The local one-click owner entry remained in memory, without cookie/profile export. The initial harness request omitted its Origin header and the Worker correctly refused it 403; supplying the normal same-origin header made the complete probe pass.
- Account connection, persisted reload, successful default change and removal used actual authenticated Worker routes and local storage. Delivery-log fields and one failing PATCH response used browser network-edge fixtures. No live posting or provider-delivery proof is claimed.
- `git fetch origin main`, `git rev-parse HEAD origin/main`, `git status --porcelain=v1`: exact matching main SHA, clean tree. `git log origin/main..HEAD --format="%an <%ae>%n%cn <%ce>%n%(trailers:only,unfold)"`: empty product candidate range.
- No full local verifier, build-time tests or new CI workflow was run for unchanged product source. CI run IDs: none. Public product publication scan: not applicable because no product tree or ref is published. Evidence files are individually selected through the report-only entrypoint.

## Counts, clauses and remaining work

Product changes before/after: 0/0 files; new product commits 0/0; committed tests added 0/0; clause promotions 0/0. One alert assessed; zero code changes needed on the inspected tree. Remote CodeQL open-alert counts are unknown because API access is refused, and are not represented as a 1-to-0 remote change.

INTEG-002 remains **partial -> partial**. No Status, Gap, Evidence or generated acceptance/claims view was edited. No claim of full clause acceptance is made from this targeted investigation. Existing test registrations and contract summary counts are unchanged.

Product blockers: none under the brief's explicit false-positive/no-change outcome. Limitation: the original alert trace and current remote alert state are inaccessible (HTTP 403). Default: retain current safe React rendering and have an authorized maintainer compare/dismiss the original alert; do not invent a code change or a CodeQL suppression.

Actual maintenance result: `work/maint/gr-mt-lamp-code-17/result.json` (also copied as packet `result.json`). Complete packet: `work/gr-mt-lamp-code-17/packet/`. Product clone remains at the maintenance output path so the fleet can inspect it; there is no unpublished product change to recover.
