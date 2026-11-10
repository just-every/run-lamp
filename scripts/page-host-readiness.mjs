// The last deploy step: the page host serves the retained public snapshot. A page host that is detached
// (its name no longer exists in DNS) is reported and skipped; a name that is slow to resolve is retried;
// a host that answers wrongly fails the deploy.
const DNS_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);
const DNS_ATTEMPTS = 6;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The DNS error code behind a failed fetch, or null for any other failure. */
export function dnsCode(error) {
  for (let cause = error, depth = 0; cause && depth < 5; cause = cause.cause, depth += 1) if (DNS_CODES.has(cause.code)) return cause.code;
  return null;
}

/**
 * Resolves `{ state: "retained" }` once the snapshot is served and retained, or `{ state: "detached" }` when the
 * host's name stays absent from DNS (ENOTFOUND) through every bounded retry. A resolver that keeps failing
 * (EAI_AGAIN) or a host that answers wrongly throws an error naming the host.
 */
export async function awaitPageHostSnapshot(pageHost, { fetchImpl = fetch, sleep = wait, now = Date.now, log = console.log, deadlineMs = 90_000 } = {}) {
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
