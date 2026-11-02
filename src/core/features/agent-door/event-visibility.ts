import type { ResourceDefinition } from '../../../../modules/agent-door/index.ts';
import type { AppBindings } from '../../app/types';
import type { AppServices } from '../../app/services';
import { authOrigin } from '../../platform/auth/config';
import { ulidSchema } from '../../shared/ids';
import { allowsOperatorRequest } from '../operators/permissions';
import { createOperatorRolesRepository } from '../operators/roles.repository';

/** Event visibility resolves the real current component and native read grant.
 * Resources remain undeclared at the MCP surface; this resolver supplies the
 * event stream's independent native audience check, never a fallback grant.
 */
export function componentEventVisibility(bindings: AppBindings, services: AppServices): ResourceDefinition[] {
  const roles = createOperatorRolesRepository(bindings.DB);
  const origin = authOrigin(bindings);
  return [{
    uriTemplate: `${origin}/app/components#{id}`,
    name: 'Native component', scope: 'components:read', classes: ['standard', 'sensitive'],
    classify: record => (record.json as { internal: boolean }).internal
      ? [{ class: 'sensitive', facts: { measure: 1, kind: 'private component record' } }]
      : [{ class: 'standard', facts: { measure: 1 } }],
    async read(uri, ctx) {
      const url = new URL(uri);
      const id = ulidSchema.safeParse(url.hash.slice(1));
      if (url.origin !== origin || url.pathname !== '/app/components' || !id.success) return null;
      const role = await roles.role(ctx.person.id);
      if (!role || !allowsOperatorRequest(role, 'GET', `/api/app/components/${id.data}`)) return null;
      const component = await services.components.get(id.data);
      return component ? { json: component, untrusted: true } : null;
    },
  }];
}
