import { readFileSource } from "../../../../../modules/import-kit/src/readers/index.ts";
import { canonicalJson, sha256 } from "../../../../../modules/import-kit/src/d1/index.ts";
import { safeValue } from "../../../../../modules/import-kit/src/readers/records.ts";
import type { Json, SourceArtifact } from "../../../../../modules/import-kit/src/types.ts";
import type { SavedFile } from "../source.ts";
import { assertSorrySafe, parseSorryJson, retainedSorry, sorryFieldInventory, SorryFieldRefusal } from "./json.ts";
import { componentSchema, managementPageSchema, nextPublicPage, noticeSchema, object, publicPageSchema, publicUrl, sorryLimits, subscriberSchema, updateSchema, noticeTemplateSchema, updateTemplateSchema, templatePagination, type ObjectValue } from "./schema.ts";

type SavedRow = { raw: ObjectValue; origin: SourceArtifact };
const equal = (a: unknown, b: unknown) => canonicalJson(a as Json) === canonicalJson(b as Json);
export function agree(left: ObjectValue, right: ObjectValue, fields: readonly string[]) {
  if (fields.some((key) => left[key] !== undefined && right[key] !== undefined && !equal(left[key], right[key]))) throw new Error("Sorry list and detail disagree; save them again together.");
}
export const accessFields = ["private", "password_enabled", "sso_enabled", "audience_ids", "published", "draft", "should_publish", "access_mode"] as const;
export const noticeFacts = ["id", "type", "subject", "state", "began_at", "ended_at", "begins_at", "ends_at", "created_at", "updated_at", "components", "component_ids", ...accessFields] as const;

