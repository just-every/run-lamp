import type { SourceMetadata } from "./imported-metadata.repository";
import { escapeHtml } from "./format";

const labels: Record<string, string> = {
  sourceId: "Source ID", id: "Source ID", state: "Original state", type: "Notice type", label: "Original label", name: "Original label",
  createdAt: "Source created", updatedAt: "Source edited", beganAt: "Actual start", endedAt: "Actual end", beginsAt: "Scheduled start", endsAt: "Scheduled end",
  shouldAutomateSchedule: "Source schedule automation", authoredState: "Authored state", shouldPublish: "Source publication choice", published: "Source published",
  parentId: "Source parent", ancestorIds: "Source ancestry", position: "Source order", synopsis: "Source synopsis", tags: "Source tags", tagList: "Source tags",
  urls: "Source URLs", url: "Source URL", link: "Source link", aggregateMetrics: "Source aggregate metrics", metricsSummary: "Source aggregate metrics", metricsMeaning: "Metrics meaning",
};
/** Source facts stay explicitly attributed and separate from Lamp's measured
 * availability and authored lifecycle. All values render as text. */
export function sourceMetadataMarkup(metadata: SourceMetadata | null | undefined): string {
  if (!metadata) return "";
  const entries = Object.entries(metadata).filter(([key]) => !["source", "provider", "description", "body", "nativeWording"].includes(key));
  const value = (key: string, item: unknown) => item === null ? key === "authoredState" ? "Unavailable in source; displayed lifecycle is projected" : "Not supplied" : typeof item === "object" ? JSON.stringify(item) : String(item);
  const fields = entries.map(([key, item]) => `<div><dt>${escapeHtml(labels[key] ?? key)}</dt><dd>${escapeHtml(value(key, item))}</dd></div>`).join("");
  const aggregate = entries.some(([key]) => /metrics/i.test(key)) ? "<p>Source aggregate metrics are retained metadata, not measured Lamp uptime.</p>" : "";
  return `<details class="source-metadata"><summary>Original Sorry details</summary>${aggregate}<dl>${fields}</dl></details>`;
}
