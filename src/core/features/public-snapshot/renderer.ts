import { statusPagePrefix } from "../page-settings/page-selection";
import { componentStateLabel } from "../../shared/component-state-label";
import { themeSchema } from "../../shared/page-theme";
import { themeChrome } from "./theme-rendering";
import { publicMetricsSection } from "../metrics/public-chart";
import { renderMaintenanceCalendar } from "./maintenance-calendar";
import { subscriptionMarkup } from "./subscription-markup";
import { PRELAUNCH_ROBOTS_KEY, PRELAUNCH_ROBOTS_TXT } from "../prelaunch/policy";
import { incidentFollowMarkup } from "../subscribers/incident-follow-markup";
import { publicMasthead } from "./page-chrome";
import { effectiveTemplate, renderTemplatePage, templateArtifacts } from "./templates/index";
import { publicUpdate } from "./public-update";
import { incidentImpact } from "../../shared/incident-impact";
import { reportMarkup } from "./report-markup";
import { historyMonths, renderHistoryContent } from "./history";
import { isPublicComponentShown } from "./component-visibility";
import { renderImportAliases } from "./import-aliases";
import { mostSevereState, type ComponentState } from "../../shared/domain";
import type { LampServerSlots } from "../../api/extensions";
import { groupComponentsByHeading } from "../../shared/component-order";

import type { PublicSnapshotSource } from "./repository";
import { publicPageScript, publicPageStyles } from "./assets";
import { publicIcon } from "./icons";
import { defaultPublicSnapshotPolicies, type PublicSnapshotPolicies } from "./policies";
import { renderBrandSvg } from "./branding";
import { statusPayload, updateSummary } from "./feed-widget";
import { renderWidget } from "./widget";
import { renderFeeds } from "./feeds";
import { renderBadges } from "./badges";
import { renderPublicApi } from "./public-api";
import { publicComponentResources } from "./component-address";
import { incidentMarkup, maintenanceMarkup, resolvedMarkup, statePill, type PublicIncident, type PublicMaintenance } from "./record-markup";
import { DAY, REPORTING_DAYS, durationText, escapeHtml, stateClass, timestamp, timestampDetails, timezoneLabel } from "./format";
import { computeUptime, reportingDays, type Uptime, uptimeMarkup } from "./uptime";
import { uptimeMethod } from "./uptime-method";
import { computeReliability } from "./reliability";
import { reliabilityMarkup, reliabilityMethod } from "./reliability-markup";

export interface SnapshotArtifact {
  key: string;
  body: string;
  contentType: string;
  encoding?: "base64";
}

export interface RenderedSnapshot {
  generatedAt: string;
  artifacts: SnapshotArtifact[];
}

interface PublicComponent {
  id: string;
  name: string;
  description: string;
  region?: string | null;
  onlyShowIfDegraded?: boolean;
  uptimeStartDate?: string | null;
  note: string;
  hideUptime?: boolean;
  groupId: string | null;
  groupName: string | null;
  groupOrder: number | null;
  displayOrder: number;
  state: ComponentState;
  uptime: Uptime;
}

