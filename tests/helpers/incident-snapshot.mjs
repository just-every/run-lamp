import assert from 'node:assert/strict';

// Full import/restore comparisons must traverse the ordinary incident pages.
// Keep the visible page size: increasing it would conceal truncated snapshots.
export async function incidentSnapshot(read) {
  const incidents = [], cursors = new Set();
  let cursor, total;
  do {
    const path = `/api/app/incidents${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`;
    const response = await read(path);
    assert.equal(response.status, 200, JSON.stringify(response.body));
    const page = response.body;
    total ??= page.total;
    assert.equal(page.total, total, 'the incident inventory stays stable during the snapshot');
    incidents.push(...page.incidents);
    cursor = page.nextCursor;
    if (cursor) {
      assert.ok(!cursors.has(cursor), 'each incident page advances the cursor');
      cursors.add(cursor);
    }
  } while (cursor);
  assert.equal(new Set(incidents.map(row => row.id)).size, incidents.length, 'snapshot pages never duplicate an incident');
  assert.equal(incidents.length, total, 'the snapshot includes every incident across all pages');
  return incidents;
}
