#!/usr/bin/env node
/** Documented-format synthetic Sorry responses. No account, credentials,
 * randomness, clock or importer implementation participates in generation.
 * Run Edit Run fleet, 17 November 2026. */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtureRoot = fileURLToPath(new URL('../tests/fixtures/sorry/generated/', import.meta.url));
const created = '2025-01-01T10:00:00.000Z';
const publicOrigin = 'https://status.example.invalid';
const iso = (minutes) => new Date(Date.parse(created) + minutes * 60_000).toISOString();
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const escapePointer = (value) => String(value).replaceAll('~', '~0').replaceAll('/', '~1');

/** Source-only RFC 6901 inventory, deliberately independent of Lamp's reader. */
export function fixtureLeafPaths(value, pointer = '') {
  if (Array.isArray(value)) return value.length
    ? value.flatMap((child, index) => fixtureLeafPaths(child, `${pointer}/${index}`)) : [pointer];
  if (value && typeof value === 'object') return Object.keys(value).length
    ? Object.entries(value).flatMap(([key, child]) => fixtureLeafPaths(child, `${pointer}/${escapePointer(key)}`)) : [pointer];
  return [pointer];
}

function components() {
  return Array.from({ length: 56 }, (_, index) => ({
    id: 1000 + index,
    name: index === 0 ? `synthetic-lamp-1 group ${'g'.repeat(135)}`
      : index === 4 ? `synthetic-lamp-5 service ${'n'.repeat(135)}` : `synthetic-lamp-${index + 1}`,
    description: index === 4 ? `synthetic-lamp-5 description ${'d'.repeat(680)}` : `Synthetic service ${index + 1}; no production data.`,
    state: 'operational',
    parent_id: index === 1 ? 1000 : index < 4 ? null
      : index < 17 ? 1001 : index < 30 ? 1000 : index < 43 ? 1002 : 1003,
    position: index + 1, created_at: created, updated_at: created,
    ...(index === 4 ? { future_metadata: { nested: { 'owner/note~text': 'synthetic-lamp-5 unknown field', flags: [true, false], empty: {} } } } : {}),
  }));
}

function notice(index, rows, isPublic) {
  const id = 2000 + index, planned = index >= 40 && index < 50, general = index >= 50;
  const type = general ? 'general' : planned ? 'planned' : 'unplanned';
  const future = index === 48 || index === 49;
  const start = future ? '2099-01-01T10:00:00.000Z' : iso(index * 60);
  const end = future ? '2099-01-01T11:00:00.000Z' : iso(index * 60 + 30);
  const state = general ? undefined : index === 39 ? 'recovering' : index === 38 ? 'false_alarm'
    : index === 48 ? 'scheduled' : index === 49 ? 'cancelled' : planned ? 'complete' : 'resolved';
  const subject = index === 0 ? `synthetic-lamp-1 incident ${'s'.repeat(280)}` : `synthetic-lamp-${index + 1} ${type} notice`;
  const address = `${publicOrigin}/notices/synthetic-lamp-${index + 1}`;
  const updateRows = [0, 1].map((step) => ({
    id: 30000 + index * 10 + step,
    content: index === 0 && step === 0 ? `Synthetic long update ${'message '.repeat(1600)}`
      : step === 0 ? `Synthetic ${type} notice ${index + 1}: review is underway.` : `Synthetic ${type} notice ${index + 1}: this is the final saved update.`,
    ...(isPublic && !general ? { state: step === 0 ? planned ? 'underway' : 'investigating' : state } : {}),
    created_at: iso(index * 60 + step * 30), updated_at: iso(index * 60 + step * 30),
    ...(!isPublic ? { should_publish: step === 0, link: `${address}#update-${30000 + index * 10 + step}` } : {}),
    ...(index === 0 && step === 0 ? { future_metadata: { delivery: { labels: ['synthetic-lamp-1', 'synthetic-lamp-2'] } } } : {}),
  }));
  const impacted = general ? [] : index === 0 ? [rows[0], rows[4]] : [rows[4 + index % 52]];
  return {
    id, type, subject, ...(state ? { state } : {}),
    timeline_state: future ? 'future' : index === 39 ? 'present' : 'past_distant',
    ...(isPublic ? { url: address } : { link: address, synopsis: updateRows[0].content }),
    created_at: iso(index * 60), updated_at: iso(index * 60 + 30),
    ...(!general ? { began_at: future ? null : start, ended_at: future || index === 39 ? null : end } : {}),
    ...(planned ? { begins_at: start, ends_at: end, ...(!isPublic ? { should_automate_schedule: true } : {}) } : {}),
    tag_list: ['synthetic-lamp-1', planned ? 'maintenance' : general ? 'information' : 'incident'],
    ...(isPublic ? { impact_time: { seconds: future ? 0 : 1800, words: future ? '0 seconds' : '30 minutes' }, links: { self: `/api/v1/notices/${id}` } } : {}),
    components: impacted.map(({ id: componentId, name, description, state: componentState, parent_id, created_at, updated_at }) => ({
      id: componentId, name, description, state: componentState, parent_id, created_at, updated_at,
    })),
    updates: updateRows,
    ...(isPublic ? { latest_update: updateRows.at(-1) } : {}),
    ...(index === 0 ? { future_metadata: { nested: { labels: ['synthetic-lamp-1'], empty: null } } } : {}),
  };
}