function toPublicModel(source: PublicSnapshotSource, generatedAt: string, policies: PublicSnapshotPolicies, includeUptime = true) {
  const theme = themeSchema.parse(JSON.parse(source.settings.theme ?? "{}"));
  const claims = new Map<string, ComponentState[]>();
  for (const claim of source.claims) claims.set(claim.componentId, [...(claims.get(claim.componentId) ?? []), claim.state]);
  const now = new Date(generatedAt).getTime();
  const windowStart = now - theme.historyDays * DAY;
  const uptimeWindow = theme.historyDays === REPORTING_DAYS ? undefined : { startsAt: windowStart, endsAt: now };
  const calendar = includeUptime ? reportingDays(windowStart, uptimeWindow ? now - 1 : now, source.settings.timezone) : undefined;
  const components: PublicComponent[] = source.components.map((component) => ({
    ...component,
    // COMP-006 fixes individual component derivation. The rollup policy is
    // deliberately only for the single overall page status.
    state: mostSevereState(claims.get(component.id) ?? []),
    hideUptime: theme.hiddenUptimeComponentIds.includes(component.id),
    uptime: includeUptime ? computeUptime(source, component.id, now, source.settings.timezone, policies, component.uptimeStartDate, uptimeWindow, calendar) : { percentage: null, trackingSince: null, coverageDays: 0, coverageMinutes: 0, marks: [] },
  }));
  if (theme.historyDays !== REPORTING_DAYS) for (const component of components) component.uptime.marks = component.uptime.marks.slice(-theme.historyDays);
  const visibleComponents = components.filter(isPublicComponentShown);
  const reliability = includeUptime
    ? computeReliability(source.reliabilityHistory ?? {}, source.components, now, source.settings.timezone, policies)
    : { components: new Map(), groups: new Map() };
  const hiddenIds = new Set(components.filter(component => !isPublicComponentShown(component)).map(component => component.id));
  const attachedIncidentIds = new Set(source.incidentComponents.map(component => component.incidentId));
  const attachedMaintenanceIds = new Set(source.maintenanceComponents.map(component => component.maintenanceId));
  const attachedByIncident = new Map<string, string[]>();
  for (const component of source.incidentComponents.filter(component => !component.componentId || !hiddenIds.has(component.componentId))) attachedByIncident.set(component.incidentId, [...(attachedByIncident.get(component.incidentId) ?? []), component.componentName]);
  const updatesByIncident = new Map<string, PublicIncident["updates"]>();
  for (const update of source.updates) updatesByIncident.set(update.incidentId, [...(updatesByIncident.get(update.incidentId) ?? []), publicUpdate(source, update)]);
  const reportsByIncident = new Map(source.reports.map((report) => [report.incidentId, report]));
  const incidents: PublicIncident[] = source.incidents.map((incident) => ({
    ...incident,
    ...incidentImpact(source.incidentImpacts?.[incident.id], incident.impactOverride, source.incidentComponents.filter(component => component.incidentId === incident.id).map(component => component.state)),
    components: attachedByIncident.get(incident.id) ?? [],
    updates: updatesByIncident.get(incident.id) ?? [],
    report: reportsByIncident.get(incident.id) ?? null,
  })).filter((incident) => incident.updates.length > 0 && (source.protectedPage || attachedIncidentIds.has(incident.id)));
  const attachedByMaintenance = new Map<string, string[]>();
  for (const component of source.maintenanceComponents.filter(component => !component.componentId || !hiddenIds.has(component.componentId))) attachedByMaintenance.set(component.maintenanceId, [...(attachedByMaintenance.get(component.maintenanceId) ?? []), component.componentName]);
  const noticesByMaintenance = new Map<string, PublicMaintenance["notices"]>();
  for (const notice of source.maintenanceNotices) noticesByMaintenance.set(notice.maintenanceId, [...(noticesByMaintenance.get(notice.maintenanceId) ?? []), notice]);
  const maintenance = source.maintenance
    .map((item) => ({ ...item, components: attachedByMaintenance.get(item.id) ?? [], notices: noticesByMaintenance.get(item.id) ?? [], importedUpdates: (source.importedMaintenanceUpdates ?? []).filter(update => update.maintenanceId === item.id) }))
    .filter((item) => source.protectedPage || attachedMaintenanceIds.has(item.id)) satisfies PublicMaintenance[];
  return { bounded: source.bounded, archive: source.archive, theme, prelaunch: source.prelaunch === true, subscriptionChannels: source.subscriptionChannels, incidentIncludeReport: source.incidentIncludeReport === true, metrics: source.metrics ?? [], websiteUrl: source.websiteUrl, origin: source.publicOrigin ?? `https://${source.settings.hostname}`, settings: source.settings, components, visibleComponents, reliability, incidents, maintenance, generatedAt, policies, overall: policies.pageStatusRollup([...components.map((component) => component.state), ...(source.dependencies ?? []).filter(row => row.mode === "rollup" && row.state !== null).map(row => row.state!)]) };
}

export type PublicSnapshotModel = ReturnType<typeof toPublicModel>;

type GeneralPublicSlot = Exclude<keyof LampServerSlots, "status-page.incident.after.v1">;

function slotContext(model: ReturnType<typeof toPublicModel>) {
  return { pageName: model.settings.pageName, hostname: model.settings.hostname, overall: model.overall };
}

function slotMarkup(slots: LampServerSlots, id: GeneralPublicSlot, model: ReturnType<typeof toPublicModel>) {
  const markup = slots[id]?.(slotContext(model));
  if (markup !== undefined && typeof markup !== "string") throw new Error(`Lamp public extension slot ${id} must return HTML text.`);
  return markup ?? "";
}

