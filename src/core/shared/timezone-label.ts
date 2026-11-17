/** City and seasonal abbreviation from the configured zone and the instant being shown. */
export function zoneAbbreviation(zone: string, at: Date = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(at).find(part => part.type === "timeZoneName")!.value;
}
export function zoneCity(zone: string) {
  return ["UTC", "Etc/UTC", "Etc/GMT"].includes(zone) ? "Universal" : zone.split("/").at(-1)!.replaceAll("_", " ");
}
export const zoneLabel = (zone: string, at?: Date) => ["UTC", "Etc/UTC", "Etc/GMT"].includes(zone) ? "Universal time" : `${zoneCity(zone)} (${zoneAbbreviation(zone, at)})`;
