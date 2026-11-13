import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseContract } from "../../src/base/seed-contract.mjs";

export const baselineId = /^BASE-[A-Z][A-Z0-9]*-[0-9]{3}$/;
const clauseLine = /^- \*\*(BASE-[A-Z][A-Z0-9]*-[0-9]{3}) — ([^.]+)\./gm;

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

export async function readBaselineCatalog(baselinePath = "BASELINE.md", contractPath = "CONTRACT.md") {
  const [baseline, contract] = await Promise.all([readFile(baselinePath, "utf8"), readFile(contractPath, "utf8")]);
  const clauses = new Map();
  let match;
  while ((match = clauseLine.exec(baseline)) !== null) {
    const [id, title] = match.slice(1);
    if (clauses.has(id)) throw new Error(`BASELINE.md defines ${id} more than once.`);
    const rest = baseline.slice(match.index + match[0].length).split(/\n(?=- \*\*BASE-|#{1,6} )/, 1)[0];
    // Base's canonical clause link names the module that proves it (`../modules/agent-door/CLAUSES.md` from Base's export/).
    // An edition that does not carry that module has no executed journey for the clause yet, so it stays planned.
    const module = /\[Canonical clause\]\((?:\.\.\/)+(modules\/[^/)]+)\//.exec(rest)?.[1];
    const moduleAbsent = module !== undefined && !existsSync(join(dirname(baselinePath), module));
    clauses.set(id, { id, title, line: lineOf(baseline, match.index), planned: moduleAbsent || /Base conformance journey:\s*planned\b/i.test(rest), supersededBy: [] });
  }
  if (!clauses.size) throw new Error("BASELINE.md does not contain any BASE clauses.");

  const contractLines = contract.split(/\r?\n/);
  const contractClauses = parseContract(contract).clauses.sort((a, b) => a.line - b.line);
  for (let index = 0; index < contractClauses.length; index += 1) {
    const source = contractClauses[index];
    if (source.kind !== "published") continue;
    const body = contractLines.slice(source.line - 1, contractClauses[index + 1]?.line - 1 || contractLines.length);
    for (const [offset, line] of body.entries()) {
      const plain = line.replace(/\*\*|`/g, "");
      for (const supersedes of plain.matchAll(/\bSupersedes\s+(BASE-[A-Z][A-Z0-9]*-[0-9]{3})\b([^.]*)\./gi)) {
        const id = supersedes[1].toUpperCase();
        const clause = clauses.get(id);
        if (!clause) throw new Error(`${source.id} names unknown baseline clause ${id}.`);
        const suffix = supersedes[2].trim();
        clause.supersededBy.push({ contractId: source.id, scope: suffix ? suffix.replace(/^for\s+/i, "") : "entire clause", line: source.line + offset });
      }
    }
  }

  return clauses;
}