function subscribers() {
  return Array.from({ length: 1003 }, (_, index) => {
    const row = {
      id: 40000 + index,
      email: `synthetic-lamp-${index + 1}@example.invalid`,
      notify_by_email: true,
      phone_number: index === 0 ? '+12025550123' : null,
      slack_webhook_url: null, microsoft_teams_url: null,
      notify_by_phone_number: index === 0,
      notify_by_slack_webhook_url: false,
      notify_by_legacy_slack_oauth_token: false,
      notify_by_microsoft_teams_url: false,
      notify_by_google_chat_space: false,
      first_name: `Synthetic ${index + 1}`, last_name: 'Lamp', nickname: `synthetic-lamp-${index + 1}`,
      company: 'Synthetic Lamp Company', tag_list: ['synthetic-lamp-1', index % 2 ? 'billing' : 'operations'],
      avatar_url: `https://assets.example.invalid/synthetic-lamp-${index + 1}.png`,
      components: [{ id: 1004 + index % 52 }],
      created_at: created, updated_at: created,
      ...(index === 0 ? { future_metadata: { preferences: { palette: ['amber', 'blue'], empty: [] } } } : {}),
    };
    if (index === 1) row.notify_by_email = false;
    if (index >= 2 && index <= 4) { row.email = null; row.notify_by_email = false; }
    if (index === 2) { row.slack_webhook_url = 'https://chat.example.invalid/synthetic-lamp-3'; row.notify_by_slack_webhook_url = true; }
    if (index === 3) { row.microsoft_teams_url = 'https://chat.example.invalid/synthetic-lamp-4'; row.notify_by_microsoft_teams_url = true; }
    if (index === 4) { row.google_chat_space = 'spaces/synthetic-lamp-5'; row.notify_by_google_chat_space = true; }
    if (index === 5) row.confirmed = false;
    if (index === 6) row.unsubscribed = true;
    if (index === 7) row.components = [{ id: 999999 }];
    if (index === 8) row.email = 'synthetic-lamp-9-invalid-address';
    if (index === 9) delete row.components;
    return row;
  });
}

function collection(files, mode, stem, rows, size) {
  const pages = Math.ceil(rows.length / size);
  for (let index = 0; index < pages; index++) {
    const chunk = rows.slice(index * size, (index + 1) * size), filename = `sorry-${stem}${index ? `-${index + 1}` : ''}.json`;
    files.set(`${mode}/${filename}`, mode === 'public' ? {
      [stem]: chunk,
      meta: { count: chunk.length, total_count: rows.length, next_page: index + 1 < pages ? `/api/v1/${stem}?page=${index + 2}` : null },
    } : { response: chunk, count: chunk.length });
  }
}