function incidentSlotMarkup(slots: LampServerSlots, incident: PublicIncident, model: ReturnType<typeof toPublicModel>) {
  const markup = slots["status-page.incident.after.v1"]?.({ ...slotContext(model), incident: { id: incident.id, reference: incident.reference, title: incident.title, lifecycle: incident.lifecycle } });
  if (markup !== undefined && typeof markup !== "string") throw new Error("Lamp public extension slot status-page.incident.after.v1 must return HTML text.");
  return markup ?? "";
}

function footerResources(model: PublicSnapshotModel) {
  const components = model.visibleComponents.map(component => {
    const resources = publicComponentResources(component);
    return `<li>${escapeHtml(component.name)}: <a href="${resources.atom}">Atom</a> · <a href="${resources.rss}">RSS</a> · <a href="${resources.badge}">Status badge</a> · <a href="${resources.uptime}">Uptime badge</a></li>`;
  }).join("");
  return `<details class="footer-resources"><summary>Feeds and badges</summary><p><a href="/feed.atom">Atom feed</a> · <a href="/feed.rss">RSS feed</a> · <a href="/maintenance.ics">Maintenance calendar</a> · <a data-lamp-vpat href="/docs/accessibility/vpat">Accessibility (VPAT)</a> · <a href="/badge.svg">Status badge</a></p>${components ? `<ul>${components}</ul>` : ""}</details>`;
}

function pageShell(title: string, body: string, model: ReturnType<typeof toPublicModel>, slots: LampServerSlots, current: "root" | "history" | "other") {
  const { settings, overall } = model;
  const publicOrigin = model.origin;
  const masthead = publicMasthead(settings.pageName, current === "root" ? "status" : current === "history" ? "history" : undefined, settings.tagline, !model.prelaunch, Boolean(settings.logoKey));
  const website = model.websiteUrl ? new URL(model.websiteUrl) : null;
  const websiteLink = website ? `<a href="${escapeHtml(website.href)}">← ${escapeHtml(website.hostname)}</a>` : "";
  const meta = `<p class="page-meta">${websiteLink}<span class="host" data-timezone-label data-timezone="${escapeHtml(settings.timezone)}" data-zone-name="${escapeHtml(timezoneLabel(settings.timezone))}">Times shown in ${escapeHtml(timezoneLabel(settings.timezone))}</span></p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="${escapeHtml(settings.tagline)}"><meta property="og:title" content="${escapeHtml(`${settings.pageName}: ${componentStateLabel(overall)}`)}"><meta property="og:image" content="${escapeHtml(`${publicOrigin}/assets/og.svg`)}"><meta property="og:image:alt" content="${escapeHtml(`${settings.pageName}: ${componentStateLabel(overall)}`)}"><title>${escapeHtml(title)}</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/status-page.css"></head><body class="lamp-public"><main class="page${current === "root" ? " root-page" : ""}">${themeChrome(model.theme, "header")}${masthead}${slotMarkup(slots, "status-page.header.after.v1", model)}${body}${meta}<footer>${themeChrome(model.theme, "footer")}${slotMarkup(slots, "status-page.footer.before.v1", model)}${footerResources(model)}<a data-lamp-signin href="/signin">Sign in</a>${settings.footerCreditEnabled ? " · Powered by Lamp" : ""}</footer></main><script src="/assets/status-page.js" defer></script></body></html>`;
}

function componentMarkup(component: PublicComponent & { hideUptime?: boolean }, model: PublicSnapshotModel) {
  const { timezone } = model.settings;
  return `<article class="component"><div class="component-name"><h4>${escapeHtml(component.name)}</h4>${statePill(component.state, "component-state", componentStateLabel(component.state))}${component.description ? `<details class="component-description"><summary>About ${escapeHtml(component.name)}</summary><p>${escapeHtml(component.description)}</p></details>` : ""}${component.note ? `<p class="component-note">${escapeHtml(component.note)}</p>` : ""}</div><div class="component-status">${uptimeMarkup(component, timezone, model.generatedAt)}${reliabilityMarkup(model.reliability.components.get(component.id), component.name, timezone)}</div></article>`;
}

