// Synthetic source records follow Sorry's public management documentation:
// https://developer.sorryapp.com/reference/get-notice-templates
// https://developer.sorryapp.com/reference/get-update-templates
// No provider account, export, key or request contributes fixture data.
export function sorryTemplateFixture() {
  const pageId = 'synthetic-lamp-templates';
  const created = '2026-01-02T10:00:00.000Z';
  const updated = '2026-01-03T11:00:00.000Z';
  const templates = ['notice', 'update'].flatMap(kind => Array.from({ length: 27 }, (_, i) => {
    const n = i + 1;
    return {
      kind, id: `synthetic-lamp-${kind}-${n}`, name: `Synthetic ${kind} template ${n}`,
      ...(kind === 'notice' || n !== 26 ? { subject: n === 25 ? `Synthetic ${kind} ${'complete subject '.repeat(20)}END-OF-SUBJECT` : `Synthetic ${kind} subject ${n}` } : {}),
      body: `Synthetic ${kind} impact ${n}.\n\n${n === 27 ? 'Complete reusable wording. '.repeat(35) + `END-OF-${kind.toUpperCase()}-WORDING` : `Synthetic ${kind} complete details ${n}.`}`,
      component_id: n % 2 ? '11' : null, created_at: created, updated_at: updated,
    };
  }));
  const saved = (name, value) => ({ name, text: JSON.stringify(value, null, 2) + '\n' });
  const files = [
    saved('sorry-page.json', { response: { id: pageId, name: 'Synthetic Lamp collection', endpoint: 'synthetic-templates.sorryapp.com', created_at: created, updated_at: updated } }),
    saved('sorry-components.json', { response: [{ id: 11, name: 'Billing API', state: 'operational', parent_id: null, position: 1, created_at: created, updated_at: updated }], count: 1 }),
    saved('sorry-notices.json', { response: [], count: 0 }),
    saved('sorry-subscribers.json', { response: [], count: 0 }),
  ];
  for (const kind of ['notice', 'update']) {
    const rows = templates.filter(row => row.kind === kind).map(({ kind: _kind, body, component_id, ...row }, i) => ({
      ...row, component_id: component_id === null ? null : Number(component_id),
      // The filtered notice list example uses content; both variants must work.
      [kind === 'notice' && i % 2 === 0 ? 'initial_comment' : 'content']: body,
    }));
    for (let page = 1; page <= 2; page++) {
      const response = rows.slice((page - 1) * 25, page * 25);
      files.push(saved(`sorry-${kind}-templates${page === 1 ? '' : '-2'}.json`, {
        response, count: response.length,
        pagination: { current: page, previous: page === 1 ? null : 1, next: page === 1 ? 2 : null, per_page: 25, pages: 2, count: rows.length },
      }));
    }
  }
  return { pageId, files, templates };
}
