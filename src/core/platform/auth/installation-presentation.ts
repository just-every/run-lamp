import { parse, parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";

const terminalRecovery = `<p>If you see 'command not found', run <code>~/.local/bin/rer cli path</code> and paste the line it prints.</p>`;
export const terminalHelp = `<p>From your project folder, run <code>~/.local/bin/rer dev --as owner</code>.</p>${terminalRecovery}`;

type Element = DefaultTreeAdapterMap["element"];
type Parent = DefaultTreeAdapterMap["document"] | DefaultTreeAdapterMap["documentFragment"] | Element;
const hasClass = (element: Element, name: string) => element.attrs.some(attribute => attribute.name === "class" && attribute.value.split(/\s+/).includes(name));
const setText = (element: Element, value: string) => { element.childNodes = [{ nodeName: "#text", value, parentNode: element }]; };

/** Preserve the native sign-in controls and headers in both Worker and Node handlers. */
export async function installationSignIn(response: Response, name: string, local = false, hasTerminalHelp = false): Promise<Response> {
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const label = name.trim() || "Lamp";
  const document = parse(await response.text());
  function rewrite(parent: Parent) {
    for (const element of parent.childNodes) {
      if (!("tagName" in element)) continue;
      if (element.attrs.some(attribute => attribute.name === "data-rer-name") ||
          (element.tagName === "span" && "tagName" in parent && hasClass(parent, "brand"))) setText(element, label);
      if (element.tagName === "title") setText(element, label === "Lamp" ? "Lamp" : `${label} · Lamp`);
      if (element.tagName === "h1") setText(element, `Sign in to ${label}`);
      if (element.tagName === "code") {
        for (const child of element.childNodes) if ("value" in child && /^rer\b/.test(child.value)) child.value = `~/.local/bin/${child.value}`;
      }
      rewrite(element);
      if (element.tagName === "main" && local) {
        const help = parseFragment(hasTerminalHelp ? terminalRecovery : terminalHelp);
        for (const child of help.childNodes) { child.parentNode = element; element.childNodes.push(child); }
      }
    }
  }
  rewrite(document);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(serialize(document), { status: response.status, statusText: response.statusText, headers });
}
