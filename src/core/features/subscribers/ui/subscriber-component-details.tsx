import { useState } from "react";

import type { StoredSubscriberComponent } from "../repository";

export function SubscriberComponentDetails({ selections }: { selections: StoredSubscriberComponent[] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const count = selections.length;
  const query = filter.trim().toLowerCase();
  const matches = open && query ? selections.filter(({ name }) => name?.toLowerCase().includes(query)) : selections;
  const label = `${count} selected ${count === 1 ? "component" : "components"}`;

  if (!count) return label;

  return <details className="subscriber-component-details" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{label}</summary>
    {open && <>
      {count > 1 && <label className="subscriber-component-filter">
        Filter components
        <input value={filter} onChange={event => setFilter(event.target.value)} />
      </label>}
      {matches.length > 0 && <ul className="subscriber-component-list">
        {matches.map(component => <li key={component.id}>{component.name ?? "Unavailable component"}</li>)}
      </ul>}
      {count > 1 && <div role="status">{matches.length === 0 && "No matching components."}</div>}
    </>}
  </details>;
}
