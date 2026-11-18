import type { PublicComponentGroup } from "./imported-metadata.repository";
import { escapeHtml } from "./format";
import { sourceMetadataMarkup } from "./source-metadata";

/** Render actual group identities recursively, including parents with no direct
 * leaves. Equal names never merge separate groups. No parent is a component. */
export function recursiveComponentGroups<T extends { groupId?: string | null; displayOrder: number; name: string }>(
  components: T[], groups: PublicComponentGroup[], rows: (members: T[]) => string, collapsed: boolean,
  groupClass = "component-group theme-component-group",
): string {
  const order = (a: { displayOrder: number; name: string }, b: { displayOrder: number; name: string }) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
  const byId = new Map(groups.map(group => [group.id, group]));
  const renderGroup = (name: string, body: string) => collapsed
    ? `<details class="${groupClass}"><summary>${escapeHtml(name)}</summary>${body}</details>`
    : `<section class="${groupClass}"><h3>${escapeHtml(name)}</h3>${body}</section>`;
  const visit = (group: PublicComponentGroup, parents: Set<string>): string => {
    if (parents.has(group.id) || parents.size > 32) return "";
    const seen = new Set([...parents, group.id]);
    const own = components.filter(component => component.groupId === group.id).sort(order);
    const children = groups.filter(child => child.parentId === group.id).sort(order).map(child => visit(child, seen)).join("");
    if (!own.length && !children) return "";
    const body = `${group.description ? `<p class="group-description">${escapeHtml(group.description)}</p>` : ""}${sourceMetadataMarkup(group.sourceMetadata)}${rows(own)}${children}`;
    return renderGroup(group.name, body);
  };
  const grouped = groups.filter(group => !group.parentId || !byId.has(group.parentId)).sort(order).map(group => visit(group, new Set())).join("");
  const ungrouped = components.filter(component => !component.groupId || !byId.has(component.groupId)).sort(order);
  if (!ungrouped.length) return grouped;
  const ungroupedRows = rows(ungrouped);
  return grouped
    ? grouped + renderGroup("Other services", ungroupedRows)
    : `<div class="component-group">${ungroupedRows}</div>`;
}
