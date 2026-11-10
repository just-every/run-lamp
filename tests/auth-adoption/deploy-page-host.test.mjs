import assert from 'node:assert/strict';
import { test } from 'node:test';
import { awaitPageHostSnapshot } from '../../scripts/page-host-readiness.mjs';

// The network edge is the only fake: fetch answers, and time does not pass.
const host = 'status.example.test';
const dnsFailure = code => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(`getaddrinfo ${code} ${host}`), { code }) });
const retained = () => new Response('{}', { headers: { 'X-Lamp-Snapshot-Retained': 'true' } });
const answering = (status = 200) => () => new Response('{}', { status });
function seam(answers) {
  const lines = [], delays = [], calls = [];
  let clock = 0;
  return {
    lines, delays, calls,
    options: {
      fetchImpl: async url => { calls.push(url); const answer = answers.length > 1 ? answers.shift() : answers[0]; if (answer instanceof Error) throw answer; return answer(); },
      sleep: async ms => { delays.push(ms); clock += ms; },
      now: () => clock,
      log: line => lines.push(line),
    },
  };
}

test('Deploy retries a page host whose DNS answer is not there yet and completes once it serves', async () => {
  const run = seam([dnsFailure('EAI_AGAIN'), dnsFailure('ENOTFOUND'), retained]);
  assert.deepEqual(await awaitPageHostSnapshot(host, run.options), { state: 'retained' });
  assert.equal(run.calls.length, 3);
  assert.ok(run.delays[1] > run.delays[0], 'the wait grows between DNS failures');
});

test('Deploy completes with a detached page host and says it skipped the check', async () => {
  const run = seam([dnsFailure('ENOTFOUND')]);
  assert.deepEqual(await awaitPageHostSnapshot(host, run.options), { state: 'detached' });
  assert.equal(run.lines.length, 1);
  assert.match(run.lines[0], /^Page host detached: skipped\./);
  assert.ok(run.lines[0].includes(host) && run.lines[0].includes('ENOTFOUND'));
});

test('Deploy fails naming the host and the DNS code when the resolver never answers', async () => {
  const run = seam([dnsFailure('EAI_AGAIN')]);
  await assert.rejects(awaitPageHostSnapshot(host, run.options), error => error.message.includes(host) && error.message.includes('EAI_AGAIN'));
  assert.deepEqual(run.lines, []);
});

test('Deploy still fails when the page host answers but is not serving the retained snapshot', async () => {
  const run = seam([answering(503)]);
  await assert.rejects(awaitPageHostSnapshot(host, run.options), error => error.message.includes(host) && error.message.includes('HTTP 503') && /unverified/.test(error.message));
  assert.deepEqual(run.lines, []);
  const unretained = seam([answering(200)]);
  await assert.rejects(awaitPageHostSnapshot(host, unretained.options), /unverified/);
});
