# Native management mail-off integration

Author: Run Edit Run fleet (Codex independent implementation agent), 2026-11-15.

Implemented explicit none in management/integration/mail-config.ts, plan.ts and revision.ts. None rejects nonblank sending credentials, relay settings, secondary-provider inputs and optional Postmark account credentials. Generated/revised plans omit sender/DKIM variables and required provider secrets while retaining MAIL_PROVIDER=none. Enabled providers retain native field validation and their required secret declarations. contract.ts now types the existing optionalSecretNames field. Required dispatcher/scheduler loops were not reclassified.

The implementation agent ran a bundled createIntegration.generatePlan/revisePlan probe through the public integration facade. Only the DNS/network edge was substituted; it would throw if contacted. Probes covered none generation without sender/key declarations or DNS reads, each contradictory key/relay/secondary input, missing provider, enabled provider missing sender, none revision and revision with a sending-secret name. Actual observed output:

    Management mail-off generation, no-network validation, conflict refusal and revision checks passed

The probe's stdout was observed in the agent tool result and was not originally saved as a raw log. This is the actual agent report, not a reconstructed raw terminal log. Its generated integration bundle was /tmp/lamp-management-integration.mjs, outside the product tree; it is not selected for public evidence. No permanent test registrations were added by this probe. The parent independently retained the actual management TypeScript-check log.

The independent implementation agent also extended the existing native deployment/real rer signin journey in tests/auth-adoption/dependencies.test.mjs. All four existing registrations passed on Node 22.20.0; the parent subsequently reran this file with the five touched mail tests, all nine passing, recorded in TOUCHED-TESTS.log. No real provider or deployment was used.
