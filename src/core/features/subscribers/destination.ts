export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

/** Expand a URL-canonical IPv6 literal (lower-case, compressed, no zone) into eight 16-bit words. */
function ipv6Words(literal: string): number[] | null {
  if (!/^[0-9a-f:]+$/.test(literal) || !literal.includes(":")) return null;
  const halves = literal.split("::");
  if (halves.length > 2) return null;
  const groups = (part: string) => part === "" ? [] : part.split(":").map((group) => parseInt(group, 16));
  const head = groups(halves[0]!), tail = halves.length === 2 ? groups(halves[1]!) : [];
  const fill = 8 - head.length - tail.length;
  const words = halves.length === 2 ? [...head, ...Array<number>(Math.max(fill, 0)).fill(0), ...tail] : head;
  return words.length === 8 && words.every((word) => word >= 0 && word <= 0xffff) ? words : null;
}

function isInternalIpv4(a: number, b: number, c: number) {
  return a === 0 || a === 10 || a === 127 || a >= 224 // this-network, private, loopback, multicast/reserved
    || (a === 100 && b >= 64 && b <= 127) // CGNAT 100.64.0.0/10
    || (a === 169 && b === 254) // link-local and cloud metadata
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 168 || (b === 0 && c === 0))) // private, 192.0.0.0/24
    || (a === 198 && (b === 18 || b === 19)); // benchmarking 198.18.0.0/15
}

/** True when the IPv6 literal is not a plausible public webhook endpoint. */
function isInternalIpv6(words: number[]) {
  const [w0, w1, w2, w3, w4, w5, w6, w7] = words as [number, number, number, number, number, number, number, number];
  if (words.slice(0, 5).every((word) => word === 0) && w5 === 0xffff) return isInternalIpv4(w6 >> 8, w6 & 255, w7 >> 8); // IPv4-mapped
  if (words.slice(0, 6).every((word) => word === 0)) return true; // ::, ::1 and IPv4-compatible ::a.b.c.d
  if (w0 === 0x64 && w1 === 0xff9b && (w2 === 1 || words.slice(2, 6).every((word) => word === 0))) return true; // NAT64 64:ff9b::/96 and 64:ff9b:1::/48
  if (w0 === 0x2002) return true; // 6to4 2002::/16
  if (w0 === 0x2001 && (w1 === 0 || w1 === 0xdb8)) return true; // Teredo 2001::/32, documentation 2001:db8::/32
  return (w0 & 0xfe00) === 0xfc00 || (w0 & 0xffc0) === 0xfe80 || (w0 & 0xffc0) === 0xfec0 || (w0 & 0xff00) === 0xff00; // ULA, link-local, site-local, multicast
}

export function hasSafeWebhookDestination(value: string) {
  try {
    const url = new URL(value);
    // A single trailing dot names the same host ("localhost." resolves like "localhost").
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password || url.port || hostname === "localhost" || hostname.endsWith(".localhost")) return false;
    const words = ipv6Words(hostname);
    if (words) return !isInternalIpv6(words);
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/.exec(hostname);
    return !(v4 && isInternalIpv4(Number(v4[1]), Number(v4[2]), Number(v4[3])));
  } catch { return false; }
}
