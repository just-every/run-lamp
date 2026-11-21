import { useAppData } from "../../../app/client/ui/api";
import { FormError, LoadingState } from "../../../app/client/ui/states";

export type StatusPage = {
  path: string;
  kind: "public" | "staff" | "audience";
  pageName: string;
  tagline: string;
  accentColor: string;
  timezone: string;
  componentIds: string[];
  allowedCidrs?: string[];
  url: string;
  footerCreditEnabled: boolean;
  logoUrl: string | null;
  updatedAt: string;
};

export const PUBLIC_PAGE_PATH = "public";

export function useStatusPages() {
  return useAppData<{ pages: StatusPage[] }>("/api/app/status-pages");
}

export function statusPageNames(pages: readonly StatusPage[], selected: string[]) {
  return selected.map(path => path === PUBLIC_PAGE_PATH ? "Public" : pages.find(page => page.path === path)?.pageName ?? path).join(", ");
}

export function StatusPageSelection({ pages, value, onChange, disabled }: {
  pages: ReturnType<typeof useStatusPages>;
  value: string[];
  onChange: (paths: string[]) => void;
  disabled?: boolean;
}) {
  if (pages.error) return <FormError>{pages.error}</FormError>;
  if (pages.loading || !pages.data) return <LoadingState>Loading status pages…</LoadingState>;
  return <fieldset className="maintenance-components" disabled={disabled}>
    <legend>Publish on</legend>
    {pages.data.pages.map(page => <label key={page.path} className="checkbox-label">
      <input type="checkbox" checked={value.includes(page.path)} onChange={event => onChange(event.target.checked ? [...value, page.path] : value.filter(path => path !== page.path))} />
      {page.kind === "public" ? "Public" : `${page.pageName} (${page.path})`}
    </label>)}
    {value.length === 0 ? <p role="status">Choose at least one status page.</p> : null}
  </fieldset>;
}
