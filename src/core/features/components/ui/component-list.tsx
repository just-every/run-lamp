import type { ComponentsService } from "../service";
import { ClientExtensionSlot } from "../../../app/client/extensions";
import { ComponentSourceMetadata } from "./source-metadata";
import { publicStateSource } from "./public-state-source";

type Component = Awaited<ReturnType<ComponentsService["list"]>>[number];
type Group = Awaited<ReturnType<ComponentsService["listGroups"]>>[number];
/** Each source group appears once under its actual parent; components remain
 * leaves, so selecting a group never invents a duplicate parent component. */
export function ComponentGroups({ groups, components, openId, onOpen }: { groups: Group[]; components: Component[]; openId: string | null; onOpen: (component: Component) => void }) {
  const ungrouped = components.filter((component) => component.groupId === null);
  const members = (id: string) => components.filter(component => component.groupId === id);
  const children = (id: string | null) => groups.filter(group => group.parentId === id);
  const count = (id: string): number => members(id).length + children(id).reduce((total, child) => total + count(child.id), 0);
  const rows = (items: Component[]) => <ul className="data-card component-rows">{items.map(component => <ComponentRow key={component.id} component={component} open={component.id === openId} onOpen={() => onOpen(component)} />)}</ul>;
  const renderGroup = (group: Group, depth: number) => {
    const leaves = members(group.id), descendants = children(group.id), total = count(group.id);
    return <div key={group.id} className="component-group" style={depth ? { marginInlineStart: Math.min(depth, 4) * 12 } : undefined}>
      <h2 className="component-group-heading">{group.name} <span className="component-group-count">{total}<span className="sr-only"> {total === 1 ? "component" : "components"}</span></span></h2>
      {group.description && <p>{group.description}</p>}
      <ComponentSourceMetadata source={group.sourceMetadata} kind="group" />
      {leaves.length ? rows(leaves) : !descendants.length ? <p className="data-card empty-component-group">No components in this group yet.</p> : null}
      {descendants.map(child => renderGroup(child, depth + 1))}
    </div>;
  };
  if (!groups.length && !ungrouped.length) return null;
  return <div className="component-groups">
    {children(null).map(group => renderGroup(group, 0))}
    {ungrouped.length > 0 && <div className="component-group">{groups.length > 0 && <h2 className="component-group-heading">Ungrouped</h2>}{rows(ungrouped)}</div>}
  </div>;
}

/** One button per row opens the component's drawer; the extension slot sits beside it, never inside it. */
function ComponentRow({ component, open, onOpen }: { component: Component; open: boolean; onOpen: () => void }) {
  const source = publicStateSource(component);
  const facts = [component.description, component.internal ? "Internal only" : "", component.note ? `Note: ${component.note}` : "", source === "maintenance" ? "Maintenance in progress" : source === "incident" ? "Open incident" : ""].filter(Boolean);
  return <li className={open ? "component-row is-open" : "component-row"}>
    <button type="button" className="component-row-button" aria-haspopup="dialog" onClick={onOpen}>
      <span className="component-row-summary"><strong>{component.name}</strong>{facts.length > 0 && <small>{facts.join(" · ")}</small>}</span>
      <span className={`state-pill state-${component.publicState.toLowerCase().replaceAll(" ", "-")}`}>{component.publicState}</span>
      <svg className="row-chevron" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    </button>
    <ClientExtensionSlot id="component.row.actions.v1" context={{ component: { id: component.id, name: component.name, publicState: component.publicState, groupName: component.groupName } }} />
  </li>;
}
