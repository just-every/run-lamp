import { readFile, rm } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { readDeployEnvFile } from '@runeditrun/rer/internal/modules/deploy-kit/env-file.mjs';
import { ownerRemove } from '@runeditrun/rer/modules/deploy-kit/owner-remove';
import { ownershipMessage } from '@runeditrun/rer/modules/deploy-kit/native-upload';
import { deployDiagnostic } from '@runeditrun/rer/internal/modules/deploy-kit/diagnostics.mjs';
import { deploymentCommands, deploymentOwnership } from './deployment-ownership.mjs';
import { deploymentRecordPath } from './ops-config.mjs';

const { values } = parseArgs({ options: { environment: { type: 'string', default: 'production' }, 'env-file': { type: 'string' }, yes: { type: 'boolean' } } });
try {
  if (!values.yes) throw new Error('Removal deletes both Lamp Workers and this environment’s recorded data. Add --yes to confirm.');
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(values.environment)) throw new Error('Invalid deployment environment.');
  const env = { ...process.env, ...(values['env-file'] ? await readDeployEnvFile(process.cwd(), values['env-file']) : {}) };
  const recordPath = deploymentRecordPath(values.environment);
  const record = JSON.parse(await readFile(recordPath, 'utf8'));
  if (record.accountId !== env.CLOUDFLARE_ACCOUNT_ID) throw new Error('Use the Cloudflare account that deployed this environment.');
  const ownership = deploymentOwnership({ environment: values.environment, resourcePrefix: record.resources.worker, pageWorker: record.resources.publicWorker, appHost: record.appHost, pageHost: record.pageHost }, env);
  const removed = [];
  console.log('Removal allows up to 10 minutes per R2 bucket purge. If a long removal stops, run this same command again to resume.');
  // The public Worker refers to the app Worker's Durable Object. Release it
  // first, then clear schedules, consumers, stored objects and data.
  for (const page of [true, false]) {
    const target = ownership.target(page);
    console.log(page ? 'Removing the public page Worker…' : 'Removing the app Worker, its database, files and queue…');
    try {
      const result = await ownerRemove({
        api: ownership.api, target, statePath: ownership.path(page), onProgress: console.log,
        expectedResources: page ? {} : { d1: [record.resources.database], r2: [record.resources.bucket], queues: [record.resources.queue] },
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
  await rm(recordPath);
  console.log(`Removed ${removed.join(', ') || 'nothing'}; read back: none remains.`);
} catch (error) {
  // Provider codes and resource names only; never print an API response or inputs.
  if (error.message === 'remove-incomplete' || deployDiagnostic(error)?.code === 'remove-incomplete') {
    const remaining = [...new Set([...(error.remaining ?? []), ...(error.resource ? [error.resource] : [])])];
    console.error(`Removal stopped: remove-incomplete. ${remaining.join(', ') || 'An unverified resource'} remains or could not be verified absent; running the same command again resumes with the retained records.`);
    process.exitCode = 1;
  } else {
    const detail = ownershipMessage(error, deploymentCommands(values.environment));
    if (detail) console.error(`Removal stopped (${error.message}): ${detail}`);
    else console.error(`Removal stopped: ${error.code === 'ENOENT' ? 'no deployment record for this environment' : error.message}. Keep the records and correct the cause before running the same command again.`);
    process.exitCode = 1;
  }
}
