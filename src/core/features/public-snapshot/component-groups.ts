import type { PublicComponentGroup } from "./imported-metadata.repository";
import { escapeHtml } from "./format";
import { sourceMetadataMarkup } from "./source-metadata";

/** Render actual group identities recursively, including parents with no direct
 * leaves. Equal names never merge separate groups. No parent is a component. */
export function recursiveComponentGroups<T extends { groupId?: string | null; displayOrder: number; name: string }>(
  components: T[], groups: PublicComponentGroup[], rows: (members: T[]) => string, collapsed: boolean,
): string {
  const order = (a: { displayOrder: number; name: string }, b: { displayOrder: number; name: string }) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
  const byId = new Map(groups.map(group => [group.id, group]));
  const visit = (group: PublicComponentGroup, parents: Set<string>): string => {
    if (parents.has(group.id) || parents.size > 32) return "";
    const seen = new Set([...parents, group.id]);
    const own = components.filter(component => component.groupId === group.id).sort(order);
    const children = groups.filter(child => child.parentId === group.id).sort(order).map(child => visit(child, seen)).join("");
    if (!own.length && !children) return "";
    const body = `${group.description ? `<p class="group-description">${escapeHtml(group.description)}</p>` : ""}${sourceMetadataMarkup(group.sourceMetadata)}${rows(own)}${children}`;
    const attrs = `class="component-group theme-component-group" data-group-id="${escapeHtml(group.id)}"`;
    return collapsed ? `<details ${attrs}><summary>${escapeHtml(group.name)}</summary>${body}</details>` : `<section ${attrs}><h3>${escapeHtml(group.name)}</h3>${body}</section>`;
  };
  const grouped = groups.filter(group => !group.parentId || !byId.has(group.parentId)).sort(order).map(group => visit(group, new Set())).join("");
  const ungrouped = components.filter(component => !component.groupId || !byId.has(component.groupId)).sort(order);
  return grouped + (ungrouped.length ? `<section class="component-group">${grouped ? "<h3>Other services</h3>" : ""}${rows(ungrouped)}</section>` : "");
}