function componentHealthMarkup(model: ReturnType<typeof toPublicModel>) {
  const { visibleComponents: components, settings } = model;
  // One section per group in the shared component order. Ungrouped components
  // take the shared heading only beside named groups; a page without groups
  // lists its components with no invented heading.
  const named = components.some((component) => component.groupName !== null);
  const charts = groupComponentsByHeading(components).map(([heading, values]) => {
    const rows = values.map((component) => componentMarkup(component, model)).join("");
    const groupId = values[0]?.groupId ?? null;
    const group = groupId ? reliabilityMarkup(model.reliability.groups.get(groupId), `the ${heading} group`, settings.timezone, "group-reliability") : "";
    return !named
      ? `<div class="component-group">${rows}</div>`
      : model.theme.groupsCollapsed ? `<details class="component-group"><summary>${escapeHtml(heading)}</summary>${group}${rows}</details>` : `<section class="component-group">${group ? `<div class="group-head"><h3>${escapeHtml(heading)}</h3>${group}</div>` : `<h3>${escapeHtml(heading)}</h3>`}${rows}</section>`;
  }).join("");
  // A page with no visible components has no components section at all.
  if (!charts) return "";
  const starts = components.flatMap(component => component.uptime.trackingSince ? [component.uptime.trackingSince] : []).sort();
  const since = starts[0] ? `<p class="availability-since">History since ${timestamp(starts[0], settings.timezone)}.</p>` : "";
  const method = `<p>Availability days use ${escapeHtml(settings.timezone)}. ${escapeHtml(uptimeMethod(model.theme.historyDays, model.policies))} ${escapeHtml(reliabilityMethod)}</p>`;
  return `<section class="component-health" aria-labelledby="components-title"><header class="section-heading"><h2 id="components-title">Components</h2><p>Uptime over the last ${model.theme.historyDays} days</p></header><div class="availability-charts">${charts}</div>${since}<div class="availability-foot"><aside class="availability-legend" aria-label="Availability legend"><span><i class="legend-good"></i>Available</span><span><i class="legend-degraded"></i>Degraded</span><span><i class="legend-downtime"></i>Downtime</span><span><i class="legend-no-data"></i>No data</span></aside><details class="availability-method"><summary>How availability is calculated</summary>${method}</details></div></section>`;
}

function timelineEntry(kind: "incident" | "maintenance" | "resolved", body: string) {
  return `<div class="timeline-entry timeline-${kind}">${body}</div>`;
}

// What is open or in progress now sits directly under the status plate; planned and
// recently resolved records follow the components. With nothing active the page keeps
// one "Incidents and maintenance" section after the components. A section with no
// entries is left out entirely, heading included.
function timelineMarkup(model: ReturnType<typeof toPublicModel>, slots: LampServerSlots) {
  const { incidents, maintenance, settings, generatedAt } = model;
  const newestFirst = (left: string, right: string) => right.localeCompare(left);
  const activeMaintenance = maintenance.filter((item) => item.state === "In progress").sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const upcomingMaintenance = maintenance.filter((item) => item.state === "Scheduled" && new Date(item.startsAt).getTime() <= new Date(generatedAt).getTime() + 14 * DAY).sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const unresolved = incidents.filter((incident) => incident.lifecycle !== "Resolved").sort((left, right) => newestFirst(left.updates[0]?.publishedAt ?? left.openedAt, right.updates[0]?.publishedAt ?? right.openedAt));
  const recentResolved = incidents.filter((incident) => incident.lifecycle === "Resolved" && incident.resolvedAt && Date.parse(incident.resolvedAt) >= Date.parse(generatedAt) - model.theme.historyDays * DAY).sort((left, right) => newestFirst(left.resolvedAt ?? "", right.resolvedAt ?? "")).slice(0, 6);
  const now = [
    ...unresolved.map((incident) => timelineEntry("incident", `${incidentMarkup(incident, settings.timezone, 5, "Current incident", "h4")}${incidentSlotMarkup(slots, incident, model)}`)),
    ...activeMaintenance.map((item) => timelineEntry("maintenance", maintenanceMarkup(item, settings.timezone, generatedAt))),
  ].join("");
  const upcoming = upcomingMaintenance.map((item) => timelineEntry("maintenance", maintenanceMarkup(item, settings.timezone, generatedAt))).join("");
  const resolved = recentResolved.map((incident) => timelineEntry("resolved", resolvedMarkup(incident, settings.timezone))).join("");
  const resolvedGroup = resolved ? `<div class="timeline-group"><h3>Recently resolved</h3><div class="resolved-list">${resolved}</div></div>` : "";
  if (now) {
    const active = `<section id="incidents" class="history-timeline" aria-labelledby="active-title"><header class="section-heading"><h2 id="active-title">Happening now</h2></header><div class="timeline-group">${now}</div></section>`;
    const rest = [upcoming ? `<div class="timeline-group"><h3>Upcoming</h3>${upcoming}</div>` : "", resolvedGroup].join("");
    return { active, rest: rest ? `<section id="earlier" class="history-timeline" aria-labelledby="timeline-title"><header class="section-heading"><h2 id="timeline-title">Incidents and maintenance</h2></header>${rest}</section>` : "" };
  }
  const groups = [
    upcoming ? `<div class="timeline-group"><h3>Now and upcoming</h3>${upcoming}</div>` : "",
    resolvedGroup,
  ].join("");
  if (!groups) return { active: "", rest: "" };
  return { active: "", rest: `<section id="incidents" class="history-timeline" aria-labelledby="timeline-title"><header class="section-heading"><h2 id="timeline-title">Incidents and maintenance</h2></header>${groups}</section>` };
}

