import type { ComponentState } from "./domain";

export const componentStateLabels = {
  Operational: "Working",
  "Degraded performance": "Slow",
  "Partially unavailable": "Partly down",
  "Major outage": "Down",
  "Under maintenance": "Maintenance",
} as const satisfies Record<ComponentState, string>;

export function componentStateLabel(state: ComponentState) {
  return componentStateLabels[state];
}
