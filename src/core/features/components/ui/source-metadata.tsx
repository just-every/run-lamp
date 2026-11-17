import type { ImportedComponentMetadata } from "../repository";

/** Source facts remain separate from editable Lamp labels and measured uptime. */
export function ComponentSourceMetadata({ source, kind = "component" }: { source: ImportedComponentMetadata | null; kind?: "component" | "group" }) {
  if (!source) return null;
  return <details className="source-metadata" style={{ overflowWrap: "anywhere" }}>
    <summary>Original Sorry {kind}</summary>
    <dl>
      <dt>Name</dt><dd>{source.name}</dd>
      {source.description && <><dt>Description</dt><dd style={{ whiteSpace: "pre-wrap" }}>{source.description}</dd></>}
      <dt>Source state</dt><dd>{source.state}</dd>
      <dt>Source order</dt><dd>{source.position ?? "Not supplied"}</dd>
      <dt>Source parent</dt><dd>{source.parentId ?? "Top level"}</dd>
      <dt>Source ancestry</dt><dd>{source.ancestorIds.length ? source.ancestorIds.join(" / ") : "Top level"}</dd>
      <dt>Source created</dt><dd>{source.createdAt}</dd>
      <dt>Source edited</dt><dd>{source.updatedAt ?? "Not supplied"}</dd>
      {source.aggregateMetrics !== undefined && <><dt>Source aggregate metrics (not measured uptime)</dt><dd style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(source.aggregateMetrics, null, 2)}</dd></>}
    </dl>
  </details>;
}
