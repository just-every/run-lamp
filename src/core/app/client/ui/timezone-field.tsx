import { useId, useState } from "react";
import { zoneLabel } from "../../../shared/timezone-label";

/** Search by city, choosing only a zone the browser can format. */
export function TimezoneField({ value, onChange, label = "Time zone" }: { value: string; onChange: (zone: string) => void; label?: string }) {
  const id = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const zones = [...new Set([value, "UTC", ...Intl.supportedValuesOf("timeZone")])];
  const search = (query ?? "").toLowerCase().replaceAll("_", " ");
  const matches = zones.filter(zone => `${zoneLabel(zone)} ${zone}`.toLowerCase().replaceAll("_", " ").includes(search));
  const choose = (zone: string) => { onChange(zone); setQuery(null); setOpen(false); };
  return <div className="timezone-field"><label className="form-label" htmlFor={id}>{label}</label>
    <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-choices`} autoComplete="off" value={query ?? zoneLabel(value)} onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setQuery(null); }} onChange={event => { setQuery(event.target.value); setOpen(true); }} onKeyDown={event => { if (event.key === "Escape") { setOpen(false); setQuery(null); } if (event.key === "Enter" && open && matches.length === 1) { event.preventDefault(); choose(matches[0]); } }} />
    {open && <div id={`${id}-choices`} role="listbox" aria-label="Cities" className="timezone-choices">{matches.map(zone => <button key={zone} type="button" role="option" aria-selected={zone === value} onMouseDown={event => event.preventDefault()} onClick={() => choose(zone)}>{zoneLabel(zone)}</button>)}{!matches.length && <p>No matching city.</p>}</div>}
  </div>;
}
