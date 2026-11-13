/** Erasure keeps a tombstone for anonymous history; it is never a destination to display. */
export function subscriberDestinationLabel(destination: string, channel?: string): string {
  if (destination.startsWith("deleted:")) return "Removed subscriber";
  if (channel === "slack") return "Slack channel";
  if (channel === "teams") return "Teams channel";
  return destination;
}
