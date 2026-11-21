import { createUlid, nowIso } from "../../shared/ids";

export interface StatusPagePresentation {
  pageName: string;
  tagline: string;
  accentColor: string;
  timezone: string;
  componentIds: string[];
}

export interface ProtectedStatusPage extends StatusPagePresentation {
  path: string;
  kind: "staff" | "audience";
  feedId: string;
  createdAt: string;
  updatedAt: string;
}

type StoredStatusPage = Omit<ProtectedStatusPage, "componentIds"> & { componentIdsJson: string };

const fields = "path, kind, page_name AS pageName, tagline, accent_color AS accentColor, timezone, component_ids_json AS componentIdsJson, feed_id AS feedId, created_at AS createdAt, updated_at AS updatedAt";

function decode({ componentIdsJson, ...row }: StoredStatusPage): ProtectedStatusPage {
  return { ...row, componentIds: JSON.parse(componentIdsJson) };
}

export class StatusPageConflictError extends Error {}
export class StatusPageComponentsError extends Error {}

export function createStatusPageRepository(binding: D1Database) {
  const get = async (path: string) => {
    const row = await binding.prepare("SELECT " + fields + " FROM status_pages WHERE path = ?").bind(path).first<StoredStatusPage>();
    return row ? decode(row) : null;
  };

  async function validateComponents(input: StatusPagePresentation) {
    const { results } = await binding.prepare("SELECT id FROM components").all<{ id: string }>();
    const known = new Set(results.map(row => row.id));
    if (input.componentIds.some(id => !known.has(id))) throw new StatusPageComponentsError("Choose components from this installation.");
  }

  const presentationValues = (input: StatusPagePresentation) => [
    input.pageName, input.tagline, input.accentColor, input.timezone, JSON.stringify(input.componentIds),
  ];

  return {
    get,
    async list() {
      const { results } = await binding.prepare("SELECT " + fields + " FROM status_pages ORDER BY kind DESC, path").all<StoredStatusPage>();
      return results.map(decode);
    },
    async publicComponentIds() {
      const { results } = await binding.prepare("SELECT id FROM components WHERE internal = 0 ORDER BY display_order, id").all<{ id: string }>();
      return results.map(row => row.id);
    },
    async create(path: string, kind: ProtectedStatusPage["kind"], input: StatusPagePresentation) {
      await validateComponents(input);
      const now = nowIso();
      // The bounded catalogue also caps per-mutation rendering work.
      const result = await binding.prepare("INSERT INTO status_pages (path, kind, page_name, tagline, accent_color, timezone, component_ids_json, feed_id, created_at, updated_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM status_pages) < 12 ON CONFLICT DO NOTHING")
        .bind(path, kind, ...presentationValues(input), createUlid(), now, now).run();
      if (!result.meta.changes) throw new StatusPageConflictError("This path is already assigned or this installation has reached its status page limit.");
      return (await get(path))!;
    },
    async update(path: string, input: StatusPagePresentation) {
      await validateComponents(input);
      const result = await binding.prepare("UPDATE status_pages SET page_name=?,tagline=?,accent_color=?,timezone=?,component_ids_json=?,updated_at=? WHERE path=?")
        .bind(...presentationValues(input), nowIso(), path).run();
      return result.meta.changes ? get(path) : null;
    },
  };
}
