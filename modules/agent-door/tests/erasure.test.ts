import test from 'node:test'
import assert from 'node:assert/strict'
import { runtime } from './runtime.mjs'
import { autonomousPolicy } from '../conformance/crypto.mjs'
import { REPLAY_WINDOW_MS, agentErasureStatements, checkAgentArtifacts } from '../erasure.ts'
import { personAgentArtifacts } from '../../../default-seed/src/agent-door/erasure.ts'
import { createErasure, defineErasure } from '../../erasure/index.mjs'
import { createPortability } from '../../portability/index.mjs'

const code = (reply: any) => reply.result?._meta?.['com.runeditrun/error']?.code ?? reply.error?.data?.code
async function fixture(t: any) {
  const r = await runtime({ erasure: true }); t.after(() => r.close())
  const portability = await createPortability({ db: r.db, policy: { product: 'agent-erasure-test', buckets: {}, excludeTables: ['test_contexts', 'test_callbacks'] } })
  const declaration = defineErasure({ entity: 'record', root: { table: 'test_records' },
    async beforeStatements({ subject, operation }: any) {
      return agentErasureStatements({ db: r.db, secret: r.secret, map: personAgentArtifacts,
        subject: { values: JSON.stringify([subject.id]) }, tombstone: { erasure_id: operation.id, at: operation.at },
        checkpoint: async () => await portability.redactionStatements() })
    },
  })
  return { ...r, portability, erasure: createErasure({ db: r.db, portability, declarations: [declaration] }) }
}
async function archive(portability: any) {
  const id = await portability.exports.create()
  let state
  do { state = await portability.exports.advance(id) } while (state.phase !== 'complete')
  return new Response(await portability.exports.download(id)).text()
}
test('native erasure keeps sequence and value-free tombstones; old keys refuse in-window and become new requests after expiry; archives exclude replay custody', async t => {
  const r = await fixture(t), subject = 'personal-subject-' + crypto.randomUUID(), peer = 'other-subject-' + crypto.randomUUID()
  const key = subject + '@example.test', args = { id: subject, value: subject, idempotency_key: key }
  const policy = autonomousPolicy(); policy.rules = [{ id: 'review', class: '*', do: 'review' }]
  await r.adopt(policy)
  await r.tool('records.write', { id: peer, value: 'unrelated value', idempotency_key: crypto.randomUUID() })
  const written = await r.tool('records.write', args)
  assert.equal(written.result.structuredContent.version, 1)
  await r.db.prepare("UPDATE agent_door_usage SET classes=json_set(classes,'$[0].facts.kind',?) WHERE decision_id=?").bind(subject, written.result._meta['com.runeditrun/decision'].id).run()
  const accounting = async () => (await r.db.prepare("SELECT decision_id,at,seed,specialist,agent,json_extract(classes,'$[0].class') AS class,json_extract(classes,'$[0].facts.measure') AS measure FROM agent_door_usage ORDER BY decision_id").all()).results
  const usageBefore = await accounting()
  const tableRows = async (where: string) => Promise.all(personAgentArtifacts.artifacts.filter(item => item.match).map(async item => ({
    table: item.table, rows: (await r.db.prepare('SELECT * FROM "' + item.table + '" WHERE ' + where + ' ORDER BY rowid').all()).results,
  })))
  const peerRows = (await r.db.prepare('SELECT * FROM agent_door_calls WHERE instr(outcome,?)>0').bind(peer).all()).results
  const auditBefore = (await r.db.prepare('SELECT sequence,id FROM agent_door_audit ORDER BY sequence').all()).results
  const before = await archive(r.portability)
  const opened = await r.erasure.start('record', { id: subject })
  const blocked = await r.tool('records.write', { ...args, idempotency_key: crypto.randomUUID() })
  assert.equal(blocked.status, 409); assert.equal(code(blocked), 'subject_erasure_in_progress')
  assert.equal((await r.erasure.run(opened.id)).phase, 'complete')
  assert.deepEqual((await r.db.prepare('SELECT sequence,id FROM agent_door_audit ORDER BY sequence').all()).results, auditBefore)
  const dump = JSON.stringify(await tableRows('1'))
  assert.ok(!dump.includes(subject), 'every declared artifact column has lost the personal values and legacy key')
  assert.deepEqual(await accounting(), usageBefore, 'redaction clears personal facts without resetting usage measures or scope dimensions')
  assert.deepEqual((await r.db.prepare('SELECT * FROM agent_door_calls WHERE instr(outcome,?)>0').bind(peer).all()).results, peerRows)
  const completedAt = r.c.now
  const expiresAt = await r.db.prepare('SELECT expires_at FROM agent_door_calls WHERE key=?').bind('erased:' + (await r.db.prepare('SELECT call_id FROM agent_door_replay_aliases').first('call_id'))).first<number>('expires_at')
  assert.equal(expiresAt, completedAt + REPLAY_WINDOW_MS, 'erasure preserves the completion horizon')
  for (const age of [0, 86400001, REPLAY_WINDOW_MS - 1]) {
    await r.setNow(completedAt + age)
    await r.adopt(autonomousPolicy())
    const replay = await r.tool('records.write', args)
    assert.equal(code(replay), 'subject_erased')
    assert.equal(replay.result.structuredContent, undefined)
    assert.ok(!JSON.stringify(replay).includes(subject))
    assert.equal(await r.db.prepare("SELECT count(*) n FROM test_contexts WHERE kind='run' AND instr(audit,?)>0").bind(key).first('n'), 1, 'the original effect count remains one')
  }
  const aliases = (await r.db.prepare('SELECT alias FROM agent_door_replay_aliases').all()).results
  assert.equal(aliases.length, 1)
  const after = await archive(r.portability)
  assert.ok(!JSON.parse(after.split('\n')[0]).tables.some((table: any) => table.name === 'agent_door_replay_aliases'))
  assert.ok(!after.includes(key) && !after.includes(String(aliases[0].alias)))

  await r.setNow(expiresAt! + 1)
  const currentPolicy = autonomousPolicy(); currentPolicy.rules = [{ id: 'current', class: '*', do: 'blocked' }]
  await r.adopt(currentPolicy)
  const fresh = await r.tool('records.write', args)
  assert.equal(code(fresh), 'policy_blocked', 'expired key enters current authorization as a new request')
  assert.equal(await r.db.prepare('SELECT count(*) n FROM agent_door_replay_aliases').first('n'), 0, 'expiry deletes the alias')
  assert.equal(await r.db.prepare("SELECT count(*) n FROM agent_door_calls WHERE key LIKE 'erased:%'").first('n'), 0, 'expiry deletes its call in the same transaction')
  assert.equal(await r.db.prepare('SELECT count(*) n FROM test_records WHERE id=?').bind(subject).first('n'), 0, 'new request cannot recover the erased value')
  assert.equal(await r.db.prepare("SELECT count(*) n FROM test_contexts WHERE kind='run' AND instr(audit,?)>0").bind(key).first('n'), 1)

  const lines = before.trim().split('\n').map(line => JSON.parse(line))
  await assert.rejects(async () => {
    const stale = await r.portability.imports.create(lines[0])
    for (const part of lines.filter(line => line.kind === 'part')) await r.portability.imports.uploadPart(stale, part.index, part)
    await r.portability.imports.finalize(stale, { archiveHash: lines.at(-1).archiveHash })
  }, /erasure_epoch/)
  t.diagnostic('all mapped columns clear; audit sequence intact; in-window replay effect=1 at now, 24h+1ms, horizon-1ms; horizon+1ms=new request/current policy_blocked, call+alias deleted, no recovered value; concurrent capture=409; peer unchanged; alias/key absent from export; older archive refused')
})

