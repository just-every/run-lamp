# R5 source evidence

Source at ccc4f7a2f1c18223078b2f5e03440fd413d1575d. No account data read.

### src/core/shared/schemas.ts:22

```text
22: export const pageSettingsSchema = z.object({
23:   pageName: nonEmptyText(120),
24:   tagline: nonEmptyText(280),
25:   accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "accentColor must be a six-digit hex colour"),
26:   timezone: nonEmptyText(100),
27:   hostname: nonEmptyText(253),
28:   footerCreditEnabled: z.boolean(),
29:   theme: themeSchema.optional(),
30:   template: z.enum(["default", "calm", "uptime", "regions"]).optional(),
31:   widgetAllowedOrigins: z.array(widgetOriginSchema).max(100).optional(),
```

### src/core/features/page-settings/routes.ts:29

```text
29:     const settings = await service.get();
30:     return settings ? context.json({ settings }) : context.json({ error: "Page settings are not configured." }, 404);
31:   });
32: 
33:   app.put("/api/app/page-settings", async (context) => {
34:     const parsed = pageSettingsSchema.safeParse(await context.req.json().catch(() => null));
35:     if (!parsed.success) return context.json({ error: "Invalid page settings.", issues: parsed.error.issues }, 400);
36: 
37:     if (parsed.data.theme && !["owner", "admin"].includes(context.get("operatorSession").operator.role)) {
38:       const current = await service.get();
39:       if (JSON.stringify(parsed.data.theme) !== JSON.stringify(current?.theme)) return context.json({ error: "Only a page owner or admin can change its theme." }, 403);
40:     }
41:     try {
42:       const settings = await service.update(parsed.data);
43:       return settings ? context.json({ settings }) : context.json({ error: "Page settings are not configured." }, 404);
44:     } catch (cause) {
45:       if (cause instanceof ThemeValidationError || cause instanceof UnsupportedMailIdentityError || cause instanceof UnavailablePageTemplateError) return context.json({ error: cause.message }, 400);
46:       throw cause;
```

### src/core/features/page-settings/service.ts:84

