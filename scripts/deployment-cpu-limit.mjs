import { readFile } from 'node:fs/promises';
import { parseJsonc } from '@runeditrun/rer/internal/modules/deploy-kit/jsonc.mjs';

export async function configuredWorkerCpuLimit() {
  const config = parseJsonc(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  const limit = config.limits?.cpu_ms;
  if (!Number.isInteger(limit) || limit < 1 || limit > 300_000) {
    throw new Error('wrangler.jsonc limits.cpu_ms must be an integer from 1 to 300000.');
  }
  return limit;
}

export async function nativeWorkerCpuLimit(api) {
  const settings = await api.request('/workers/settings');
  if (typeof settings?.free_tier !== 'boolean') {
    throw new Error('Cloudflare Workers settings did not identify the account plan.');
  }
  return settings.free_tier ? undefined : configuredWorkerCpuLimit();
}
