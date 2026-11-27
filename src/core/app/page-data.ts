export type AppJson = null | boolean | number | string | AppJson[] | { [key: string]: AppJson };
export type AppDataSnapshot = Record<string, { data: AppJson; error: string | null }>;

// Only the data used by this visit. A navigation loads a new snapshot; mutations
// and explicit refreshes still read the authoritative API. Every snapshot also
// holds the session and page settings (loaders.ts), so no screen lists them.
// `view` is the screen's own `?view=`: Subscribers' delivery log reads the log.
export function operatorPageReads(path: string, view?: string): string[] {
  const components = "/api/app/components";
  switch (path.replace(/\/$/, "")) {
    case "/app": return ["/api/app/overview"];
    case "/app/move-in": return ["/api/app/website"];
    case "/app/incidents": return ["/api/app/incidents", components];
    case "/app/components": return [components];
    case "/app/maintenance": return ["/api/app/maintenance", components];
    case "/app/subscribers": return [view === "log" ? "/api/app/deliveries?limit=100&offset=0" : "/api/app/subscribers?limit=100&offset=0"];
    // A Settings document starts on Page. Hash-selected panes read their data
    // through the operator API when they open after hydration.
    case "/app/settings": return [components, "/api/app/overview"];
    default: {
      const incident = /^\/app\/incidents\/([0-9A-HJKMNP-TV-Z]{26})$/.exec(path);
      if (!incident) return [];
      const resource = `/api/app/incidents/${incident[1]}`;
      return [resource, `${resource}/brief`, `${resource}/report`, components, "/api/app/ai/status", "/api/app/incident-templates"];
    }
  }
}
