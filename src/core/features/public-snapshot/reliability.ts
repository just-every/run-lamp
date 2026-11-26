import type { ComponentState } from "../../shared/domain";
import { MINUTE, dayKey, localMidnight } from "./format";
import type { PublicSnapshotPolicies } from "./policies";
import { severity, type ReliabilityHistory } from "./reliability-history";

/** Older pages fold consecutive months into one mark. */
const MAX_MARKS = 36;

export interface ReliabilityMark {
  from: string;
  to: string;
  coverageMinutes: number;
  downtimeMinutes: number;
  worstState: ComponentState | null;
}

export interface Reliability {
  percentage: string | null;
  since: string | null;
  coverageMinutes: number;
  downtimeMinutes: number;
  marks: ReliabilityMark[];
}

function monthNumber(instant: number, timezone: string) {
  const [year, month] = dayKey(instant, timezone).split("-").map(Number);
  return year! * 12 + month! - 1;
}

function monthKey(number: number) {
  return `${Math.floor(number / 12)}-${String(number % 12 + 1).padStart(2, "0")}`;
}

function reliabilityPeriods(from: number, to: number, timezone: string) {
  let month = monthNumber(from, timezone);
  const last = monthNumber(to, timezone);
  const step = Math.ceil((last - month + 1) / MAX_MARKS);
  const periods: Array<{ from: string; to: string; startsAt: number; endsAt: number }> = [];
  let startsAt = localMidnight(`${monthKey(month)}-01`, timezone);
  while (month <= last) {
    const next = Math.min(month + step, last + 1);
    const endsAt = localMidnight(`${monthKey(next)}-01`, timezone);
    periods.push({ from: monthKey(month), to: monthKey(next - 1), startsAt, endsAt });
    month = next;
    startsAt = endsAt;
  }
  return periods;
}

function worse(left: ComponentState | null, right: ComponentState | null) {
  return right !== null && (left === null || severity(right) < severity(left)) ? right : left;
}

function summarize(marks: ReliabilityMark[], start: number): Reliability {
  const coverageMinutes = marks.reduce((sum, mark) => sum + mark.coverageMinutes, 0);
  const downtimeMinutes = marks.reduce((sum, mark) => sum + mark.downtimeMinutes, 0);
  const percentage = coverageMinutes > 0
    ? `${Math.max(0, Math.floor((100 - (downtimeMinutes / coverageMinutes) * 100) * 100) / 100).toFixed(2)}%`
    : null;
  return { percentage, since: new Date(start).toISOString(), coverageMinutes, downtimeMinutes, marks };
}

export interface ReliabilityRecord {
  components: Map<string, Reliability>;
  groups: Map<string, Reliability>;
}

/** Work directly in the bounded displayed periods. Component starts and
 * group coverage still use the full time interval, even when marks are folded. */
export function computeReliability(
  history: ReliabilityHistory,
  components: ReadonlyArray<{ id: string; groupId: string | null; createdAt: string; uptimeStartDate?: string | null }>,
  now: number,
  timezone: string,
  policies: PublicSnapshotPolicies,
): ReliabilityRecord {
  const record: ReliabilityRecord = { components: new Map(), groups: new Map() };
  if (!components.length) return record;
  const starts = components.map(component => Math.min(now, component.uptimeStartDate
    ? localMidnight(component.uptimeStartDate, timezone)
    : Math.min(Date.parse(component.createdAt), history[component.id]?.firstIncidentAt ?? now)));
  const periods = reliabilityPeriods(Math.min(...starts), now, timezone);
  const emptyMarks = () => periods.map(({ from, to }): ReliabilityMark => ({ from, to, coverageMinutes: 0, downtimeMinutes: 0, worstState: null }));
  const groups = new Map<string, { start: number; marks: ReliabilityMark[] }>();
  for (const [index, component] of components.entries()) {
    const start = starts[index]!;
    const marks = emptyMarks();
    for (const [i, period] of periods.entries()) {
      marks[i]!.coverageMinutes = Math.max(0, Math.min(period.endsAt, now) - Math.max(period.startsAt, start)) / MINUTE;
    }
    let firstPeriod = 0;
    for (const span of history[component.id]?.spans ?? []) {
      const from = Math.max(span.startsAt, start);
      const to = Math.min(span.endsAt ?? now, now);
      if (to <= from) continue;
      const weight = policies.uptimeDowntimeWeight(span.state);
      if (!weight) continue;
      while (firstPeriod < periods.length && periods[firstPeriod]!.endsAt <= from) firstPeriod += 1;
      for (let i = firstPeriod; i < periods.length && periods[i]!.startsAt < to; i += 1) {
        const { startsAt, endsAt } = periods[i]!;
        const minutes = (Math.min(to, endsAt) - Math.max(from, startsAt)) / MINUTE;
        if (minutes <= 0) continue;
        marks[i]!.downtimeMinutes += minutes * weight;
        marks[i]!.worstState = worse(marks[i]!.worstState, span.state);
      }
    }
    record.components.set(component.id, summarize(marks, start));
    if (!component.groupId) continue;
    const group = groups.get(component.groupId) ?? { start, marks: emptyMarks() };
    group.start = Math.min(group.start, start);
    for (const [i, mark] of marks.entries()) {
      const total = group.marks[i]!;
      total.coverageMinutes += mark.coverageMinutes;
      total.downtimeMinutes += mark.downtimeMinutes;
      total.worstState = worse(total.worstState, mark.worstState);
    }
    groups.set(component.groupId, group);
  }
  for (const [id, group] of groups) record.groups.set(id, summarize(group.marks, group.start));
  return record;
}
