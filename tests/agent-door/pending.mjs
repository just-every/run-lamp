// Qualification boundaries on released rer 0.2.96. These records never skip,
// relabel or suppress a conformance point; contract judgments remain unchanged.
export const pendingBaseAssertions = [{
  family: 'nativeOperatorPolicyErasure',
  source: 'modules/agent-door/ADOPTING.md:1512; modules/agent-door/erasure.ts:75-106',
  reason: 'Operator erasure must map policy person references, but selecting agent_door_state reaches agent_erasure_unsupported_table. Lamp cannot rewrite a signed policy envelope or declare those personal authority references unrelated. Native custody remains unqualified.',
}, {
  family: 'timedAndQueuedFinalAdmission',
  source: 'modules/agent-door/ADOPTING.md:813',
  reason: 'timedLifecycle and queuedLifecycle remain unscoped. Native due-draft Cron replay and failed/restored JOBS producer proof do not establish execution-time agent admission.',
}];
