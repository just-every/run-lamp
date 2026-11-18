const terminalRecovery = `<p>If you see 'command not found', run <code>~/.local/bin/rer cli path</code> and paste the line it prints.</p>`;
export const terminalHelp = `<p>From your project folder, run <code>~/.local/bin/rer dev --as owner</code>.</p>${terminalRecovery}`;

export function installationSignIn(response: Response, name: string, local = false, hasTerminalHelp = false) {
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const label = name.trim() || "Lamp";
  return new HTMLRewriter().on("[data-rer-name], .brand > span", { element(element) { element.setInnerContent(label); } })
    .on("title", { element(element) { element.setInnerContent(label === "Lamp" ? "Lamp" : `${label} · Lamp`); } })
    .on("h1", { element(element) { element.setInnerContent(`Sign in to ${label}`); } })
    .on("code", { text(chunk) { if (/^rer\b/.test(chunk.text)) chunk.replace(`~/.local/bin/${chunk.text}`); } })
    .on("main", { element(element) { if (local) element.append(hasTerminalHelp ? terminalRecovery : terminalHelp, { html: true }); } }).transform(response);
}
