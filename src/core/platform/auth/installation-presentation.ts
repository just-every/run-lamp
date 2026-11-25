import { parse, parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";

const ssoNotice = `<p class="notice" role="status">Your organization requires single sign-on (SSO). Use your sign-in provider.</p>
<p>For emergency access, the deployment owner can run <code>rer signin</code> from the checkout that deployed this environment.</p>`;
// MAIL_RECIPIENTS=owner: the email form says who it reaches. No address is checked or revealed by the page.
const ownerOnlyNote = `<section aria-labelledby="owner-only-signin"><h2 id="owner-only-signin">Email links go to the owner only</h2><p>This installation emails a sign-in link to its owner's address and to no one else. Other operators need a configured sign-in provider.</p></section>`;
const terminalHelp = `<p>On this computer, paste the private <code>RER_OPEN</code> link from your terminal into this tab. For a fresh link, run <code>~/.local/bin/rer dev --as owner</code> from your Lamp folder.</p>`;

type Element = DefaultTreeAdapterMap["element"];
type Parent = DefaultTreeAdapterMap["document"] | DefaultTreeAdapterMap["documentFragment"] | Element;
const hasClass = (element: Element, name: string) => element.attrs.some(attribute => attribute.name === "class" && attribute.value.split(/\s+/).includes(name));
const setText = (element: Element, value: string) => { element.childNodes = [{ nodeName: "#text", value, parentNode: element }]; };

/** Preserve the native sign-in controls and headers in both Worker and Node handlers. */
export async function installationSignIn(response: Response, name: string, local = false, terminalEntry = false, required = false, ownerOnly = false): Promise<Response> {
  if (!response.headers.get("content-type")?.includes("text/html")) return response;
  const label = name.trim() || "Lamp";
  const document = parse(await response.text());
  function rewrite(parent: Parent) {
    if (required && "tagName" in parent && parent.tagName === "main") {
      // Replace the generic provider-required and mail-unavailable messages.
      // Preserve provider errors and any first-owner setup guidance.
      parent.childNodes = parent.childNodes.filter(child => !("tagName" in child && hasClass(child, "notice")
        && child.childNodes.some(node => "value" in node && /requires its own sign-in provider|Sign-in email is not available/.test(node.value))));
      const notice = parseFragment(ssoNotice);
      for (const child of notice.childNodes) child.parentNode = parent;
      const heading = parent.childNodes.findIndex(child => "tagName" in child && child.tagName === "h1");
      parent.childNodes.splice(heading + 1, 0, ...notice.childNodes);
    }
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
      if (element.tagName === "main" && ownerOnly && !required) {
        const note = parseFragment(ownerOnlyNote).childNodes;
        for (const child of note) child.parentNode = element;
        element.childNodes.push(...note);
      }
      if (element.tagName === "main" && local) {
        const help = parseFragment(terminalHelp).childNodes;
        for (const child of help) child.parentNode = element;
        if (terminalEntry) {
          element.childNodes = element.childNodes.flatMap(child => {
            if (!("tagName" in child) || child.tagName !== "p") return [child];
            const text = child.childNodes.find(node => "value" in node)?.value ?? "";
            if (text.startsWith("It opens only from that computer.")) return help;
            return text.includes("command not found") ? [] : [child];
          });
        } else {
          element.childNodes.push(...help);
        }
      }
    }
  }
  rewrite(document);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(serialize(document), { status: response.status, statusText: response.statusText, headers });
}
