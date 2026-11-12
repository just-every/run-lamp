import assert from "node:assert/strict";
import { openSubscriberManagementFixture, pageOrigin } from "./subscriber-management-fixture.mjs";

/** Only bulk population is setup SQL. The limits, refusal, row accounting,
 * operator messages and recovery below are exercised through product doors. */
export async function seedSubscriberLimitFixture(db,start,count,channel="email") {
  const now=new Date().toISOString();
  await db.prepare(`WITH RECURSIVE sequence(n) AS (SELECT ? UNION ALL SELECT n+1 FROM sequence WHERE n<?)
    INSERT INTO subscribers(id,channel,chat_kind,destination,contact_email,state,selection_mode,token_hash,created_at,updated_at)
    SELECT '01JLIMIT' || printf('%018d',n),?,?,CASE WHEN ?='email' THEN 'synthetic-lamp-limit-' || n || '@example.test'
      ELSE 'https://receiver.example.test/synthetic-lamp-limit-' || n END,NULL,'active','all','synthetic-lamp-limit-token-' || n,?,? FROM sequence`)
    .bind(start,start+count-1,channel === "slack" || channel === "teams" ? "webhook" : channel,channel === "slack" || channel === "teams" ? channel : null,channel,now,now).run();
}
export const subscriberLimitSourceFiles=(count)=>[
  {name:"page.json",text:JSON.stringify({id:"synthetic-lamp-limit-page",name:"Synthetic Lamp source",viewers_must_be_team_members:false,ip_restrictions:null})},
  {name:"page-access-groups.json",text:"[]"},
  {name:"components.json",text:JSON.stringify([{id:"synthetic-lamp-limit-component",name:"Synthetic Lamp imported API",position:1,status:"operational",created_at:"2026-10-01T00:00:00.000Z"}])},
  {name:"subscribers.json",text:JSON.stringify(Array.from({length:count},(_,index)=>({id:`synthetic-lamp-limit-import-${index}`,mode:"email",email:`synthetic-lamp-limit-import-${index}@example.test`,components:[],created_at:"2026-10-01T00:00:00.000Z"})))},
];

/** Saturate the capacity declared by this installation, refuse without a
 * partial CSV write or email, then free a real subscription and admit again. */