export async function readSorryFiles(files: SavedFile[], pageId?: string, capturePublicUrl?: string) {
  if (!files.length || files.length > sorryLimits.files) throw new Error("Choose between 1 and 200 saved Sorry response files.");
  const bytes = files.reduce((sum, file) => sum + new TextEncoder().encode(file.text).length, 0);
  if (bytes > sorryLimits.maxBytes) throw new Error("Saved Sorry responses exceed the 8 MiB limit.");
  const envelopes = new Map<string, { value: ObjectValue; origin: SourceArtifact }>();
  const artifacts: SourceArtifact[] = [];
  let records = 0;
  const count = (value: unknown) => {
    records++;
    if (records > sorryLimits.maxRecords || new TextEncoder().encode(JSON.stringify(value)).length > sorryLimits.maxRecordBytes) throw new Error("Sorry source record count or record size exceeds its limit; nothing was truncated.");
  };
  for (const file of files) {
    if (envelopes.has(file.name) || !/^sorry-(?:status|page|components(?:-[1-9][0-9]*)?|notices(?:-[1-9][0-9]*)?|(?:notice|update)-templates(?:-[1-9][0-9]*)?|subscribers(?:-[1-9][0-9]*)?|notice-[0-9]+(?:-updates(?:-[1-9][0-9]*)?)?)\.json$/u.test(file.name)) throw new Error(file.name + ":/ (all fields refused): unsupported or duplicate Sorry resource file; no fields were imported. Remove it and recreate that resource separately before reviewing again.");
    try {
      const value = object(parseSorryJson(file.text));
      const hasChannels = assertSorrySafe(value, undefined, /^sorry-subscribers(?:-[1-9][0-9]*)?\.json$/u.test(file.name));
      safeValue(retainedSorry(value));
      // Capability-bearing subscriber originals stay transient. Hash the exact
      // input as Instatus does; never label sanitized bytes as original custody.
      const origin: SourceArtifact = hasChannels
        ? { name: file.name, sha256: sha256(file.text), size: new TextEncoder().encode(file.text).length }
        : (await readFileSource({ namespace: "sorry", name: file.name, bytes: new TextEncoder().encode(file.text), format: "json", parse: () => ({ kind: "response", sourceId: file.name, payload: retainedSorry(value) }) }, { ...sorryLimits, maxRecordBytes: sorryLimits.maxBytes })).artifacts[0];
      envelopes.set(file.name, { value, origin }); artifacts.push(origin);
    } catch (error) { if (error instanceof SorryFieldRefusal) throw new Error(file.name + error.message); throw new Error(`${file.name}: invalid Sorry JSON, credential-bearing response or unsupported source size.`); }
  }
  const isPublic = envelopes.has("sorry-status.json");
  if (isPublic === envelopes.has("sorry-page.json")) throw new Error("Include exactly one sorry-status.json public response or sorry-page.json authenticated response.");
  if (isPublic && [...envelopes.keys()].some((name) => name.startsWith("sorry-subscribers"))) throw new Error("Public Sorry responses cannot include subscribers; use the authenticated API export.");
  const used = new Set<string>();
  const pageName = isPublic ? "sorry-status.json" : "sorry-page.json";
  const pageEnvelope = envelopes.get(pageName)!; used.add(pageName);
  const page = isPublic ? publicPageSchema.parse(pageEnvelope.value.page) : managementPageSchema.parse(pageEnvelope.value.response);
  count(page);
  if (!isPublic && pageId && page.id !== pageId) throw new Error("The Sorry response belongs to another page ID.");
  const sourceUrl = isPublic ? String(page.url) : `https://${String(page.endpoint).replace(/\/$/u, "")}`;
  const pageUrl = publicUrl(capturePublicUrl ?? sourceUrl);

  function collection(stem: string, resource: string, perPage?: number): SavedRow[] {
    const rows: SavedRow[] = [];
    let total: number | undefined;
    for (let number = 1; number <= sorryLimits.pages; number++) {
      const name = `sorry-${stem}${number === 1 ? "" : `-${number}`}.json`;
      const entry = envelopes.get(name);
      if (!entry) throw new Error(`Include ${name}; Sorry pagination must be complete.`);
      used.add(name);
      const list = isPublic ? entry.value[resource] : entry.value.response;
      if (!Array.isArray(list)) throw new Error(`${name}: undocumented Sorry list envelope.`);
      for (const row of list) { const raw = object(row); count(raw); rows.push({ raw, origin: entry.origin }); }
      let next = false;
      if (isPublic) {
        const meta = object(entry.value.meta);
        if (!Number.isSafeInteger(meta.count) || meta.count !== list.length || !Number.isSafeInteger(meta.total_count) || Number(meta.total_count) < rows.length || list.length > 25) throw new Error("Sorry public pagination counts are incomplete or inconsistent.");
        if (total !== undefined && total !== meta.total_count) throw new Error("Sorry public pagination changed while being captured.");
        total = Number(meta.total_count);
        next = nextPublicPage(meta.next_page, `/api/v1/${resource}`, number, pageUrl.origin) !== null;
        if (next && !list.length || next !== (rows.length < total)) throw new Error("Sorry public pagination ended before all records were supplied.");
      } else if (entry.value.pagination != null) {
        const pagination = object(entry.value.pagination);
        if (pagination.current !== number || !Number.isSafeInteger(pagination.pages) || Number(pagination.pages) < number || !Number.isSafeInteger(pagination.per_page) || Number(pagination.per_page) < list.length || !Number.isSafeInteger(pagination.count)) throw new Error("Sorry authenticated pagination is inconsistent.");
        if (total !== undefined && total !== pagination.count) throw new Error("Sorry authenticated pagination changed while being captured.");
        total = Number(pagination.count);
        next = number < Number(pagination.pages);
        if (pagination.next !== (next ? number + 1 : null) || next && !list.length || !next && total !== rows.length) throw new Error("Sorry authenticated pagination is incomplete.");
      } else {
        if (entry.value.count !== list.length) throw new Error("Sorry authenticated response count does not match its records.");
        if (perPage && list.length > perPage) throw new Error("Sorry subscribers exceed the documented page size.");
        next = Boolean(perPage && list.length === perPage);
      }
      if (!next) return rows;
    }
    throw new Error("Sorry collection exceeds 50 pages; nothing was truncated.");
  }
  const components = collection("components", "components").map(({ raw, origin }) => ({ raw: componentSchema.parse(raw), origin }));
  const notices = collection("notices", "notices").map(({ raw, origin }) => ({ raw: noticeSchema.parse(raw), origin }));
  const subscribers = isPublic ? [] : collection("subscribers", "subscribers", 500).map(({ raw, origin }) => ({ raw: subscriberSchema.parse(raw), origin }));
  function templates(stem: "notice" | "update") {
    const rows: Array<{ raw: import("./schema.ts").SorryTemplate; origin: SourceArtifact }> = [];
    const firstName = `sorry-${stem}-templates.json`;
    // Original historical/public captures can omit template resources. If any
    // page is present its full documented pagination chain must be supplied.
    if (!envelopes.has(firstName)) return rows;
    if (isPublic) throw new Error("Sorry template collections require authenticated saved responses, not a public status capture.");
    let pagination: ReturnType<typeof templatePagination> | undefined;
    for (let number = 1; number <= sorryLimits.pages; number++) {
      const name = `sorry-${stem}-templates${number === 1 ? "" : `-${number}`}.json`;
      const entry = envelopes.get(name);
      if (!entry) throw new Error(`Include ${name}; Sorry template pagination must be complete.`);
      used.add(name);
      pagination = templatePagination(entry.value, number, rows.length, pagination);
      for (const value of entry.value.response as unknown[]) {
        const raw = (stem === "notice" ? noticeTemplateSchema : updateTemplateSchema).parse(value);
        count(raw); rows.push({ raw, origin: entry.origin });
      }
      if (!pagination.next) return rows;
    }
    throw new Error("Sorry template collection exceeds 50 pages; nothing was truncated.");
  }
  const noticeTemplates = templates("notice"), updateTemplates = templates("update");
  const details = new Map<string, SavedRow>();
  const updates = new Map<string, SavedRow[]>();
  for (const item of notices) {
    const name = `sorry-notice-${item.raw.id}.json`, entry = envelopes.get(name);
    if (!entry) continue;
    used.add(name);
    const raw = noticeSchema.parse(isPublic ? entry.value.notice : entry.value.response);
    if (raw.id !== item.raw.id) throw new Error("Sorry notice detail identity does not match its filename.");
    agree(item.raw, raw, noticeFacts);
    count(raw); details.set(raw.id, { raw, origin: entry.origin });
    const updateName = `notice-${raw.id}-updates`;
    const separate = envelopes.has(`sorry-${updateName}.json`);
    if (separate && isPublic) throw new Error("Public Sorry notice updates must come from its complete detail response.");
    const history = separate ? collection(updateName, "updates") : raw.updates?.map((row) => ({ raw: row, origin: entry.origin }));
    if (!history) throw new Error("Every Sorry notice detail needs its full updates array or saved authenticated updates response.");
    if (!separate) history.forEach(({ raw: update }) => count(update));
    const parsed = history.map(({ raw: update, origin }) => ({ raw: updateSchema.parse(update), origin }));
    if (separate && raw.updates && !equal(raw.updates, parsed.map(({ raw: update }) => update))) throw new Error("Sorry detail and separate update history disagree.");
    updates.set(raw.id, parsed);
  }
  if ([...envelopes.keys()].some((name) => !used.has(name))) throw new Error("A Sorry response is extraneous, duplicated, orphaned or follows a completed pagination chain.");
  for (const rows of [components, notices, subscribers, noticeTemplates, updateTemplates]) if (new Set(rows.map(({ raw }) => raw.id)).size !== rows.length) throw new Error("Sorry collection repeats source identities across pages.");
  function checkPage(value: unknown): void {
    if (Array.isArray(value)) { value.forEach(checkPage); return; }
    if (!value || typeof value !== "object") return;
    const raw = value as ObjectValue;
    if (raw.page_id != null && String(raw.page_id) !== page.id) throw new Error("A Sorry record belongs to another page.");
    Object.values(raw).forEach(checkPage);
  }
  for (const { raw } of [...components, ...notices, ...subscribers, ...noticeTemplates, ...updateTemplates, ...details.values(), ...[...updates.values()].flat()]) checkPage(raw);
  for (const rows of [noticeTemplates, updateTemplates]) for (const { raw } of rows) {
    if (raw.component_id != null && !components.some(component => component.raw.id === raw.component_id)) throw new Error(`Sorry template ${raw.name} has a collection-page scope outside the selected page; no scope was broadened.`);
  }
  const groupIds = new Set(components.flatMap(({ raw }) => raw.parent_id ? [String(raw.parent_id)] : []));
  const fieldLedger = sorryFieldInventory([...envelopes].map(([name, { value }]) => ({ name, value })), groupIds);
  // Preserve safe envelope/page fields even when channel capabilities prevent
  // retaining original subscriber bytes. Entity bodies live in source records.
  const fieldMetadata = Object.fromEntries([...envelopes].map(([name, { value }]) => [name,
    retainedSorry(Object.fromEntries(Object.entries(value).filter(([key]) =>
      !["response", "components", "notices", "subscribers", "notice"].includes(key) ||
      name === "sorry-page.json" && key === "response")))]));
  return { fieldLedger, fieldMetadata, isPublic, page, pageUrl: sourceUrl, components, notices, subscribers, details, updates, noticeTemplates, updateTemplates, artifacts };
}
