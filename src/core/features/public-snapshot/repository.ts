import { noPublicSubscriptionChannels, type PublicSubscriptionChannels } from "../subscribers/public-subscription-channels";
import { loadArchiveSource, publicIncident, publicMaintenance, scopedRecord } from "./archive.repository";
import { projectImportedIncidentUpdates } from "../statuspage-import/imported-update.repository";
import type { createStatusPageRepository } from "../page-settings/status-page.repository";
import { createUlid } from "../../shared/ids";
import { createDependencyRepository } from "../dependencies/repository";
import { createIncidentFollowSettingsRepository } from "../subscribers/incident-follow-settings.repository";
import { createMetricsRepository } from "../metrics/repository";
import type { PublicMetric } from "../metrics/types";
import { readImportedNamespaces, readImportedPublicRecords } from "../statuspage-import/alias-repository";
import type { ImportedPublicRecord } from "../statuspage-import/public-addresses";
import { loadPublicApiIds } from "./api-identity-repository";
import { prepareReliabilityHistory, type ReliabilityHistory, type ReliabilityRow } from "./reliability-history";
import { createPublicPlanReader, readPublicPlans } from "../statuspage-import/public-plan-reader";
import { createWebsiteRepository } from "../website/repository";
import { and, asc, desc, eq, getTableColumns, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { createDatabase } from "../../platform/db/client";
import {
  componentGroups,
  componentStandingClaims,
  components,
  componentStateHistory,
  componentStateCorrections,
  incidentComponents,
  incidents,
  incidentUpdates,
  maintenance,
  maintenanceComponents,
  pageSettings,
  snapshotBuilds,
} from "../../shared/schema";

export interface SnapshotRepository {
  /** Non-secret Worker configuration that affects the rendered source. */
  sourceConfiguration?: string;
  createPlanReader?(): typeof readPublicPlans;
  load(readPlans?: typeof readPublicPlans): Promise<PublicSnapshotSource | null>;
  loadArchive?(context: PublicSnapshotSource, key: string, generatedAt: string, readPlans?: typeof readPublicPlans): Promise<PublicSnapshotSource | null>;
  /** The public metric series alone. Timed refreshes read it fresh; minute points never request a full rebuild. */
  loadMetrics?(): Promise<PublicMetric[]>;
  startBuild(input: typeof snapshotBuilds.$inferInsert): Promise<void>;
  finishBuild(input: { id: string; status: "published" | "failed"; version: string | null; error: string | null; attempts: number; finishedAt: string; updatedAt: string }): Promise<void>;
  hasPublishedBuild?(id: string, version: string): Promise<boolean>;
  latestBuild(): Promise<typeof snapshotBuilds.$inferSelect | null>;
  /** The next generation, strictly above `atLeast` (the generation already published elsewhere). */
  reserveGeneration(now: string, atLeast: number): Promise<number>;
  requestWork(now: string): Promise<number>;
  currentWork(): Promise<{ requestedRevision: number; completedRevision: number }>;
  completeWork(revision: number, now: string): Promise<void>;
  markInterruptedBuilds(now: string, staleBefore: string): Promise<Array<{ id: string; startedAt: string }>>;
  claimPendingWork(input: { leaseId: string; now: string; leaseUntil: string; staleBefore: string; refreshRevision?: number }): Promise<boolean>;
  releaseWorkLease(leaseId: string, now: string): Promise<void>;
}

export interface PublicSnapshotSource {
  protectedPage?: string;
  archive?: import("./archive").ArchivePage;
  bounded?: boolean;
  dependencies?: Awaited<ReturnType<ReturnType<typeof createDependencyRepository>["publicRows"]>>;
  subscriptionChannels: PublicSubscriptionChannels;
  incidentIncludeReport?:boolean;
  /** Pre-launch: the page offers no way to subscribe and asks search engines to stay away. Set by the service from the owner setting. */
  prelaunch?: boolean;
  metrics?: PublicMetric[];
  websiteUrl?: string | null;
  publicOrigin?: string;
  publicApiIds?: Record<string, string>;
  incidentImpacts?: Record<string, typeof componentStandingClaims.$inferSelect.state>;
  importedNamespaces?: string[];
  importedPublicRecords?: ImportedPublicRecord[];
  settings: typeof pageSettings.$inferSelect;
  components: Array<{
    id: string;
    name: string;
    description: string;
    region?: string | null;
    onlyShowIfDegraded?: boolean;
    uptimeStartDate?: string | null;
    note: string;
    groupId: string | null;
    groupName: string | null;
    groupOrder: number | null;
    groupCreatedAt?: string | null;
    groupUpdatedAt?: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  claims: Array<{ componentId: string; state: typeof componentStandingClaims.$inferSelect.state }>;
  history: Array<typeof componentStateHistory.$inferSelect>;
  corrections: Array<typeof componentStateCorrections.$inferSelect>;
  incidents: Array<typeof incidents.$inferSelect>;
  incidentComponents: Array<typeof incidentComponents.$inferSelect>;
  updates: Array<typeof incidentUpdates.$inferSelect>;
  maintenance: Array<typeof maintenance.$inferSelect>;
  maintenanceComponents: Array<typeof maintenanceComponents.$inferSelect>;
  reports: Array<{ incidentId: string; summary: string; timeline: string; cause: string; remediation: string; publishedAt: string }>;
  importedMaintenanceUpdates?: Array<{ id: string; maintenanceId: string; body: string; publishedAt: string; sourceStates?: string }>;
  maintenanceNotices: Array<{ id: string; maintenanceId: string; kind: string; body: string; publishedAt: string }>;
  /** The union of incident impacts per component over the whole public history. */
  reliabilityHistory?: ReliabilityHistory;
}

export function createSnapshotRepository(
  binding: D1Database,
  publicOrigin?: string,
  configuration: PublicSubscriptionChannels & { mailFromAddress?: string } = noPublicSubscriptionChannels,
  scope?: { path: string; pages: ReturnType<typeof createStatusPageRepository> },
): SnapshotRepository {
  const { mailFromAddress, ...channels } = configuration;
  function subscriptionChannels(settings: PublicSnapshotSource["settings"]): PublicSubscriptionChannels {
    const email = channels.email && Boolean(settings.mailFromAddress ?? mailFromAddress);
    // Webhook deliveries still require the subscriber to confirm by email.
    return { ...channels, email, webhook: email && channels.webhook };
  }
  const database = createDatabase(binding);
  const path = scope?.path ?? "public";
  // The global revision watches shared component and record source mutations.
  // This page keeps its own completion and manual rebuild requests.
  const globalRevision = scope ? " + (SELECT requested_revision FROM public_snapshot_work WHERE id = 'default')" : "";
  const workTable = scope ? "status_page_snapshot_work" : "public_snapshot_work";
  const workId = scope ? path : "default";
  async function ensureWork() {
    if (!scope) return;
    const now = new Date().toISOString();
    await binding.prepare("INSERT OR IGNORE INTO status_page_snapshot_work (id, created_at, updated_at) VALUES (?,?,?)").bind(workId, now, now).run();
  }

  const loadMetrics = async () => scope ? [] : createMetricsRepository(binding).publicSeries();
  return {
    sourceConfiguration: JSON.stringify([publicOrigin, channels, Boolean(mailFromAddress)]),
    createPlanReader: createPublicPlanReader,
    async load(readPlans = readPublicPlans) {
      const settings = await database.select().from(pageSettings).where(eq(pageSettings.id, "default")).get();
      if (!settings) return null;
      const protectedPage = scope ? await scope.pages.get(path) : null;
      if (scope && !protectedPage) return null;
      if (protectedPage) {
        const { pageName, tagline, timezone, accentColor, feedId, createdAt, updatedAt, footerCreditEnabled, logoKey, logoContentType } = protectedPage;
        Object.assign(settings, {
          id: path, pageName, tagline, timezone, accentColor, feedId, createdAt, updatedAt, template: "default",
          hostname: publicOrigin ? new URL(publicOrigin).hostname : settings.hostname,
          theme: "{}", themeAssets: "{}", footerCreditEnabled, logoKey, logoContentType,
          mailFromAddress: "", emailBranding: "{}", aiToneInstructions: "", wordingBlockedTerms: "[]",
          widgetAllowedOrigins: "[]",
        });
      }
      // Settings restored or inserted after the feed-identity migration can
      // still have its placeholder default. Persist one identity before rendering;
      // competing builders must use the same winner, including on retries.
      if (!settings.feedId || settings.feedId === "pending-feed-identity") {
        await binding.prepare("UPDATE page_settings SET feed_id = ? WHERE id = 'default' AND feed_id IN ('', 'pending-feed-identity')").bind(createUlid()).run();
        const identity = await binding.prepare("SELECT feed_id AS feedId FROM page_settings WHERE id = 'default'").first<{ feedId: string }>();
        if (!identity?.feedId || identity.feedId === "pending-feed-identity") throw new Error("Public feed identity could not be persisted.");
        settings.feedId = identity.feedId;
      }

      // The retained generation contains current work plus a recent window.
      // Older records use indexed, bounded archive pages; no records are removed.
      // Apply the archive's public membership before the limit: private rows
      // cannot consume a slot and suppress the Older history continuation.
      const incidentVisibility = scope ? scopedRecord("incident", path) : publicIncident;
      const maintenanceVisibility = scope ? scopedRecord("maintenance", path) : publicMaintenance;
      const activeIncidentQuery = `SELECT i.id FROM incidents i WHERE i.deleted_at IS NULL AND i.lifecycle <> 'Resolved' AND ${scope ? incidentVisibility : "i.public_hidden=0"}`;
      const activeMaintenanceQuery = `SELECT m.id FROM maintenance m WHERE m.state NOT IN ('Completed','Cancelled') AND ${scope ? maintenanceVisibility : "m.public_hidden=0"}`;
      const recentIncidentQuery = `${activeIncidentQuery}
        UNION SELECT id FROM (SELECT i.id FROM incidents i INDEXED BY incidents_resolved_public_window WHERE i.lifecycle = 'Resolved' AND i.resolved_at IS NOT NULL AND ${incidentVisibility} ORDER BY i.resolved_at DESC, i.id DESC LIMIT 50)`;
      const recentMaintenanceQuery = `${activeMaintenanceQuery}
        UNION SELECT id FROM (SELECT m.id FROM maintenance m INDEXED BY maintenance_completed_public_window WHERE m.state IN ('Completed','Cancelled') AND ${maintenanceVisibility} ORDER BY COALESCE(m.completed_at,m.ends_at) DESC,m.id DESC LIMIT 50)`;
      const componentIds = JSON.stringify(protectedPage?.componentIds ?? []);
      const selected = sql`(SELECT value FROM json_each(${componentIds}))`;
      const reliabilityComponents = scope ? "SELECT value FROM json_each(?)"
        : "SELECT id FROM components c WHERE c.internal=0 AND NOT EXISTS (SELECT 1 FROM vendor_dependencies v WHERE v.component_id=c.id)";
      // Select the visible incident window once. Links, updates and reports use
      // the same IDs without repeating the history and visibility seeks.
      const incidentRowsWithImpact = await database.select({ ...getTableColumns(incidents),
        peakImpact: sql<typeof componentStandingClaims.$inferSelect.state | null>`peak_impact`,
      }).from(incidents).where(inArray(incidents.id, sql.raw(`(${recentIncidentQuery})`))).orderBy(desc(incidents.openedAt)).all();
      const incidentIds = JSON.stringify(incidentRowsWithImpact.map(row => row.id));
      const recentIncidents = sql`(SELECT value FROM json_each(${incidentIds}))`;
      const recentMaintenance = sql.raw(`(${recentMaintenanceQuery})`);
      const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();
      const sourceRows = database.batch([
        database
          .select({
            id: components.id,
            name: components.name,
            description: components.description,
            region: components.region,
            onlyShowIfDegraded: components.onlyShowIfDegraded,
            uptimeStartDate: components.uptimeStartDate,
            note: components.note,
            groupId: components.groupId,
            groupName: sql<string | null>`${componentGroups.name}`.as("group_name"),
            groupOrder: sql<number | null>`${componentGroups.displayOrder}`.as("group_order"),
            groupCreatedAt: sql<string | null>`${componentGroups.createdAt}`.as("group_created_at"),
            groupUpdatedAt: sql<string | null>`${componentGroups.updatedAt}`.as("group_updated_at"),
            displayOrder: components.displayOrder,
            createdAt: components.createdAt,
            updatedAt: components.updatedAt,
          })
          .from(components)
          .leftJoin(componentGroups, eq(components.groupId, componentGroups.id))
          .where(scope ? inArray(components.id, selected) : and(eq(components.internal, false), sql`NOT EXISTS (SELECT 1 FROM vendor_dependencies v WHERE v.component_id = ${components.id})`))
          .orderBy(asc(componentGroups.displayOrder), asc(components.displayOrder)),
        database.select({ componentId: componentStandingClaims.componentId, state: componentStandingClaims.state }).from(componentStandingClaims),
        database
          .select({ componentId: incidentComponents.componentId, state: incidentComponents.state })
          .from(incidentComponents)
          .innerJoin(incidents, eq(incidentComponents.incidentId, incidents.id))
          .where(and(inArray(incidentComponents.incidentId, sql.raw(`(${activeIncidentQuery})`)), sql`incident_components.published_at IS NOT NULL`)),
        database
          .select({ componentId: maintenanceComponents.componentId, state: maintenanceComponents.state })
          .from(maintenanceComponents)
          .innerJoin(maintenance, eq(maintenanceComponents.maintenanceId, maintenance.id))
          .where(and(eq(maintenance.state, "In progress"), inArray(maintenance.id, sql.raw(`(${activeMaintenanceQuery})`)))),
        // Correction audit rows are not observations; computeUptime reads the
        // independently stored correction intervals instead.
        database.select().from(componentStateHistory).where(and(ne(componentStateHistory.causeType, "correction"), sql`(${componentStateHistory.changedAt} >= ${cutoff} OR ${componentStateHistory.id} IN
          (SELECT (SELECT h.id FROM component_state_history h WHERE h.component_id=c.id AND h.cause_type <> 'correction' AND h.changed_at < ${cutoff} ORDER BY h.changed_at DESC,h.created_at DESC,h.id DESC LIMIT 1) FROM components c WHERE c.internal=0)
          OR ${componentStateHistory.id} IN (SELECT (SELECT h.id FROM component_state_history h WHERE h.component_id=c.id AND h.cause_type <> 'correction' ORDER BY h.changed_at,h.created_at,h.id LIMIT 1) FROM components c WHERE c.internal=0))`)).orderBy(asc(componentStateHistory.changedAt), asc(componentStateHistory.createdAt)),
        database.select().from(componentStateCorrections).where(sql`${componentStateCorrections.endsAt} >= ${cutoff}`).orderBy(asc(componentStateCorrections.startsAt), asc(componentStateCorrections.createdAt)),
        database
          .select(getTableColumns(incidentComponents))
          .from(incidentComponents)
          .leftJoin(components, eq(incidentComponents.componentId, components.id))
          .where(and(inArray(incidentComponents.incidentId, recentIncidents), sql`incident_components.published_at IS NOT NULL`, scope ? inArray(incidentComponents.componentId, selected) : or(and(isNull(incidentComponents.componentId), sql`incident_components.detached_internal = 0`), eq(components.internal, false)))),
        database.select().from(incidentUpdates).where(inArray(incidentUpdates.incidentId, recentIncidents)).orderBy(desc(incidentUpdates.publishedAt)),
        database.select().from(maintenance).where(inArray(maintenance.id, recentMaintenance)).orderBy(asc(maintenance.startsAt)),
        database
          .select(getTableColumns(maintenanceComponents))
          .from(maintenanceComponents)
          .leftJoin(components, eq(maintenanceComponents.componentId, components.id))
          .where(and(inArray(maintenanceComponents.maintenanceId, recentMaintenance), scope ? inArray(maintenanceComponents.componentId, selected) : or(and(isNull(maintenanceComponents.componentId), sql`maintenance_components.detached_internal = 0`), eq(components.internal, false)))),
      ]);
      const supplementalRows = binding.batch([
        binding.prepare("SELECT incident_id AS incidentId, summary, timeline, cause, remediation, published_at AS publishedAt FROM incident_reports WHERE incident_id IN (SELECT value FROM json_each(?)) AND published_at IS NOT NULL ORDER BY published_at DESC").bind(incidentIds),
        binding.prepare(`SELECT id, maintenance_id AS maintenanceId, kind, body, published_at AS publishedAt FROM maintenance_notices WHERE maintenance_id IN (${recentMaintenanceQuery}) ORDER BY published_at DESC`),
        binding.prepare(`SELECT id,maintenance_id AS maintenanceId,body,published_at AS publishedAt,source_states AS sourceStates FROM import_maintenance_updates WHERE maintenance_id IN (${recentMaintenanceQuery}) ORDER BY published_at DESC,id`),
        binding.prepare(`SELECT a.component_id AS componentId, i.opened_at AS openedAt, i.resolved_at AS resolvedAt, COALESCE(i.peak_impact, a.state) AS impact
          FROM incident_components a JOIN incidents i ON i.id = a.incident_id
          WHERE a.component_id IS NOT NULL AND a.published_at IS NOT NULL AND ${incidentVisibility}
          AND a.component_id IN (${reliabilityComponents})`).bind(...(scope ? [componentIds] : [])),
      ]) as Promise<[
        D1Result<PublicSnapshotSource["reports"][number]>,
        D1Result<PublicSnapshotSource["maintenanceNotices"][number]>,
        D1Result<NonNullable<PublicSnapshotSource["importedMaintenanceUpdates"]>[number]>,
        D1Result<ReliabilityRow>,
      ]>;
      const [[componentRows, standingClaims, incidentClaims, maintenanceClaims, history, corrections, attachedComponents, updates, maintenanceRows, attachedMaintenanceComponents],
        [reports, maintenanceNotices, importedMaintenanceUpdates, reliability], website, incidentFollow, dependencies, importedPublicRecords, importedNamespaces, publicApiIds, metrics] = await Promise.all([
        sourceRows,
        supplementalRows,
        createWebsiteRepository(binding).get(),
        createIncidentFollowSettingsRepository(binding).get(),
        scope ? [] : createDependencyRepository(binding).publicRows(),
        scope ? [] : readImportedPublicRecords(binding, readPlans),
        scope ? [] : readImportedNamespaces(binding),
        scope ? {} : loadPublicApiIds(binding, readPlans),
        loadMetrics(),
      ]);
      return {
        bounded: true,
        protectedPage: scope?.path,
        websiteUrl: website?.url ?? null,
        subscriptionChannels: subscriptionChannels(settings),
        incidentIncludeReport: incidentFollow.includeReport,
        publicOrigin,
        publicApiIds, incidentImpacts: Object.fromEntries(incidentRowsWithImpact.flatMap(({ id, peakImpact }) => peakImpact === null ? [] : [[id, peakImpact]])),
        importedPublicRecords, importedNamespaces,
        settings,
        dependencies,
        components: componentRows,
        claims: [...standingClaims, ...incidentClaims, ...maintenanceClaims]
          .filter((claim): claim is { componentId: string; state: typeof componentStandingClaims.$inferSelect.state } => claim.componentId !== null),
        history,
        corrections,
        incidents: incidentRowsWithImpact.map(({ peakImpact, ...incident }) => incident),
        incidentComponents: attachedComponents,
        updates: await projectImportedIncidentUpdates(binding, updates, readPlans),
        maintenance: maintenanceRows,
        maintenanceComponents: attachedMaintenanceComponents,
        reports: reports.results,
        maintenanceNotices: maintenanceNotices.results, importedMaintenanceUpdates: importedMaintenanceUpdates.results, metrics,
        reliabilityHistory: prepareReliabilityHistory(reliability.results),
      };
    },
    loadMetrics,
    loadArchive: (context, key, generatedAt, readPlans) => loadArchiveSource(binding, {
      ...context,
      // A retained generation from an older release did not store channel availability.
      subscriptionChannels: context.subscriptionChannels ?? subscriptionChannels(context.settings),
    }, key, generatedAt, readPlans),
    async startBuild(input) {
      await database.insert(snapshotBuilds).values({ ...input, pagePath: path });
    },
    async finishBuild(input) {
      await database.update(snapshotBuilds).set(input).where(eq(snapshotBuilds.id, input.id));
    },
    async hasPublishedBuild(id, version) {
      return Boolean(await binding.prepare("SELECT 1 FROM snapshot_builds WHERE id = ? AND page_path = ? AND status = 'published' AND version = ?").bind(id, path, version).first());
    },
    async latestBuild() {
      return (await database.select().from(snapshotBuilds).where(eq(snapshotBuilds.pagePath, path)).orderBy(desc(snapshotBuilds.startedAt)).limit(1).get()) ?? null;
    },
    async reserveGeneration(now, atLeast) {
      const result = await binding.prepare(`UPDATE snapshot_build_control SET next_generation = MAX(next_generation, ?) + 1, updated_at = ? WHERE id = 'default' RETURNING next_generation AS generation`).bind(atLeast, now).first<{ generation: number }>();
      if (!result || !Number.isInteger(result.generation)) throw new Error("Public snapshot generation control is unavailable.");
      return result.generation;
    },
    async requestWork(now) {
      await ensureWork();
      const result = await binding.prepare(`UPDATE ${workTable} SET requested_revision = requested_revision + 1, updated_at = ? WHERE id = ? RETURNING requested_revision${globalRevision} AS requestedRevision`).bind(now, workId).first<{ requestedRevision: number }>();
      if (!result || !Number.isInteger(result.requestedRevision)) throw new Error("Public snapshot work control is unavailable.");
      return result.requestedRevision;
    },
    async currentWork() {
      await ensureWork();
      const work = await binding.prepare(`SELECT requested_revision${globalRevision} AS requestedRevision, completed_revision AS completedRevision FROM ${workTable} WHERE id = ?`).bind(workId).first<{ requestedRevision: number; completedRevision: number }>();
      if (!work || !Number.isInteger(work.requestedRevision) || !Number.isInteger(work.completedRevision)) throw new Error("Public snapshot work control is unavailable.");
      return work;
    },
    async completeWork(revision, now) {
      await binding.prepare(`UPDATE ${workTable} SET completed_revision = CASE WHEN completed_revision < ? THEN ? ELSE completed_revision END, updated_at = ? WHERE id = ?`).bind(revision, revision, now, workId).run();
    },
    async markInterruptedBuilds(now, staleBefore) {
      return (await binding.prepare(`UPDATE snapshot_builds INDEXED BY snapshot_builds_in_flight SET status = 'failed', error = COALESCE(error, 'Snapshot build lease expired before completion.'), finished_at = ?, updated_at = ? WHERE page_path = ? AND status = 'building' AND started_at <= ? RETURNING id, started_at AS startedAt`).bind(now, now, path, staleBefore).all<{ id: string; startedAt: string }>()).results;
    },
    async claimPendingWork(input) {
      const result = await binding.prepare(`UPDATE ${workTable} SET retry_lease_id = ?, retry_lease_until = ?, updated_at = ? WHERE id = ? AND (requested_revision${globalRevision} > completed_revision OR completed_revision = ?) AND (retry_lease_until IS NULL OR retry_lease_until <= ?) AND NOT EXISTS (SELECT 1 FROM snapshot_builds INDEXED BY snapshot_builds_in_flight WHERE page_path = ? AND status = 'building' AND started_at > ?)`)
        .bind(input.leaseId, input.leaseUntil, input.now, workId, input.refreshRevision ?? null, input.now, path, input.staleBefore).run();
      return result.meta.changes === 1;
    },
    async releaseWorkLease(leaseId, now) {
      await binding.prepare(`UPDATE ${workTable} SET retry_lease_id = NULL, retry_lease_until = NULL, updated_at = ? WHERE id = ? AND retry_lease_id = ?`).bind(now, workId, leaseId).run();
    },
  };
}