function renderPage(model: ReturnType<typeof toPublicModel>, slots: LampServerSlots) {
  const template = effectiveTemplate(model);
  if (template !== "default") return renderTemplatePage(template, model, {
    slot: (id) => slotMarkup(slots, id, model),
    incidentSlot: (incident) => incidentSlotMarkup(slots, incident, model),
    footerResources: footerResources(model),
    otherSubscriptions: subscriptionMarkup(model, false),
  });
  const { settings, incidents, overall, generatedAt } = model;
  const newest = incidents.filter((incident) => incident.lifecycle !== "Resolved").flatMap((incident) => incident.updates.map((update) => ({ incident, update }))).sort((left, right) => right.update.publishedAt.localeCompare(left.update.publishedAt))[0];
  const statusIcon = overall === "Operational" ? "check" : overall === "Under maintenance" ? "maintenance" : "alert";
  const status = `<section class="status-banner ${stateClass(overall)}" aria-labelledby="overall-status"><div id="status-live" role="status" aria-live="polite" aria-atomic="true"><div class="status-summary">${publicIcon(statusIcon, "overall-status-icon")}<div><p class="eyebrow">Current status</p><h1 id="overall-status" data-overall>${escapeHtml(componentStateLabel(overall))}</h1></div></div><p class="status-live-update" data-newest-update>${escapeHtml(newest ? updateSummary(newest.incident, newest.update) : "There are no open incidents.")}</p></div><p class="status-generated" data-generated-at>Updated ${timestamp(generatedAt, settings.timezone)}.</p><div data-generation-details>${timestampDetails(settings.timezone, ["Updated", generatedAt])}</div></section>`;
  const pageTitle = /\bstatus\s*$/i.test(settings.pageName.trim()) ? settings.pageName : `${settings.pageName} status`;
  const timeline = timelineMarkup(model, slots);
  return pageShell(pageTitle, `${status}${timeline.active}${componentHealthMarkup(model)}<div class="component-extension">${slotMarkup(slots, "status-page.components.after.v1", model)}</div>${timeline.rest}${subscriptionMarkup(model)}`, model, slots, "root");
}

