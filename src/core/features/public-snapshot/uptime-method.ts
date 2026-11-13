import { COMPONENT_STATES } from "../../shared/domain";
import type { PublicSnapshotPolicies } from "./policies";

/** The stated uptime method (UPTIME-005) in the same words beside the figures of every public layout: the reporting
 *  window and the selected policy's downtime weight for each state. Plain text; the caller escapes it. */
export function uptimeMethod(historyDays: number, policies: PublicSnapshotPolicies) {
  const weights = COMPONENT_STATES.map((state) => {
    const weight = policies.uptimeDowntimeWeight(state);
    return `${state} counts as ${weight} downtime minute${weight === 1 ? "" : "s"}`;
  });
  return `Uptime uses a ${historyDays}-day window. ${weights.join("; ")}.`;
}
