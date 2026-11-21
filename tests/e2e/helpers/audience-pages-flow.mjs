import assert from 'node:assert/strict';
import { legacyPublication, openAudienceInstallations } from './audience-archive-fixture.mjs';
import { eventually, openStatusJourney } from './status-journey.mjs';
import { themeHeaderImage } from './theme-fixture.mjs';

const configuration = '/api/app/status-pages';
const staffPath = 'staff';
const audiencePath = 'acme';
const responses = new Map([
  ['/', 'text/html'],
  ['/history', 'text/html'],
  ['/feed.atom', 'application/atom+xml'],
  ['/feed.rss', 'application/rss+xml'],
  ['/widget.js', 'application/javascript'],
  ['/badge.svg', 'image/svg+xml'],
  ['/badge.json', 'application/json'],
  ['/api/public/status', 'application/json'],
  ['/api/public/v1/components', 'application/json'],
  ['/api/public/v1/incidents', 'application/json'],
  ['/api/public/v1/maintenance', 'application/json'],
]);
const legacySurfaces = [
  ...responses.keys(),
  '/history.atom', '/history.rss', '/embed/script.js', '/maintenance.ics',
  '/api/v2/summary.json', '/api/v2/incidents.json', '/api/v2/incidents/unresolved.json',
  '/api/v2/incidents/resolved.json', '/api/v2/scheduled-maintenances.json',
  '/api/v2/scheduled-maintenances/upcoming.json', '/api/v2/scheduled-maintenances/active.json',
];

function requireBody(body, includes, excludes, label) {
  for (const value of includes) assert.ok(body.includes(value), `${label} contains ${value}`);
  for (const value of excludes) assert.ok(!body.includes(value), `${label} excludes ${value}`);
}

function snapshotIdentity(atom) {
  const id = /<id>([^<]+)<\/id>/.exec(atom)?.[1];
  assert.match(id ?? '', /^urn:lamp:.+/);
  return id;
}

export function privateStatusUrl(page, path = '/') {
  const base = new URL(page.url);
  return new URL(base.pathname.replace(/\/$/, '') + path, base.origin).href;
}

export async function addStatusPage(j, {path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled = true}) {
  const input = {path, kind, pageName, tagline, accentColor, timezone, componentIds, footerCreditEnabled};
  const { page } = await j.json(configuration, 'POST', input, 201);
  assert.equal(new URL(page.url).origin, j.appOrigin);
  assert.equal(new URL(page.url).pathname.replace(/\/$/, ''), `/status-pages/${path}`);
  assert.deepEqual(Object.fromEntries(Object.keys(input).map(key => [key, page[key]])), input);
  return page;
}

async function representation(j, page, path, privateRead = true) {
  const response = privateRead
    ? await j.request(privateStatusUrl(page, path))
    : await j.publicResponse(path);
  assert.equal(response.status, 200, privateRead ? `${page.path} ${path}` : path);
  if (responses.has(path)) assert.ok(response.headers.get('content-type').startsWith(responses.get(path)), path);
  if (privateRead) {
    assert.match(response.headers.get('cache-control') ?? '', /\bprivate\b/);
    assert.match(response.headers.get('cache-control') ?? '', /\bno-store\b/);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  return { body: await response.text(), version: response.headers.get('x-lamp-snapshot-version'), etag: response.headers.get('etag') };
}

async function waitFor(j, page, path, marker) {
  return eventually(async () => {
    const response = page ? await j.request(privateStatusUrl(page, path)) : await j.publicResponse(path);
    return { status: response.status, body: await response.text() };
  }, result => result.status === 200 && result.body.includes(marker), `${marker} reaches ${page?.path ?? "Public"} ${path}`);
}

async function subscribePublic(j) {
  const email = ['synthetic-lamp-audience-reader', 'example.test'].join('@');
  const subscription = await j.raw(new URL('/subscribe', j.publicOrigin).href, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email }),
  });
  assert.equal(subscription.status, 202);
  const invite = await eventually(() => j.messages.find(message => message.to.includes(email)), Boolean, 'a real public subscriber receives the confirmation');
  const confirm = invite.text.match(/https?:\/\/\S+\/confirm-subscription\/\S+/)?.[0];
  assert.ok(confirm);
  assert.equal((await j.raw(confirm)).status, 200);
  return email;
}

