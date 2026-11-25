import { tokenFence, type TokenAuthority } from "../management-api/repository";
import { createUlid, nowIso } from "../../shared/ids";
import { minuteRetentionCutoff, retentionStatements } from "./retention";
import type { AggregatePoint, MetricDefinition, PublicMetric } from "./types";
export interface StoredMetric extends MetricDefinition { sealedCredentials: string | null; version: number }
const columns = `id,component_id AS componentId,source_id AS sourceId,name,unit,provider,query,endpoint,account_id AS accountId,region,CASE WHEN sealed_credentials IS NOT NULL THEN 1 ELSE 0 END AS connected,last_reported_at AS lastReportedAt,error,sealed_credentials AS sealedCredentials,version`;
export function createMetricsRepository(db: D1Database) {
  // A series row missing after the upgrade or a restore is built once from the
  // stored minutes; once it exists the constant NOT EXISTS skips the scan.
  const seedSeries = (id: string) => db.prepare(`INSERT INTO public_metric_series(metric_id,points_json)
    SELECT ?,json_group_object(CAST(bucket AS TEXT),value_sum/samples) FROM metric_points
    WHERE metric_id=? AND resolution=60 AND NOT EXISTS(SELECT 1 FROM public_metric_series WHERE metric_id=?) HAVING count(*)>0`).bind(id,id,id);
  const audit = (id: string, actor: string, action: string) => db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at) SELECT ?,'metric',id,?,?,'{}',?,? FROM public_metrics WHERE id=?`).bind(createUlid(),action,actor,nowIso(),nowIso(),id);
  return {
    async isManager(actor: string) { return Boolean(await db.prepare("SELECT 1 FROM oa_operators WHERE id=? AND role IN ('owner','admin') AND status='active'").bind(actor).first()); },
    async validTarget(componentId: string, sourceId: string | null, provider: string, query: string) {
      return Boolean(await db.prepare(`SELECT 1 FROM components c WHERE c.id=? AND c.internal=0 AND (? IS NULL OR EXISTS(SELECT 1 FROM alert_sources s WHERE s.id=? AND COALESCE(s.vendor_preset,s.preset,s.uptime_preset)=? AND (s.component_id=c.id OR (?='uptime' AND EXISTS(SELECT 1 FROM json_each(s.monitor_mappings_json) j WHERE json_extract(j.value,'$.componentId')=c.id AND json_extract(j.value,'$.monitorId')=?)))))`).bind(componentId,sourceId,sourceId,provider,provider,query).first());
    },
    async list() { return (await db.prepare(`SELECT ${columns} FROM public_metrics ORDER BY created_at,id`).all<StoredMetric>()).results; },
    async hasMetrics() { return Boolean(await db.prepare("SELECT 1 FROM public_metrics LIMIT 1").first()); },
    async get(id: string) { return db.prepare(`SELECT ${columns} FROM public_metrics WHERE id=?`).bind(id).first<StoredMetric>(); },
    async create(row: StoredMetric, actor: string) {
      const now=nowIso();
      await db.batch([
        db.prepare(`INSERT INTO public_metrics(id,component_id,source_id,name,unit,provider,query,endpoint,account_id,region,sealed_credentials,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(row.id,row.componentId,row.sourceId,row.name,row.unit,row.provider,row.query,row.endpoint,row.accountId,row.region,row.sealedCredentials,now,now),
        audit(row.id,actor,"metric.created"),
      ]);
    },
    async update(row: StoredMetric, actor: string, reset: boolean) {
      const change=createUlid(), now=nowIso();
      const result=await db.batch([
        db.prepare(`UPDATE public_metrics SET name=?,unit=?,query=?,endpoint=?,account_id=?,region=?,sealed_credentials=?,error=NULL,version=version+1,change_id=?,pull_after=0,pull_lease_until=NULL,last_reported_at=CASE WHEN ? THEN NULL ELSE last_reported_at END,stale=CASE WHEN ? THEN 0 ELSE stale END,updated_at=? WHERE id=? AND version=?`).bind(row.name,row.unit,row.query,row.endpoint,row.accountId,row.region,row.sealedCredentials,change,reset?1:0,reset?1:0,now,row.id,row.version),
        db.prepare(`DELETE FROM metric_points WHERE metric_id=? AND ? AND EXISTS(SELECT 1 FROM public_metrics WHERE id=? AND change_id=?)`).bind(row.id,reset?1:0,row.id,change),
        db.prepare(`DELETE FROM public_metric_series WHERE metric_id=? AND ? AND EXISTS(SELECT 1 FROM public_metrics WHERE id=? AND change_id=?)`).bind(row.id,reset?1:0,row.id,change),
        db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at) SELECT ?,'metric',id,'metric.updated',?,'{}',?,? FROM public_metrics WHERE id=? AND change_id=?`).bind(createUlid(),actor,now,now,row.id,change),
      ]);
      return Boolean(result[0].meta.changes);
    },
    async remove(id: string, actor: string) {
      const result=await db.batch([audit(id,actor,"metric.deleted"),db.prepare("DELETE FROM public_metrics WHERE id=?").bind(id),db.prepare("DELETE FROM public_metric_series WHERE metric_id=?").bind(id)]);
      return Boolean(result[1].meta.changes);
    },
    async write(id: string, points: AggregatePoint[], now: number, version: number, authority?: TokenAuthority) {
      if (!points.length) return false;
      const latest=Math.max(...points.map(point=>point.at)),receipt=createUlid(),at=nowIso();
      const fence=authority?tokenFence(authority):null;
      // A transaction-local audit receipt witnesses both current token authority
      // and metric version; every token mutation repeats that exact receipt.
      const guard=authority?" AND EXISTS(SELECT 1 FROM audit_entries WHERE id=?)":"";
      const guardParams=authority?[receipt]:[];
      const result=await db.batch([
        seedSeries(id),
        ...(authority&&fence?[db.prepare(`INSERT INTO audit_entries(id,entity_type,entity_id,action,operator_id,payload_json,created_at,updated_at)
          SELECT ?,'metric',id,'metric.points-pushed',?,?,?,? FROM public_metrics WHERE id=? AND version=? AND ${fence.sql}`)
          .bind(receipt,authority.personId,JSON.stringify({tokenId:authority.id}),at,at,id,version,...fence.params)]:[]),
        db.prepare(`INSERT INTO metric_points(metric_id,resolution,bucket,value_sum,samples,last_at)
          SELECT ?,60,json_extract(value,'$.at'),json_extract(value,'$.value'),1,json_extract(value,'$.at') FROM json_each(?)
          WHERE EXISTS(SELECT 1 FROM public_metrics WHERE id=? AND version=?)${guard}
          ON CONFLICT(metric_id,resolution,bucket) DO UPDATE SET value_sum=excluded.value_sum,samples=1,last_at=excluded.last_at WHERE metric_points.value_sum IS NOT excluded.value_sum OR metric_points.samples<>1 OR metric_points.last_at<>excluded.last_at`).bind(id,JSON.stringify(points),id,version,...guardParams),
        // The public series takes the same minute values in the same transaction.
        db.prepare(`INSERT INTO public_metric_series(metric_id,points_json) SELECT ?,? WHERE EXISTS(SELECT 1 FROM public_metrics WHERE id=? AND version=?)${guard}
          ON CONFLICT(metric_id) DO UPDATE SET points_json=json_patch(points_json,excluded.points_json)`).bind(id,JSON.stringify(Object.fromEntries(points.map(point=>[String(point.at),point.value]))),id,version,...guardParams),
        db.prepare(`UPDATE public_metrics SET last_reported_at=MAX(COALESCE(last_reported_at,0),?),stale=CASE WHEN MAX(COALESCE(last_reported_at,0),?)<? THEN 1 ELSE 0 END,error=NULL WHERE id=? AND version=?${guard}`).bind(latest,latest,now-120_000,id,version,...guardParams),
        ...(authority?[db.prepare("UPDATE management_tokens SET last_used_at=? WHERE id=? AND EXISTS(SELECT 1 FROM audit_entries WHERE id=?)").bind(now,authority.id,receipt)]:[]),
      ]);
      return authority?Boolean(result[1].meta.changes):true;
    },
    async due(now: number) { return (await db.prepare(`SELECT ${columns} FROM public_metrics WHERE provider NOT IN ('push','uptime') AND sealed_credentials IS NOT NULL AND pull_after<=? AND (pull_lease_until IS NULL OR pull_lease_until<=?) ORDER BY pull_after,id LIMIT 10`).bind(now,now).all<StoredMetric>()).results; },
    async claim(row: StoredMetric, now: number) { const result=await db.prepare("UPDATE public_metrics SET pull_lease_until=?,pull_after=? WHERE id=? AND version=? AND (pull_lease_until IS NULL OR pull_lease_until<=?)").bind(now+60_000,now+60_000,row.id,row.version,now).run(); return Boolean(result.meta.changes); },
    async finish(row: StoredMetric, error: string | null) { await db.prepare("UPDATE public_metrics SET error=?,pull_lease_until=NULL WHERE id=? AND version=?").bind(error,row.id,row.version).run(); },
    async maintain(now: number) {
      // Minutes leaving the last day leave each public series in the same batch.
      const expired=(await db.prepare("SELECT metric_id AS metricId,bucket FROM metric_points WHERE resolution=60 AND bucket<?").bind(minuteRetentionCutoff(now)).all<{metricId:string;bucket:number}>()).results;
      const unseeded=(await db.prepare("SELECT id FROM public_metrics m WHERE NOT EXISTS(SELECT 1 FROM public_metric_series s WHERE s.metric_id=m.id)").all<{id:string}>()).results;
      const removals=new Map<string,Record<string,null>>();
      for(const {metricId,bucket} of expired) removals.set(metricId,{...removals.get(metricId),[String(bucket)]:null});
      await db.batch([...unseeded.map(({id})=>seedSeries(id)),...retentionStatements(db,now),
        ...[...removals].map(([metricId,patch])=>db.prepare("UPDATE public_metric_series SET points_json=json_patch(points_json,?) WHERE metric_id=?").bind(JSON.stringify(patch),metricId)),
        db.prepare("UPDATE public_metrics SET stale=1 WHERE stale=0 AND last_reported_at<?").bind(now-120_000)]);
    },
    /** One stored series row per public metric, kept with its minute points by write, maintain and update. */
    async publicSeries(): Promise<PublicMetric[]> {
      const rows=await db.prepare(`SELECT m.id,m.component_id AS componentId,m.name,m.unit,m.provider AS source,m.last_reported_at AS lastReportedAt,s.points_json AS pointsJson FROM public_metrics m JOIN components c ON c.id=m.component_id LEFT JOIN public_metric_series s ON s.metric_id=m.id WHERE c.internal=0 ORDER BY m.created_at,m.id LIMIT 10`).all<Omit<PublicMetric,"points"> & {pointsJson:string|null}>();
      return rows.results.map(({pointsJson,...row})=>({...row,points:Object.entries(JSON.parse(pointsJson ?? "{}") as Record<string,number>).map(([at,value])=>({at:Number(at),value})).sort((left,right)=>left.at-right.at)}));
    },
  };
}
