import { useEffect } from "react";

import { installTooltips } from "./tooltip/tooltip";

/**
 * The one tooltip layer of this document: icon-only controls carry tooltip("Name") and need no wrapper. The layer's
 * element lives in its own host after <body>, outside the tree React renders and hydrates: an element React did not
 * render inside the <body> it owns reads as never hydrated (Base's hydration check in rer verify).
 */
export function TooltipLayer() {
  useEffect(() => {
    const host = document.createElement("div");
    host.className = "tooltip-host";
    document.documentElement.appendChild(host);
    const removeTooltips = installTooltips(document, host);
    return () => { removeTooltips(); host.remove(); };
  }, []);
  return null;
}
