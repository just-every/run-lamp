export interface RetainedArtifact { key: string; body: string; contentType: string; encoding?: "base64"; footer?: number; footerAt?: number }
export interface RetainedBundle {
  version: string;
  generatedAt: string;
  generation: number;
  artifacts: RetainedArtifact[];
  footers?: string[];
}
export function encodeRetainedBundle(bundle: RetainedBundle) {
  // Public documents share the same complete footer (including component
  // resources). Store repeated bytes once without changing any served HTML.
  const counts = new Map<string, number>();
  for (const artifact of bundle.artifacts) {
    if (!artifact.contentType.startsWith("text/html")) continue;
    const footer = artifact.body.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
    if (footer && footer.length >= 1024) counts.set(footer, (counts.get(footer) ?? 0) + 1);
  }
  const footers = [...counts].filter(([, count]) => count > 1).map(([footer]) => footer);
  const artifacts = footers.length ? bundle.artifacts.map(artifact => {
    if (!artifact.contentType.startsWith("text/html")) return artifact;
    const footer = artifact.body.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
    const index = footer ? footers.indexOf(footer) : -1;
    if (index < 0 || !footer) return artifact;
    const at = artifact.body.indexOf(footer);
    return { ...artifact, body: artifact.body.slice(0, at) + artifact.body.slice(at + footer.length), footer: index, footerAt: at };
  }) : bundle.artifacts;
  const encoded = JSON.stringify({ ...bundle, artifacts, ...(footers.length ? { footers } : {}) });
  // Bound memory during rendering and replication; reject before publication.
  if (new TextEncoder().encode(encoded).byteLength > 25 * 1024 * 1024) throw new Error("Retained snapshot exceeds the 25 MiB retained bundle limit.");
  return encoded;
}
export function readRetainedArtifact(encoded: string, key: string) {
  const bundle = JSON.parse(encoded) as RetainedBundle;
  if (!bundle || typeof bundle.version !== "string" || !Number.isFinite(Date.parse(bundle.generatedAt)) || (!Number.isInteger(bundle.generation) || bundle.generation < 0) || !Array.isArray(bundle.artifacts)) throw new Error("Retained snapshot is invalid.");
  if (bundle.footers !== undefined && (!Array.isArray(bundle.footers) || bundle.footers.some(footer => typeof footer !== "string"))) throw new Error("Retained snapshot footer table is invalid.");
  const keys = new Set<string>();
  for (const artifact of bundle.artifacts) {
    if (typeof artifact.key !== "string" || typeof artifact.body !== "string" || typeof artifact.contentType !== "string" || keys.has(artifact.key)) throw new Error("Retained snapshot artifact is invalid.");
    if (artifact.footer !== undefined && (!Number.isInteger(artifact.footer) || artifact.footer < 0 || !bundle.footers?.[artifact.footer] || !Number.isInteger(artifact.footerAt) || artifact.footerAt! < 0 || artifact.footerAt! > artifact.body.length || artifact.encoding)) throw new Error("Retained snapshot footer reference is invalid.");
    keys.add(artifact.key);
  }
  for (const required of ["page.html", "feed.atom", "widget.js", "status.json"]) if (!keys.has(required)) throw new Error("Retained snapshot is incomplete.");
  const artifact = bundle.artifacts.find((item) => item.key === key);
  if (!artifact) return null;
  const body = artifact.footer === undefined ? artifact.body : artifact.body.slice(0, artifact.footerAt) + bundle.footers![artifact.footer] + artifact.body.slice(artifact.footerAt);
  const bytes = artifact.encoding === "base64" ? Uint8Array.from(atob(body), character => character.charCodeAt(0)).buffer : new TextEncoder().encode(body).buffer;
  return { bytes, contentType: artifact.contentType, version: bundle.version, generatedAt: new Date(bundle.generatedAt).toISOString(), stale: true, retainedReady: true };
}