function renderIncidentPage(incident: PublicIncident, model: ReturnType<typeof toPublicModel>, slots: LampServerSlots) {
  const timezone = model.settings.timezone;
  const report = reportMarkup(incident.report);
  const resolutionUpdateCarriesTime = incident.updates.some((update) => update.lifecycle === "Resolved" && update.publishedAt === incident.resolvedAt);
  const resolved = incident.lifecycle === "Resolved" && incident.resolvedAt
    ? `<p class="incident-resolution">${resolutionUpdateCarriesTime ? "" : `Resolved at ${timestamp(incident.resolvedAt, timezone)}. `}Duration: ${escapeHtml(durationText(incident.openedAt, incident.resolvedAt))}</p>`
    : "";
  const content = `<div class="incident-document"><div class="incident-document-main">${incidentMarkup(incident, timezone, undefined, "Incident", "h1")}${resolved ? `<section class="about"><h2>About this incident</h2>${resolved}</section>` : ""}${report}${model.prelaunch ? "" : incidentFollowMarkup(incident, model.subscriptionChannels, model.incidentIncludeReport)}</div><aside class="incident-summary" aria-label="Incident status"><p class="eyebrow">Incident status</p><h2 class="summary-state">${statePill(incident.lifecycle)}</h2><dl><div><dt>Opened</dt><dd>${timestamp(incident.openedAt, timezone)}</dd></div><div><dt>Updates</dt><dd>${incident.updates.length}</dd></div></dl>${timestampDetails(timezone, ["Opened", incident.openedAt], ...(incident.resolvedAt ? [["Resolved", incident.resolvedAt] as [string, string]] : []))}<a class="text-link" href="/">Current status</a></aside></div>`;
  return pageShell(`${incident.title} · ${model.settings.pageName}`, content, model, slots, "other");
}

function renderNotFoundPage(model: ReturnType<typeof toPublicModel>, slots: LampServerSlots) {
  const content = `<section class="history not-found" aria-labelledby="missing-incident-title"><p class="eyebrow">Incident record</p><h1 id="missing-incident-title">We couldn't find that incident</h1><p>The incident may have moved or been removed.</p><nav class="not-found-links" aria-label="Status navigation"><a class="text-link" href="/">Current status</a><a class="text-link" href="/history">History</a></nav></section>`;
  return pageShell(`Incident not found · ${model.settings.pageName}`, content, model, slots, "other");
}

function renderHistory(model: ReturnType<typeof toPublicModel>, slots: LampServerSlots, month?: string) {
  return pageShell(`${month ?? "History"} · ${model.settings.pageName}`, `${renderHistoryContent(model, month)}`, model, slots, "history");
}

