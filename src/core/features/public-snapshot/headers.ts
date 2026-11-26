/** Isolation shared by public snapshots and native subscriber documents. */
export function applyPublicIsolationHeaders(headers: Headers, origin: string, turnstileOrigin?: string) {
  const challenge = turnstileOrigin ? ` ${turnstileOrigin}; frame-src ${turnstileOrigin}` : "";
  headers.set("Content-Security-Policy", `default-src ${origin}; script-src ${origin}${challenge}; style-src ${origin}; font-src 'self' data:; img-src ${origin}; connect-src ${origin}; form-action ${origin}; base-uri ${origin}; frame-ancestors 'none'; object-src 'none'`);
  headers.set("X-Content-Type-Options", "nosniff");
}
