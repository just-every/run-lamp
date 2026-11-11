import { openNativeRuntime, nativeRequest } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/dev-ingress/runtime.mjs';
import { devKey } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/helpers/dev-key.mjs';
import { signInAs } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/node_modules/@runeditrun/rer/modules/operator-auth/dev/sign-in-as.mjs';
import { withDraftVersion } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/e2e/draft-version-helper.mjs';
import { requestHeaders } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/helpers/request-headers.mjs';
import { anotherToolSetupJourney } from '/home/agent/rer-consolidation/work/main-lamp-another-tool-1-c1/run-lamp/tests/e2e/helpers/another-tool-setup-journey.mjs';
const runtime = await openNativeRuntime();
try {
  await runtime.start();
  await runtime.seedOperator();
  const cookie = (await signInAs({ origin: runtime.origin, key: devKey })).header;
  async function api(path, init = {}) {
    init = await withDraftVersion(path, init, readPath => nativeRequest(readPath, { cookie }));
    const response = await nativeRequest(path, { cookie, ...init, headers: requestHeaders(init.body ? { 'Content-Type': 'application/json' } : {}, init.headers) });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null, text };
  }
  await anotherToolSetupJourney({ origin: runtime.origin, cookie, api, width: 390 });
  console.log('Browser proof complete: Another tool connect, connected sample, edit and new-token at 390; credentials redacted in screenshots.');
} finally {
  await runtime.close();
}
