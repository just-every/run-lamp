import { z } from "zod";

const nameLimit = 120;
const componentNames = z.array(z.string().trim()).max(200).superRefine((names, context) => {
  const firstOccurrence = new Map<string, number>();
  for (const [index, name] of names.entries()) {
    const key = name.toLowerCase();
    const first = firstOccurrence.get(key);
    let message: string | undefined;
    if (!name) message = "is empty. Enter a name or remove the blank line.";
    else if (name.length > nameLimit) message = `is ${name.length} characters. The limit is ${nameLimit}.`;
    else if (first !== undefined) message = `duplicates component ${first + 1}.`;
    else firstOccurrence.set(key, index);
    if (message) context.addIssue({ code: "custom", path: [index], message });
  }
});

export const firstRunSchema = z.object({
  components: componentNames.default([]),
  groups: z.array(z.object({ name: z.string().trim().min(1).max(nameLimit), components: componentNames }).strict()).max(25).default([]),
}).strict();

export function firstRunError(error: z.ZodError) {
  const issue = error.issues[0];
  const [field, row, groupField, groupRow] = issue.path;
  const detail = issue.code === "custom" ? issue.message : "must be a component name.";
  if (field === "components" && typeof row === "number") return `Component ${row + 1} ${detail}`;
  if (field === "groups" && typeof row === "number" && groupField === "components" && typeof groupRow === "number") {
    return `Group ${row + 1}, component ${groupRow + 1} ${detail}`;
  }
  return "Invalid setup action.";
}
