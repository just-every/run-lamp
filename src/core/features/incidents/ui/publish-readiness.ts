import type { IncidentDraftInput } from "../../../shared/schemas";
import type { PublishTiming } from "./publish-options";

/** The same reason explains and disables publication, including while a save is pending. */
export function publishBlockReason({ draft, hasComponents, timing, timeError, saved, saveFailed, publishing }: {
  draft: IncidentDraftInput;
  hasComponents: boolean;
  timing: PublishTiming;
  timeError: string | null;
  saved: boolean;
  saveFailed: boolean;
  publishing: boolean;
}): string | null {
  if (publishing) return "Publishing this update…";
  if (!draft.affectedAudience.trim()) return "Fill in who’s affected before publishing.";
  if (!draft.customerImpact.trim()) return "Describe what’s happening before publishing.";
  if (!hasComponents) return "Add an affected component before publishing.";
  if (timeError) return timeError;
  if (draft.lifecycle !== "Resolved" && (!draft.nextUpdateAt || !Number.isFinite(Date.parse(draft.nextUpdateAt)))) return "Choose the next update time before publishing.";
  if (timing.mode !== "now" && !timing.at) return timing.mode === "schedule" ? "Choose when to publish the scheduled update." : "Choose when the historical update was published.";
  if (saveFailed) return "The draft could not be saved. Retry save before publishing.";
  if (!saved) return "Waiting for the draft to save before publishing.";
  return null;
}
