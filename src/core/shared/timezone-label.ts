/** A name for the configured zone that stays the same through seasonal clock changes. */
export function zoneLabel(zone: string) {
  if (["UTC", "Etc/UTC", "Etc/GMT", "GMT", "Etc/GMT0", "GMT0"].includes(zone)) return "Universal time";
  const city = zone.split("/").at(-1)!.replaceAll("_", " ");
  // Intl also accepts fixed-offset identifiers. Their technical spelling belongs in Details.
  if (/^(?:GMT)?[+-]/i.test(city)) return "Fixed-offset time";
  return `${city} time`;
}

export function zoneOffset(zone: string, at: Date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(at).find(part => part.type === "timeZoneName")?.value;
  if (!name) throw new Error("A time zone offset is unavailable.");
  return name === "GMT" ? "UTC+00:00" : name.replace(/^GMT/, "UTC");
}