test('pending approval loses its inputs and marks, cannot execute after native erasure', async t => {
  const r = await fixture(t), id = 'approval-subject-' + crypto.randomUUID()
  await r.db.prepare("INSERT INTO test_records VALUES(?,?,1,'internal')").bind(id, 'private').run()
  const policy = autonomousPolicy(); policy.rules = [{ id: 'hold', class: '*', do: 'approval', approver: ['sponsor'], wait: 'PT1H' }]
  await r.adopt(policy)
  const pending = await r.tool('records.write', { id, value: id, idempotency_key: id })
  const approval = pending.result._meta['com.runeditrun/approval']
  const oldView = (await r.person('/agents/api/approvals/' + approval.id)).body.approval
  const opened = await r.erasure.start('record', { id }); await r.erasure.run(opened.id)
  const decided = await r.person('/agents/api/approvals/' + approval.id + '/approve', { revision: oldView.revision, summary_sha256: oldView.summary_sha256 })
  assert.equal(decided.status, 409); assert.equal(decided.body.code, 'subject_erased')
  const page = await r.fetch('/agents/approvals/' + approval.id, { headers: { Cookie: r.c.person.cookie } })
  assert.equal(page.status, 200)
  assert.ok(!(await page.text()).includes('data-approval-action="approve"'))
  assert.equal(await r.db.prepare("SELECT count(*) n FROM test_contexts WHERE kind='run'").first('n'), 0)
  assert.ok(!JSON.stringify((await r.db.prepare('SELECT * FROM agent_door_approvals').all()).results).includes(id))
})

