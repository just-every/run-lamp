import { emailBrandingSchema, type EmailBranding } from "../../shared/email-branding";
import { UnknownStatusPageError } from "./page-selection";
import { createUlid, nowIso } from "../../shared/ids";

export interface StatusPagePresentation {
  pageName: string;
  tagline: string;
  accentColor: string;
  timezone: string;
  componentIds: string[];
  footerCreditEnabled?: boolean;
}

export interface ProtectedStatusPage extends StatusPagePresentation {
  path: string;
  kind: "staff" | "audience";
  feedId: string;
  footerCreditEnabled: boolean;
  logoKey: string | null;
  logoContentType: string | null;
  createdAt: string;
  updatedAt: string;
}

type StoredStatusPage = Omit<ProtectedStatusPage, "componentIds" | "footerCreditEnabled"> & { componentIdsJson: string; footerCreditEnabled: number };

const fields = "path, kind, page_name AS pageName, tagline, accent_color AS accentColor, timezone, footer_credit_enabled AS footerCreditEnabled, logo_key AS logoKey, logo_content_type AS logoContentType, component_ids_json AS componentIdsJson, feed_id AS feedId, created_at AS createdAt, updated_at AS updatedAt";

function decode({ componentIdsJson, ...row }: StoredStatusPage): ProtectedStatusPage {
  return { ...row, footerCreditEnabled: row.footerCreditEnabled === 1, componentIds: JSON.parse(componentIdsJson) };
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
    async getEmailBranding(path: string) {
      const row = await binding.prepare("SELECT branding_json FROM status_page_email_branding WHERE page_path=?")
        .bind(path).first<{ branding_json: string }>();
      return row ? emailBrandingSchema.parse(JSON.parse(row.branding_json)) : null;
    },
    async setEmailBranding(path: string, branding: EmailBranding | null) {
      if (branding === null) {
        await binding.prepare("DELETE FROM status_page_email_branding WHERE page_path=?").bind(path).run();
        return;
      }
      await binding.prepare(`INSERT INTO status_page_email_branding (page_path, branding_json) VALUES (?,?)
        ON CONFLICT(page_path) DO UPDATE SET branding_json=excluded.branding_json`)
        .bind(path, JSON.stringify(branding)).run();
    },
    async list() {
      const { results } = await binding.prepare("SELECT " + fields + " FROM status_pages ORDER BY kind DESC, path").all<StoredStatusPage>();
      return results.map(decode);
    },
    async paths() {
      return (await binding.prepare("SELECT path FROM status_pages").all<{ path: string }>()).results;
    },
    async publicComponentIds() {
      const { results } = await binding.prepare("SELECT id FROM components WHERE internal = 0 ORDER BY display_order, id").all<{ id: string }>();
      return results.map(row => row.id);
    },
    async create(path: string, kind: ProtectedStatusPage["kind"], input: StatusPagePresentation) {
      await validateComponents(input);
      const now = nowIso();
      // The bounded catalogue also caps per-mutation rendering work.
      const result = await binding.prepare("INSERT INTO status_pages (path, kind, page_name, tagline, accent_color, timezone, component_ids_json, footer_credit_enabled, feed_id, created_at, updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM status_pages) < 12 ON CONFLICT DO NOTHING")
        .bind(path, kind, ...presentationValues(input), input.footerCreditEnabled === false ? 0 : 1, createUlid(), now, now).run();
      if (!result.meta.changes) throw new StatusPageConflictError("This path is already assigned or this installation has reached its status page limit.");
      return (await get(path))!;
    },
    async setLogo(path: string, logoKey: string | null, logoContentType: string | null) {
      const result = await binding.prepare("UPDATE status_pages SET logo_key=?,logo_content_type=?,updated_at=? WHERE path=?")
        .bind(logoKey, logoContentType, nowIso(), path).run();
      return result.meta.changes ? get(path) : null;
    },
    async update(path: string, input: StatusPagePresentation) {
      await validateComponents(input);
      const result = await binding.prepare("UPDATE status_pages SET page_name=?,tagline=?,accent_color=?,timezone=?,component_ids_json=?,footer_credit_enabled=COALESCE(?,footer_credit_enabled),updated_at=? WHERE path=?")
        .bind(...presentationValues(input), input.footerCreditEnabled === undefined ? null : Number(input.footerCreditEnabled), nowIso(), path).run();
      return result.meta.changes ? get(path) : null;
    },
  };
}

export async function resolvePageSelection(binding: D1Database, pagePaths: string[]): Promise<void> {
  const selected = pagePaths.filter(path => path !== "public");
  if (!selected.length) return;
  const { results } = await binding.prepare("SELECT path FROM status_pages").all<{ path: string }>();
  const known = new Set(results.map(row => row.path));
  if (selected.some(path => !known.has(path))) throw new UnknownStatusPageError("One or more selected status pages do not exist.");
}
