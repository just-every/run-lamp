import { escapeHtml } from "./format";

export function publicNavigation(current?: "status" | "history" | "subscribe", subscribeOffered = true) {
  return `<nav class="status-utilities" aria-label="Status page"><a href="/"${current === "status" ? ' aria-current="page"' : ""}>Status</a><a href="/history"${current === "history" ? ' aria-current="page"' : ""}>History</a>${subscribeOffered ? `<a class="subscribe-link" href="/#subscribe"${current === "subscribe" ? ' aria-current="step"' : ""}>Subscribe</a>` : ""}</nav>`;
}

/** The header band's soft wave: shapes filled from the brand colour's tokens in the stylesheet, so any business's
 *  colour shapes it and no colour is baked in. Decorative only. */
const mastheadWave = '<svg class="masthead-wave" viewBox="0 0 630 228" preserveAspectRatio="xMaxYMin slice" aria-hidden="true" focusable="false"><path class="wave-far" d="M466 0c-14 22-10 52 22 66 40 17 96 22 142 48V0Z"/><path d="M44 228C52 132 100 52 160 0h118C200 54 136 136 116 228Z"/><path class="wave-far" d="M296 228c22-64 90-104 192-104 54 0 104 10 142 22v62c-44-16-94-22-142-20-66 3-110 20-126 40Z"/></svg>';

export function publicMasthead(pageName: string, current?: "status" | "history" | "subscribe", tagline = "", subscribeOffered = true, hasLogo = false) {
  return `<header class="masthead">${mastheadWave}<div class="masthead-brand"><a class="brand" href="/"><img class="${hasLogo ? "brand-logo" : "brand-mark"}" src="${hasLogo ? "/assets/logo" : "/assets/mark.svg"}" alt=""><span>${escapeHtml(pageName)}</span></a>${tagline ? `<p class="tagline">${escapeHtml(tagline)}</p>` : ""}</div>${publicNavigation(current, subscribeOffered)}</header>`;
}
