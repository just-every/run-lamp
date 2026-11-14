import { ARCHIVE_PAGE_SIZE, encodeArchiveCursor } from "./archive";
import { impactLabel } from "../../shared/incident-impact";
import { renderAtomContent, renderRssDescription } from "./feed-content";
import type { PublicSnapshotModel, SnapshotArtifact } from "./renderer";
import type { PublicSnapshotSource } from "./repository";
import { componentSlug, publicComponentResources } from "./component-address";
import { DAY, escapeXml } from "./format";
import { updateText } from "./feed-widget";

interface FeedEntry {
  id: string;
  title: string;
  publishedAt: string;
  content: string;
  path: string;
  recordKind: "incident" | "maintenance";
  recordId: string;
}

/** Atom and RSS deliberately share the same event IDs, order and reporting window. */
export function publicFeedEntries(model: PublicSnapshotModel): FeedEntry[] {
  return [
    ...model.incidents.flatMap((incident) => incident.updates.map((update) => ({
      id: `update-${update.id}`,
      title: `${incident.reference}: ${incident.title}`,
      publishedAt: update.publishedAt,
      content: [`Incident impact: ${impactLabel(incident.effectiveImpact)}`, updateText(incident, update, model.settings.timezone), incident.components.length ? `Affected components: ${incident.components.join(", ")}` : ""].filter(Boolean).join("\n\n"),
      path: `/incidents/${encodeURIComponent(incident.reference)}`,
      recordKind: "incident" as const,
      recordId: incident.id,
    }))),
    ...model.maintenance.flatMap((item) => item.notices.map((notice) => ({
      id: `maintenance-notice-${notice.id}`,
      title: `${item.reference}: ${item.title} — ${notice.kind}`,
      publishedAt: notice.publishedAt,
      content: [notice.kind, notice.body, item.components.join(", ")].filter(Boolean).join("\n"),
      path: `/maintenance/${encodeURIComponent(item.reference)}`,
      recordKind: "maintenance" as const,
      recordId: item.id,
    }))),
  ].filter((entry) => new Date(entry.publishedAt).getTime() >= new Date(model.generatedAt).getTime() - 365 * DAY)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || right.id.replace(/^(?:update-|maintenance-notice-)/, "").localeCompare(left.id.replace(/^(?:update-|maintenance-notice-)/, "")) || (right.recordKind === "incident" ? "incident-update" : "maintenance-notice").localeCompare(left.recordKind === "incident" ? "incident-update" : "maintenance-notice"));
}

function feedIdentity(model: PublicSnapshotModel) {
  const id = model.settings.feedId;
  if (!id || id === "pending-feed-identity") throw new Error("Lamp requires a persisted feed identity before rendering feeds.");
  return `urn:lamp:${id}`;
}

interface FeedDocument {
  model: PublicSnapshotModel;
  entries: FeedEntry[];
  title: string;
  identity: string;
  atomPath: string;
  rssPath: string;
  nextCursor?: string | null;
}

function nextFeedLink(feed: FeedDocument, format: "atom" | "rss") {
  const path = format === "atom" ? feed.atomPath : feed.rssPath;
  return feed.nextCursor ? `<link href="${escapeXml(feed.model.origin + path + "?cursor=" + encodeURIComponent(feed.nextCursor))}" rel="next" type="application/${format === "atom" ? "atom" : "rss"}+xml"/>` : "";
}

function atomDocument(feed: FeedDocument) {
  const { model, entries } = feed;
  const origin = model.origin;
  return `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><id>${escapeXml(feed.identity)}</id><title>${escapeXml(feed.title)}</title><updated>${escapeXml(model.generatedAt)}</updated><author><name>${escapeXml(model.settings.pageName)}</name></author><link href="${escapeXml(origin + feed.atomPath)}" rel="self" type="application/atom+xml"/><link href="${escapeXml(origin + "/")}" rel="alternate" type="text/html"/>${nextFeedLink(feed, "atom")}${entries.map((entry) => `<entry><id>${escapeXml(`${feedIdentity(model)}:event:${entry.id}`)}</id><title>${escapeXml(entry.title)}</title><updated>${escapeXml(entry.publishedAt)}</updated><link href="${escapeXml(origin + entry.path)}" rel="alternate" type="text/html"/>${renderAtomContent(entry.content)}</entry>`).join("")}</feed>`;
}