export function renderPublicSnapshot(source: PublicSnapshotSource, generatedAt = new Date().toISOString(), policies: PublicSnapshotPolicies = defaultPublicSnapshotPolicies, branding: { logoDataUrl: string | null; iconDataUrl?: string | null } = { logoDataUrl: null }, slots: LampServerSlots = {}): RenderedSnapshot {
  const model = toPublicModel(source, generatedAt, policies);
  const dependencies = source.dependencies ?? [];
  const vendorMarkup = dependencies.length ? `<section class="history" aria-label="Upstream providers"><h2>Upstream providers</h2><p>Vendor reports are separate from buyer incidents.</p>${dependencies.map(row => {
    const state = row.state && componentStateLabel(row.state);
    const status = row.unavailableAt
      ? `Vendor status unavailable since ${timestamp(row.unavailableAt, model.settings.timezone)}.${state ? ` Last reported: ${escapeHtml(state)}.` : ""}`
      : escapeHtml(state ?? "Waiting for first read");
    return `<article class="component"><div class="component-name"><h3>${escapeHtml(row.name)}</h3><p><a href="${escapeHtml(row.statusPageUrl)}">Reported by ${escapeHtml(row.vendorName)}</a></p><p>${status}</p></div></article>`;
  }).join("")}</section>` : "";
  const feeds = renderFeeds(model, source);
  const protectedPrefix = source.protectedPage ? statusPagePrefix(source.protectedPage) : "";
  const artifacts: SnapshotArtifact[] = [
    { key: "page.html", body: renderPage(model, slots).replace("<footer", vendorMarkup + publicMetricsSection(model.metrics, model.visibleComponents, model.generatedAt, model.settings.timezone) + "<footer"), contentType: "text/html; charset=utf-8" },
    ...feeds,
    { key: "maintenance.ics", body: renderMaintenanceCalendar(model), contentType: "text/calendar; charset=utf-8" },
    ...(model.prelaunch ? [{ key: PRELAUNCH_ROBOTS_KEY, body: PRELAUNCH_ROBOTS_TXT, contentType: "text/plain; charset=utf-8" }] : []),
    ...renderBadges(model),
    ...renderPublicApi(model, source),
    { key: "api/public/dependencies", body: JSON.stringify({ dependencies }), contentType: "application/json; charset=utf-8" },
    { key: "widget.js", body: renderWidget(statusPayload(model), model.settings, "banner", protectedPrefix, model.origin), contentType: "application/javascript; charset=utf-8" },
    { key: "embed/script.js", body: renderWidget(statusPayload(model), model.settings, "floating", protectedPrefix, model.origin), contentType: "application/javascript; charset=utf-8" },
    { key: "status.json", body: JSON.stringify(statusPayload(model)), contentType: "application/json; charset=utf-8" },
    { key: "assets/status-page.js", body: protectedPrefix ? publicPageScript.replace("fetch('/api/public/status'", `fetch('${protectedPrefix}/api/public/status'`) : publicPageScript, contentType: "application/javascript; charset=utf-8" },
    { key: "assets/status-page.css", body: publicPageStyles(model.settings.accentColor, model.theme, model.origin), contentType: "text/css; charset=utf-8" },
    { key: "assets/mark.svg", body: renderBrandSvg({ settings: model.settings, overall: model.overall, logoDataUrl: branding.logoDataUrl, iconDataUrl: branding.iconDataUrl }, "mark"), contentType: "image/svg+xml; charset=utf-8" },
    { key: "assets/favicon.svg", body: renderBrandSvg({ settings: model.settings, overall: model.overall, logoDataUrl: branding.logoDataUrl, iconDataUrl: branding.iconDataUrl }, "favicon"), contentType: "image/svg+xml; charset=utf-8" },
    { key: "assets/og.svg", body: renderBrandSvg({ settings: model.settings, overall: model.overall, logoDataUrl: branding.logoDataUrl, iconDataUrl: branding.iconDataUrl }, "og"), contentType: "image/svg+xml; charset=utf-8" },
    { key: "not-found.html", body: renderNotFoundPage(model, slots), contentType: "text/html; charset=utf-8" },
    ...model.incidents.map((incident) => ({ key: `incidents/${encodeURIComponent(incident.reference)}.html`, body: renderIncidentPage(incident, model, slots), contentType: "text/html; charset=utf-8" })),
  ];
  artifacts.push(...model.maintenance.map((item) => ({ key: `maintenance/${encodeURIComponent(item.reference)}.html`, body: pageShell(`${item.title} · ${model.settings.pageName}`, `${maintenanceMarkup(item, model.settings.timezone, generatedAt, true)}`, model, slots, "other"), contentType: "text/html; charset=utf-8" })));
  if (!source.bounded) artifacts.push(...historyMonths(model).map(month => ({ key: `history/${month}.html`, body: renderHistory(model, slots, month), contentType: "text/html; charset=utf-8" })));
  artifacts.push(...renderImportAliases(source, model.incidents, model.maintenance, renderHistory(model, slots)));
  artifacts.push(...templateArtifacts(model));
  return { generatedAt, artifacts };
}

/** Render one cold historical page using its generation's public presentation. */
export function renderArchiveArtifact(source: PublicSnapshotSource, key: string, generatedAt: string, policies: PublicSnapshotPolicies = defaultPublicSnapshotPolicies, slots: LampServerSlots = {}): SnapshotArtifact | null {
  // Archive documents use component names and visibility, never uptime charts.
  const model = toPublicModel(source, generatedAt, policies, false);
  const html = (body: string): SnapshotArtifact => ({ key, body, contentType: "text/html; charset=utf-8" });
  switch (source.archive?.kind) {
    case "history": case "month": return html(renderHistory(model, slots, source.archive.month));
    case "incident": return model.incidents[0] ? html(renderIncidentPage(model.incidents[0], model, slots)) : null;
    case "maintenance": return model.maintenance[0] ? html(pageShell(`${model.maintenance[0].title} · ${model.settings.pageName}`, maintenanceMarkup(model.maintenance[0], model.settings.timezone, generatedAt, true), model, slots, "other")) : null;
    case "feed": return renderFeeds(model, source).find(artifact => artifact.key === `${source.archive?.componentSlug ? `components/${source.archive.componentSlug}/` : ""}${key.endsWith(".rss") ? "feed.rss" : "feed.atom"}`) ?? null;
    case "api-incidents": case "api-maintenance": {
      const name = source.archive.kind === "api-incidents" ? "incidents" : "maintenance";
      const artifact = renderPublicApi(model, source).find(artifact => artifact.key === key);
      if (!artifact) return null;
      const payload = JSON.parse(artifact.body);
      return { ...artifact, key, body: JSON.stringify({ ...payload, nextCursor: source.archive.nextCursor }) };
    }
    default: return null;
  }
}
