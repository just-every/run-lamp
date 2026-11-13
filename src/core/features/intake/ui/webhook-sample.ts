import type { Source } from "./tools";

type SampleSource = Pick<Source, "endpointUrl" | "deduplicationPath" | "titlePath" | "statePath" | "recoveredValue">;

// Use the same dotted fields and numeric array indexes that intake's readPath accepts.
function put(payload: unknown, path: string[], value: string): unknown {
  const [field, ...rest] = path;
  if (field === undefined) return value;
  const container = payload && typeof payload === "object" ? payload : /^\d+$/.test(field) ? [] : Object.create(null);
  const previous = Object.hasOwn(container, field) ? Reflect.get(container, field) : undefined;
  Object.defineProperty(container, field, { value: put(previous, rest, value), enumerable: true, configurable: true, writable: true });
  return container;
}

const quote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;

/** A runnable firing request using the saved source's address and payload mappings. */
export function webhookSample(source: SampleSource, token: string): string {
  const firing = source.recoveredValue === "firing" ? "alerting" : "firing";
  let payload: unknown = {};
  // The required string identity wins if paths overlap; optional title/state do not prevent intake.
  for (const [path, value] of [
    [source.statePath, firing],
    [source.titlePath, "First alert from your monitoring tool"],
    [source.deduplicationPath, source.recoveredValue === "lamp-first-alert" ? "lamp-first-alert-2" : "lamp-first-alert"],
  ]) {
    const segments = path.replace(/^\$\.?/, "").replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    payload = put(payload, segments, value);
  }
  return [
    `curl --request POST ${quote(source.endpointUrl)} \\`,
    `  --header ${quote(`Authorization: Bearer ${token}`)} \\`,
    "  --header 'Content-Type: application/json' \\",
    `  --data-raw ${quote(JSON.stringify(payload, null, 2))}`,
  ].join("\n");
}
