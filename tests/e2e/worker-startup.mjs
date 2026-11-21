import { createServer } from "node:net";
import { stripVTControlCharacters } from "node:util";
import { stopProcessGroup } from "../dev-ingress/shutdown.mjs";

function startupOutput(output) {
  return typeof output === "function" ? output() : output ?? "";
}

async function probeSummary(response) {
  if (!response || typeof response.status !== "number") throw new Error("A Worker startup probe must return an HTTP response.");
  const body = typeof response.text === "function" ? await response.text() : "";
  return `${response.status}${body ? ` ${body}` : ""}`;
}

/** Reserve an ephemeral loopback port for one local Worker test. */
export async function reservePort({ host = "127.0.0.1", label = "Worker" } = {}) {
  return new Promise((resolvePort, reject) => {
    const listener = createServer();
    listener.once("error", reject);
    listener.listen(0, host, () => {
      const address = listener.address();
      if (!address || typeof address === "string") return reject(new Error(`Could not reserve a ${label} port.`));
      listener.close((error) => error ? reject(error) : resolvePort(address.port));
    });
  });
}

/**
 * Wait for one locally spawned Worker without allowing a half-open HTTP probe
 * to exceed the fixture's wall-clock startup budget. Custom host-routing probes
 * receive the same AbortSignal and remaining budget as the default fetch probe.
 */
export async function waitForWorker({ origin, child, output, probe, isListening, signal, timeoutMs = 30_000, label = "Worker" } = {}) {
  if (!child) throw new Error(`${label} startup requires its spawned child process.`);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error(`${label} startup timeout must be positive.`);
  if (!probe && !origin) throw new Error(`${label} startup requires an origin or custom probe.`);

  const healthProbe = probe ?? (({ signal }) => fetch(new URL("/health", origin), { signal }));
  const deadline = performance.now() + timeoutMs;
  let latest = "connection refused";

  while (performance.now() < deadline) {
    signal?.throwIfAborted();
    if (child.exitCode != null || child.signalCode != null) {
      throw new Error(`${label} exited before it became ready:\n${startupOutput(output)}`);
    }
    const remainingMs = Math.max(1, Math.ceil(deadline - performance.now()));
    const timeout = AbortSignal.timeout(remainingMs);
    const probeSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      if (isListening && !isListening()) throw new Error("spawned Worker has not announced its listening address");
      const response = await healthProbe({ signal: probeSignal, remainingMs });
      if (child.exitCode != null || child.signalCode != null) {
        throw new Error(`${label} exited during its startup probe:\n${startupOutput(output)}`);
      }
      if (!response || typeof response.status !== "number") throw new Error("startup probe did not return an HTTP response.");
      if (response.status === 200) return response;
      latest = await probeSummary(response);
    } catch (cause) {
      latest = cause instanceof Error ? cause.message : String(cause);
    }

    const pause = Math.min(100, Math.max(0, deadline - performance.now()));
    if (pause) await new Promise((resolve) => setTimeout(resolve, pause));
  }

  throw new Error(`${label} did not become ready within ${timeoutMs}ms (${latest}):\n${startupOutput(output)}`);
}

/** Start a detached Vite fixture, rebuilding its port-dependent options on each attempt. */
export async function startViteWorker({ start, label = "Worker", firstPort, probe, onOutput, describeOutput = startupOutput }) {
  const tried = new Set();
  let port = firstPort ?? await reservePort({ label });
  const originalPort = port;

  for (let attempt = 1; attempt <= 3; attempt++) {
    tried.add(port);
    const origin = `http://127.0.0.1:${port}`;
    const child = start(port);
    const controller = new AbortController();
    let output = "";
    let retry = false;
    let starting = true;
    try {
      const failed = new Promise((_, reject) => {
        const fail = (message) => {
          if (!starting) return;
          retry = true;
          reject(new Error(`${label} ${message}:\n${describeOutput(output)}`));
        };
        child.once("error", reject);
        child.once("exit", () => fail("exited before it became ready"));
        const record = (chunk) => {
          output += chunk;
          onOutput?.(chunk);
          if (starting && /\bPort \d+ is already in use\b/.test(stripVTControlCharacters(output))) {
            fail("reported a port conflict before it became ready");
          }
        };
        child.stdout.on("data", record);
        child.stderr.on("data", record);
      });
      await Promise.race([failed, waitForWorker({
        origin, child, label, output: () => describeOutput(output),
        timeoutMs: 180_000, signal: controller.signal,
        isListening: () => stripVTControlCharacters(output).includes(`${origin}/`),
        probe: probe && ((options) => probe({ ...options, origin })),
      })]);
      if (attempt > 1) console.log(`${label} startup retried: first port ${originalPort}, ready on port ${port}`);
      return { child, port };
    } catch (error) {
      starting = false;
      controller.abort();
      await stopProcessGroup(child);
      if (!retry || attempt === 3) throw error;
    } finally {
      starting = false;
      controller.abort();
    }

    do {
      port = await reservePort({ label });
    } while (tried.has(port));
  }
}
