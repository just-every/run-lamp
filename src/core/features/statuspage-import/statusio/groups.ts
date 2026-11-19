import type { SourceComponent, SourceGroup } from "../source";
import type { StatusIoComponent } from "./schema";

export const pairId = (component: string, container?: string) => container ? `${component}:${container}` : component;
const undated = "1970-01-01T00:00:00.000Z";
export type Pair = { component: string; container?: string };

export function statusIoTopology(rows: StatusIoComponent[]) {
  const groups = new Map<string, SourceGroup>();
  const components: SourceComponent[] = [];
  const pairs = new Map<string, Pair>();
  for (const { _id: component, name, position, containers } of rows) {
    if (!containers.length) {
      pairs.set(component, { component });
      components.push({ id: component, name, position: position ?? 0, created_at: "", status: "" });
    }
    for (const container of containers) {
      const groupId = container._id, id = pairId(component, groupId);
      const existing = groups.get(groupId);
      if (pairs.has(id) || (existing && existing.name !== container.name)) {
        throw new Error("The Status.io component list contains duplicate infrastructure or conflicting container names.");
      }
      const group = existing ?? { id: groupId, name: container.name, components: [], position: container.position ?? 0, created_at: undated };
      group.components.push(id);
      groups.set(groupId, group);
      pairs.set(id, { component, container: groupId });
      components.push({ id, name: `${name} (${container.name})`, group_id: groupId, position: position ?? 0, created_at: "", status: "" });
    }
  }
  return { groups: [...groups.values()], components, pairs };
}

/** Some lists describe affected components and containers separately. A bounded
 * selection is safe when all references resolve and its pairs are unambiguous. */
export function selectPairs(pairs: Pair[], components: string[] = [], containers: string[] = []) {
  const componentIds = new Set(components), containerIds = new Set(containers);
  const selected = pairs.filter(pair => (!componentIds.size || componentIds.has(pair.component))
    && (!containerIds.size || (pair.container && containerIds.has(pair.container))));
  const selectedComponents = new Set(selected.map(pair => pair.component));
  const selectedContainers = new Set(selected.map(pair => pair.container));
  if (components.some(id => !selectedComponents.has(id)) || containers.some(id => !selectedContainers.has(id))) return null;
  return selected;
}
