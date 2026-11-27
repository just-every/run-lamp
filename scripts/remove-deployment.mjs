import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { readDeployEnvFile } from '@runeditrun/rer/internal/modules/deploy-kit/env-file.mjs';
import { withStateLock } from '@runeditrun/rer/internal/modules/deploy-kit/owner.mjs';
import { ownerRemove } from '@runeditrun/rer/modules/deploy-kit/owner-remove';
import { ownershipMessage } from '@runeditrun/rer/modules/deploy-kit/native-upload';
import { deployDiagnostic } from '@runeditrun/rer/internal/modules/deploy-kit/diagnostics.mjs';
import { deploymentCommands, deploymentOwnership } from './deployment-ownership.mjs';
import { deploymentRecordPath, readDeploymentRecord, resourceNames, writeDeploymentRecord } from './ops-config.mjs';

// Cloudflare reserves a deleted R2 bucket name for 60 seconds, even after GET
// says it is absent. Count from the DELETE response to allow for request time.
const r2NameHoldMs = 60_000;

async function removeDeployment(environment, env, recordPath, sleep) {
  const saved = await readDeploymentRecord(recordPath).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
  if (saved && saved.accountId !== env.CLOUDFLARE_ACCOUNT_ID) throw new Error('Use the Cloudflare account that deployed this environment.');
  // Setup records identities as it creates resources. The outer record only
  // exists after provisioning finishes, so use the original inputs to locate
  // the owner journal when setup stopped early.
  const record = saved ?? {
    partial: true, environment, accountId: env.CLOUDFLARE_ACCOUNT_ID,
    appHost: env.LAMP_APP_HOST, pageHost: env.LAMP_PAGE_HOST,
    resources: resourceNames(environment, env.LAMP_RESOURCE_PREFIX?.trim() || undefined, env.LAMP_PAGE_WORKER?.trim() || undefined),
  };
  const { worker, publicWorker, database, bucket, queue } = record.resources;
  const ownership = deploymentOwnership({ environment, resourcePrefix: worker, pageWorker: publicWorker, appHost: record.appHost, pageHost: record.pageHost }, env);
  const state = await ownership.read();
  if (!saved) {
    if (!Object.values(state.owned).some(entry => entry && Object.keys(entry).length)) throw new Error('no deployment record for this environment');
    await writeDeploymentRecord(recordPath, record);
  }
  // A prior invocation might have deleted the bucket and stopped before
  // recording the time. In that case, allow a full hold from this read.
  const mayHaveDeletedBucket = !record.partial || state.owned.r2[bucket]?.status === 'created';
  let reuseAt = record.bucketReuseAfter ?? (mayHaveDeletedBucket ? Date.now() + r2NameHoldMs : 0);
  const api = { ...ownership.api, async request(path, options) {
    if (path !== `/r2/buckets/${bucket}` || options?.method !== 'DELETE') return ownership.api.request(path, options);
    try { return await ownership.api.request(path, options); }
    finally {
      // A lost response can also follow deletion. Keep the deadline if the
      // rest of removal cannot finish in this invocation.
      reuseAt = Date.now() + r2NameHoldMs;
      await writeDeploymentRecord(recordPath, { ...record, bucketReuseAfter: reuseAt });
    }
  } };
  const removed = [];
  console.log('Removal allows up to 10 minutes per R2 bucket purge. If a long removal stops, run this same command again to resume.');
  // The public Worker refers to the app Worker's Durable Object. Release it
  // first, then clear schedules, consumers, stored objects and data.
  for (const page of [true, false]) {
    const target = ownership.target(page);
    console.log(page ? 'Removing the public page Worker…' : 'Removing the app Worker, its database, files and queue…');
    try {
      const result = await ownerRemove({
        api, target, statePath: ownership.path(page), onProgress: console.log,
        expectedResources: page || record.partial ? {} : { d1: [database], r2: [bucket], queues: [queue] },
      });
      removed.push(...result.removed);
    } catch (error) {
      if (error.message !== 'nothing-to-remove') throw error;
      // A retired creation record still needs a Durable Object absence check.
      const namespaces = await ownership.api.list('/workers/durable_objects/namespaces');
      if (namespaces.some(row => row.script === target.worker)) {
        throw Object.assign(new Error('remove-incomplete'), {resource: `durable-object:${target.worker}`});
      }
    }
  }
  const remainingHold = Math.min(reuseAt - Date.now(), r2NameHoldMs);
  if (remainingHold > 0) {
    console.log(`Waiting for Cloudflare to release the R2 bucket name ${bucket} before a new setup can reuse it…`);
    await sleep(remainingHold);
  }
  await rm(recordPath);
  console.log(`Removed ${removed.join(', ') || 'nothing'}; read back: none remains.`);
}

export async function runRemoval(args, { sleep = wait } = {}) {
  const { values } = parseArgs({ args, options: { environment: { type: 'string', default: 'production' }, 'env-file': { type: 'string' }, yes: { type: 'boolean' } } });
  try {
    if (!values.yes) throw new Error('Removal deletes both Lamp Workers and this environment’s recorded data. Add --yes to confirm.');
    if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(values.environment)) throw new Error('Invalid deployment environment.');
    const env = { ...process.env, ...(values['env-file'] ? await readDeployEnvFile(process.cwd(), values['env-file']) : {}) };
    const recordPath = deploymentRecordPath(values.environment);
    await withStateLock(recordPath, () => removeDeployment(values.environment, env, recordPath, sleep));
    return 0;
  } catch (error) {
    // Provider codes and resource names only; never print an API response or inputs.
    if (error.message === 'remove-incomplete' || deployDiagnostic(error)?.code === 'remove-incomplete') {
      const remaining = [...new Set([...(error.remaining ?? []), ...(error.resource ? [error.resource] : [])])];
      console.error(`Removal stopped: remove-incomplete. ${remaining.join(', ') || 'An unverified resource'} remains or could not be verified absent; running the same command again resumes with the retained records.`);
    } else {
      const detail = ownershipMessage(error, deploymentCommands(values.environment));
      if (detail) console.error(`Removal stopped (${error.message}): ${detail}`);
      else console.error(`Removal stopped: ${error.message}. Keep the records and correct the cause before running the same command again.`);
    }
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await runRemoval(process.argv.slice(2));