export function documentedSorryFixture() {
  const files = new Map(), rows = components();
  const page = {
    id: 'synthetic-lamp-1', name: 'Synthetic Lamp service status', endpoint: 'synthetic-lamp-1.sorryapp.com',
    state: 'operational', timezone: 'America/New_York', support_email: 'synthetic-lamp-1@example.invalid',
    support_telephone: '+12025550123', support_url: 'https://help.example.invalid/synthetic-lamp-1',
    visible_to_search: false, meta_title: 'Synthetic Lamp status', meta_description: 'Generated fixture, not a real export.',
    google_analytics_id: null, timeline_threshold: 604800, timeline_threshold_in_days: 7,
    timeline_sort_order: 'asc', locale: 'en',
    send_notifications_by_email: true, send_notifications_by_sms: true, send_notifications_by_slack: true,
    send_notifications_by_microsoft_teams: true, send_notifications_by_twitter: false,
    created_at: created, updated_at: created,
    future_metadata: { nested: { owner: 'synthetic-lamp-1', empty: {}, labels: ['synthetic-lamp-1'] } },
  };
  files.set('authenticated/sorry-page.json', { response: page });
  // Management components/notices document count envelopes, without public pagination metadata.
  collection(files, 'authenticated', 'components', rows, 56);
  const authenticatedNotices = Array.from({ length: 53 }, (_, index) => notice(index, rows, false));
  const publicNotices = Array.from({ length: 53 }, (_, index) => notice(index, rows, true));
  const lists = (notices) => notices.map(({ components: omittedComponents, updates: omittedUpdates, ...basic }) => basic);
  collection(files, 'authenticated', 'notices', lists(authenticatedNotices), 53);
  for (const row of authenticatedNotices) {
    if (row.id === 2000) {
      const { updates, ...detail } = row;
      files.set(`authenticated/sorry-notice-${row.id}.json`, { response: detail });
      files.set(`authenticated/sorry-notice-${row.id}-updates.json`, { response: updates, count: updates.length });
    } else files.set(`authenticated/sorry-notice-${row.id}.json`, { response: row });
  }
  collection(files, 'authenticated', 'subscribers', subscribers(), 500);
  files.set('public/sorry-status.json', { page: {
    name: 'Synthetic Lamp service status', state: 'operational', state_text: 'Synthetic systems are operational.',
    url: publicOrigin, links: { components: { href: '/v1/components', count: 56 }, notices: { href: '/v1/notices', count: 53 } },
    created_at: created, updated_at: created,
    future_metadata: { nested: { label: 'synthetic-lamp-1', empty: [] } },
  } });
  const publicComponents = rows.map((row, index) => ({
    ...row,
    metrics_summary: index === 4 ? {
      timeframe_start: '2025-01-01', timeframe_end: '2025-01-31',
      percentage_uptime: { percent: 99.5, words: '99.50%' },
      url: `${publicOrigin}/components/synthetic-lamp-5/metrics`,
    } : null,
    links: { children: { href: `/api/v1/components?filter[parent_id_eq]=${row.id}`, count: rows.filter((child) => child.parent_id === row.id).length } },
  }));
  collection(files, 'public', 'components', publicComponents, 25);
  collection(files, 'public', 'notices', lists(publicNotices), 25);
  for (const row of publicNotices) files.set(`public/sorry-notice-${row.id}.json`, { notice: row });
  files.set('unsupported/sorry-brand.json', { response: {
    color_state_ok: '#27ae60', color_state_warning: '#e67e22', color_state_info: '#2980b9', color_state_alert: '#f1c40f',
    color_navbar_background: 'rgba(0,0,0,0.01)', color_navbar_links: '#2c3e50',
    color_header_background: '#F7F8F9', color_header_links: '#2980b9', color_header_text: '#2c3e50',
    color_body_background: '#FFFFFF', color_body_links: '#2980b9', color_body_text: '#2c3e50',
    created_at: created, updated_at: created,
  } });
  files.set('unsupported/sorry-custom-domain.json', { response: { type: 'CNAME', from: 'status.example.invalid', to: 'synthetic-lamp-1.sorryapp.com', created_at: created, updated_at: created } });
  files.set('unsupported/sorry-notice-templates.json', { response: [{ id: 'synthetic-lamp-1', name: 'Synthetic incident template', subject: 'synthetic-lamp-1 notice template', initial_comment: 'Synthetic template text.', created_at: created, updated_at: created }], count: 1, pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 } });
  files.set('unsupported/sorry-update-templates.json', { response: [{ id: 'synthetic-lamp-1', name: 'Synthetic progress template', content: 'synthetic-lamp-1 progress template', created_at: created, updated_at: created }], count: 1, pagination: { current: 1, previous: null, next: null, per_page: 25, pages: 1, count: 1 } });
  files.set('unsupported/sorry-component-1004-metrics.json', {
    component: { id: '1004', name: 'synthetic-lamp-5' }, timeframe_start: '2025-01-01', timeframe_end: '2025-01-31',
    percentage_uptime: { percent: 99.5, words: '99.50%', calculation: '100 - ((total_impact_time / total_time) * 100)' },
    mean_time_to_recovery: { seconds: 1800, words: '30 minutes', calculation: 'total_impact_time / notices.count' },
    mean_time_between_failures: { seconds: 2590200, words: '29 days', calculation: '(total_time - total_impact_time) / notices.count' },
    url: `${publicOrigin}/components/synthetic-lamp-5/metrics`,
  });
  return files;
}

