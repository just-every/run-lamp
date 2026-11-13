import dns from 'node:dns';
import { edgeFetch } from './cloudflare-edge.mjs';

// NODE_OPTIONS=--import for `rer deploy` and every Node process it starts: Cloudflare and the deployed Worker's
// host answer from the fake edge at LAMP_FAKE_EDGE, and no name resolves except localhost, so no client can
// reach the network. A process started without the edge variables reaches no host at all.
globalThis.fetch = edgeFetch({ edge: process.env.LAMP_FAKE_EDGE, hosts: (process.env.LAMP_FAKE_EDGE_HOSTS ?? '').split(',').filter(Boolean), fetch: globalThis.fetch });
const refused = name => Object.assign(new Error(`getaddrinfo ENOTFOUND ${name}`), { code: 'ENOTFOUND', hostname: name });
const local = name => ['localhost', '127.0.0.1', '::1'].includes(name);
const lookup = dns.lookup, promiseLookup = dns.promises.lookup;
dns.lookup = (name, ...rest) => local(name) ? lookup(name, ...rest) : process.nextTick(rest.at(-1), refused(name));
dns.promises.lookup = (name, ...rest) => local(name) ? promiseLookup(name, ...rest) : Promise.reject(refused(name));
for (const method of ['resolve', 'resolve4', 'resolve6', 'resolveTxt', 'resolveCname', 'resolveMx', 'resolveAny']) {
  dns[method] = (name, ...rest) => process.nextTick(rest.at(-1), refused(name));
  dns.promises[method] = name => Promise.reject(refused(name));
}
