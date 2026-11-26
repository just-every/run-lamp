/** Colour arithmetic for the business's one brand colour (its saved accent), so text on it or beside it reads at
 *  WCAG AA (4.5:1) whatever colour the business picks. */

const WHITE = "#ffffff";
const BLACK = "#000000";
/** The public page's ink (styles/foundation.css --ink). */
export const PAGE_INK = "#142b3a";
const AA = 4.5;

function channels(hex: string) {
  return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(hex: string) {
  const [red, green, blue] = channels(hex).map(value => {
    const unit = value / 255;
    return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

export function contrast(left: string, right: string) {
  const [light, dark] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (light! + 0.05) / (dark! + 0.05);
}

/** `share` of `toward` mixed into `colour`, in sRGB. */
export function mix(colour: string, toward: string, share: number) {
  const target = channels(toward);
  return `#${channels(colour).map((value, index) => Math.round(value + (target[index]! - value) * share).toString(16).padStart(2, "0")).join("")}`;
}

/** Text on the accent: white when it reads at AA, else the page ink when that does, else black (which always reads
 *  at AA where white does not). */
export function accentInk(accentColor: string) {
  if (contrast(WHITE, accentColor) >= AA) return WHITE;
  return contrast(PAGE_INK, accentColor) >= AA ? PAGE_INK : BLACK;
}

/** A shade of the accent for a quiet surface laid on it (the header wave, the current link): lighter when the
 *  accent's ink still reads on it at AA, otherwise darker, so the ink never loses contrast. */
export function accentLift(accentColor: string, share: number) {
  const ink = accentInk(accentColor);
  const lighter = mix(accentColor, WHITE, share);
  if (ink !== WHITE || contrast(WHITE, lighter) >= AA) return lighter;
  return mix(accentColor, BLACK, share);
}

/** The accent as text on white and on its own pale tint: the accent itself when it reads at AA there, otherwise
 *  the accent darkened just enough. */
export function accentText(accentColor: string, surface: string) {
  for (let step = 0; step <= 20; step += 1) {
    const candidate = mix(accentColor, BLACK, step / 20);
    if (contrast(candidate, surface) >= AA) return candidate;
  }
  return BLACK;
}

/** A single-colour logo in white or black can vanish into an accent close to it, and the page cannot see the logo's
 *  colours. Where white or black would fall under 1.5:1 on the accent, the logo takes a thin outline in the
 *  accent's ink, which reads against the accent at AA; elsewhere none. */
export function logoHalo(accentColor: string) {
  if (contrast(WHITE, accentColor) >= 1.5 && contrast(BLACK, accentColor) >= 1.5) return "none";
  const edge = `drop-shadow(0 0 .5px ${accentInk(accentColor)})`;
  return `${edge} ${edge} ${edge}`;
}
