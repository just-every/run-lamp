import { useEffect } from "react";

import { installTooltips } from "./tooltip/tooltip";

/** The one tooltip layer of this document: icon-only controls carry tooltip("Name") and need no wrapper. */
export function TooltipLayer() {
  useEffect(() => installTooltips(document), []);
  return null;
}
