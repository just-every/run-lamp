import { COMPONENT_STATE_SEVERITY, type ComponentState } from "../../shared/domain";
import { MINUTE, dayKey, localMidnight } from "./format";
import type { PublicSnapshotPolicies } from "./policies";

/** One public incident's attachment to one component, read over the whole stored history. `impact` is the
 *  incident's retained peak (Lamp's incident impact), or the attachment's own state where no peak was kept. */
export interface ReliabilityRow {
  componentId: string;
  openedAt: string;
  resolvedAt: string | null;
  impact: ComponentState;
}

/** At most this many marks in the all-history bar: older pages fold consecutive months into one mark. */
const MAX_MARKS = 36;

export interface ReliabilityMark {
  /** First and last month (YYYY-MM) the mark covers; equal for a single month. */
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

interface Month { key: string; startsAt: number; endsAt: number }

function monthKey(instant: number, timezone: string) {
  return dayKey(instant, timezone).slice(0, 7);
}

function nextMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
}

function months(from: number, to: number, timezone: string): Month[] {
  const list: Month[] = [];
  const last = monthKey(to, timezone);
  for (let key = monthKey(from, timezone); key <= last; key = nextMonth(key)) {
    list.push({ key, startsAt: localMidnight(`${key}-01`, timezone), endsAt: localMidnight(`${nextMonth(key)}-01`, timezone) });
  }
  return list;
}

const severity = (state: ComponentState) => COMPONENT_STATE_SEVERITY.indexOf(state);

/** Weighted downtime per month for one component: at each instant the most severe impact among the incidents then
 *  open on it counts, at the policy's downtime weight, so overlapping incidents are never counted twice. */
function componentMonths(rows: readonly ReliabilityRow[], startsAt: number, now: number, calendar: readonly Month[], policies: PublicSnapshotPolicies) {
  const coverage = calendar.map((month) => Math.max(0, Math.min(month.endsAt, now) - Math.max(month.startsAt, startsAt)) / MINUTE);
  const downtime = calendar.map(() => 0);
  const worst: Array<ComponentState | null> = calendar.map(() => null);
  const events: Array<[at: number, level: number, change: 1 | -1]> = [];
  for (const row of rows) {
    const from = Math.max(Date.parse(row.openedAt), startsAt);
    const to = Math.min(row.resolvedAt ? Date.parse(row.resolvedAt) : now, now);
    if (to > from) events.push([from, severity(row.impact), 1], [to, severity(row.impact), -1]);
  }
  events.sort((left, right) => left[0] - right[0]);
  const open = COMPONENT_STATE_SEVERITY.map(() => 0);
  let month = 0;
  for (let index = 0; index < events.length; index += 1) {
    const [at, level, change] = events[index]!;
    open[level] = open[level]! + change;
    const until = events[index + 1]?.[0];
    if (until === undefined || until <= at) continue;
    const active = open.findIndex((count) => count > 0);
    if (active < 0) continue;
    const state = COMPONENT_STATE_SEVERITY[active]!;
    const weight = policies.uptimeDowntimeWeight(state);
    if (weight === 0) continue;
    while (month < calendar.length - 1 && calendar[month]!.endsAt <= at) month += 1;
    for (let cursor = month; cursor < calendar.length && calendar[cursor]!.startsAt < until; cursor += 1) {
      const overlap = Math.min(until, calendar[cursor]!.endsAt) - Math.max(at, calendar[cursor]!.startsAt);
      if (overlap <= 0) continue;
      downtime[cursor]! += (overlap / MINUTE) * weight;
      const previous = worst[cursor];
      worst[cursor] = previous === null || severity(state) < severity(previous!) ? state : previous!;
    }
  }
  return calendar.map((_, index) => ({ coverageMinutes: coverage[index]!, downtimeMinutes: downtime[index]!, worstState: worst[index]! }));
}

function percentage(coverageMinutes: number, downtimeMinutes: number) {
  if (coverageMinutes <= 0) return null;
  return `${Math.max(0, Math.floor((100 - (downtimeMinutes / coverageMinutes) * 100) * 100) / 100).toFixed(2)}%`;
}

