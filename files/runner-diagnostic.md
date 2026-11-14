# Local runner diagnosis

Initial direct component-flow invocations used `node --input-type=module -e ...`. Miniflare's SynchronousFetcher starts an eval worker containing CommonJS `require`, inherits that flag, and blocks the parent in Atomics.wait while trying to read the D1 binding. This was a test invocation defect, not a product assertion failure. Proxy, Node-version, inspector, worker-name and CF-metadata probes did not resolve it. Temporary fixture/dependency instrumentation and the alternate fixture were restored/removed; none are product changes. Only owned test PIDs were stopped.

The final invocation is `cloud_run timeout 600 node /tmp/run-component-read.mjs`, whose ordinary ES module file imports and awaits componentReadFlow. The file uses no --input-type flag. The actual final output is component-read-test.log. Initial diagnostic outputs are retained separately and never substituted for passing tests.
