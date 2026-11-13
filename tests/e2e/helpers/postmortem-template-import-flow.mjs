import assert from "node:assert/strict";

const publishedText = "CONTINUITY-PUBLISHED-REPORT";
const privateText = "CONTINUITY-PRIVATE-REPORT";
const templateText = "CONTINUITY-PRIVATE-TEMPLATE";
const largeDetails = `${"Full wording survives import. ".repeat(40)}END-OF-OVERSIZED-WORDING`;
const reportTail = `${"Detailed recovery evidence. ".repeat(800)}END-OF-FULL-REPORT`;
const publication = "2026-01-23T12:00:00.000Z";

/** Synthetic network-edge records, kept within the existing Statuspage cases. */
export function continuityFiles(original, { oversized = false } = {}) {
  const files = original.map(file => ({ ...file, text: file.text.replaceAll("i000000000", "continuityi").replaceAll("c000000000", "continuityc").replaceAll("s000000000", "continuitys").replaceAll("subscriber", "continuitysubscriber").replaceAll("https://stspg.io/", "https://stspg.io/continuity-") }));
  const file = files.find(file => file.name === "incidents.json");
  const incidents = JSON.parse(file.text);
  incidents[0].impact = "critical";
  incidents[0].postmortem_body = `# ${publishedText}\n\nFirst paragraph with **every word** &amp; an &eacute; entity.\n\n- First list item\n- Second list item\n\n[Review recovery](https://example.com/recovery)\n\n![Recovery chart](https://images.example.com/never-fetch.png)\n\n<p>HTML paragraph <a href="https://example.com/html">HTML link wording</a>.</p><h2>Final heading</h2><ol><li>Final list wording</li></ol>\n\n${reportTail}`;
  incidents[0].postmortem_published_at = publication;
  incidents[0].postmortem_notify_subscribers = true;
  incidents[1].postmortem_body = `<p>${privateText}</p><p>Private cause and remediation.</p>`;
  incidents[1].postmortem_published_at = null;
  file.text = JSON.stringify(incidents);
  const components = JSON.parse(files.find(file => file.name === "components.json").text);
  const group = { id: "continuityfolder", name: "Customer communication" };
  files.push({ name: "incident-template-groups.json", text: JSON.stringify([group]) });
  files.push({ name: "incident-templates.json", text: JSON.stringify([0, 1, 2].map(index => ({
    id: `continuitytemplate${index}`, name: `Continuity template ${index + 1}`, title: `Private imported title ${index + 1}`,
    body: `${templateText} ${index + 1}\n\n${oversized && index === 2 ? largeDetails : `Follow-up details ${index + 1}.`}`,
    group_id: group.id, group, update_status: ["investigating", "identified", "monitoring"][index], should_send_notifications: index === 0,
    components: index === 2
      ? [{ id: components[1].id, status: "partial_outage" }, { id: components[0].id, status: "major_outage" }]
      : [{ id: components[index].id, status: ["degraded_performance", "partial_outage"][index] }],
  }))) });
  return files;
}

export function assertContinuityCounts(report) {
  assert.equal(report.counts.postmortem.read, 2);
  assert.equal(report.counts.postmortem.imported, 1);
  assert.equal(report.counts.postmortem["kept-private"], 1);
  assert.equal(report.counts.postmortem.rejected, 0);
  assert.equal(report.counts.template.read, 3);
  assert.equal(report.counts.template.imported + report.counts.template.changed, 3);
}

const byId = rows => [...rows].sort((a, b) => a.id.localeCompare(b.id));
const templateInventory = templates => byId(templates.map(row => ({ ...row, components: byId(row.components) })));
const templateItems = report => report.items.filter(row => row.kind === "template").sort((a, b) => a.sourceId.localeCompare(b.sourceId));

