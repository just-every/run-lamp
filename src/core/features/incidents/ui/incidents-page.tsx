import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { IncidentsService } from "../service";
import { NewIncidentPage } from "./new-incident-page";
import { Button } from "../../../app/client/ui/button";
import { Icon } from "../../../app/client/ui/icon";
import { LoadingState, useOperatorTime } from "../../../app/client/ui/states";
import { EmptyState, ErrorState } from "../../../app/client/ui/lit-states";
import { useAppData } from "../../../app/client/ui/api";
import { UpdateDueNotice, updateDueLabel, useCommittedTime } from "./update-due-notice";

type IncidentsResponse = Awaited<ReturnType<IncidentsService["listPage"]>>;

function useIncidentPage(group: "active" | "resolved") {
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const cursor = cursors.at(-1);
  const resource = useAppData<IncidentsResponse>(`/api/app/incidents?group=${group}&limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  return { ...resource, page: cursors.length, previous: () => setCursors(values => values.slice(0, -1)), next: () => { if (resource.data?.nextCursor) setCursors(values => [...values, resource.data!.nextCursor]); } };
}

export function IncidentsPage() {
  const activePage = useIncidentPage("active");
  const resolvedPage = useIncidentPage("resolved");
  const error = activePage.error ?? resolvedPage.error;
  const createRequested = useRouterState({ select: state => state.location.hash === "new" });
  const navigate = useNavigate();
  // Older links ask for the create form with #new; it is its own screen now.
  useEffect(() => { if (createRequested) void navigate({ to: "/app/incidents/new", replace: true }); }, [createRequested, navigate]);
  const [dismissedEmptyCreation, setDismissedEmptyCreation] = useState(false);
  if (activePage.loading || resolvedPage.loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={() => window.location.reload()}>{error}</ErrorState>;
  if (!activePage.data || !resolvedPage.data) return null;
  // An empty list opens the create form, not an empty table.
  if (activePage.data.activeTotal + resolvedPage.data.resolvedTotal === 0 && !dismissedEmptyCreation && !createRequested) return <NewIncidentPage onClose={() => setDismissedEmptyCreation(true)} />;
  const active = activePage.data.incidents;
  const resolved = resolvedPage.data.incidents;

  return <div className="page-stack">
    <section className="page-title-row"><div><h1>Incidents</h1><p>Tell customers what’s happening.</p></div><Button asChild><Link to="/app/incidents/new">New incident</Link></Button></section>
    <UpdateDueNotice incidents={active} />
    <section className="data-card incident-list-card" aria-label="Active incidents">
      <div className="card-heading"><div><p className="card-kicker">Active</p><h2>Current incidents</h2></div><span className="count-label">{activePage.data.activeTotal} total</span></div>
      {active.length ? <div className="record-list">{active.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div> : <EmptyState>No active incidents on this page.</EmptyState>}
      <IncidentPagination label="Active incidents" resource={activePage} />
    </section>
    <section className="data-card incident-list-card" aria-label="Resolved incidents">
      <div className="card-heading"><div><h2>Resolved incidents</h2></div><span className="count-label">{resolvedPage.data.resolvedTotal} total</span></div>
      {resolved.length ? <div className="record-list">{resolved.map((incident) => <IncidentRow key={incident.id} incident={incident} />)}</div> : <EmptyState>No resolved incidents on this page.</EmptyState>}
      <IncidentPagination label="Resolved incidents" resource={resolvedPage} />
    </section>
  </div>;
}

function IncidentPagination({ label, resource }: { label: string; resource: ReturnType<typeof useIncidentPage> }) {
  const data = resource.data!;
  const start = data.incidents.length ? (resource.page - 1) * data.limit + 1 : 0;
  const end = start ? start + data.incidents.length - 1 : 0;
  return <nav className="list-pagination" aria-label={`${label} pages`}>
    <span className="count-label" aria-live="polite">{start}–{end} of {data.total} · {data.limit} per page</span>
    <div>
      <Button variant="secondary" disabled={resource.page === 1} onClick={resource.previous}>Previous<span className="sr-only"> {label}</span></Button>
      <Button variant="secondary" disabled={!data.nextCursor} onClick={resource.next}>Next<span className="sr-only"> {label}</span></Button>
    </div>
  </nav>;
}

function IncidentRow({ incident }: { incident: IncidentsResponse["incidents"][number] }) {
  const formatOperatorTime = useOperatorTime();
  const committedTime = useCommittedTime();
  const dueLabel = updateDueLabel(incident, committedTime);
  return <Link className={`incident-list-row${incident.overdue ? " live-block" : ""}`} to="/app/incidents/$incidentId" params={{ incidentId: incident.id }}>
    <span className="record-ref">{incident.reference}</span>
    <span className="incident-row-content"><strong>{incident.title}</strong><small>Opened {formatOperatorTime(incident.openedAt)}{incident.impact ? ` · ${incident.impact}` : " · No component impact"}</small></span>
    <span className="incident-row-state"><span className={`state-pill${incident.updates.length ? ` state-${incident.lifecycle.toLowerCase()}` : ""}`}>{incident.updates.length ? incident.lifecycle : "Not published"}</span>{dueLabel && <small className="overdue-note">{dueLabel}</small>}</span>
    <Icon className="row-chevron" name="arrow" width={18} height={18} />
  </Link>;
}
