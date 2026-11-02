import assert from 'node:assert/strict';
import { subscriberCsvRows } from './subscriber-management-fixture.mjs';

const channelFields = {
  coverage: 'coverage', committed: 'committed', distinct_committed: 'distinctCommitted',
  provider_accepted: 'providerAccepted', distinct_provider_accepted: 'distinctProviderAccepted',
  delivered: 'delivered', distinct_delivered: 'distinctDelivered', queued: 'queued',
  bounced: 'bounced', complained: 'complained', suppressed: 'suppressed', failed: 'failed',
  first_provider_accepted_at: 'firstProviderAcceptedAt',
};
const postFields = {
  operator_posts_committed: 'committed', operator_posts_accepted: 'accepted',
  operator_posts_rejected: 'rejected', operator_posts_uncertain: 'uncertain', operator_posts_pending: 'pending',
};
const fields = (source, names) => Object.fromEntries(Object.entries(names).map(([column, property]) => [column, source[property]]));

function incidentValues(incident) {
  return {
    incident_id: incident.incidentId, reference: incident.reference, title: incident.title,
    first_accepted_alert_at: incident.firstAcceptedAlertAt, first_public_update_at: incident.firstPublicUpdateAt,
    first_update_latency_ms: incident.firstUpdateLatencyMs, resolution_duration_ms: incident.resolutionDurationMs,
    commitments_kept: incident.commitments.kept, commitments_missed: incident.commitments.missed,
    commitments_pending: incident.commitments.pending, reports_owed: Number(incident.reportOwed),
  };
}

function reachValues(reach, context) {
  return [
    ...reach.channels.map(channel => ({
      ...context, channel: channel.channel, ...fields(channel, channelFields),
      unknown_delivery_updates: reach.unknownDeliveryUpdates,
      failure_numerator: reach.deliveryFailure.failures, failure_denominator: reach.deliveryFailure.denominator,
      failure_rate: reach.deliveryFailure.rate, failure_denominator_label: reach.deliveryFailure.denominatorLabel,
    })),
    ...reach.operatorPosts.map(post => ({
      ...context, scope: `${context.scope}-operator-posts`, channel: post.channel, ...fields(post, postFields),
    })),
  ];
}

function csvValue(value) {
  if (value === null) return 'unknown';
  const text = String(value);
  // Spreadsheet formula input remains text in a downloaded report.
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function assertRecords(records, expected, definitions) {
  const definitionRows = Object.entries(definitions).map(([name, definition]) => ({ scope: 'definition', definition_name: name, definition }));
  const rows = [...expected, ...definitionRows];
  assert.equal(records.length, rows.length, 'the download retains every report scope, channel, operator post and definition');
  const identity = row => [row.scope, row.incident_id ?? '', row.update_id ?? '', row.channel ?? '', row.definition_name ?? ''].join('\u0000');
  const actualByIdentity = new Map(records.map(row => [identity(row), row]));
  assert.equal(actualByIdentity.size, records.length, 'the download has exactly one record for each report identity');
  for (const expectedRow of rows) {
    const key = identity(expectedRow), record = actualByIdentity.get(key);
    assert.ok(record, `download retains report record ${JSON.stringify(key)}`);
    for (const [column, value] of Object.entries(expectedRow)) {
      assert.notEqual(value, undefined, `${column} has a native report value`);
      assert.equal(record[column], csvValue(value), `${JSON.stringify(key)}: ${column} agrees with the native report`);
    }
    for (const [column, value] of Object.entries(record)) {
      if (!(column in expectedRow)) assert.equal(value, '', `${JSON.stringify(key)}: unrelated ${column} stays empty`);
    }
  }
}

async function download(j, path) {
  const response = await j.request(path);
  assert.equal(response.status, 200, 'the native report download succeeds');
  assert.match(response.headers.get('content-type'), /^text\/csv/);
  return subscriberCsvRows(await response.text());
}

export async function assertIncidentCsv(j, incidentId, data) {
  const context = {
    timezone: data.timezone, measured_at: data.measuredAt, incident_id: incidentId,
    reference: data.incident.reference, title: data.incident.title,
  };
  const expected = [
    ...reachValues(data.incident, { ...context, ...incidentValues(data.incident), scope: 'incident' }),
    ...data.updates.flatMap(update => reachValues(update, { ...context, scope: 'update', update_id: update.updateId })),
  ];
  const records = await download(j, `/api/app/incidents/${incidentId}/reach?format=csv`);
  assertRecords(records, expected, data.definitions);
  return records;
}

export async function assertMonthlyCsv(j, data) {
  const context = {
    timezone: data.timezone, measured_at: data.measuredAt, month: data.month,
    cohort_start: data.startsAt, cohort_end: data.endsAt,
  };
  const summary = data.summary;
  const expected = [
    ...reachValues(summary, {
      ...context, scope: 'month', incident_count: summary.incidentCount,
      commitments_kept: summary.commitments.kept, commitments_missed: summary.commitments.missed,
      commitments_pending: summary.commitments.pending, reports_owed: summary.reportsOwed,
      known_first_update_latency_count: summary.knownFirstUpdateLatencyCount,
      unknown_first_update_latency_count: summary.unknownFirstUpdateLatencyCount,
      first_update_latency_total_ms: summary.firstUpdateLatencyTotalMs,
      average_first_update_latency_ms: summary.averageFirstUpdateLatencyMs,
      resolved_duration_count: summary.resolvedDurationCount,
      resolution_duration_total_ms: summary.resolutionDurationTotalMs,
      average_resolution_duration_ms: summary.averageResolutionDurationMs,
    }),
    ...data.incidents.flatMap(incident => reachValues(incident, { ...context, ...incidentValues(incident), scope: 'incident' })),
  ];
  const records = await download(j, `/api/app/communication-performance?month=${data.month}&format=csv`);
  assertRecords(records, expected, data.definitions);
  return records;
}