export function expectedSorryInventory(files = documentedSorryFixture()) {
  return {
    schema: 1, provenance: 'unsigned synthetic documented-format fixture; not an export from an account',
    pageId: 'synthetic-lamp-1', asOf: '2026-11-17T00:00:00.000Z',
    census: {
      sourceComponentRows: 56, nativeComponents: 52, nativeGroups: 4,
      sourceNotices: 53, unplannedNotices: 40, plannedNotices: 10, generalNotices: 3,
      nativeIncidents: 43, nativeMaintenance: 10, sourceUpdates: 106,
      sourceSubscribers: 1003, eligibleHeldEmailSubscribers: 994, skippedSubscribers: 9,
      subscriberPageSizes: [500, 500, 3], publicComponentPageSizes: [25, 25, 6], publicNoticePageSizes: [25, 25, 3],
      parentIds: ['1000', '1001', '1002', '1003'], skippedSubscriberIds: ['40001', '40002', '40003', '40004', '40005', '40006', '40007', '40008', '40009'],
    },
    // Exact source path census is computed directly from generated source values,
    // never from the importer, a plan, a report or the report's classifications.
    paths: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => [name, fixtureLeafPaths(value)])),
    cases: [
      { file: 'authenticated/sorry-components.json', path: '/response/0/name', expected: 'changed', reason: 'Parent group name exceeds native length.' },
      { file: 'authenticated/sorry-components.json', path: '/response/4/name', expected: 'changed', reason: 'Component name exceeds native length.' },
      { file: 'authenticated/sorry-components.json', path: '/response/4/description', expected: 'changed', reason: 'Component description exceeds native length.' },
      { file: 'authenticated/sorry-components.json', path: '/response/4/future_metadata/nested/owner~1note~0text', expected: 'raw-only', reason: 'Unknown nested extension must be named.' },
      { file: 'authenticated/sorry-page.json', path: '/response/timezone', expected: 'raw-only', reason: 'Source page settings are not automatically applied.' },
      { file: 'authenticated/sorry-page.json', path: '/response/support_email', expected: 'raw-only', reason: 'Source support details are not automatically applied.' },
      { file: 'authenticated/sorry-notice-2000.json', path: '/response/subject', expected: 'changed', reason: 'Incident title exceeds native length.' },
      { file: 'authenticated/sorry-subscribers.json', path: '/response/0/phone_number', expected: 'deleted', reason: 'Phone channel value must not be retained.' },
      { file: 'authenticated/sorry-subscribers.json', path: '/response/2/slack_webhook_url', expected: 'deleted', reason: 'Chat access capability must not be retained.' },
      { file: 'public/sorry-components.json', path: '/components/4/metrics_summary/percentage_uptime/percent', expected: 'raw-only', reason: 'Source metrics summary is not native availability history.' },
    ],
    resourceGaps: [
      { file: 'sorry-brand.json', resource: 'branding', expected: 'refused', nextAction: 'Recreate branding in Lamp Settings.' },
      { file: 'sorry-custom-domain.json', resource: 'custom domain', expected: 'refused', nextAction: 'Follow Lamp hostname cutover; do not reuse source DNS instructions.' },
      { file: 'sorry-notice-templates.json', resource: 'notice templates', expected: 'refused', nextAction: 'Recreate required notice templates in Lamp.' },
      { file: 'sorry-update-templates.json', resource: 'update templates', expected: 'refused', nextAction: 'Recreate required update text in Lamp.' },
      { file: 'sorry-component-1004-metrics.json', resource: 'component metrics', expected: 'refused', nextAction: 'Retain source metrics separately; native metrics import is unavailable.' },
    ],
  };
}

