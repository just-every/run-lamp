import { resolve } from 'node:path';
import { cloudflare } from '@runeditrun/rer/internal/modules/deploy-kit/provider.mjs';
import { readOwnerState, writeOwnerState, resourceId } from '@runeditrun/rer/modules/deploy-kit/owner';
import { nativeUpload, nativeWorkerCheck } from '@runeditrun/rer/modules/deploy-kit/native-upload';
import { activeWorker } from '@runeditrun/rer/internal/modules/deploy-kit/worker.mjs';
import { resourceNames } from './ops-config.mjs';

export function deploymentCommands(environment) {
  return {
    deploy: `rer deploy --environment ${environment} with the original deployment inputs`,
    remove: `node scripts/remove-deployment.mjs --environment ${environment} --yes with the same --env-file (if used)`,
  };
}

// Native Lamp keeps its established two-Worker topology and resource names.
// Record actual creation identities in Base's format so signin and teardown
// have the same ownership boundary as an ordinary rer deployment.
export function deploymentOwnership(config, env = process.env) {
  const names = resourceNames(config.environment, config.resourcePrefix, config.pageWorker);
  for (const name of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN']) {
    if (!env[name]?.trim()) throw new Error(`${name} is required for native deployment ownership.`);
  }
  const api = cloudflare({ accountId: env.CLOUDFLARE_ACCOUNT_ID, token: env.CLOUDFLARE_API_TOKEN, maxRequests: Infinity });
  const target = (page = false) => ({ accountId: api.accountId, project: 'just-every/lamp', environment: config.environment,
    worker: page ? names.publicWorker : names.worker, origin: `https://${page ? config.pageHost : config.appHost}` });
  const path = (page = false) => resolve('.rer', 'deploy', `${config.environment}${page ? '.page' : ''}.json`);
  const read = (page = false) => readOwnerState(path(page), target(page));
  const commands = deploymentCommands(config.environment);
  const uploadTarget = page => ({ api, target: target(page), statePath: path(page), commands });
  return { api, target, path,
    // Check both targets before setup can create or migrate any resources.
    // Reading Base's original records also refuses a renamed recorded Worker.
    async checkWorkers() {
      await nativeWorkerCheck(uploadTarget(false));
      if (config.hosting === 'workers-dev') await nativeWorkerCheck(uploadTarget(true));
      // Custom-domain hosting leaves the page Worker inactive, but must not
      // replace its recorded identity when setup writes the resource record.
      else await read(true);
    },
    /** The secret names the live Worker holds (never values); none before its first deploy. */
    async heldSecrets(page = false) {
      const live = await activeWorker(api, target(page).worker);
      return live ? live.settings.bindings.filter(binding => binding.type === 'secret_text').map(binding => binding.name) : [];
    },
    async resource(kind, name, find, create) {
      const state = await read(), existing = await find();
      if (existing) {
        const entry = state.owned[kind][name];
        if (entry?.status !== 'created' || entry.id !== resourceId(kind, existing)) throw new Error(`Refusing unrecorded or replaced ${kind} resource ${name}. Keep its original deployment record; it was not created by this checkout.`);
        return existing;
      }
      if (state.owned[kind][name]) throw new Error(`Recorded ${kind} resource ${name} is missing. Finish removing this environment before deploying it again.`);
      state.owned[kind][name] = { status: 'pending' };
      await writeOwnerState(path(), state);
      const made = await create();
      const id = resourceId(kind, made);
      if (!id) throw new Error(`The provider did not identify the created ${kind} resource ${name}. Keep the deployment record and inspect it before continuing.`);
      state.owned[kind][name] = { status: 'created', id };
      await writeOwnerState(path(), state);
      return made;
    },
    async upload(page, identity, action) {
      const selected = uploadTarget(page);
      await nativeUpload({
        ...selected,
        fingerprint: identity.fingerprint,
        receipt: { origin: selected.target.origin, source: { sha: identity.source } },
        upload: action,
      });
    },
  };
}