async function publicationInventory(j, table, column, id) {
  return (await j.db.prepare(`SELECT id FROM ${table} WHERE ${column} = ? ORDER BY id`).bind(id).all()).results;
}

async function deniedWithoutLookup(j, url, marker, validator, revokedCookie) {
  const headers = new Headers({ 'If-None-Match': validator ?? '*' });
  if (revokedCookie) headers.set('Cookie', revokedCookie);
  const response = await j.raw(url, { headers });
  assert.equal(response.status, 401, url);
  assert.equal(response.headers.get('x-test-r2-reads'), '0', 'the operator authorization boundary is before stored artifact lookup');
  assert.equal(response.headers.get('x-lamp-snapshot-version'), null);
  assert.equal(response.headers.get('etag'), null);
  assert.doesNotMatch(await response.text(), new RegExp(marker));
}

export async function audiencePagesFlow() {
  const installations = await openAudienceInstallations();
  const options = { pageHost: 'localhost', extraBindings: { LAMP_TEST_AUDIENCE_READS: 'true' } };
  let j;
  try {
    j = await openStatusJourney({ ...options, installation: installations.source });
    const publicBrand = (await j.json('/api/app/page-settings')).settings;
    const a = await j.component('Checkout service');
    const b = await j.component('Workspace console');
    const internal = await j.component('Restricted internal system', { internal: true });
    await j.visible('/', a.name);
    const beforePublicFeed = snapshotIdentity(await j.publicText('/feed.atom'));
    assert.equal(beforePublicFeed, legacyPublication.feedIdentity, 'migration preserves the installed public feed identity');
    for (const { path, wording } of [legacyPublication.incident, legacyPublication.maintenance]) {
      requireBody(await j.publicText(path), [wording], [], 'the original public permalink still serves the migrated record');
    }
    const beforePublicPage = (await j.json(configuration)).pages.find(page => page.path === 'public');
    assert.equal(beforePublicPage.kind, 'public');
    assert.equal(new URL(beforePublicPage.url).href, new URL('/', j.publicOrigin).href);
    assert.deepEqual([...beforePublicPage.componentIds].sort(), [legacyPublication.componentId, a.id, b.id].sort());
    assert.equal(beforePublicPage.pageName, publicBrand.pageName);

    const staffSettings = { path: staffPath, kind: 'staff', pageName: 'Internal operations', tagline: 'Signals for our operators', accentColor: '#75499b', timezone: ['Europe', 'Stockholm'].join('/'), componentIds: [a.id, b.id], footerCreditEnabled: false };
    const staff = await addStatusPage(j, staffSettings);
    const audienceSettings = { path: audiencePath, kind: 'audience', pageName: 'Acme service status', tagline: 'Signals for Acme', accentColor: '#394785', timezone: 'UTC', componentIds: [b.id] };
    const audience = await addStatusPage(j, audienceSettings);
    const renamed = { pageName: staffSettings.pageName, tagline: 'Operations team service health', accentColor: '#914486', timezone: staffSettings.timezone, componentIds: staffSettings.componentIds, footerCreditEnabled: false };
    const { page: savedStaff } = await j.json(`${configuration}/${staff.path}`, 'PUT', renamed);
    assert.equal(savedStaff.url, staff.url, 'editing branding leaves the page address stable');
    assert.deepEqual(Object.fromEntries(Object.keys(renamed).map(key => [key, savedStaff[key]])), renamed);
    const logo = themeHeaderImage();
    const form = new FormData();
    form.append('logo', new Blob([logo], { type: 'image/png' }), 'synthetic-lamp.png');
    const logoEndpoint = `${configuration}/${staff.path}/logo`;
    const multipart = new Request(j.appOrigin + logoEndpoint, { method: 'POST', body: form });
    const upload = await j.request(logoEndpoint, {
      method: 'POST', headers: { 'Content-Type': multipart.headers.get('Content-Type') }, body: await multipart.arrayBuffer(),
    });
    assert.equal(upload.status, 200, await upload.clone().text());
    assert.equal((await upload.json()).page.logoUrl, privateStatusUrl(staff, '/assets/logo'));
    const verifyLogo = async page => {
      const logoResponse = await j.request(privateStatusUrl(page, '/assets/logo'));
      assert.equal(logoResponse.status, 200);
      assert.equal(logoResponse.headers.get('content-type'), 'image/png');
      assert.match(logoResponse.headers.get('cache-control'), /private, no-store/);
      assert.deepEqual(Buffer.from(await logoResponse.arrayBuffer()), logo, 'the selected page serves its uploaded image bytes');
    };
    await verifyLogo(staff);
    assert.equal((await j.publicResponse('/assets/logo')).status, 404);
    assert.equal((await j.request(privateStatusUrl(audience, '/assets/logo'))).status, 404);
    const listed = (await j.json(configuration)).pages;
    assert.deepEqual(listed.map(page => page.path).sort(), [audiencePath, staffPath, 'public'].sort());
    assert.equal(listed.find(page => page.path === staffPath).url, staff.url);
    assert.equal(listed.find(page => page.path === audiencePath).url, audience.url);
    assert.equal(listed.find(page => page.path === 'public').url, beforePublicPage.url);

    await waitFor(j, staff, '/', renamed.tagline);
    await waitFor(j, audience, '/', audienceSettings.tagline);
    const staffRoot = await representation(j, staff, '/');
    const audienceRoot = await representation(j, audience, '/');
    requireBody(staffRoot.body, [renamed.pageName, renamed.tagline, a.name, b.name], [internal.name, legacyPublication.component, audienceSettings.pageName, 'Powered by Lamp'], 'Staff snapshot branding and selection');
    requireBody(audienceRoot.body, [audienceSettings.pageName, audienceSettings.tagline, b.name, 'Powered by Lamp'], [a.name, internal.name, legacyPublication.component, renamed.pageName], 'Acme snapshot branding and selection');
    assert.equal(JSON.parse((await representation(j, staff, '/api/public/v1')).body).page.timezone, renamed.timezone);
    for (const [page, accent] of [[staff, renamed.accentColor], [audience, audienceSettings.accentColor]]) {
      const { body: css } = await representation(j, page, '/assets/status-page.css');
      assert.ok(css.includes(accent), page.path + ' supplies its configured brand color');
    }
    const publicAfterSettings = await j.publicText('/');
    requireBody(publicAfterSettings, [publicBrand.pageName, a.name, b.name], [renamed.tagline, audienceSettings.tagline, internal.name], 'Public branding and visibility');
    assert.equal(snapshotIdentity(await j.publicText('/feed.atom')), beforePublicFeed);
    const staffFeed = snapshotIdentity((await representation(j, staff, '/feed.atom')).body);
    const audienceFeed = snapshotIdentity((await representation(j, audience, '/feed.atom')).body);
    assert.equal(new Set([beforePublicFeed, staffFeed, audienceFeed]).size, 3, 'each page has a stable distinct feed identity');
    console.info('PROBE AUD-001 1: native Status Pages Settings -> stable Public, Staff and Acme paths, branding and component selection');

    const reader = await subscribePublic(j);
    const shared = await j.incident('Checkout slow for customers', [a], {
      components: [{ componentId: a.id, state: 'Degraded performance', relationship: 'Primary' }],
    });
    const sharedImpact = 'Shared wording: Checkout took longer for a subset of customers.';
    await j.save(shared.id, { customerImpact: sharedImpact });
    const beforePublish = await j.read(shared.id);
    assert.deepEqual(beforePublish.updates, []);
    await j.publish(shared.id, { channels: ['email'], pagePaths: ['public', 'unknown-page'] }, 400);
    const afterRefusal = await j.read(shared.id);
    assert.equal(afterRefusal.draft.id, beforePublish.draft.id);
    assert.deepEqual(afterRefusal.updates, []);
    const { update: sharedUpdate } = await j.publish(shared.id, { channels: ['email'], pagePaths: ['public', staffPath] });
    assert.deepEqual((await j.read(shared.id)).updates.map(({ id }) => id), [sharedUpdate.id], 'one native publication creates exactly one update');

    const sharedPermalink = `/incidents/${shared.reference}`;
    for (const page of [null, staff]) {
      await waitFor(j, page, sharedPermalink, sharedImpact);
      const read = async path => page ? (await representation(j, page, path)).body : j.publicText(path);
      for (const path of ['/', sharedPermalink, '/feed.atom', '/feed.rss', '/widget.js', '/api/public/status', '/api/public/v1/incidents']) {
        const specificIdentity = ['/feed.atom', '/feed.rss', '/api/public/v1/incidents'].includes(path) ? [sharedUpdate.id] : [];
        requireBody(await read(path), [shared.title, sharedImpact, ...specificIdentity], [], `${page?.path ?? "Public"} ${path}`);
      }
      const permalink = page ? new URL(privateStatusUrl(page, sharedPermalink)).pathname : sharedPermalink;
      assert.ok((await read('/')).includes(`href="${permalink}"`), 'the page links to its own copy of the incident');
      assert.ok((await read('/feed.atom')).includes(page ? privateStatusUrl(page, sharedPermalink) : new URL(sharedPermalink, j.publicOrigin).href), 'the feed links to its own copy of the incident');
      assert.equal(JSON.parse(await read('/badge.json')).message, 'Slow');
      assert.match(await read('/badge.svg'), />Slow<\/text>/);
    }
    assert.ok(!(await representation(j, audience, '/feed.atom')).body.includes(sharedUpdate.id));
    assert.equal((await j.request(privateStatusUrl(audience, sharedPermalink))).status, 404);
    assert.equal((await publicationInventory(j, 'notification_deliveries', 'incident_update_id', sharedUpdate.id)).length, 1);
    await j.tick(Date.now());
    await eventually(() => j.messages.find(message => message.to.includes(reader) && message.text.includes(sharedImpact)), Boolean, 'the eligible public subscriber receives the shared publication');
    console.info('PROBE AUD-001 3: one native incident publish selecting Public and Staff -> same update in both snapshots and one public subscriber delivery');

    const now = Date.now();
    const schedule = (title, customerImpact, componentId, pagePaths) => j.json('/api/app/maintenance', 'POST', {
      title, affectedAudience: 'Operators using the scheduled service', customerImpact,
      startsAt: new Date(now + 3_600_000).toISOString(), endsAt: new Date(now + 7_200_000).toISOString(),
      componentIds: [componentId], pagePaths, autoStart: false, autoComplete: false,
    }, 201);
    const sharedWorkImpact = 'Both audiences have the checkout upgrade window.';
    const { maintenance: sharedWork } = await schedule('Shared checkout upgrade', sharedWorkImpact, a.id, ['public', staffPath]);
    const sharedWorkLink = `/maintenance/${sharedWork.reference}`;
    for (const page of [null, staff]) {
      await waitFor(j, page, sharedWorkLink, sharedWorkImpact);
      const list = page ? (await representation(j, page, '/api/public/v1/maintenance')).body : await j.publicText('/api/public/v1/maintenance');
      const matches = JSON.parse(list).data.filter(record => record.id === sharedWork.id);
      assert.equal(matches.length, 1);
      assert.equal(matches[0].reference, sharedWork.reference);
      assert.equal(matches[0].notices.length, 1);
    }
    assert.equal((await j.request(privateStatusUrl(audience, sharedWorkLink))).status, 404);
    console.info('PROBE AUD-001 2: one native maintenance create selecting Public and Staff -> the same window and notice in both published APIs and permalinks');

    const confidential = await j.incident('Operator-only key rotation disruption', [b]);
    const confidentialImpact = 'Synthetic private wording: rotation invalidated the internal session pool.';
    await j.save(confidential.id, { customerImpact: confidentialImpact });
    const { update: confidentialUpdate } = await j.publish(confidential.id, { channels: ['email', 'webhook'], pagePaths: [staffPath] });
    const privateWorkImpact = 'Synthetic private wording: replace the restricted console gateway.';
    const { maintenance: privateWork } = await schedule('Operator-only gateway upgrade', privateWorkImpact, b.id, [staffPath]);
    await j.json(`/api/app/maintenance/${privateWork.id}/start`, 'POST', {});
    const privateWorkLink = `/maintenance/${privateWork.reference}`;
    const confidentialPermalink = `/incidents/${confidential.reference}`;
    const staffOnly = [confidential.title, confidentialImpact, confidential.reference, confidentialUpdate.id, privateWork.title, privateWorkImpact, privateWork.reference];
    await waitFor(j, staff, confidentialPermalink, confidentialImpact);
    await waitFor(j, staff, privateWorkLink, privateWorkImpact);
    await waitFor(j, staff, '/api/public/status', privateWork.title);
    await j.save(confidential.id, { customerImpact: 'The internal session pool is recovering.' });
    await j.publish(confidential.id, { pagePaths: ['public', staffPath] }, 409);
    assert.deepEqual((await j.read(confidential.id)).updates.map(({ id }) => id), [confidentialUpdate.id], 'a refused scope change cannot publish a second update');
    assert.deepEqual((await j.read(confidential.id)).pagePaths, [staffPath]);
    for (const path of ['/', '/feed.atom', '/feed.rss', '/widget.js', '/api/public/status']) {
      requireBody((await representation(j, staff, path)).body, [confidential.title, privateWork.title], [], `populated Staff ${path}`);
    }
    assert.equal(JSON.parse((await representation(j, staff, '/badge.json')).body).message, 'Down');
    assert.match((await representation(j, staff, '/badge.svg')).body, />Down<\/text>/);
    assert.equal(JSON.parse(await j.publicText('/badge.json')).message, 'Slow', 'Staff-only component claims never raise the public badge');
    assert.equal(JSON.parse((await representation(j, audience, '/badge.json')).body).message, 'Working');
    assert.equal(snapshotIdentity((await representation(j, staff, '/feed.atom')).body), staffFeed);
    assert.equal(snapshotIdentity((await representation(j, audience, '/feed.atom')).body), audienceFeed);
    const catalogue = JSON.parse(await j.publicText('/api/public/v1/components')).data;
    const consoleService = catalogue.find(row => row.id === b.id);
    assert.equal(consoleService.state, 'Operational', 'the actual public component stays operational');
    for (const path of [...legacySurfaces, `/components/${consoleService.slug}/feed.atom`, `/components/${consoleService.slug}/feed.rss`, `/components/${consoleService.slug}/badge.svg`]) {
      requireBody(await j.publicText(path), [], staffOnly, `Public ${path}`);
    }
    for (const path of [confidentialPermalink, privateWorkLink]) {
      const response = await j.publicResponse(path);
      assert.equal(response.status, 404, path);
      requireBody(await response.text(), [], staffOnly, `Public ${path}`);
      const unselected = await j.request(privateStatusUrl(audience, path));
      assert.equal(unselected.status, 404, path);
      requireBody(await unselected.text(), [], staffOnly, `Acme ${path}`);
    }
    const publicFollow = await j.raw(new URL('/subscribe/incident', j.publicOrigin).href, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ incidentId: confidential.id, channel: 'email', email: reader }),
    });
    assert.equal(publicFollow.status, 404, 'knowing a Staff incident id does not permit public notification signup');
    requireBody(await publicFollow.text(), [], staffOnly, 'refused public incident follow response');
    assert.equal((await j.db.prepare('SELECT COUNT(*) AS n FROM incident_subscriptions WHERE incident_id = ?').bind(confidential.id).first()).n, 0);

    const acmeIncident = await j.incident('Acme connector unavailable', [b]);
    const acmeImpact = 'Acme-only wording: Connector sync needs a retry.';
    await j.save(acmeIncident.id, { customerImpact: acmeImpact });
    const { update: acmeUpdate } = await j.publish(acmeIncident.id, { pagePaths: [audiencePath] });
    await waitFor(j, audience, '/', acmeImpact);
    requireBody((await representation(j, audience, '/api/public/v1/incidents')).body, [acmeIncident.title, acmeImpact, acmeUpdate.id], staffOnly, 'Acme includes only selected publications');
    requireBody((await representation(j, staff, '/feed.atom')).body, [confidentialUpdate.id], [acmeIncident.title, acmeImpact, acmeUpdate.id], 'Staff excludes Acme-only publication');
    requireBody(await j.publicText('/feed.atom'), [sharedUpdate.id], [...staffOnly, acmeUpdate.id], 'Public feed retains only public events');

    const privateEvents = [confidentialUpdate.id, acmeUpdate.id];
    for (const { id } of (await j.db.prepare('SELECT id FROM maintenance_notices WHERE maintenance_id = ? ORDER BY id').bind(privateWork.id).all()).results) privateEvents.push(id);
    assert.ok(privateEvents.length > 2, 'real private maintenance notices were published');
    await j.tick(Date.now());
    for (const id of privateEvents) {
      assert.deepEqual(await publicationInventory(j, 'notification_deliveries', 'notification_event_id', id), [], 'private events capture no public recipients');
      assert.deepEqual(await publicationInventory(j, 'notification_outbox', 'aggregate_id', id), [], 'private events queue no public delivery');
    }
    requireBody(JSON.stringify(j.messages.filter(message => message.to.includes(reader))), [sharedImpact], [...staffOnly, acmeImpact], 'public provider messages');
    requireBody(JSON.stringify(j.webhookRequests), [], [...staffOnly, acmeImpact], 'public webhook requests');

    const protectedRead = await representation(j, staff, confidentialPermalink);
    assert.ok(protectedRead.version, 'Staff served a published snapshot');
    assert.notEqual(protectedRead.version, (await representation(j, undefined, '/', false)).version);
    const otherValidator = await j.raw(new URL('/feed.atom', j.publicOrigin).href, {
      headers: { 'If-None-Match': protectedRead.etag ?? ('W/"' + protectedRead.version + '"') },
    });
    assert.equal(otherValidator.status, 200, 'the protected generation cannot validate a public feed');
    requireBody(await otherValidator.text(), [sharedUpdate.id], staffOnly, 'public response to a protected validator');
    for (const path of [...responses.keys(), '/assets/logo', confidentialPermalink, privateWorkLink]) {
      await deniedWithoutLookup(j, privateStatusUrl(staff, path), confidentialImpact, protectedRead.etag);
    }
    await deniedWithoutLookup(j, privateStatusUrl(audience, '/feed.atom'), acmeImpact);
    const wrongHost = await j.raw(new URL(new URL(staff.url).pathname, j.publicOrigin).href, { headers: { Cookie: j.cookie } });
    assert.equal(wrongHost.status, 404);
    assert.equal(wrongHost.headers.get('x-test-r2-reads'), '0');
    const revoked = j.cookie;
    assert.equal((await j.request('/api/app/session/signout', { method: 'POST' })).status, 204);
    await deniedWithoutLookup(j, privateStatusUrl(staff, confidentialPermalink), confidentialImpact, protectedRead.etag, revoked);
    console.info('PROBE AUD-001 4: Staff-only native publication -> public artifacts and notification work exclude it; anonymous and revoked sessions do not reach object storage');
    await j.signIn(undefined, { fresh: true });
    assert.equal((await j.request(privateStatusUrl(staff, confidentialPermalink))).status, 200);
    const sourceSession = j.cookie;
    const settingsAtStablePaths = pages => pages.map(({ url, logoUrl, ...page }) => ({
      ...page, pathName: new URL(url).pathname, logoPath: logoUrl ? new URL(logoUrl).pathname : null,
    }));
    const savedPages = settingsAtStablePaths(listed);
    await j.close();
    j = null;

    j = await openStatusJourney({ ...options, installation: await installations.restore() });
    const restoredPages = (await j.json(configuration)).pages;
    assert.deepEqual(settingsAtStablePaths(restoredPages), savedPages);
    const restoredStaff = restoredPages.find(page => page.path === staffPath);
    const restoredAudience = restoredPages.find(page => page.path === audiencePath);
    const oldSession = await j.raw(privateStatusUrl(restoredStaff, confidentialPermalink), { headers: { Cookie: sourceSession } });
    assert.equal(oldSession.status, 401, 'the native restore does not revive source session authority');
    assert.equal((await j.raw('/test/rebuild', { method: 'POST' })).status, 204);
    await verifyLogo(restoredStaff);
    assert.equal(snapshotIdentity(await j.publicText('/feed.atom')), legacyPublication.feedIdentity);
    assert.equal(snapshotIdentity((await representation(j, restoredStaff, '/feed.atom')).body), staffFeed);
    assert.equal(snapshotIdentity((await representation(j, restoredAudience, '/feed.atom')).body), audienceFeed);
    requireBody(await j.publicText(legacyPublication.incident.path), [legacyPublication.incident.wording], [], 'native restore retains the legacy public incident');
    requireBody(await j.publicText(legacyPublication.maintenance.path), [legacyPublication.maintenance.wording], [], 'native restore retains the legacy public maintenance');
    requireBody(await j.publicText('/feed.atom'), [sharedUpdate.id], [...staffOnly, acmeUpdate.id], 'restored public projection');
    requireBody((await representation(j, restoredStaff, '/feed.atom')).body, [sharedUpdate.id, confidentialUpdate.id, privateWork.title], [acmeUpdate.id], 'restored Staff projection');
    requireBody((await representation(j, restoredAudience, '/feed.atom')).body, [acmeUpdate.id], staffOnly, 'restored Acme projection');
    console.info('AUD-001 populated upgrade and native export and import preserve settings, page membership and all three feed identities without reviving source sessions');
  } finally {
    try { await j?.close(); } finally { await installations.close(); }
  }
}
