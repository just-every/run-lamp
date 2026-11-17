import type { IncidentTemplate } from "../template-repository";

export function templateLabel(template: IncidentTemplate) {
  const prefix = template.kind === "notice" ? "Sorry notice / " : template.kind === "update" ? "Sorry update / " : "";
  return `${prefix}${template.folder ? `${template.folder} / ` : ""}${template.name}`;
}

/** A Sorry collection page scopes availability; it never asserts affected services. */
export function TemplateSource({ template }: { template: IncidentTemplate }) {
  const source = template.sourceMetadata;
  if (!source || source.provider !== "sorry") return null;
  return <section aria-label="Sorry template source">
    <dl>
      <div><dt>Template kind</dt><dd>{template.kind === "notice" ? "Sorry notice template" : "Sorry update template"}</dd></div>
      <div><dt>Source subject</dt><dd style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{source.subject ?? "No subject supplied"}</dd></div>
      <div><dt>Collection scope</dt><dd>{source.componentId ? `Collection page ${source.componentId}` : "Available across the source collection"}</dd></div>
      <div><dt>Source created</dt><dd>{source.createdAt}</dd></div>
      {source.updatedAt ? <div><dt>Source updated</dt><dd>{source.updatedAt}</dd></div> : null}
    </dl>
    <p>Review status and affected services in the private draft before publishing. Collection scope describes where the wording is available.</p>
    <details><summary>Original Sorry wording</summary><textarea aria-label="Original Sorry wording" readOnly value={source.body} rows={6} /></details>
  </section>;
}