function summarize(perMonth: ReadonlyArray<Omit<ReliabilityMark, "from" | "to">>, calendar: readonly Month[], since: string | null): Reliability {
  const fold = Math.max(1, Math.ceil(calendar.length / MAX_MARKS));
  const marks: ReliabilityMark[] = [];
  for (let index = 0; index < calendar.length; index += fold) {
    const slice = perMonth.slice(index, index + fold);
    const states = slice.flatMap((entry) => entry.worstState ? [entry.worstState] : []).sort((left, right) => severity(left) - severity(right));
    marks.push({
      from: calendar[index]!.key,
      to: calendar[Math.min(index + fold, calendar.length) - 1]!.key,
      coverageMinutes: slice.reduce((sum, entry) => sum + entry.coverageMinutes, 0),
      downtimeMinutes: slice.reduce((sum, entry) => sum + entry.downtimeMinutes, 0),
      worstState: states[0] ?? null,
    });
  }
  const coverageMinutes = perMonth.reduce((sum, entry) => sum + entry.coverageMinutes, 0);
  const downtimeMinutes = perMonth.reduce((sum, entry) => sum + entry.downtimeMinutes, 0);
  return { percentage: percentage(coverageMinutes, downtimeMinutes), since, coverageMinutes, downtimeMinutes, marks };
}

export interface ReliabilityRecord {
  components: Map<string, Reliability>;
  groups: Map<string, Reliability>;
}

/** The all-history record of every listed component and of each group, from stored incidents only. A component's
 *  record starts at its uptime start date when the owner set one, otherwise at the earlier of its creation and its
 *  first incident. A group rolls up its members: their downtime over their combined tracked time. */
export function computeReliability(
  rows: readonly ReliabilityRow[],
  components: ReadonlyArray<{ id: string; groupId: string | null; createdAt: string; uptimeStartDate?: string | null }>,
  now: number,
  timezone: string,
  policies: PublicSnapshotPolicies,
): ReliabilityRecord {
  const byComponent = new Map<string, ReliabilityRow[]>();
  for (const row of rows) byComponent.set(row.componentId, [...(byComponent.get(row.componentId) ?? []), row]);
  const starts = new Map(components.map((component) => {
    const own = byComponent.get(component.id) ?? [];
    const start = component.uptimeStartDate
      ? localMidnight(component.uptimeStartDate, timezone)
      : Math.min(Date.parse(component.createdAt), ...own.map((row) => Date.parse(row.openedAt)));
    return [component.id, Math.min(start, now)] as const;
  }));
  const record: ReliabilityRecord = { components: new Map(), groups: new Map() };
  if (!components.length) return record;
  const calendar = months(Math.min(...starts.values()), now, timezone);
  const groupMonths = new Map<string, { since: number; months: Array<Omit<ReliabilityMark, "from" | "to">> }>();
  for (const component of components) {
    const startsAt = starts.get(component.id)!;
    const perMonth = componentMonths(byComponent.get(component.id) ?? [], startsAt, now, calendar, policies);
    record.components.set(component.id, summarize(perMonth, calendar, new Date(startsAt).toISOString()));
    if (!component.groupId) continue;
    const group = groupMonths.get(component.groupId) ?? { since: startsAt, months: calendar.map(() => ({ coverageMinutes: 0, downtimeMinutes: 0, worstState: null })) };
    group.since = Math.min(group.since, startsAt);
    group.months = group.months.map((total, index) => {
      const entry = perMonth[index]!;
      const worstState = [total.worstState, entry.worstState].filter((state): state is ComponentState => state !== null).sort((left, right) => severity(left) - severity(right))[0] ?? null;
      return { coverageMinutes: total.coverageMinutes + entry.coverageMinutes, downtimeMinutes: total.downtimeMinutes + entry.downtimeMinutes, worstState };
    });
    groupMonths.set(component.groupId, group);
  }
  for (const [groupId, group] of groupMonths) record.groups.set(groupId, summarize(group.months, calendar, new Date(group.since).toISOString()));
  return record;
}
