const maintenanceStates: Record<string, string> = {
  scheduled: "Scheduled", in_progress: "In progress", verifying: "In progress",
  completed: "Completed", cancelled: "Cancelled",
};

/** Legacy imports retained only component states. Those cannot establish a
 * message's authored lifecycle; neither can a window's present-day state. */
export function importedMaintenanceUpdateLabel(update: { sourceStates?: string }): string {
  if (!update.sourceStates) return "Imported update";
  const source: unknown = JSON.parse(update.sourceStates);
  if (!source || typeof source !== "object" || Array.isArray(source)) return "Imported update";
  const status = (source as { status?: unknown }).status;
  return typeof status === "string" && Object.hasOwn(maintenanceStates, status) ? maintenanceStates[status] : "Imported update";
}
