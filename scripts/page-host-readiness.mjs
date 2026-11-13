// The last deploy step: the page host serves the retained public snapshot. A page host that is detached
// (its name no longer exists in DNS) is reported and skipped; a name that is slow to resolve is retried;
// a host that answers wrongly fails the deploy. A page host routed through Cloudflare for SaaS (`target` set)
// is checked only once its DNS points at the target: before that, the check is skipped and reported.
import { resolve4, resolve6, resolveCname } from "node:dns/promises";

const DNS_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);
const DNS_ATTEMPTS = 6;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The DNS error code behind a failed fetch, or null for any other failure. */
export function dnsCode(error) {
  for (let cause = error, depth = 0; cause && depth < 5; cause = cause.cause, depth += 1) if (DNS_CODES.has(cause.code)) return cause.code;
  return null;
}

const NO_RECORDS = new Set(["ENODATA", "ENOTFOUND"]);
const MAX_CNAME_HOPS = 8;

/** Where a name leads: the CNAME names it passes through and the A/AAAA addresses it ends on. A name that does not exist throws ENOTFOUND. */
export async function resolveHost(host) {
  const chain = [];
  let name = host;
  for (let hop = 0; hop < MAX_CNAME_HOPS; hop += 1) {
    const [next] = await resolveCname(name).catch((error) => { if (error?.code === "ENODATA") return []; throw error; });
    if (!next) break;
    name = next.toLowerCase().replace(/\.$/, "");
    chain.push(name);
  }
  const addresses = (await Promise.all([resolve4, resolve6].map((lookup) => lookup(name).catch((error) => { if (NO_RECORDS.has(error?.code)) return []; throw error; })))).flat();
  return { chain, addresses: addresses.sort() };
}

/** Whether `pageHost`'s DNS reaches `target`: its CNAME chain contains the target, or its A/AAAA set equals the target's. */
async function pointsAtTarget(pageHost, target, resolve, retry) {
  const lookup = async (name) => {
    for (let failures = 1; ; failures += 1) {
      try { return await resolve(name); } catch (error) {
        const code = dnsCode(error);
        if (code === "EAI_AGAIN" && failures < DNS_ATTEMPTS) { await retry(failures); continue; }
        if (code === "EAI_AGAIN") throw new Error(`Page host ${pageHost} did not resolve (${code}) after ${DNS_ATTEMPTS} attempts; the DNS resolver kept failing. Rerun the deploy when DNS answers.`);
        throw error;
      }
    }
  };
  let page;
  try { page = await lookup(pageHost); } catch (error) {
    if (dnsCode(error) === "ENOTFOUND") return false;
    throw error;
  }
  if (page.chain.includes(target)) return true;
  if (!page.addresses.length) return false;
  const goal = await lookup(target).catch((error) => { throw dnsCode(error) === "ENOTFOUND" ? new Error(`LAMP_PAGE_HOST_TARGET ${target} is not in DNS (ENOTFOUND); create it before deploying.`) : error; });
  return goal.addresses.length === page.addresses.length && goal.addresses.every((address, index) => address === page.addresses[index]);
}

/**
 * Resolves `{ state: "retained" }` once the snapshot is served and retained, or `{ state: "detached" }` when the
 * host's name stays absent from DNS (ENOTFOUND) through every bounded retry. A resolver that keeps failing
 * (EAI_AGAIN) or a host that answers wrongly throws an error naming the host. With a `target`, a host whose DNS
 * does not reach the target yet resolves `{ state: "not-pointed" }` and is not fetched.
 */
export async function awaitPageHostSnapshot(pageHost, { target, resolve = resolveHost, fetchImpl = fetch, sleep = wait, now = Date.now, log = console.log, deadlineMs = 90_000 } = {}) {
  if (target && !await pointsAtTarget(pageHost, target, resolve, (failures) => sleep(Math.min(2_000 * 2 ** (failures - 1), 20_000)))) {
    log(`Page host ${pageHost} does not point at ${target} yet: skipped.`);
    return { state: "not-pointed" };
  }
  const url = `https://${pageHost}/api/public/status`;
  const deadline = now() + deadlineMs;
  let dnsFailures = 0;
  let last = null;
  for (;;) {
    try {
      const snapshot = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(15_000), redirect: "error" });
      dnsFailures = 0;
      last = `HTTP ${snapshot.status}`;
      const retained = snapshot.ok && snapshot.headers.get("X-Lamp-Snapshot-Retained") === "true";
      await snapshot.body?.cancel();
      if (retained) return { state: "retained" };
    } catch (error) {
      const code = dnsCode(error);
      last = code ?? (error?.cause?.code || error?.name || "unreachable");
      if (code) {
        dnsFailures += 1;
        if (dnsFailures >= DNS_ATTEMPTS) {
          if (code === "EAI_AGAIN") throw new Error(`Page host ${pageHost} did not resolve (${code}) after ${DNS_ATTEMPTS} attempts; the DNS resolver kept failing. Rerun the deploy when DNS answers.`);
          log(`Page host detached: skipped. ${pageHost} is not in DNS (${code} after ${DNS_ATTEMPTS} attempts), so its retained snapshot was not checked.`);
          return { state: "detached" };
        }
        await sleep(Math.min(2_000 * 2 ** (dnsFailures - 1), 20_000));
        continue;
      }
      dnsFailures = 0;
    }
    if (now() >= deadline) break;
    await sleep(2_000);
  }
  throw new Error(`Deployment is live but retained snapshot readiness is unverified for ${pageHost} (${last}); inspect snapshot build failures before accepting this deployment.`);
}
