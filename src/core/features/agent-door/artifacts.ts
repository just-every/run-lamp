import type { AgentArtifactMap } from '../../../../modules/agent-door/index.ts';

// Native ids and exact contact destinations select personal artifacts. Names
// alone are not selectors: two people may share a name. A contact in free text
// must have identifier boundaries, so a peer's longer address is not selected.
const mentions = (table: string, columns: string[]) => `EXISTS(SELECT 1 FROM json_each(?1) subject WHERE ${columns.map(name => {
  const column = `${table}.${name}`;
  return `EXISTS(WITH RECURSIVE hits(text,pos) AS (
    SELECT leaf.value,instr(leaf.value,subject.value) FROM json_tree(CASE WHEN json_valid(${column}) THEN ${column} ELSE json_quote(${column}) END) leaf WHERE leaf.type='text'
    UNION ALL SELECT text,pos+instr(substr(text,pos+1),subject.value) FROM hits WHERE pos>0 AND instr(substr(text,pos+1),subject.value)>0
  ) SELECT 1 FROM hits WHERE pos>0
    AND substr(text,pos-1,1) NOT GLOB '[A-Za-z0-9_@.+-]'
    AND substr(text,pos+length(subject.value),1) NOT GLOB '[A-Za-z0-9_@.+-]')`;
}).join(' OR ')})`;
const calls = mentions('agent_door_calls', ['key', 'outcome']);
const approvals = mentions('agent_door_approvals', ['saved', 'approvals', 'result']);
const reviews = mentions('agent_door_reviews', ['saved', 'marked_by']);
const audits = mentions('agent_door_audit', ['row', 'evidence']);
const agents = "SELECT id FROM agent_door_agents WHERE sponsor IN (SELECT value FROM json_each(?1))";
const decisions = `SELECT decision_id FROM agent_door_calls WHERE ${calls} OR agent IN (${agents})
  UNION SELECT json_extract(saved,'$.decision_id') FROM agent_door_approvals WHERE ${approvals}
  UNION SELECT json_extract(saved,'$.decision_id') FROM agent_door_reviews WHERE ${reviews}
  UNION SELECT id FROM agent_door_audit WHERE ${audits} OR agent IN (${agents})`;
const match = (sql: string) => ({ sql, params: ['values'] });

/** Complete installed inventory for Lamp's operator and subscriber subjects.
 * State is deliberately accounted for: operator person: policy references are
 * personal authority. They cannot truthfully be labelled unrelated or have
 * their signed envelope edited by the seed. Base must support their retirement.
 */
export const lampAgentArtifacts: AgentArtifactMap = { artifacts: [
  { table: 'agent_door_state', columns: ['id','envelope','local_document','local_revision','local_paused','decision_lock','decision_until'], match: match(mentions('agent_door_state', ['envelope','local_document'])) },
  { table: 'agent_door_agents', columns: ['id','name','specialist','sponsor','sponsor_name','revoked','window','requests','tombstone'], match: match(`sponsor IN (SELECT value FROM json_each(?1)) OR ${mentions('agent_door_agents', ['name','specialist'])}`) },
  { table: 'agent_door_calls', columns: ['agent','key','digest','decision_id','created_at','state','outcome','expires_at'], match: match(`decision_id IN (${decisions})`) },
  { table: 'agent_door_audit', columns: ['sequence','id','at','agent','classes','row','evidence'], match: match(`id IN (${decisions}) OR json_extract(row,'$.decision_id') IN (${decisions}) OR json_extract(row,'$.replay_of') IN (${decisions})`) },
  { table: 'agent_door_approvals', columns: ['id','state','saved','approvals','result','version'], match: match(`json_extract(saved,'$.decision_id') IN (${decisions}) OR ${approvals}`) },
  { table: 'agent_door_reviews', columns: ['id','state','saved','marked_by','marked_at'], match: match(`json_extract(saved,'$.decision_id') IN (${decisions}) OR ${reviews}`) },
  { table: 'agent_door_events', columns: ['sequence','id','uri','event'], match: match(`${mentions('agent_door_events', ['uri','event'])} OR json_extract(event,'$.decision_id') IN (${decisions})`) },
  { table: 'agent_door_usage', columns: ['decision_id','at','seed','specialist','agent','classes'], match: match(`decision_id IN (${decisions})`) },
  { table: 'agent_door_replay_aliases', columns: ['agent','alias','call_id','tombstone'], unrelated: 'Installation-private HMAC replay associations contain no native subject or payload; never exported or imported.' },
  { table: 'agent_door_relay', columns: ['sequence','decision_id','business'], unrelated: 'Value-free decision ids and installation Business id only. Erasure-aware projections are external Business custody; signed pull, stop and unreachable rules govern their removal.' },
] };