export async function postmortemTemplateImportFlow({ api, request, importAll, moveIn, original, publicOrigin, runtime, t, preserveEdits = false, fetcher = globalThis.fetch }) {
  const fetch = fetcher;
  const files = continuityFiles(original, { oversized: preserveEdits });
  const nativeComponents = (await api("/api/app/components")).body.components;
  assert.ok(nativeComponents.length > 0, "dry-run control uses an existing native component");
  const control = await api("/api/app/incident-templates", {
    name: "Owner template before import", lifecycle: "Identified", affectedAudience: "Existing customers",
    customerImpact: "Existing impact", whatStillWorks: "Existing unaffected service", details: "Existing complete details",
    nextUpdateOffsetMinutes: 45, channels: ["email", "webhook"],
    resolvedUpdate: { affectedAudience: "Recovered customers", customerImpact: "Recovered impact", whatStillWorks: "Recovered service", details: "Recovered details" },
    components: [{ componentId: nativeComponents[0].id, state: "Degraded performance", relationship: "Dependent" }],
  });
  assert.equal(control.status, 201, JSON.stringify(control.body));
  const readTemplates = async () => {
    const response = await api("/api/app/incident-templates");
    assert.equal(response.status, 200, JSON.stringify(response.body));
    return templateInventory(response.body.templates);
  };
  const baseline = await readTemplates();
  const incidentsBefore = byId((await api("/api/app/incidents")).body.incidents);
  const templatesBefore = baseline.length;
  assert.ok(baseline.some(row => row.name === "Owner template before import" && row.components.length > 0));
  const sourceTemplates = JSON.parse(files.find(file => file.name === "incident-templates.json").text);
  const expectedSources = sourceTemplates.map(row => ({ sourceId: row.id, name: row.name })).sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  const expected = [
    { name: "Continuity template 1", title: "Private imported title 1", lifecycle: "Investigating", affectedAudience: "Customers using Public API", shouldSendNotifications: true, customerImpact: `${templateText} 1`, details: "Follow-up details 1.", components: [{ componentName: "Public API", state: "Degraded performance", relationship: "Primary" }] },
    { name: "Continuity template 2", title: "Private imported title 2", lifecycle: "Identified", affectedAudience: "Customers using Dashboard", shouldSendNotifications: false, customerImpact: `${templateText} 2`, details: "Follow-up details 2.", components: [{ componentName: "Dashboard", state: "Partially unavailable", relationship: "Primary" }] },
    { name: "Continuity template 3", title: "Private imported title 3", lifecycle: "Monitoring", affectedAudience: "Customers using Dashboard, Public API", shouldSendNotifications: false, customerImpact: `${templateText} 3`, details: preserveEdits ? largeDetails : "Follow-up details 3.", components: [{ componentName: "Dashboard", state: "Partially unavailable", relationship: "Primary" }, { componentName: "Public API", state: "Major outage", relationship: "Primary" }] },
  ];
  const preview = await moveIn.preview({ files });
  assert.equal(preview.status, 200, JSON.stringify(preview.body));
  assertContinuityCounts(preview.body.report);
  if (!preserveEdits) assert.equal(preview.body.report.counts.template.imported, 3);
  if (preserveEdits) assert.ok(preview.body.report.items.some(item => item.name === "Continuity template 3" && /details.*shorten|shorten.*details/iu.test(item.reason)));
  assert.deepEqual(templateItems(preview.body.report).map(({ sourceId, name }) => ({ sourceId, name })), expectedSources, "review names every original source identity exactly once");
  assert.deepEqual(await readTemplates(), baseline, "dry run preserves every existing template field and component");
  t.diagnostic("PROBE MOVE-014 4: native owner preview over populated templates -> complete existing contents and component rows unchanged");
  // A refused child report must not discard its valid incident.
  const invalid = files.map(file => ({ ...file }));
  const incidentFile = invalid.find(file => file.name === "incidents.json");
  const invalidRows = JSON.parse(incidentFile.text); invalidRows[0].postmortem_published_at = "invalid"; incidentFile.text = JSON.stringify(invalidRows);
  const refused = await moveIn.preview({ files: invalid });
  assert.equal(refused.status, 200, JSON.stringify(refused.body));
  assert.equal(refused.body.report.counts.postmortem.rejected, 1);
  assert.equal(refused.body.report.counts.incident.rejected, 0);
  assert.deepEqual(await readTemplates(), baseline, "the refused report preview also preserves complete existing templates");
  const { preview: reviewed, result } = await importAll(files);
  assertContinuityCounts(result.report);
  const reviewedTemplates = templateItems(reviewed.report);
  assert.deepEqual(reviewedTemplates, templateItems(preview.body.report));
  assert.deepEqual(templateItems(result.report), reviewedTemplates, "apply reports exactly the reviewed template identities and dispositions");
  assert.deepEqual(result.report.counts.template, reviewed.report.counts.template);
  const reconciliation = await moveIn.door("statuspage", "reconcile", { planId: reviewed.planId });
  assert.equal(reconciliation.status, 200, JSON.stringify(reconciliation.body));
  assert.equal(reconciliation.body.ok, true, JSON.stringify(reconciliation.body));
  assert.deepEqual(reconciliation.body.sourceIds.filter(row => row.kind === "template").map(({ sourceId }) => sourceId).sort(), expectedSources.map(row => row.sourceId));
  assert.equal(reconciliation.body.counts.byKind.template, 3);
  const verification = await api(`/api/app/statuspage-import/jobs/${result.job.id}/verification`);
  assert.equal(verification.status, 200, JSON.stringify(verification.body));
  assert.equal(verification.body.unexplainedDifferences, 0, "all applied contents and provenance match the persisted reviewed plan");
  for (const manifest of Object.values(verification.body.reconciliation)) {
    assert.equal(manifest.sourceCount, manifest.targetCount);
    assert.equal(manifest.sourceManifestSha256, manifest.targetManifestSha256);
  }
  const incidents = (await api("/api/app/incidents")).body.incidents;
  const priorIncidentIds = new Set(incidentsBefore.map(row => row.id));
  assert.deepEqual(byId(incidents.filter(row => priorIncidentIds.has(row.id))), incidentsBefore, "template import changes no pre-existing incident or publication");
  const redirect = await fetch(`${publicOrigin}/incidents/continuityi1`, { redirect: "manual" });
  const draftRedirect = await fetch(`${publicOrigin}/incidents/continuityi2`, { redirect: "manual" });
  assert.equal(redirect.status, 301);
  assert.equal(draftRedirect.status, 301);
  const permalink = redirect.headers.get("Location");
  const published = incidents.find(row => `/incidents/${row.reference}` === permalink);
  const draftIncident = incidents.find(row => `/incidents/${row.reference}` === draftRedirect.headers.get("Location"));
  const readReport = async id => (await api(`/api/app/incidents/${id}/report`)).body.report;
  const report = await readReport(published.id);
  assert.equal(report.publishedAt, publication);
  for (const word of [publishedText, "every word", "é entity", "First list item", "Second list item", "Review recovery", "https://example.com/recovery", "Recovery chart", "https://images.example.com/never-fetch.png", "HTML paragraph", "HTML link wording", "https://example.com/html", "Final heading", "Final list wording", reportTail]) assert.ok(report.summary.includes(word), word);
  assert.deepEqual([report.timeline, report.cause, report.remediation], ["", "", ""]);
  assert.equal((await readReport(draftIncident.id)).publishedAt, null);
  assert.ok((await readReport(draftIncident.id)).summary.includes(privateText));
  const afterImport = await readTemplates();
  const existingIds = new Set(baseline.map(row => row.id));
  assert.deepEqual(afterImport.filter(row => existingIds.has(row.id)), baseline, "apply preserves complete pre-existing templates");
  const templates = afterImport.filter(row => !existingIds.has(row.id));
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map(row => row.id)).size, 3);
  assert.deepEqual(templates.map(row => row.name).sort(), expectedSources.map(row => row.name).sort(), "no reviewed template omitted and no extra template applied");
  const { results: provenance } = await runtime.db.prepare("SELECT json_extract(record_json, '$.sourceId') AS sourceId, target_id AS targetId FROM ik_provenance WHERE job_id = ? AND json_extract(record_json, '$.sourceKind') = 'template' AND target_kind = 'template' AND reversed = 0 ORDER BY sourceId, target_id").bind(result.job.id).all();
  assert.deepEqual(provenance, expectedSources.map(source => ({ sourceId: source.sourceId, targetId: templates.find(row => row.name === source.name).id })), "each original source identity owns the native template with its original name");
  const components = (await api("/api/app/components")).body.components;
  const sortedClaims = rows => [...rows].sort((a, b) => a.componentName.localeCompare(b.componentName));
  for (const wanted of expected) {
    const actual = templates.find(row => row.name === wanted.name);
    const { components: wantedComponents, ...metadata } = wanted;
    assert.deepEqual(Object.fromEntries(Object.keys(metadata).map(key => [key, actual[key]])), metadata, wanted.name);
    assert.equal(actual.folder, "Customer communication");
    assert.equal(actual.nextUpdateOffsetMinutes, null);
    assert.equal(actual.whatStillWorks, "");
    assert.deepEqual(actual.fieldsToShorten, preserveEdits && wanted.name === "Continuity template 3" ? ["details"] : []);
    const claims = wantedComponents.map(claim => {
      const matches = components.filter(component => component.name === claim.componentName && !nativeComponents.some(before => before.id === component.id));
      assert.equal(matches.length, 1, `one imported component for ${claim.componentName}`);
      return { ...claim, componentId: matches[0].id };
    });
    assert.deepEqual(sortedClaims(actual.components.map(({ componentId, componentName, state, relationship }) => ({ componentId, componentName, state, relationship }))), sortedClaims(claims), `${wanted.name} keeps its complete component selection and states`);
  }
  t.diagnostic("PROBE MOVE-014 1: reviewed owner import -> all three source names, identities, lifecycles, metadata and exact component claims reconciled");
  t.diagnostic("PROBE MOVE-014 2: native template readback -> exact body mapping and audience names both selected components");
  const retainedTemplate = templates.find(row => row.name === "Continuity template 3");
  const retainedComponents = structuredClone(retainedTemplate.components);
  assert.equal(retainedComponents.length, 2, "undo starts with a nonempty complete multi-component selection");
  const first = templates.find(row => row.name === "Continuity template 1");
  assert.equal(first.folder, "Customer communication");
  assert.equal(first.title, "Private imported title 1");
  assert.equal(first.shouldSendNotifications, true);
  assert.equal(first.nextUpdateOffsetMinutes, null);
  assert.equal(first.components[0].state, "Degraded performance");
  assert.equal(first.customerImpact, `${templateText} 1`);
  // Source severity stays separate from the explicit partial-outage claims.
  assert.equal(published.impactOverride, "critical");
  const html = await (await fetch(`${publicOrigin}${permalink}`)).text();
  assert.ok(html.includes(publishedText), "published postmortem is in the script-free HTML");
  assert.doesNotMatch(html, /<img[^>]+never-fetch/iu);
  for (const path of ["/api/v2/incidents.json", "/api/public/v1/incidents"]) {
    const response = await fetch(`${publicOrigin}${path}`);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes(publishedText), `${path} carries the published report`);
  }
  for (const path of ["/", permalink, `/incidents/${draftIncident.reference}`, "/history/", "/feed.atom", "/feed.rss", "/api/v2/summary.json", "/api/v2/incidents.json", "/api/v2/incidents/unresolved.json", "/api/v2/incidents/resolved.json", "/api/public/v1/incidents", "/api/public/status"]) {
    const body = await (await fetch(`${publicOrigin}${path}`)).text();
    assert.equal(body.includes(privateText), false, `${path} keeps the draft report private`);
    assert.equal(body.includes(templateText), false, `${path} keeps templates private`);
  }
  const unchanged = await moveIn.preview({ files });
  assert.equal(unchanged.body.report.state, "already imported");
  const repeated = await moveIn.apply(unchanged.body);
  assert.equal(repeated.status, 200, JSON.stringify(repeated.body));
  assert.equal((await api("/api/app/incident-templates")).body.templates.length, templatesBefore + 3);
  assert.deepEqual(await readTemplates(), afterImport, "repeat preserves complete templates and child identities");
  const applied = await request(`/api/app/incidents/${published.id}/templates/${first.id}/apply`, { method: "POST", headers: { "If-Match": `-:${published.updates.length}` }, json: {} });
  assert.equal(applied.status, 200, await applied.clone().text());
  const filled = await applied.json();
  assert.equal(filled.draft.lifecycle, "Investigating");
  assert.equal(filled.draft.affectedAudience, "Customers using Public API");
  assert.equal(filled.draft.whatStillWorks, "");
  assert.equal(filled.draft.customerImpact, first.customerImpact);
  assert.equal(filled.draft.details, first.details);
  assert.equal(filled.draft.nextUpdateAt, null);
  assert.ok(filled.draft.componentChanges.some(change => change.componentId === first.components[0].componentId && change.state === first.components[0].state));
  assert.equal((await api(`/api/app/incidents/${published.id}`)).body.incident.updates.length, published.updates.length, "applying an imported template publishes nothing");
  t.diagnostic("PROBE MOVE-014 5: native apply-template -> private composer fields and component state filled without publication");
  if (preserveEdits) {
    const overflow = templates.find(row => row.name === "Continuity template 3");
    assert.equal(overflow.details, largeDetails, "whole oversized wording survives");
    assert.ok(overflow.fieldsToShorten.includes("details"));
    const blocked = await request(`/api/app/incidents/${draftIncident.id}/templates/${overflow.id}/apply`, { method: "POST", headers: { "If-Match": `-:${draftIncident.updates.length}` }, json: {} });
    assert.equal(blocked.status, 409, await blocked.clone().text());
    const saved = await request(`/api/app/incident-templates/${overflow.id}`, { method: "PUT", json: { details: "Shortened by the operator." } });
    assert.equal(saved.status, 200, await saved.clone().text());
    const shortened = await request(`/api/app/incidents/${draftIncident.id}/templates/${overflow.id}/apply`, { method: "POST", headers: { "If-Match": `-:${draftIncident.updates.length}` }, json: {} });
    assert.equal(shortened.status, 200, await shortened.clone().text());
    assert.equal((await shortened.json()).draft.details, "Shortened by the operator.");
    t.diagnostic("PROBE MOVE-014 3: oversized native template apply -> 409, operator shortening -> 200 with exact shortened details");
    const reportSaved = await request(`/api/app/incidents/${draftIncident.id}/report`, { method: "PUT", json: { summary: `${privateText} edited here`, timeline: "Reviewed timeline", cause: "Reviewed cause", remediation: "Reviewed actions" } });
    assert.equal(reportSaved.status, 200, await reportSaved.clone().text());
  }
  const undone = await moveIn.undo(result.door);
  assert.equal(undone.status, 200, JSON.stringify(undone.body));
  assert.equal(undone.body.job.state, "undone");
  assert.equal((await api("/api/app/incident-templates")).body.templates.length, templatesBefore + Number(preserveEdits));
  assert.equal(await readReport(published.id), null, "untouched report is removed with its incident");
  assert.equal((await readReport(draftIncident.id))?.summary ?? null, preserveEdits ? `${privateText} edited here` : null);
  if (preserveEdits) {
    const kept = (await api("/api/app/incident-templates")).body.templates.find(row => row.name === "Continuity template 3");
    assert.equal(kept.details, "Shortened by the operator.");
    assert.equal(kept.id, retainedTemplate.id);
    assert.deepEqual(kept.components, retainedComponents, "edited-template undo preserves the independently captured complete nonempty component rows");
    assert.deepEqual((await readTemplates()).filter(row => existingIds.has(row.id)), baseline);
    assert.deepEqual((await readTemplates()).filter(row => !existingIds.has(row.id)).map(row => row.id), [retainedTemplate.id]);
    assert.ok(undone.body.undo.dispositions.some(row => row.targetKind === "template" && row.targetId === retainedTemplate.id && row.disposition === "retained"), "undo names the exact edited template as retained");
    const componentIds = new Set((await api("/api/app/components")).body.components.map(row => row.id));
    assert.ok(kept.components.every(component => componentIds.has(component.componentId)), "retained templates keep the components they need");
    t.diagnostic("PROBE MOVE-014 6: repeated reviewed import and preserve-conflicts undo -> no duplicates; exact edited template and both original complete component rows retained");
    for (const kind of ["incident", "template", "component"]) assert.ok(undone.body.undo.dispositions.some(row => row.targetKind === kind && row.disposition === "retained"), `edited report/template retains ${kind}`);
  }
}
