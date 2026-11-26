import { COMPONENT_STATE_SEVERITY, type ComponentState } from "../../shared/domain";

/** One published incident attachment. The incident peak takes precedence over its attachment state. */
export interface ReliabilityRow {
  componentId: string;
  openedAt: string;
  resolvedAt: string | null;
  impact: ComponentState;
}

interface ImpactSpan {
  startsAt: number;
  endsAt: number | null;
  state: ComponentState;
}

interface ComponentHistory {
  firstIncidentAt: number;
  spans: ImpactSpan[];
}

export type ReliabilityHistory = Record<string, ComponentHistory>;
export const severity = (state: ComponentState) => COMPONENT_STATE_SEVERITY.indexOf(state);

/** Resolve overlaps once per source revision. An open span has no end, so a
 * timed refresh can advance it without rereading or sorting incident history. */
export function prepareReliabilityHistory(rows: readonly ReliabilityRow[]): ReliabilityHistory {
  const records = new Map<string, { firstIncidentAt: number; events: Array<{ at: number; level: number; change: number }> }>();
  for (const row of rows) {
    const from = Date.parse(row.openedAt);
    const to = row.resolvedAt ? Date.parse(row.resolvedAt) : null;
    let record = records.get(row.componentId);
    if (!record) {
      record = { firstIncidentAt: from, events: [] };
      records.set(row.componentId, record);
    }
    record.firstIncidentAt = Math.min(from, record.firstIncidentAt);
    if (to !== null && !(to > from)) continue;
    const level = severity(row.impact);
    record.events.push({ at: from, level, change: 1 });
    if (to !== null) record.events.push({ at: to, level, change: -1 });
  }
  return Object.fromEntries([...records].map(([id, { firstIncidentAt, events }]) => {
    events.sort((left, right) => left.at - right.at);
    const active = COMPONENT_STATE_SEVERITY.map(() => 0);
    const spans: ImpactSpan[] = [];
    for (const [index, { at, level, change }] of events.entries()) {
      active[level]! += change;
      const until = events[index + 1]?.at ?? null;
      if (until === at) continue;
      const state = COMPONENT_STATE_SEVERITY[active.findIndex(count => count > 0)];
      if (!state) continue;
      const previous = spans.at(-1);
      if (previous?.endsAt === at && previous.state === state) previous.endsAt = until;
      else spans.push({ startsAt: at, endsAt: until, state });
    }
    return [id, { firstIncidentAt, spans }];
  }));
}
