// Lamp removal adaptation of rer 0.2.121's owner-remove: retain its creation
// identity preflight and state lock, bound purge work and settle every readback.
import { r2ObjectPages, r2ObjectPath } from '@runeditrun/rer/internal/modules/deploy-kit/r2-objects.mjs';
import { rm } from 'node:fs/promises';
import { assert, hexId } from '@runeditrun/rer/internal/modules/deploy-kit/validation.mjs';
import { resourceKinds, findResource } from '@runeditrun/rer/internal/modules/deploy-kit/resources.mjs';
import { activeWorker } from '@runeditrun/rer/internal/modules/deploy-kit/worker.mjs';
import { deleteWorker } from '@runeditrun/rer/internal/modules/deploy-kit/teardown.mjs';
import { query } from '@runeditrun/rer/internal/modules/deploy-kit/migrations.mjs';
import { KINDS, readOwnerState, writeOwnerState, withStateLock, withScopeHints, withSettledLists, workerSettings, sameDeployment, resourceId, checkResourceIdentity, refuse, settlePendingSecret } from '@runeditrun/rer/internal/modules/deploy-kit/owner.mjs';

const remove = {
  d1: (api, id) => api.request(`/d1/database/${id}`, {method:'DELETE'}),
  kv: (api, id) => api.request(`/storage/kv/namespaces/${id}`, {method:'DELETE'}),
  queues: (api, id) => api.request(`/queues/${id}`, {method:'DELETE'}),
};

/** A resource whose create response was lost (still `pending` in the state file) may be
 * rer's or someone else's. It is removed only under this environment's derived name and
 * once it is confirmed empty: a D1 with no tables or a KV namespace with no keys. R2 always
 * requires a confirmed creation identity. A queue's backlog cannot be read, so an uncertain queue refuses with its own code. */
