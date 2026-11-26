import foundationSource from "./styles/foundation.css?raw";
import { accentInk, accentLift, accentText, logoHalo, mix } from "../../shared/accent-ink";

/** The business's brand colour as the public page's tokens: the header band, the ink chosen on it by contrast, the
 *  quieter shades laid on it, and the brand as readable text on white. Nothing here is a fixed hue. */
export function brandTokens(accentColor: string) {
  const tint = mix(accentColor, "#ffffff", 0.86);
  return [
    `--accent:${accentColor}`,
    `--accent-ink:${accentInk(accentColor)}`,
    `--band-wave:${accentLift(accentColor, 0.2)}`,
    `--band-current:${accentLift(accentColor, 0.42)}`,
    `--accent-tint:${tint}`,
    `--accent-text:${accentText(accentColor, tint)}`,
    `--logo-halo:${logoHalo(accentColor)}`,
  ].join(";");
}

/** Lamp's public foundation stylesheet in the business's brand colour. */
export function foundationStyles(accentColor: string) {
  return foundationSource.replace("__LAMP_BRAND_TOKENS__", brandTokens(accentColor));
}