test('adoption refuses undeclared tables and columns', async t => {
  const r = await fixture(t)
  await checkAgentArtifacts(r.db, personAgentArtifacts)
  await r.db.prepare('CREATE TABLE agent_door_unmapped(value TEXT)').run()
  await assert.rejects(checkAgentArtifacts(r.db, personAgentArtifacts), /undeclared_table/)
  await r.db.prepare('DROP TABLE agent_door_unmapped').run()
  await r.db.prepare('ALTER TABLE agent_door_events ADD COLUMN private_copy TEXT').run()
  await assert.rejects(checkAgentArtifacts(r.db, personAgentArtifacts), /undeclared_column/)
})

test('an admitted completion cannot overwrite a tombstone or append late personal events; stale selections roll back', async t => {
  const r = await fixture(t), id = 'racing-subject-' + crypto.randomUUID()
  await r.adopt(autonomousPolicy())
  await r.tool('records.write', { id, value: id, idempotency_key: id })
  const nativeHorizon = r.c.now + 60_000
  await r.db.prepare('UPDATE agent_door_calls SET expires_at=? WHERE key=?').bind(nativeHorizon, id).run()
  const original = await r.db.prepare('SELECT row,evidence FROM agent_door_audit ORDER BY sequence DESC LIMIT 1').first<any>()
  const originalRow = JSON.parse(original.row)
  const statements = await agentErasureStatements({ db: r.db, map: personAgentArtifacts, subject: { values: JSON.stringify([id]) }, secret: r.secret,
    tombstone: { erasure_id: crypto.randomUUID(), at: new Date().toISOString() }, checkpoint: () => r.portability.redactionStatements() })
  await r.db.prepare('UPDATE agent_door_calls SET outcome=?').bind(JSON.stringify({ changed: id })).run()
  await assert.rejects(r.db.batch(statements))
  assert.equal(await r.db.prepare('SELECT count(*) n FROM agent_door_replay_aliases').first('n'), 0, 'no partial alias publication')
  const opened = await r.erasure.start('record', { id }); await r.erasure.run(opened.id)
  assert.equal(await r.db.prepare('SELECT expires_at FROM agent_door_calls WHERE decision_id=?').bind(originalRow.id).first('expires_at'), nativeHorizon, 'an existing shorter replay horizon survives erasure')
  const { audit } = await import('../audit.ts'), { appendEvents } = await import('../events.ts')
  const rt = { options: { db: r.db }, now: Date.now } as any
  await audit(rt, originalRow, JSON.parse(original.evidence))
  await audit(rt, { ...originalRow, id: crypto.randomUUID(), decision_id: originalRow.id }, JSON.parse(original.evidence))
  await appendEvents(rt, [{ type: 'record.saved', uri: 'synthetic://record/' + id, actor: { kind: 'business' }, data: { personal: id } }], originalRow.id)
  assert.ok(!JSON.stringify((await r.db.prepare('SELECT * FROM agent_door_audit').all()).results).includes(id))
  assert.ok(!JSON.stringify((await r.db.prepare('SELECT * FROM agent_door_events').all()).results).includes(id))
})