export async function generateSorryFixture(outputDirectory = fixtureRoot) {
  const directory = resolve(outputDirectory), files = documentedSorryFixture();
  files.set('expected-inventory.json', expectedSorryInventory(files));
  files.set('sources.json', {
    author: 'Run Edit Run fleet', reviewedAt: '2026-11-17', provenance: 'Documentation-derived synthetic examples; no real account, export, provider request, signature or verification promotion.',
    references: [
      { url: 'https://docs.sorryapp.com/v1/status-pages', facts: 'REST page response object; timezone, support, metadata, locale and notification settings.' },
      { url: 'https://docs.sorryapp.com/v1/components', facts: 'REST response/count envelope; numeric component identities, recursive parent_id, order, state, description and timestamps.' },
      { url: 'https://docs.sorryapp.com/v1/notices', facts: 'REST notice types, lifecycles, timing, synopsis, tags, scheduled automation and include=components,updates.' },
      { url: 'https://docs.sorryapp.com/v1/notice-updates', facts: 'REST progress updates document content, should_publish, link and timestamps; authored lifecycle is absent.' },
      { url: 'https://docs.sorryapp.com/v1/subscribers', facts: 'REST subscribers use 500 records per page; component preferences, notification channels and profile metadata.' },
      { url: 'https://status.sorryapp.com/api', facts: 'Documentation page only: public page/components/notices/detail envelopes, metrics summaries, pagination of at most25 and same-origin next_page.' },
      { url: 'https://docs.sorryapp.com/v1/branding', facts: 'Separate /brand response resource; explicitly refused fixture.' },
      { url: 'https://docs.sorryapp.com/v1/custom-domain', facts: 'Separate /custom_domain response resource; explicitly refused fixture.' },
      { url: 'https://docs.sorryapp.com/v1/notice-templates', facts: 'Separate notice_templates response and pagination; explicitly refused fixture.' },
      { url: 'https://docs.sorryapp.com/v1/update-templates', facts: 'Separate update_templates response and pagination; explicitly refused fixture.' },
    ],
    intentionalSyntheticExtensions: [
      'future_metadata nested structures, including RFC6901 slash/tilde escaping and empty arrays/objects, are invented forward-compatibility probes; they are not documented Sorry fields.',
      'confirmed=false and unsubscribed=true are synthetic safety probes in passthrough subscriber fields, not claims about a documented consent authority.',
      'One subscriber preference references a missing component, one omits preferences and one email is invalid; these are refusal probes.',
      'Unusually long documented text fields exercise visible truncation accounting rather than asserting provider size limits.',
      'Filename conventions are Lamp saved-response upload conventions; resources and envelopes follow the cited incumbent documentation.',
    ],
    use: 'Upload only one of authenticated/ or public/. Add each unsupported/ file separately to prove explicit refusal; expected-inventory.json, manifest.json and sources.json are independent test metadata, not provider responses.',
  });
  const rows = [];
  for (const [name, value] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    const target = resolve(directory, name), text = json(value);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, text);
    rows.push({ path: name, bytes: Buffer.byteLength(text), sha256: hash(text) });
  }
  const manifest = { schema: 1, provenance: 'unsigned synthetic; no live provider reads or signature', files: rows };
  await writeFile(resolve(directory, 'manifest.json'), json(manifest));
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === '--out' && args[1])) throw new Error('usage: node scripts/generate-sorry-fixture.mjs [--out DIRECTORY]');
  const manifest = await generateSorryFixture(args[1]);
  console.log(`Generated ${manifest.files.length} deterministic Sorry synthetic fixture files; not a real export.`);
}
