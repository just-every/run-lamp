/** Presentation only: the recorded codes remain the filter and export keys. */
const actionLabels: Record<string, string> = {
  published: "Published an incident update",
  "notice-published": "Published a maintenance notice",
  invited: "Invited an operator",
  "access-revoked": "Revoked operator access",
  "access-denied": "Denied access",
  "role-changed": "Changed an operator role",
  "state-changed": "Changed a component state",
  "components-changed": "Changed incident components",
  "impact-changed": "Changed incident impact",
  corrected: "Published a correction",
  deleted: "Removed an item",
  erased: "Erased personal data",
  created: "Created an item",
  updated: "Updated an item",
  expired: "Expired a pending subscription",
  "import-approved": "Approved an import",
};

export function auditRecordLabel(value: string): string {
  const words = value.replace(/[._-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function auditActionLabel(action: string): string {
  return actionLabels[action] ?? auditRecordLabel(action);
}
