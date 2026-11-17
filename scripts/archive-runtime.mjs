import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import { getPlatformProxy } from "wrangler";
import { readDeployEnvFile } from "@runeditrun/rer/internal/modules/deploy-kit/env-file.mjs";

import { deploymentRecordPath, readDeploymentRecord, renderRemoteArchiveWranglerToml } from "./ops-config.mjs";

function persistence(flags) {
  return resolve(flags.get("persist-to") ?? ".wrangler/state");
}

function localConfig(flags) {
  return flags.get("config") ?? "wrangler.jsonc";
}

function archiveEnvironment(flags) {
  const environment = flags.get("environment") ?? "production";
  if (!/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(environment)) throw new Error("Archive environment must contain lowercase letters, digits, and hyphens.");
  return environment;
}

// A remote archive reads the deployment's Cloudflare credentials from the same
// private input file as rer deploy; file values override exported ones.
async function loadCloudflareCredentials(flags) {
  const file = flags.get("env-file");
  if (!file) return;
  const values = await readDeployEnvFile(process.cwd(), file);
  for (const name of ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"]) if (values[name]) process.env[name] = values[name];
}

// Archive commands read only D1 and R2. The full wrangler.jsonc also declares the
// SnapshotCache Durable Object, which belongs to the Worker script and cannot be
// served by a bindings-only proxy, so the proxy gets just the two bindings it uses.
async function localArchiveConfig(flags) {
  const source = resolve(localConfig(flags));
  const config = JSON.parse((await readFile(source, "utf8")).replace(/^\s*\/\/.*$/gm, ""));
  const proxy = {
    name: config.name,
    compatibility_date: config.compatibility_date,
    d1_databases: config.d1_databases.filter((entry) => entry.binding === "DB"),
    r2_buckets: config.r2_buckets.filter((entry) => entry.binding === "SNAPSHOTS"),
  };
  const path = join(dirname(source), `.lamp-archive-proxy-${process.pid}.json`);
  await writeFile(path, `${JSON.stringify(proxy, null, 2)}\n`, { mode: 0o600 });
  return path;
}

async function remoteConfig(flags) {
  if (flags.get("config")) throw new Error("Remote archives use the generated owner deployment record; --config is only supported for local archives.");
  const environment = archiveEnvironment(flags);
  let record;
  try {
    record = await readDeploymentRecord(deploymentRecordPath(environment));
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Remote archive requires the deployment record rer deploy wrote for ${environment} in this checkout (.seed/deployment/${environment}.json): ${reason}`);
  }
  await loadCloudflareCredentials(flags);
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is required for remote archive operations. Pass the deployment's private input file with --env-file, or export CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
  if (record.accountId && record.accountId !== accountId) throw new Error(`CLOUDFLARE_ACCOUNT_ID does not match the ${environment} deployment record.`);
  const path = resolve(".seed", "deployment", `${environment}.archive-proxy-${process.pid}.toml`);
  await mkdir(resolve(".seed", "deployment"), { recursive: true });
  await writeFile(path, renderRemoteArchiveWranglerToml({ accountId, ...record.resources, migrationsDir: resolve("migrations", "core") }), "utf8");
  return path;
}

export async function openArchivePlatform(flags) {
  if (flags.get("local") && flags.get("remote")) throw new Error("Choose exactly one of --local or --remote.");
  if (!flags.get("remote")) {
    const proxyConfig = await localArchiveConfig(flags);
    let platform;
    try {
      platform = await getPlatformProxy({
        configPath: proxyConfig,
        remoteBindings: false,
        // Wrangler's local CLI writes a v3 directory below --persist-to. Its Node
        // binding accepts that v3 directory itself, so both sides address one state.
        persist: { path: join(persistence(flags), "v3") },
      });
    } catch (cause) {
      await rm(proxyConfig, { force: true });
      throw cause;
    }
    return {
      platform,
      configPath: localConfig(flags),
      async dispose() {
        await platform.dispose();
        await rm(proxyConfig, { force: true });
      },
    };
  }
  const configPath = await remoteConfig(flags);
  let platform;
  try {
    platform = await getPlatformProxy({ configPath, remoteBindings: true });
  } catch (cause) {
    await rm(configPath, { force: true });
    throw cause;
  }
  return {
    platform,
    configPath,
    async dispose({ keepConfig = false } = {}) {
      await platform.dispose();
      if (!keepConfig) await rm(configPath, { force: true });
    },
  };
}

export function archivePersistence(flags) {
  return persistence(flags);
}
