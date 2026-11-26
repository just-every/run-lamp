import subscriptionSource from "./styles/subscription.css?raw";
import type { PageTheme } from "../../shared/page-theme";
import { themeStyles } from "./theme-rendering";
import statusSource from "./styles/status.css?raw";
import componentsSource from "./styles/components.css?raw";
import recordSource from "./styles/record.css?raw";
import documentsSource from "./styles/documents.css?raw";
import responsiveSource from "./styles/responsive.css?raw";
import { localPublicPageFonts } from "./local-fonts";
import { foundationStyles } from "./brand-tokens";

/** The public page's stylesheet: the business's accent substituted into Lamp's quiet public design. */
export function publicStyles(accentColor: string, theme?: PageTheme, origin?: string) {
  return `${localPublicPageFonts}${foundationStyles(accentColor)}${statusSource}${componentsSource}${recordSource}${subscriptionSource}${documentsSource}${responsiveSource}${theme ? themeStyles(theme, origin!) : ""}`;
}
