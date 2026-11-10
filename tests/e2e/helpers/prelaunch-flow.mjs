import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { openSubscriberManagementFixture, eventuallySubscriber } from './subscriber-management-fixture.mjs';
import { smsBindings } from './sms-subscriber-flow.mjs';
import { recordedSlackExchange } from '../slack-subscriptions-helper.mjs';
import { subscriberTeamsUrl } from '../teams-subscriptions-helper.mjs';

const SUBSCRIBE_ROUTES = ['/subscribe', '/subscribe/incident', '/subscribe/teams', '/subscribe/sms', '/subscribe/slack'];

/** SUB-024: one owner switch makes a page that has not launched offer no way to subscribe, send
 * nothing to strangers and stay out of search; clearing it restores today's page. Every door is
 * the real Worker's; only the Twilio, Slack and Teams network edges are captured, so an
 * outbound message is a recorded fact rather than an inference. */
export async function prelaunchFlow() {
  const outbound = [];
  const fixture = await openSubscriberManagementFixture({
    pageHost: 'status.example.test',
    extraBindings: { ...smsBindings, SLACK_CLIENT_ID: recordedSlackExchange.request.client_id, SLACK_CLIENT_SECRET: recordedSlackExchange.request.client_secret, SLACK_SIGNING_SECRET: 'synthetic-lamp-slack-signing'.repeat(2) },
    providerEdge: async request => {
      const { origin } = new URL(request.url);
      if (origin === 'https://api.resend.com') return undefined; // mail is captured by the fixture's own outbox
      outbound.push(request.url);
      return new Response('{}', { status: 500 });
    },
  });
  const { raw, publicOrigin } = fixture;
  let browser;
  try {
    const component = await fixture.createComponent('Synthetic Lamp prelaunch component');
    const { incident } = await fixture.publish(component, 'Synthetic Lamp prelaunch incident');
    const incidentPath = `/incidents/${incident.reference}`;
    let network = 0;
    const send = (path, init = {}) => raw(`${publicOrigin}${path}`, { ...init, headers: { 'CF-Connecting-IP': `192.0.2.${++network}`, ...init.headers } });
    const form = (path, fields) => send(path, { method: 'POST', headers: { Origin: publicOrigin, Accept: 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields).toString() });
    const bodies = {
      '/subscribe': { email: 'synthetic-lamp-stranger@example.test' },
      '/subscribe/incident': { incidentId: incident.id, channel: 'email', email: 'synthetic-lamp-stranger@example.test' },
      '/subscribe/teams': { url: subscriberTeamsUrl },
      '/subscribe/sms': { phone: '+12025550123' },
      '/subscribe/slack': { componentId: component.id },
    };
    const publicHtml = async path => {
      const response = await send(path);
      assert.equal(response.status, 200, path);
      return { text: await response.text(), headers: response.headers };
    };
    const setPrelaunch = async enabled => {
      const response = await fixture.api('/api/app/prelaunch', { method: 'PATCH', body: JSON.stringify({ enabled }) });
      assert.equal(response.status, 200, response.text);
      assert.deepEqual(response.body, { enabled });
    };
    const offersSubscription = html => /action="\/subscribe|href="\/#subscribe"|id="subscribe"/.test(html);

    // Unset: the page, routes and headers are today's.
    assert.deepEqual((await fixture.api('/api/app/prelaunch')).body, { enabled: false }, 'an installation that predates the setting reads off');
    const openPage = await eventuallySubscriber(() => publicHtml('/'), page => offersSubscription(page.text), 'the default page offers subscription');
    for (const action of SUBSCRIBE_ROUTES.filter(route => route !== '/subscribe/incident')) assert.ok(openPage.text.includes(`action="${action}"`), `the page posts to ${action}`);
    assert.ok((await publicHtml(incidentPath)).text.includes('action="/subscribe/incident"'), 'an incident page offers following');
    assert.equal(openPage.headers.get('x-robots-tag'), null, 'no robots header on the page');
    const openRobots = await send('/robots.txt');
    assert.equal(openRobots.status, 404);
    assert.equal(await openRobots.text(), 'Not found.');
    const sent = fixture.messages.length;
    for (const route of SUBSCRIBE_ROUTES) assert.notEqual((await form(route, bodies[route])).status, 503, `${route} is open while the setting is unset`);
    assert.ok(fixture.messages.length > sent, 'an open page sends its confirmation');
    // An existing subscriber, to prove their links outlive the switch.
    const existing = 'synthetic-lamp-existing@example.test';
    assert.equal((await form('/subscribe', { email: existing })).status, 202);
    await fixture.confirm(existing);
    const unsubscribeLink = fixture.messagesFor(existing).flatMap(message => message.text.match(/https?:\/\/\S+\/unsubscribe\/\S+/) ?? [])[0];
    assert.ok(unsubscribeLink, 'the confirmation carries an unsubscribe link');
    const linkIn = (email, pattern) => fixture.messagesFor(email).flatMap(message => message.text.match(pattern) ?? [])[0];
    // The manage link travels with a notification, so the existing subscriber is notified of a second incident.
    await fixture.publish(component, 'Synthetic Lamp prelaunch notification');
    const manageLink = await eventuallySubscriber(async () => linkIn(existing, /https?:\/\/\S+\/manage\/\S+/), Boolean, 'the existing subscriber gets a manage link');
    // A second subscriber who has not confirmed yet: their link must still work once the page is pre-launch.
    const pending = 'synthetic-lamp-pending@example.test';
    assert.equal((await form('/subscribe', { email: pending })).status, 202);
    const confirmLink = await eventuallySubscriber(async () => linkIn(pending, /https?:\/\/\S+\/confirm-subscription\/\S+/), Boolean, 'the pending subscriber gets a confirmation link');
    // The link pages of subscribers and the Teams card, each with its own function. The Teams token is unissued:
    // the page still wears the same masthead.
    const unissued = '0'.repeat(26);
    const subscriberPages = [
      ['confirmation', async () => raw(confirmLink, { headers: { 'CF-Connecting-IP': '192.0.2.201' } }), 200],
      ['manage', async () => raw(manageLink, { headers: { 'CF-Connecting-IP': '192.0.2.202' } }), 200],
      ['unsubscribe', async () => raw(unsubscribeLink, { headers: { 'CF-Connecting-IP': '192.0.2.203' } }), 200],
      ['Teams confirmation', async () => send(`/subscribe/teams/confirm/${unissued}`), 404],
      ['unissued confirmation', async () => send(`/confirm-subscription/${unissued}`), 404],
    ];
    const mastheadSubscribe = html => /class="subscribe-link"/.test(html);
    for (const [name, open, status] of subscriberPages.filter(([name]) => name !== 'confirmation')) {
      const response = await open();
      assert.equal(response.status, status, name);
      assert.ok(mastheadSubscribe(await response.text()), `${name} page has the masthead Subscribe link while the page is open`);
    }

    outbound.length = 0; // the open phase sent real messages through the captured edges

    // Set: no forms, five refusals before any write or send, noindex everywhere.
    await setPrelaunch(true);
    for (const path of ['/', '/history', incidentPath]) assert.ok(!offersSubscription((await publicHtml(path)).text), `${path} offers no subscription`);
    assert.ok(!(await publicHtml('/')).text.includes('/subscribe'), 'no subscribe address is left on the page');
    for (const path of ['/', '/history', incidentPath, '/feed.atom', '/feed.rss', '/api/public/status', '/widget.js', '/no-such-page']) {
      assert.equal((await send(path)).headers.get('x-robots-tag'), 'noindex, nofollow', `${path} asks search engines to stay away`);
    }
    const robots = await send('/robots.txt');
    assert.equal(robots.status, 200);
    assert.equal(await robots.text(), 'User-agent: *\nDisallow: /\n');
    assert.equal(robots.headers.get('x-robots-tag'), 'noindex, nofollow');
    const before = await fixture.databaseState();
    const mailBefore = fixture.messages.length;
    for (const route of SUBSCRIBE_ROUTES) {
      const response = await form(route, bodies[route]);
      assert.equal(response.status, 503, route);
      assert.match(await response.text(), /not open yet/);
    }
    assert.equal((await send('/subscribe/slack/callback?code=synthetic&state=synthetic')).status, 503);
    await fixture.assertUnchanged(before);
    assert.equal(fixture.messages.length, mailBefore, 'no mail left the Worker');
    assert.deepEqual(outbound, [], 'no SMS, Slack or Teams message left the Worker');

    // The link pages of existing subscribers keep their function and offer no way to subscribe.
    for (const [name, open, status] of subscriberPages) {
      const response = await open();
      assert.equal(response.status, status, `${name} page still answers`);
      const text = await response.text();
      assert.ok(!mastheadSubscribe(text), `${name} page has no masthead Subscribe link`);
      assert.ok(!text.includes('#subscribe'), `${name} page points nowhere at a subscribe form`);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    }

    // The shipped layouts carry their own subscribe forms: none may survive.
    const saved = (await fixture.api('/api/app/page-settings')).body.settings;
    const settings = Object.fromEntries(['pageName', 'tagline', 'accentColor', 'timezone', 'hostname', 'mailFromAddress', 'template', 'footerCreditEnabled', 'widgetAllowedOrigins'].map(key => [key, saved[key]]));
    for (const template of ['calm', 'uptime', saved.template]) {
      const response = await fixture.api('/api/app/page-settings', { method: 'PUT', body: JSON.stringify({ ...settings, template }) });
      assert.equal(response.status, 200, response.text);
      const page = await eventuallySubscriber(() => publicHtml('/'), result => template === 'default' || result.text.includes(`data-template="${template}"`), `the ${template} layout is published`);
      assert.ok(!page.text.includes('/subscribe') && !page.text.includes('#subscribe'), `the ${template} layout offers no subscription`);
      assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
    }

    // Existing subscribers still manage and leave; operators keep the whole app.
    assert.equal((await raw(unsubscribeLink, { headers: { 'CF-Connecting-IP': '192.0.2.200' } })).status, 200, 'the unsubscribe link still opens');
    const left = await form(new URL(unsubscribeLink).pathname, { action: 'unsubscribe' });
    assert.equal(left.status, 200, 'an existing subscriber can still unsubscribe');
    const goodbye = await left.text();
    assert.ok(!mastheadSubscribe(goodbye) && !goodbye.includes('#subscribe'), 'the goodbye page offers no way back to a subscribe form');
    assert.equal((await fixture.api('/api/app/subscribers')).status, 200);
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, headless: true, args: ['--no-sandbox', '--use-mock-keychain', '--password-store=basic'] });
    const html = (await publicHtml('/')).text;
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      try {
        await context.route('**/*', route => route.abort());
        const page = await context.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('form[action^="/subscribe"], a[href$="#subscribe"]').count(), 0, `no subscription control at ${width}`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `no horizontal overflow at ${width}`);
      } finally { await context.close(); }
    }

    // Cleared: subscription and indexing return at once.
    await setPrelaunch(false);
    const restored = await publicHtml('/');
    assert.ok(offersSubscription(restored.text));
    assert.equal(restored.headers.get('x-robots-tag'), null);
    assert.ok(mastheadSubscribe(await (await send(`/confirm-subscription/${unissued}`)).text()), 'link pages carry the masthead Subscribe link again');
    assert.equal((await send('/robots.txt')).status, 404);
    assert.equal((await form('/subscribe', { email: 'synthetic-lamp-later@example.test' })).status, 202, 'a stranger can subscribe once the page has launched');
  } finally {
    await browser?.close();
    await fixture.close();
  }
}