function rssDocument(feed: FeedDocument) {
  const { model, entries } = feed;
  const origin = model.origin;
  // RSS descriptions carry HTML. Encode the prose inside that HTML as well as
  // encoding the XML, so a literal <tag> remains text in a feed reader.
  return `<?xml version="1.0" encoding="utf-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(feed.title)}</title><link>${escapeXml(origin + "/")}</link><description>${escapeXml(`${feed.title} — incident and maintenance updates`)}</description><language>en</language><lastBuildDate>${escapeXml(new Date(model.generatedAt).toUTCString())}</lastBuildDate><atom:link href="${escapeXml(origin + feed.rssPath)}" rel="self" type="application/rss+xml"/>${nextFeedLink(feed, "rss").replace("<link", "<atom:link")}${entries.map((entry) => `<item><guid isPermaLink="false">${escapeXml(`${feedIdentity(model)}:event:${entry.id}`)}</guid><title>${escapeXml(entry.title)}</title><link>${escapeXml(origin + entry.path)}</link><pubDate>${escapeXml(new Date(entry.publishedAt).toUTCString())}</pubDate>${renderRssDescription(entry.content)}</item>`).join("")}</channel></rss>`;
}

export function renderFeeds(model: PublicSnapshotModel, source: PublicSnapshotSource): SnapshotArtifact[] {
  const allEntries = publicFeedEntries(model);
  const entries = allEntries.slice(0, ARCHIVE_PAGE_SIZE);
  const last = entries.at(-1);
  const nextCursor = source.archive?.kind === "feed" ? source.archive.nextCursor : last && (allEntries.length > ARCHIVE_PAGE_SIZE || (source.bounded && model.incidents.filter(row => row.lifecycle === "Resolved").length >= ARCHIVE_PAGE_SIZE)) ? encodeArchiveCursor({ at: last.publishedAt, id: last.id.replace(/^(?:update-|maintenance-notice-)/, ""), kind: last.recordKind === "incident" ? "incident-update" : "maintenance-notice" }) : null;
  const identity = feedIdentity(model);
  const global: FeedDocument = { model, entries, nextCursor, identity, title: model.settings.pageName, atomPath: "/feed.atom", rssPath: "/feed.rss" };
  const atom = atomDocument(global);
  const rss = rssDocument(global);
  const artifacts: SnapshotArtifact[] = [
    { key: "feed.atom", body: atom, contentType: "application/atom+xml; charset=utf-8" },
    { key: "feed.rss", body: rss, contentType: "application/rss+xml; charset=utf-8" },
    { key: "history.atom", body: atom, contentType: "application/atom+xml; charset=utf-8" },
    { key: "history.rss", body: rss, contentType: "application/rss+xml; charset=utf-8" },
  ];
  for (const component of model.visibleComponents) {
    const incidents = new Set(source.incidentComponents.filter((claim) => claim.componentId === component.id).map((claim) => claim.incidentId));
    const maintenance = new Set(source.maintenanceComponents.filter((claim) => claim.componentId === component.id).map((claim) => claim.maintenanceId));
    const paths = publicComponentResources(component);
    const componentEntries = allEntries.filter((entry) => entry.recordKind === "incident" ? incidents.has(entry.recordId) : maintenance.has(entry.recordId));
    const componentPage = componentEntries.slice(0, ARCHIVE_PAGE_SIZE);
    const tail = componentPage.at(-1);
    const componentNext = source.archive?.componentSlug === componentSlug(component) ? source.archive.nextCursor : source.bounded || componentEntries.length > ARCHIVE_PAGE_SIZE
      ? encodeArchiveCursor(tail ? { at: tail.publishedAt, id: tail.id.replace(/^(?:update-|maintenance-notice-)/, ""), kind: tail.recordKind === "incident" ? "incident-update" : "maintenance-notice" } : { at: model.generatedAt, id: "zzzz", kind: "maintenance-notice" }) : null;
    const feed: FeedDocument = {
      model,
      entries: componentPage,
      nextCursor: componentNext,
      identity: `${identity}:component:${componentSlug(component)}`,
      title: `${model.settings.pageName} — ${component.name}`,
      atomPath: paths.atom,
      rssPath: paths.rss,
    };
    artifacts.push(
      { key: paths.atom.slice(1), body: atomDocument(feed), contentType: "application/atom+xml; charset=utf-8" },
      { key: paths.rss.slice(1), body: rssDocument(feed), contentType: "application/rss+xml; charset=utf-8" },
    );
  }
  return artifacts;
}