async function confirmEmpty(api, worker, kind, name, id) {
  if (!name.startsWith(`${worker}-`)) throw refuse('uncertain-resource-create', kind, name);
  if (kind === 'queues') throw refuse('uncertain-resource-unverifiable', kind, name);
  if (kind === 'd1') {
    const [{results}] = await query(api, id, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite~_%' ESCAPE '~' AND name NOT LIKE '~_cf~_%' ESCAPE '~'");
    if (results.length) throw refuse('uncertain-resource-not-empty', kind, name);
  }
  if (kind === 'kv') {
    const keys = await api.request(`/storage/kv/namespaces/${id}/keys?limit=10`);
    assert(Array.isArray(keys), 'invalid-kv-key-list');
    if (keys.length) throw refuse('uncertain-resource-not-empty', kind, name);
  }
}

/** Delete exactly what this environment's state file says rer created: the Worker (its
 * schedules first; its Durable Objects go with it), then each D1, R2, KV and queue,
 * each only while it is still the one rer created. Read back that each is gone, then
 * drop the state file. Nothing else in the account is touched. Ownership is checked for
 * everything before the first delete; a replaced or uncertain resource refuses it all,
 * except an uncertain one confirmed empty (see confirmEmpty). R2 object purges
 * additionally require the saved creation timestamp and recheck it before each delete. */
export async function ownerRemove({api: provider, target, statePath, expectedResources = {}, clock = () => performance.now(), sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), readbackMs = 60000, purgeMs = 600000}) {
  const api = withSettledLists(withScopeHints(provider), {clock, sleep, windowMs: readbackMs});
  const waitGone = async (read, resource) => {
    const start = clock();
    for (let delay = 500; ; delay = Math.min(delay * 2, 4000)) {
      const signal = AbortSignal.timeout(Math.max(1, Math.ceil(readbackMs - (clock() - start))));
      const bounded = {...api,
        request: (path, options = {}) => api.request(path, {...options, signal}),
        list: (path, options = {}) => api.list(path, {...options, signal}),
      };
      try { if (await read(bounded)) return; }
      catch (error) { throw Object.assign(new Error('remove-incomplete'), {resource, cause:error}); }
      const left = readbackMs - (clock() - start);
      if (left <= 0) throw Object.assign(new Error('remove-incomplete'), {resource});
      await sleep(Math.min(delay, left));
    }
  };
  const deletePresent = async (path, options = {}) => {
    try { await api.request(path, {method: 'DELETE', ...options}); }
    catch (error) { if (error.status !== 404) throw error; }
  };
  return withStateLock(statePath, async () => {
    const state = await readOwnerState(statePath, target);
    const known = KINDS.flatMap(kind => [...new Set([...Object.keys(state.owned[kind]), ...(expectedResources[kind] ?? [])])].map(name => ({kind, name})));
    const remaining = new Set([...(state.owned.worker ? [`worker:${target.worker}`] : []), ...known.map(({kind, name}) => `${kind}:${name}`)]);
    const removed = [], failed = [];
    try {
      if (await settlePendingSecret(api, target.worker, state, {preflight:true})) await writeOwnerState(statePath, state);
      const owned = KINDS.flatMap(kind => Object.entries(state.owned[kind]).map(([name, entry]) => ({kind, name, entry})));
      // An earlier pass may have completed this target before the outer receipt
      // was removed. Still read the Worker and its namespaces below.
      if (!state.owned.worker && !owned.length && await workerSettings(api, target.worker) !== null) throw refuse('resource-name-collision', 'worker', target.worker);
      // Preflight, read-only.
      let worker = null;
      if (await workerSettings(api, target.worker) !== null) {
        if (!state.owned.worker) throw refuse('resource-name-collision', 'worker', target.worker);
        const expected = state.pendingUpload?.provider ?? state.receipt?.provider;
        if (!expected) throw refuse('uncertain-resource-create', 'worker', target.worker);
        const live = await activeWorker(api, target.worker);
        if (!sameDeployment(live, expected)) throw refuse('owned-resource-replaced', 'worker', target.worker);
        worker = target.worker;
      } else remaining.delete(`worker:${target.worker}`);
      assert(!state.pendingSecret, 'secret-change-unsettled');
      const listed = {}, doomed = [];
      for (const kind of KINDS) {
        if (!known.some(item => item.kind === kind)) continue;
        listed[kind] = await resourceKinds[kind].list(api);
        // A missing creation record never proves the installation is absent.
        // Expected names are read-only: they grant no deletion authority.
        for (const {name} of known.filter(item => item.kind === kind)) {
          if (!state.owned[kind][name] && findResource(listed[kind], kind, name)) throw refuse('unrecorded-resource', kind, name);
        }
        for (const {name, entry} of owned.filter(item => item.kind === kind)) {
          const row = findResource(listed[kind], kind, name);
          if (!row) { remaining.delete(`${kind}:${name}`); continue; }
          if (kind === 'r2') requireBucketIdentity(name, entry);
          if (entry.status === 'pending') await confirmEmpty(api, target.worker, kind, name, resourceId(kind, row));
          else checkResourceIdentity(kind, name, row, entry);
          if (kind === 'r2' && entry.status === 'created' && entry.id) {
            try { await checkBucket(api, name, entry); }
            catch (error) { if (error.status !== 404) throw error; }
          }
          doomed.push({kind, name, entry, id:resourceId(kind, row)});
        }
      }
      // A Worker that consumes one of these queues is released first.
      for (const queue of doomed.filter(item => item.kind === 'queues')) {
        for (const consumer of await api.list(`/queues/${queue.id}/consumers`, {pagination:'single'})) {
          assert(hexId(consumer.consumer_id), 'invalid-consumer-id');
          try { await deletePresent(`/queues/${queue.id}/consumers/${consumer.consumer_id}`); }
          catch (error) { throw Object.assign(new Error('remove-incomplete'), {resource: `queues:${queue.name}`, cause:error}); }
        }
      }
      if (worker) {
        try { await deleteWorker({api, worker, clock, sleep, maxWaitMs: readbackMs}); }
        catch (error) { if (error.status !== 404) throw Object.assign(new Error('remove-incomplete'), {resource: `worker:${worker}`, cause:error}); }
        await waitGone(async bounded => await workerSettings(bounded, worker) === null, `worker:${worker}`);
        remaining.delete(`worker:${worker}`);
        removed.push(`worker:${worker}`);
      }
      await waitGone(async bounded => !(await bounded.list('/workers/durable_objects/namespaces')).some(row => row.script === target.worker), `durable-object:${target.worker}`);
      for (const item of doomed) {
        try {
          if (item.kind === 'r2') await removeBucket(api, item, {clock, sleep, purgeMs});
          else {
            try { await remove[item.kind](api, item.id, item.name); }
            catch (error) { if (error.status !== 404) throw error; }
          }
          await waitGone(async bounded => !findResource(await resourceKinds[item.kind].list(bounded), item.kind, item.name), `${item.kind}:${item.name}`);
          remaining.delete(`${item.kind}:${item.name}`);
          removed.push(`${item.kind}:${item.name}`);
        }
        catch (error) {
          const resource = `${item.kind}:${item.name}`;
          failed.push({resource, code:error.message, error});
          // This step exhausted its budget or was refused. Keep all records;
          // don't spend a second readback budget before reporting the survivor.
          throw Object.assign(new Error('remove-incomplete'), {resource, cause:error});
        }
      }
      // Only complete, successful reads prove absence. Keep every unverified
      // resource recorded even when its DELETE returned success.
      let readFailure;
      const readback = async read => { try { await read(); } catch (error) { if (error.resource) remaining.add(error.resource); readFailure ??= error; } };
      await readback(async () => {
        await waitGone(async bounded => await workerSettings(bounded, target.worker) === null, `worker:${target.worker}`);
        remaining.delete(`worker:${target.worker}`);
      });
      let namespacesKnown = false;
      await readback(async () => {
        await waitGone(async bounded => !(await bounded.list('/workers/durable_objects/namespaces')).some(row => row.script === target.worker), `durable-object:${target.worker}`);
        namespacesKnown = true;
      });
      // Missing namespace readback cannot establish that the Worker's data is gone.
      if (!namespacesKnown && state.owned.worker) remaining.add(`worker:${target.worker}`);
      for (const kind of KINDS) {
        if (!listed[kind]) continue;
        await readback(async () => {
          for (const {name} of known.filter(item => item.kind === kind)) {
            await waitGone(async bounded => !findResource(await resourceKinds[kind].list(bounded), kind, name), `${kind}:${name}`);
            remaining.delete(`${kind}:${name}`);
          }
        });
      }
      if (remaining.size || readFailure) {
        // Keep proof for every survivor or resource whose absence is unverified.
        for (const kind of KINDS) for (const name of Object.keys(state.owned[kind])) if (!remaining.has(`${kind}:${name}`)) delete state.owned[kind][name];
        if (!remaining.has(`worker:${target.worker}`) && ![...remaining].some(name => name.startsWith('durable-object:'))) {
          state.owned.worker = null; state.receipt = null; delete state.pendingUpload;
          delete state.ownerClaim; delete state.retiredSecrets;
        }
        await writeOwnerState(statePath, state);
        throw Object.assign(new Error('remove-incomplete'), {cause: readFailure});
      }
      await rm(statePath, {force:true});
      return {worker:target.worker, removed, remaining:[]};
    } catch (error) {
      error.remaining = [...remaining];
      error.failed = failed;
      error.removed = removed.filter(resource => !remaining.has(resource));
      throw error;
    }
  });
}