```text
84:       const timestamp = nowIso();
85:       const mailFromAddress = settings.mailFromAddress ?? initialMailFromAddress;
86:       if (!mailFromAddress) throw new Error("Lamp requires MAIL_FROM_ADDRESS to initialize the email sender setting.");
87:       await repository.insertIfMissing({
88:         id: "default",
89:         ...settings,
90:         theme: JSON.stringify(validatePageTheme(settings.theme ?? {}, { origin: `https://${settings.hostname}`, imagePaths: [] }).theme),
91:         template: settings.template ?? "default",
92:         emailBranding: JSON.stringify(settings.emailBranding ?? {}),
```

### src/core/features/page-settings/service.ts:104

```text
104:     async update(settings) {
105:       const existing = await readRequired();
106:       const assets = JSON.parse(existing.themeAssets) as { header?: unknown; font?: unknown };
107:       const checkedTheme = settings.theme ? validatePageTheme(settings.theme, {
108:         origin: `https://${settings.hostname}`,
109:         imagePaths: [...(assets.header ? ["/assets/theme-header"] : []), ...(existing.logoKey ? ["/assets/logo"] : [])],
110:       }) : null;
111:       if (checkedTheme?.theme.headerImage && !assets.header) throw new ThemeValidationError("Header image", "Upload a header image before showing it.");
112:       if (checkedTheme?.theme.font === "uploaded" && !assets.font) throw new ThemeValidationError("Font", "Upload a WOFF2 font before selecting it.");
113:       const template = settings.template ?? existing.template;
114:       // Choosing Regions map needs two regions. A page that already chose it keeps that choice while regions change;
115:       // the public page then shows Calm headline and Settings says why.
116:       if (template === "regions" && existing.template !== "regions" && !await regionsAvailable()) throw new UnavailablePageTemplateError("Regions map needs public components in at least two regions. Add regions in the component editor, or choose another template.");
117:       if (!mailIdentityEditable && (settings.emailBranding?.displayName || settings.emailBranding?.replyTo)) throw new UnsupportedMailIdentityError("Managed mail controls From and Reply-To. Clear those fields; subject, logo and message wording remain editable.");
118:       await repository.update({
119:         theme: checkedTheme ? JSON.stringify(checkedTheme.theme) : existing.theme,
120:         pageName: settings.pageName,
121:         tagline: settings.tagline,
122:         accentColor: settings.accentColor,
123:         timezone: settings.timezone,
124:         hostname: settings.hostname,
125:         footerCreditEnabled: settings.footerCreditEnabled,
126:         template,
```

### src/core/features/page-settings/ui/settings-form.ts:10

```text
10: export function toSettingsForm(settings: PageSettingsView): SettingsForm {
11:   return {
12:     pageName: settings.pageName, template: settings.template, tagline: settings.tagline,
13:     accentColor: settings.accentColor, timezone: settings.timezone, hostname: settings.hostname,
14:     footerCreditEnabled: settings.footerCreditEnabled, widgetAllowedOrigins: settings.widgetAllowedOrigins,
15:     widgetAppearance: settings.widgetAppearance, mailFromAddress: settings.mailFromAddress, emailBranding: settings.emailBranding,
16:     aiToneInstructions: settings.aiToneInstructions, wordingBlockedTerms: settings.wordingBlockedTerms,
17:     wordingFriendlyLength: settings.wordingFriendlyLength,
18:     theme: settings.theme,
```

### src/core/features/page-settings/ui/page-settings-tab.tsx:7

```text
7: 
8: /** Settings › Page under Lamp's drawing of it: where the page lives, then its name, tagline and time zone. */
9: export function PageSettingsTab({ settings, live, markSrc, update }: {
10:   settings: SettingsForm; live: LiveStatus | null; markSrc: string;
11:   update: <K extends keyof SettingsForm>(field: K, value: SettingsForm[K], immediate?: boolean) => void;
12: }) {
13:   const timezones = zones();
14:   return <>
15:     <PageHero live={live} markSrc={markSrc} />
16:     <section className="data-card page-card" aria-labelledby="page-card-title">
17:       <p className="card-kicker" id="page-card-title">Page</p>
18:       <label className="form-label">Page name<input required maxLength={120} value={settings.pageName} onChange={event => update("pageName", event.target.value)} /></label>
19:       <label className="form-label">Tagline<textarea required maxLength={280} value={settings.tagline} onChange={event => update("tagline", event.target.value)} /></label>
20:       <label className="form-label">Time zone{timezones.length ? <select value={settings.timezone} onChange={event => update("timezone", event.target.value, true)}>{(timezones.includes(settings.timezone) ? timezones : [settings.timezone, ...timezones]).map(zone => <option key={zone} value={zone}>{zone}</option>)}</select> : <input required maxLength={100} value={settings.timezone} onChange={event => update("timezone", event.target.value)} />}</label>
21:     </section>
22:     <ClientExtensionSlot id="settings.sections.v1" context={{}} />
23:   </>;
24: }
```

### src/core/features/page-settings/ui/page-hero.tsx:10

```text
10:   const origin = live?.publicOrigin ?? null;
11:   const problem = live && [live.page, live.subscribe].find((check) => check && !check.ok)?.reason;
12:   return <section className="data-card page-hero" id="public-address" aria-labelledby="page-hero-address">
13:     <img className="page-hero-mark" src={markSrc} alt="" width={84} height={84} />
14:     <div className="page-hero-facts">
15:       <p className="card-kicker">Your status page</p>
16:       {origin ? <a id="page-hero-address" className="page-hero-address" href={`${origin}/`} target="_blank" rel="noopener">{new URL(origin).host}<Icon name="external" width={18} height={18} /></a> : <p id="page-hero-address" className="page-hero-address">Loading address…</p>}
17:       <p className={`page-hero-live${problem ? " is-failing" : ""}`}><span className="live-dot" />{problem ?? (live?.publishedAt ? `Live · last published ${relativeTime(live.publishedAt)}. Changes publish automatically.` : "Publishing…")}</p>
18:       {origin && isLocal(origin) ? <p className="page-hero-note">This address works only on this computer. <a className="text-link" href="/docs/deploy">Deploy Lamp</a> to give customers a public one.</p> : null}
19:       <a className="text-link" href="/docs/domains">Use a custom domain</a>
20:     </div>
21:   </section>;
22: }
```

### scripts/ops-config.mjs:299

```text
299: 
300: export function setupPageSettingsStatement(config, now = new Date().toISOString(), ownerJustCreated = false) {
301:   const condition = ownerJustCreated ? "changes() = 1" : "NOT EXISTS (SELECT 1 FROM page_settings WHERE id = 'default')";
302:   const conflict = ownerJustCreated ? " ON CONFLICT(id) DO UPDATE SET page_name=excluded.page_name,tagline=excluded.tagline,accent_color=excluded.accent_color,timezone=excluded.timezone,hostname=excluded.hostname,mail_from_address=excluded.mail_from_address,feed_id=CASE WHEN page_settings.feed_id = 'pending-feed-identity' OR page_settings.feed_id = '' THEN excluded.feed_id ELSE page_settings.feed_id END,updated_at=excluded.updated_at" : "";
303:   return `INSERT INTO page_settings (id, page_name, tagline, accent_color, timezone, hostname, feed_id, footer_credit_enabled, widget_allowed_origins, mail_from_address, created_at, updated_at) SELECT 'default', ${sqlLiteral(config.pageName)}, ${sqlLiteral(config.pageTagline)}, ${sqlLiteral(config.pageAccentColor)}, ${sqlLiteral(config.pageTimezone)}, ${sqlLiteral(config.pageHost)}, lower(hex(randomblob(16))), 1, '[]', ${sqlLiteral(config.mailFromAddress)}, ${sqlLiteral(now)}, ${sqlLiteral(now)} WHERE ${condition}${conflict};`;
304: }
```

### scripts/setup.mjs:77

```text
77:   }
78:   wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", "wrangler.toml"]);
79:   // An apply that exits cleanly is not proof that it finished: read the ledger back and compare it with the shipped list.
80:   assertMigrationsApplied(shippedMigrations(), ledgerNames(wrangler(["d1", "execute", "DB", "--remote", "--json", "--config", "wrangler.toml", "--command", coreLedgerQuery])));
81:   await applyOwnerMigrations("wrangler.toml", ["--remote"]);
82:   wrangler(["d1", "execute", "DB", "--remote", "--config", "wrangler.toml", "--command", `${setupPageSettingsStatement(config)}`]);
83:   if (!existsSync("wrangler.toml")) throw new Error("Setup did not generate wrangler.toml.");
84:   console.log(`Provisioned ${names.worker}; migrations and page settings are initialized.`);
```

### docs/public-page.md:7

```text
7: ## Set branding and widget access
8: 
9: In **Settings**, edit the page name, tagline, hostname, accent color, time zone
10: and footer credit. Upload a logo or remove it; Lamp serves the logo from its own
11: origin and generates the status favicon and social image. List the full origins
12: where you embed the widget. The widget refuses requests from other host origins.
```
