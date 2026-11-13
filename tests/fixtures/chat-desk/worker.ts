import { createApp } from '../../../src/core/app/server';
import { createHostDispatch } from '../../../src/core/app/host-dispatch';
import type { AppBindings } from '../../../src/core/app/types';
import { lampServerExtensions } from '../../../src/ext/index.server';
export { SnapshotCache } from '../../../src/core/platform/blobs/snapshot-cache';
export default {
  async fetch(request: Request, bindings: AppBindings, context: ExecutionContext) {
    if (!createHostDispatch(bindings).surfaceFor(request)) return new Response('Not found.', { status: 404 });
    request = new Request(request);
    request.headers.set('Host', new URL(request.url).host);
    Object.assign(lampServerExtensions.policies, {
      'update.review.v1': { requiresReview: () => (bindings as unknown as Record<string, string>).LAMP_TEST_REQUIRE_REVIEW === 'true' },
    });
    return createApp(bindings).app.fetch(request, bindings, context);
  },
};
