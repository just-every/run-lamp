import { parseJson } from "../../../../../modules/import-kit/src/readers/json.ts";
import { decodedCredentialText, reflectedCredentialMatcher } from "../../../../../modules/import-kit/src/provenance/credentials.ts";
import type { Json } from "../../../../../modules/import-kit/src/types.ts";

/** Validate duplicate keys before preserving integer ID lexemes. No numeric ID
 * passes through Number, including IDs larger than Number.MAX_SAFE_INTEGER. */
export function parseSorryJson(text: string): Json {
  parseJson(text, { artifact: "Sorry response" });
  let index = 0;
  const replacements: { start: number; end: number }[] = [];
  const space = () => { while (index < text.length && /\s/u.test(text[index])) index++; };
  const string = () => { const start = index++; while (text[index] !== '"') { if (text[index] === "\\") index++; index++; } index++; return JSON.parse(text.slice(start, index)) as string; };
  function visit(key = "", depth = 0): void {
    if (depth > 64) throw new Error("Sorry response exceeds the supported JSON nesting depth.");
    space();
    if (text[index] === '"') { string(); return; }
    if (text[index] === "{" || text[index] === "[") {
      const isObject = text[index++] === "{", end = isObject ? "}" : "]";
      space();
      while (text[index] !== end) {
        let childKey = key;
        if (isObject) { childKey = string(); space(); index++; }
        visit(childKey, depth + 1); space();
        if (text[index] !== ",") break;
        index++; space();
      }
      index++; return;
    }
    const start = index;
    while (index < text.length && !/[\s,\]}]/u.test(text[index])) index++;
    if (/^(?:id|parent_id|page_id|component_id|component_ids)$/u.test(key) && /^-?\d+(?:[.eE][+\-\d]*)?$/u.test(text.slice(start, index))) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(text.slice(start, index))) throw new Error("Sorry numeric identities must be nonnegative decimal integers.");
      replacements.push({ start, end: index });
    }
  }
  visit();
  let last = 0, transformed = "";
  for (const entry of replacements) { transformed += text.slice(last, entry.start) + JSON.stringify(text.slice(entry.start, entry.end)); last = entry.end; }
  return JSON.parse(transformed + text.slice(last)) as Json;
}

export const sorrySubscriberChannels = {
  phone_number: "SMS / phone",
  slack_webhook_url: "Slack", microsoft_teams_url: "Microsoft Teams",
  google_chat_space: "Google Chat", legacy_slack_oauth_token: "legacy Slack",
} as const;
const capability = /(?:token|secret|password|authorization|cookie|api.?key|webhook|secure.?link|manage.?url|unsubscribe.?url|confirmation.?url|microsoft.?teams.?url|google.?chat.?space)/iu;
/** Only documented channel fields on subscriber rows may carry capabilities.
 * Such responses retain a hash, never original bytes or redacted originals. */
export class SorryFieldRefusal extends Error {}
export function assertSorrySafe(value: unknown, key?: string, subscriberResponse = false): boolean {
  const reflected = reflectedCredentialMatcher(key ? [key] : []);
  const rows = subscriberResponse && value && typeof value === "object" && "response" in value && Array.isArray(value.response) ? new Set(value.response) : new Set();
  let hasChannelCapabilities = false;
  function visit(item: unknown, path = ""): void {
    if (typeof item === "string" && reflected(item)) throw new SorryFieldRefusal((path || "/") + ": credential material refused; remove it and review a fresh export. Nothing was retained.");
    if (Array.isArray(item)) { item.forEach((child, index) => visit(child, path + "/" + index)); return; }
    if (item && typeof item === "object") for (const [name, child] of Object.entries(item)) {
      if (reflected(name)) throw new SorryFieldRefusal((path || "/") + ": credential-bearing field name refused; remove it and review a fresh export. Nothing was retained.");
      const childPath = path + "/" + name.replaceAll("~", "~0").replaceAll("/", "~1");
      if ((Object.hasOwn(sorrySubscriberChannels, name) || capability.test(decodedCredentialText(name))) && child != null && child !== "" && typeof child !== "boolean") {
        if (!rows.has(item) || !Object.hasOwn(sorrySubscriberChannels, name) || typeof child !== "string") throw new SorryFieldRefusal(childPath + ": access capability refused; remove this field and review a fresh export. Nothing was retained.");
        hasChannelCapabilities = true;
      }
      visit(child, childPath);
    }
  }
  visit(value);
  return hasChannelCapabilities;
}

export function retainedSorry(value: unknown): Json {
  if (Array.isArray(value)) return value.map(retainedSorry);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !Object.hasOwn(sorrySubscriberChannels, key) && !capability.test(decodedCredentialText(key))).map(([key, child]) => [key, retainedSorry(child)])) as Json;
  return value as Json;
}

/** Field accounting is independent of the normalized entity projection: walk
 * the original parsed response, so passthrough/nested fields cannot disappear. */
