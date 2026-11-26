import { escapeHtml } from "./format";

export function installedSignIn(response: Response, target: string) {
  if (!response.headers.get("Content-Type")?.includes("text/html")) return response;
  const operatorLink = `<a data-lamp-signin href="${escapeHtml(target)}">Sign in</a>`;
  let signInSeen = false;
  return new HTMLRewriter()
    .on("body", {
      element(element) {
        element.onEndTag((endTag) => {
          if (signInSeen) return;
          endTag.before(`<footer>${operatorLink}</footer>`, { html: true });
          signInSeen = true;
        });
      },
    })
    .on("nav.status-utilities a", {
      element(element) {
        if (element.hasAttribute("data-lamp-signin") || element.getAttribute("href") === "/signin" || element.getAttribute("href") === target) element.remove();
      },
    })
    .on("footer", {
      element(element) {
        // Archived generations predate the footer link. Reuse a marked link
        // when present, or add the operator entry after the customer resources.
        element.onEndTag((endTag) => {
          if (signInSeen) return;
          endTag.before(` ${operatorLink}`, { html: true });
          signInSeen = true;
        });
      },
    })
    .on("footer a[data-lamp-vpat]", {
      element(element) { element.setAttribute("href", new URL("/docs/accessibility/vpat", target).href); },
    })
    .on("footer a[data-lamp-signin]", {
      element(element) {
        if (signInSeen) return void element.remove();
        element.setAttribute("href", target);
        signInSeen = true;
      },
    }).transform(response);
}