async function checkBucket(api, name, entry) {
  const row = await api.request(`/r2/buckets/${name}`);
  if (row?.name !== name) throw refuse('owned-resource-replaced', 'r2', name);
  checkResourceIdentity('r2', name, row, entry);
}
function requireBucketIdentity(name, entry) {
  if (entry.status !== 'created' || typeof entry.id !== 'string' || !entry.id) throw refuse('uncertain-resource-create', 'r2', name);
}
// Re-list the first bounded page after each batch: deleting while advancing a
// cursor can skip objects. The saved creation identity is checked before every
// destructive call, including every retry of the bucket delete.
async function removeBucket(api, {name, entry}, {clock, sleep, purgeMs}) {
  requireBucketIdentity(name, entry);
  const start = clock();
  const resource = `r2:${name}`;
  const left = () => purgeMs - (clock() - start);
  const budget = () => {
    if (left() <= 0) throw Object.assign(new Error('remove-incomplete'), {resource});
    return AbortSignal.timeout(Math.max(1, Math.ceil(left())));
  };
  const bounded = {...api,
    request: (path, options = {}) => api.request(path, {...options, signal: budget()}),
    envelope: (path, options = {}) => api.envelope(path, {...options, signal: budget()}),
  };
  const present = async () => {
    try { await checkBucket(bounded, name, entry); return true; }
    catch (error) { if (error.status === 404) return false; throw error; }
  };
  for (let delay = 500; ; delay = Math.min(delay * 2, 4000)) {
    if (!await present()) return;
    let rows = [];
    for await (const page of r2ObjectPages(bounded, name)) { rows = page; if (rows.length) break; }
    for (const {key} of rows) {
      if (!await present()) return;
      try { await bounded.request(r2ObjectPath(name, key), {method: 'DELETE'}); }
      catch (error) { if (error.status !== 404) throw error; }
    }
    if (!rows.length) {
      if (!await present()) return;
      try { await bounded.request(`/r2/buckets/${name}`, {method: 'DELETE'}); return; }
      catch (error) {
        if (error.status === 404) return;
        // A nonempty bucket can be an eventually consistent object listing.
        // All other refusals stop; they are not an excuse to retry a delete.
        if (!error.providerRefusal?.errors?.some(row => /not.?empty|contains.*objects/i.test(row.message ?? ''))) throw error;
      }
    }
    budget();
    await sleep(Math.min(delay, left()));
  }
}
