import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { readBuiltWorkerArtifact } from '../../../scripts/build-output.mjs';

const require = createRequire(import.meta.url);
const { unstable_getMiniflareWorkerOptions } = require('wrangler');

// Use the shipped Worker and assets for the existing Reach screen. The wrapper
// controls only time and the same paused-effects boundary as status journeys.
export async function reachBuiltWorkerOptions() {
  await readBuiltWorkerArtifact();
  const options = unstable_getMiniflareWorkerOptions(resolve('dist/server/wrangler.json'));
  const { modulesRules, ...workerOptions } = options.workerOptions;
  async function files(directory) {
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) result.push(...await files(path));
      else if (/\.(?:js|mjs|txt|html|sql|bin|wasm)$/.test(path)) result.push({
        type: /\.(?:js|mjs)$/.test(path) ? 'ESModule' : /\.(?:txt|html|sql)$/.test(path) ? 'Text' : path.endsWith('.bin') ? 'Data' : 'CompiledWasm', path,
      });
    }
    return result;
  }
  const modules = await files(dirname(options.main));
  modules.unshift({ type: 'ESModule', path: join(dirname(options.main), '__reach-fixture.mjs'), contents: `
    import worker from './index.js';
    export * from './index.js';
    const RealDate = Date;
    let clock, paused = false;
    globalThis.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [clock ?? RealDate.now()])); }
      static now() { return clock ?? RealDate.now(); }
    };
    const bindings = env => paused ? { ...env, EFFECTS_PAUSED: '1' } : env;
    export default {
      async fetch(request, env, context) {
        const path = new URL(request.url).pathname;
        if (path === '/test/clock' && request.method === 'PUT') {
          clock = (await request.json()).now;
          return new Response(null, { status: 204 });
        }
        if (path === '/test/effects' && request.method === 'PUT') {
          paused = (await request.json()).paused;
          return new Response(null, { status: 204 });
        }
        return worker.fetch(request, bindings(env), context);
      },
      queue: (batch, env) => worker.queue(batch, bindings(env)),
      scheduled: (event, env, context) => worker.scheduled(event, bindings(env), context),
    };
  ` });
  return { ...workerOptions, modules, modulesRoot: dirname(options.main), externalWorkers: options.externalWorkers };
}
