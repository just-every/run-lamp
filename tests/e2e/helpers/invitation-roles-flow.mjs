import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { operatorHydrated } from './operator-hydrated.mjs';

/** The chosen invitation role survives real email-link acceptance. */
export async function invitationRolesFlow({ browser, page, origin, linkFor, confirm }) {
  const panel = page.getByRole('region', { name: 'Operators', exact: true });
  for (const role of ['viewer', 'responder', 'admin', 'owner']) {
    const email = `synthetic-lamp-invite-${role}@example.test`;
    await panel.getByLabel('Email', { exact: true }).fill(email);
    await panel.getByLabel('Name', { exact: true }).fill(`Invited ${role}`);
    await panel.getByLabel('Invitation role', { exact: true }).selectOption(role);
    const response = page.waitForResponse(response => new URL(response.url()).pathname === '/api/app/operators/invite' && response.request().method() === 'POST');
    await panel.getByRole('button', { name: 'Invite operator', exact: true }).click();
    assert.equal((await response).status(), 202);
    const row = panel.getByRole('region', { name: 'Pending invitations' }).locator('.operator-row').filter({ hasText: email });
    await expect(row).toBeVisible();
    const pending = (await (await page.request.get(origin + '/api/app/operators/invited')).json()).operators.find(operator => operator.email === email);
    assert.equal(pending.role, role, 'the pending invitation has the selected role');
    await expect(panel.getByLabel('Invitation role', { exact: true })).toHaveValue('communicator');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      const colleague = await context.newPage();
      await confirm(colleague, linkFor(email));
      await colleague.reload(); await operatorHydrated(colleague);
      const session = (await (await colleague.request.get(origin + '/api/app/session')).json()).operator;
      assert.equal(session.role, role, 'acceptance and reload retain the selected authority');
      if (role === 'admin') {
        const refused = await colleague.request.post(origin + '/api/app/operators/invite', {
          headers: { Origin: origin },
          data: { email: 'synthetic-lamp-refused-owner@example.test', displayName: 'Refused invitation', role: 'owner' },
        });
        assert.equal(refused.status(), 403, 'an Admin cannot grant ownership through invitations');
      }
    } finally { await context.close(); }
  }
  const omitted = await page.request.post(origin + '/api/app/operators/invite', {
    headers: { Origin: origin },
    data: { email: 'synthetic-lamp-default-invite@example.test', displayName: 'Default invitation' },
  });
  assert.equal(omitted.status(), 202);
  const pending = (await (await page.request.get(origin + '/api/app/operators/invited')).json()).operators;
  assert.equal(pending.find(operator => operator.email === 'synthetic-lamp-default-invite@example.test').role, 'communicator', 'clients omitting a role receive the same safe default');
  assert.equal(pending.some(operator => operator.email === 'synthetic-lamp-refused-owner@example.test'), false);
}
