import { componentStateLabel } from "../../shared/component-state-label";
import { escapeHtml, zonedFormatter } from "./format";
import type { Reliability, ReliabilityMark } from "./reliability";

const monthFormatter = zonedFormatter("en-US", { month: "short", year: "numeric" });
const monthName = (key: string) => monthFormatter("UTC").format(new Date(`${key}-15T00:00:00Z`));
const sinceFormatter = zonedFormatter("en-US", { month: "short", year: "numeric" });

function sinceText(since: string, timezone: string) {
  return sinceFormatter(timezone).format(new Date(since));
}

function minutesText(minutes: number) {
  return minutes.toFixed(minutes % 1 === 0 ? 0 : 1);
}

/** One mark of the all-history bar as a reader hears it. */
export function reliabilityMarkLabel(mark: ReliabilityMark) {
  const period = mark.from === mark.to ? monthName(mark.from) : `${monthName(mark.from)} to ${monthName(mark.to)}`;
  if (mark.coverageMinutes <= 0) return `${period}: no data`;
  if (mark.downtimeMinutes <= 0) return `${period}: no downtime`;
  const share = Math.max(0, Math.floor((100 - (mark.downtimeMinutes / mark.coverageMinutes) * 100) * 100) / 100).toFixed(2);
  return `${period}: ${share}%, downtime ${minutesText(mark.downtimeMinutes)} minutes (weighted)${mark.worstState ? `; worst impact: ${componentStateLabel(mark.worstState)}` : ""}`;
}

/** The figure and compact bar of a component's or group's reliability over all stored history. */
export function reliabilityMarkup(reliability: Reliability | undefined, subject: string, timezone: string, className = "") {
  if (!reliability || reliability.percentage === null || !reliability.since) return "";
  const marks = reliability.marks.map((mark) => {
    const label = reliabilityMarkLabel(mark);
    const tone = mark.coverageMinutes <= 0 ? "no-data" : mark.downtimeMinutes > 0 ? `downtime${mark.worstState === "Major outage" ? " major-outage" : ""}` : "good";
    return `<span class="reliability-mark ${tone}" role="listitem" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"></span>`;
  }).join("");
  const since = sinceText(reliability.since, timezone);
  return `<div class="reliability${className ? ` ${className}` : ""}"><p class="reliability-number"><span class="reliability-caption">All time</span> <span class="reliability-value">${escapeHtml(reliability.percentage)}</span> <span class="reliability-since">since ${escapeHtml(since)}</span></p><div class="reliability-marks" role="list" aria-label="All-history reliability by month for ${escapeHtml(subject)}">${marks}</div></div>`;
}

/** The stated method beside the figures (plain text; the caller escapes it). */
export const reliabilityMethod = "All time counts every public incident from its start to its resolution, or to now while it is open, on the components it affected, at the downtime weight of the incident's impact; when incidents overlap, the most severe counts once. A component's record starts at its uptime start date, or else at the earlier of its creation and its first incident. A group combines its components' downtime over their tracked time. Scheduled maintenance does not count.";
