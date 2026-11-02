export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export function hasSafeWebhookDestination(value: string) {
  try {
    const url = new URL(value);
    let hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (url.protocol !== "https:" || url.username || url.password || url.port || hostname === "localhost" || hostname.endsWith(".localhost")) return false;
    if (hostname === "::" || hostname === "::1" || /^(?:f[cd][0-9a-f]{2}|fe[89ab][0-9a-f]):/.test(hostname)) return false;
    // URL canonicalizes IPv4-mapped IPv6 (including dotted input) to two hex words.
    // Reuse the IPv4 policy for the embedded address rather than a second range list.
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(hostname);
    if (mapped) {
      const high = parseInt(mapped[1]!, 16), low = parseInt(mapped[2]!, 16);
      hostname = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    }
    if (/^(?:127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(hostname)) return false;
    return true;
  } catch { return false; }
}
