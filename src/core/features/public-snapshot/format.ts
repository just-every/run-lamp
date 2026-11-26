import { zoneLabel, zoneOffset } from "../../shared/timezone-label";
export const MINUTE = 60_000;

export const DAY = 86_400_000;
export const REPORTING_DAYS = 90;

export function zonedFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  let zone: string | undefined;
  let formatter: Intl.DateTimeFormat | undefined;
  return (timezone: string) => {
    if (!formatter || zone !== timezone) {
      formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: timezone });
      zone = timezone;
    }
    return formatter;
  };
}

const dateTimeFormatter = zonedFormatter("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateLabelFormatter = zonedFormatter("en-US", { month: "short", day: "numeric" });
const dayKeyFormatter = zonedFormatter("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" });
const midnightFormatter = zonedFormatter("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function xmlSafe(value: string) {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    // XML 1.0 excludes these controls. Preserve valid surrogate pairs and
    // drop unpaired code units so operator prose cannot corrupt Atom.
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    if (code >= 0xd800 && code <= 0xdbff) {
      const following = value.charCodeAt(index + 1);
      if (following < 0xdc00 || following > 0xdfff) continue;
      result += value[index] + value[index + 1];
      index += 1;
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    result += value[index];
  }
  return result;
}

export function escapeXml(value: string) {
  return escapeHtml(xmlSafe(value));
}

function validDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("A public timestamp is invalid.");
  return date;
}

// "Oct 9, 2026, 13:12", built from the formatter's parts: engines join a date and a time with different words (V8
// writes "Oct 9, 2026, 13:12", Safari's WebKit "Oct 9, 2026 at 13:12"), and the same instant must read the same
// wherever it is formatted, or a page rendered on the server and hydrated in a browser no longer matches itself.
function dateTimeText(date: Date, timezone: string) {
  const parts = dateTimeFormatter(timezone).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value;
  return `${part("month")} ${part("day")}, ${part("year")}, ${part("hour")}:${part("minute")}`;
}

/** Technical timestamp for delivery, feeds and expanded time details. */
export function formatTime(value: string, timezone: string) {
  const date = validDate(value);
  return `${dateTimeText(date, timezone)} ${zoneOffset(timezone, date)}`;
}

export function formatPageTime(value: string, timezone: string) {
  return `${dateTimeText(validDate(value), timezone)} ${zoneLabel(timezone)}`;
}

export function timestampDetails(timezone: string, ...entries: Array<[label: string, instant: string]>) {
  return `<details class="time-details"><summary>Time details</summary>${entries.map(([label, instant]) =>
    `<div>${escapeHtml(label)}: <time datetime="${escapeHtml(instant)}">${escapeHtml(formatTime(instant, timezone))}</time></div>`).join("")}</details>`;
}

export function timezoneLabel(timezone: string) {
  return zoneLabel(timezone);
}

export function timestamp(value: string, timezone: string) {
  return `<time datetime="${escapeHtml(value)}" data-local-time>${escapeHtml(formatPageTime(value, timezone))}</time>`;
}

export function dateLabel(value: string, timezone: string) {
  return dateLabelFormatter(timezone).format(validDate(value));
}

export function durationText(startsAt: string, endsAt: string) {
  const minutes = Math.max(0, Math.round((validDate(endsAt).getTime() - validDate(startsAt).getTime()) / MINUTE));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function stateClass(state: string) {
  return state.toLowerCase().replaceAll(" ", "-");
}

export function dayKey(value: number, timezone: string) {
  const parts = dayKeyFormatter(timezone).formatToParts(value);
  const part = (kind: string) => parts.find((entry) => entry.type === kind)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addCalendarDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

export function localMidnight(day: string, timezone: string) {
  const [year, month, date] = day.split("-").map(Number);
  const approximate = Date.UTC(year, month - 1, date);
  const parts = midnightFormatter(timezone).formatToParts(approximate);
  const part = (kind: string) => Number(parts.find((entry) => entry.type === kind)?.value ?? 0);
  return approximate + (approximate - Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute")));
}

export function formatMaintenanceWindow(startsAt: string, endsAt: string, timezone: string) {
  const start = validDate(startsAt), end = validDate(endsAt);
  const universal = ["UTC", "Etc/UTC", "Etc/GMT"].includes(timezone);
  const date = (at: Date) => new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric" }).format(at);
  const clock = (at: Date) => new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", ...(universal ? { hourCycle: "h23" } as const : { hour12: true }) }).format(at);
  const sameDay = dayKey(start.getTime(), timezone) === dayKey(end.getTime(), timezone);
  const startText = `${date(start)}, ${clock(start)}`;
  const endText = `${sameDay ? "" : `${date(end)}, `}${clock(end)} ${zoneLabel(timezone)}`;
  return { startText, endText };
}

export function maintenanceTimeRange(startsAt: string, endsAt: string, timezone: string) {
  const { startText, endText } = formatMaintenanceWindow(startsAt, endsAt, timezone);
  return `<time datetime="${escapeHtml(startsAt)}">${escapeHtml(startText)}</time> – <time datetime="${escapeHtml(endsAt)}">${escapeHtml(endText)}</time>`;
}