export function sorryFieldInventory(
  files: Array<{ name: string; value: Record<string, unknown> }>,
  groupIds: Set<string>,
): import("./schema.ts").SorryField[] {
  const fields: import("./schema.ts").SorryField[] = [];
  const pointer = (value: string) => value.replaceAll("~", "~0").replaceAll("/", "~1");
  for (const { name: file, value: envelope } of files) {
    const isPublic = !Object.hasOwn(envelope, "response");
    const resource = /^sorry-(components|notices|subscribers|notice-templates|update-templates)(?:-\d+)?\.json$/u.exec(file)?.[1];
    const noticeId = /^sorry-notice-(\d+)(?:-updates(?:-\d+)?)?\.json$/u.exec(file)?.[1];
    const separateUpdates = /-updates(?:-\d+)?\.json$/u.test(file);
    const root = isPublic ? resource ?? (file === "sorry-status.json" ? "page" : "notice") : "response";
    function leaf(value: unknown, parts: string[], kind: string, sourceId: string, relative: string[]) {
      const path = "/" + parts.map(pointer).join("/");
      const field: import("./schema.ts").SorryField = { file, path, kind, sourceId, outcome: "raw-only",
        reason: "Retained only in source data; Lamp has no native mapping for this field.",
        action: "Review this loss; recreate it in Lamp if available, or keep the source export." };
      const key = relative[0], last = relative.at(-1);
      const mapped = (target: string, changed = false, reason?: string) => Object.assign(field, { target,
        outcome: changed ? "changed" : "mapped",
        reason: reason ?? (changed ? "Translated to Lamp's native representation." : "Carried to the named Lamp field."),
        action: changed ? "Review the native representation before importing." : "No action needed." });
      if (kind === "envelope") {
        if (relative.length === 1 && key === "count" || relative.length === 2 && (
          key === "pagination" && ["current", "pages", "per_page", "count", "next", "previous"].includes(last!) ||
          key === "meta" && ["count", "total_count", "next_page", "previous_page"].includes(last!))) {
          mapped("input.pagination", false, "Validated for complete collection pagination; no native content is created.");
        }
      } else if (kind === "page") {
        if (relative.length === 1 && ["id", "url", "endpoint"].includes(key)) mapped("sourceInfo", false, "Retained as source page identity or public origin; not applied as Lamp settings.");
      } else if (["component", "group"].includes(kind) && relative.length === 1) {
        if (key === "id") mapped("provenance.sourceId", true, "Source identity derives a stable Lamp identity.");
        if (key === "name") mapped(kind === "group" ? "component_groups.name" : "components.name", kind === "group" && groupIds.has(sourceId), kind === "group" ? "Parent is represented once as a visual group; nested ancestor names are flattened." : undefined);
        if (key === "description" && kind === "component") mapped("components.description");
        if (key === "parent_id") mapped(kind === "group" ? "component_groups.name" : "components.group_id", true, "Parent becomes a visual group; nested hierarchy is flattened.");
        if (key === "position") mapped(kind === "group" ? "component_groups.display_order" : "components.display_order", true, "Source relative order is appended after existing Lamp records.");
        if (key === "state" && kind === "component") mapped("component_standing_claims.state", true, "Source state is translated to a Lamp standing claim; Operational needs no extra claim.");
        if (key === "created_at" && kind === "component") mapped("components.created_at", true, "Native history starts at the earliest source creation or derived claim instant.");
      } else if (["template", "update-template"].includes(kind) && relative.length === 1) {
        if (key === "id") mapped("provenance.sourceId", true, "Source identity derives a stable Lamp template identity.");
        if (key === "name") mapped("incident_templates.name");
        if (key === "subject") mapped("incident_templates.source_metadata_json", false, "Exact subject retained, including an update template subject; oversized titles require shortening.");
        if (["initial_comment", "content"].includes(key)) mapped("incident_templates wording", true, "Complete wording fills impact and details by paragraph; oversized fields stay complete until the owner shortens them.");
        if (key === "component_id") mapped("incident_templates.source_metadata_json", false, "Collection-page scope retained; this is not an affected-service choice or state.");
        if (["created_at", "updated_at"].includes(key)) mapped("incident_templates.source_metadata_json", false, "Source timestamp retained unchanged, separately from native import/edit times.");
      } else if (kind === "subscriber") {
        if (relative.length === 1 && key === "id") mapped("provenance.sourceId", true, "Source identity derives a stable Lamp identity.");
        if (relative.length === 1 && key === "email") mapped("subscribers.destination", true, "Email is trimmed and lowercased; the candidate is held inactive for explicit invitation and confirmation.");
        if (relative.length === 1 && ["notify_by_email", "confirmed", "verified", "email_verified", "unsubscribed", "unsubscribed_at", "deleted_at", "deactivated_at"].includes(key)) mapped("subscriber eligibility", true, "Used to accept or refuse an inactive email candidate; source consent never activates a Lamp subscription.");
        if (key === "component_ids" && relative.length === 2 || key === "components" && relative.length === 3 && last === "id" || ["component_ids", "components"].includes(key) && relative.length === 1 && Array.isArray(value)) mapped("subscriber_components.component_id", true, "Component preferences are resolved without broadening; parent-only selection expands to its leaves.");
      } else if (["incident", "maintenance", "notice-update"].includes(kind)) {
        const update = kind === "notice-update" || key === "updates";
        const property = update ? last : key;
        const direct = kind === "notice-update" ? relative.length === 1 : update ? relative.length === 3 : relative.length === 1;
        const table = kind === "maintenance" ? "maintenance" : "incidents";
        if (direct) {
          if (property === "id") mapped("provenance.sourceId", true, "Source identity derives a stable Lamp record or timeline identity.");
          if (property === "content" && update) mapped(kind === "maintenance" ? "import_maintenance_updates.body" : "imported incident timeline", kind !== "maintenance" && typeof value === "string" && (value !== value.trim() || Array.from(value).length > 250),
            kind === "maintenance" ? "Historical maintenance message retained in full." : "Full source message remains in imported history; Lamp's impact summary is bounded and surrounding whitespace is trimmed for native summary fields.");
          if (property === "created_at" && update) mapped(kind === "maintenance" ? "import_maintenance_updates.published_at" : "incident_updates.published_at");
          if (property === "state") mapped(update ? "timeline lifecycle" : table + ".state", true, "Sorry lifecycle is translated to Lamp; general notices are informational, and unsupported states refuse the record.");
          if (!update && property === "subject") mapped(table + ".title");
          if (!update && property === "type") mapped("native record kind", true, "Planned notices become maintenance; general notices become resolved informational incidents.");
          if (!update && ["began_at", "ended_at", "begins_at", "ends_at"].includes(property!)) mapped(table + ".timing", true, "Source notice times determine native timing; invalid intervals require an authored resolution or are refused.");
          if (!update && ["url", "link"].includes(property!)) mapped("public aliases", true, "Safe source paths redirect on the moved hostname; the source host remains outside Lamp control.");
        }
        if (!update && (key === "component_ids" && relative.length === 2 || key === "components" && relative.length === 3 && last === "id" || ["component_ids", "components"].includes(key) && relative.length === 1 && Array.isArray(value))) mapped(table + "_components", true, "Affected leaves are resolved against parent groups and explicit children; a parent alongside a child does not add siblings.");
      }
      // This mirrors retainedSorry, including empty/null capability fields.
      // A field path and its disposition survive; its capability value never does.
      if (relative.some(part => Object.hasOwn(sorrySubscriberChannels, part) || capability.test(decodedCredentialText(part)))) {
        field.outcome = "deleted"; delete field.target;
        field.reason = "This channel or capability field is removed from sanitized source records and is never imported. Original byte custody is withheld when a response contains channel capabilities.";
        field.action = "Configure a fresh supported channel separately; keep any original response private.";
      }
      const limit = field.target?.endsWith(".name") ? 120 : field.target === "components.description" ? 500 : field.target?.endsWith(".title") ? 250 : undefined;
      if (limit && typeof value === "string" && Array.from(value).length > limit && field.outcome !== "deleted") {
        field.outcome = "changed";
        field.reason = "Native text is shortened to " + limit + " Unicode code points; full source text remains retained.";
        field.action = "Review the shortened native text; copy any needed detail from the source export.";
      } else if (typeof value === "string" && value.toWellFormed() !== value && field.outcome === "mapped") {
        field.outcome = "changed"; field.reason = "Invalid Unicode is replaced with U+FFFD for native storage.";
        field.action = "Review the replacement characters before importing.";
      }
      fields.push(field);
    }
    function walk(value: unknown, parts: string[], kind: string, sourceId: string, relative: string[]) {
      if (value && typeof value === "object" && Object.keys(value).length) {
        for (const [key, child] of Object.entries(value)) walk(child, [...parts, key], kind, sourceId, [...relative, key]);
      } else leaf(value, parts, kind, sourceId, relative);
    }
    for (const [key, value] of Object.entries(envelope)) {
      if (key !== root) { walk(value, [key], "envelope", file, [key]); continue; }
      if (Array.isArray(value)) {
        if (!value.length) leaf(value, [key], "envelope", file, [key]);
        value.forEach((row: Record<string, unknown>, index) => {
          const detail = noticeId ? files.find(entry => entry.name === "sorry-notice-" + noticeId + ".json")?.value : undefined;
          const owner = detail ? (detail.response ?? detail.notice) as Record<string, unknown> : undefined;
          const kind = resource === "components" ? groupIds.has(String(row.id)) ? "group" : "component"
            : resource === "subscribers" ? "subscriber"
            : resource === "notice-templates" ? "template" : resource === "update-templates" ? "update-template"
            : (separateUpdates ? owner?.type : row.type) === "planned" ? "maintenance" : "incident";
          walk(row, [key, String(index)], kind, noticeId ?? String(row.id), separateUpdates ? ["updates", String(index)] : []);
        });
      } else {
        const row = value as Record<string, unknown>;
        const kind = file === "sorry-page.json" || file === "sorry-status.json" ? "page" : row.type === "planned" ? "maintenance" : "incident";
        walk(value, [key], kind, String(row.id ?? file), []);
      }
    }
  }
  return fields;
}