export async function subscriberLimitsFlow() {
  const fixture = await openSubscriberManagementFixture({ workerEntry: 'tests/e2e/helpers/automation-clock-worker.ts' });
  try {
    const { api, post, db } = fixture;
    const clock = await fixture.raw('/test/clock', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ now: Date.now() + 60_000 }) });
    assert.equal(clock.status, 204, await clock.text());
    const capacity = (await api('/api/app/subscribers?limit=1')).body.capacity;
    const all = capacity.find(row => row.channel === 'all');
    assert.ok(all && all.limit > all.count);
    const addressFor = name => [`synthetic-lamp-capacity-${name}`, 'example.test'].join('@');
    // Each native group represents one visitor within the real write allowance,
    // even when every request shares the same frozen minute.
    const subscribe = (email, network = '192.0.2.41') => fixture.raw(pageOrigin + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html', 'CF-Connecting-IP': network }, body: new URLSearchParams({ email }) });
    const inventory = async () => JSON.parse((await fixture.databaseState()).get('subscribers')).map(row => JSON.parse(row));
    const retainedIds = new Set((await inventory()).map(row => row.id));
    const seeded = all.limit - all.count - 2;
    await seedSubscriberLimitFixture(db, 1, seeded);
    for (let n = 1; n <= seeded; n++) retainedIds.add(`01JLIMIT${String(n).padStart(18, '0')}`);
    const reconcile = async (eligible, states = new Map()) => {
      const rows = await inventory();
      assert.deepEqual(rows.map(row => row.id).sort(), [...retainedIds].sort(), 'capacity accounting retains every subscriber identity, in every state');
      assert.ok(rows.every(row => row.channel === 'email'), 'this isolated total-capacity fixture contains only email subscriptions');
      assert.equal(rows.filter(row => row.state === 'pending' || row.state === 'active').length, eligible, 'the complete stored inventory independently reconciles eligible subscriptions');
      for (const [id, state] of states) assert.equal(rows.find(row => row.id === id)?.state, state);
      const response = await api('/api/app/subscribers?limit=1');
      assert.equal(response.status, 200, response.text);
      for (const capacity of response.body.capacity) {
        assert.equal(capacity.count, ['all', 'email'].includes(capacity.channel) ? eligible : 0, `${capacity.channel}: the native capacity report matches the independent inventory`);
      }
      return rows;
    };
    const admit = async email => {
      const response = await subscribe(email);
      assert.equal(response.status, 202, await response.text());
      const rows = await inventory();
      const added = rows.filter(row => !retainedIds.has(row.id));
      assert.equal(added.length, 1, 'a supported public admission adds precisely one subscriber');
      assert.equal(added[0].destination, email);
      assert.equal(added[0].state, 'pending');
      retainedIds.add(added[0].id);
      assert.equal(fixture.messagesFor(email).length, 1, 'admission sends one confirmation to its actual recipient');
      return added[0];
    };

    // A real active subscription and a pending one fill the final two slots.
    const stoppedAddress = addressFor('will-unsubscribe');
    const stopped = await admit(stoppedAddress);
    await fixture.confirm(stoppedAddress);
    await reconcile(all.limit - 1, new Map([[stopped.id, 'active']]));
    const address = addressFor('pending');
    const pending = await admit(address);
    await reconcile(all.limit, new Map([[stopped.id, 'active'], [pending.id, 'pending']]));

    // Release capacity through the recipient's native authority, retaining the
    // deactivated record. A new public opt-in must use the freed slot.
    const unsubscribe = fixture.messagesFor(stoppedAddress)[0].text.match(/https?:\/\/\S+\/unsubscribe\/\S+/)?.[0];
    assert.ok(unsubscribe, 'native confirmation mail carries unsubscribe authority');
    const released = await fixture.raw(unsubscribe, { method: 'POST', headers: { Origin: pageOrigin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
    assert.equal(released.status, 200, await released.text());
    const states = new Map([[stopped.id, 'deactivated'], [pending.id, 'pending']]);
    const afterRelease = await reconcile(all.limit - 1, states);
    assert.equal(afterRelease.find(row => row.id === stopped.id).deactivation_reason, 'unsubscribed');
    const recoveredAddress = addressFor('recovered');
    const recovered = await admit(recoveredAddress);
    states.set(recovered.id, 'pending');
    await reconcile(all.limit, states);
    await fixture.confirm(recoveredAddress);
    states.set(recovered.id, 'active');
    await reconcile(all.limit, states);

    // Refusal cannot create any row, token, sidecar, audit or mail, including a
    // deactivated row that an eligible-only count would fail to detect.
    const beforeRefusals = await fixture.databaseState();
    const mailBefore = structuredClone(fixture.messages);
    const answers = [];
    for (const email of [address, recoveredAddress, stoppedAddress, addressFor('refused-new')]) {
      const denied = await subscribe(email, '192.0.2.42'); assert.equal(denied.status, 409);
      const html = await denied.text(); answers.push(html);
      assert.ok(html.includes('/feed.atom') && html.includes('/feed.rss'), 'a full page still offers public feeds');
      const after = await fixture.databaseState();
      assert.deepEqual([...after.keys()], [...beforeRefusals.keys()], 'refusal creates no application table');
      for (const [table, rows] of beforeRefusals) {
        // Public write attempts consume rate-limit bookkeeping only.
        if (table === 'request_rate_windows') continue;
        assert.ok(after.get(table) === rows, `full-channel refusal changed ${table}`);
      }
      assert.deepEqual(fixture.messages, mailBefore, 'full capacity sends no confirmation or management email and preserves every captured message');
    }
    assert.equal(answers[0], answers[1], 'capacity refusals cannot enumerate addresses');
    assert.ok(answers.every(answer => answer === answers[0]), 'new, pending, active and deactivated addresses receive the identical full-channel page');
    await reconcile(all.limit, states);
    const csvAddress = addressFor('csv');
    const csv = subscriberCsvInput(csvAddress);
    const before = await fixture.databaseState();
    const preview = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(preview.status, 200, preview.text);
    assert.equal(preview.body.counts.refused, 1);
    assert.ok(preview.body.limits.length);
    const apply = await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: preview.body.fingerprint });
    assert.equal(apply.status, 409, apply.text);
    await fixture.assertUnchanged(before);
    const row = await db.prepare('SELECT id FROM subscribers WHERE destination=?').bind(address).first();
    assert.equal((await api(`/api/app/subscribers/${row.id}`, { method: 'DELETE' })).status, 204);
    states.set(row.id, 'deactivated');
    const afterDelete = await reconcile(all.limit - 1, states);
    assert.equal(afterDelete.find(item => item.id === row.id).destination, `deleted:${row.id}`);
    const fitting = await post('/api/app/subscribers/import/preview', { csv });
    assert.equal(fitting.body.counts.created, 1);
    assert.equal((await post('/api/app/subscribers/import/apply', { csv, reviewedFingerprint: fitting.body.fingerprint })).status, 200);
    const imported = (await inventory()).filter(row => !retainedIds.has(row.id));
    assert.equal(imported.length, 1);
    assert.equal(imported[0].destination, csvAddress);
    retainedIds.add(imported[0].id);
    states.set(imported[0].id, 'pending');
    await reconcile(all.limit, states);
    const fullAgain = (await api('/api/app/subscribers?limit=1')).body.capacity.find(row => row.channel === 'all');
    assert.equal(fullAgain.count, fullAgain.limit);
  } finally { await fixture.close(); }
}

const subscriberCsvInput = email => `email\r\n${email}\r\n`;
