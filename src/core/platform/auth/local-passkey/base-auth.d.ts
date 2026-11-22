declare module '@runeditrun/rer/internal/modules/operator-auth/config.mjs' {
 export function configure(config: import('@runeditrun/rer/modules/operator-auth').AuthConfig): {
  origin: string; local: boolean; SESSION_SECRET: string; sessionSeconds: number; cookieName: string; secure: boolean;
 }
}

declare module '@runeditrun/rer/internal/modules/operator-auth/input.mjs' {
 export function readInput(request: Request): Promise<Record<string, unknown>>;
}

declare module '@runeditrun/rer/internal/modules/operator-auth/http.mjs' {
 export function localCookieName(name: string, origin: string): string
 export function requirePost(request: Request, config: { origin: string; local: boolean }): void
 export function sessionCookie(token: string, config: { cookieName: string; secure: boolean; sessionSeconds?: number }, seconds?: number): string
 export function escapeHtml(text: string): string
}

declare module '@runeditrun/rer/internal/modules/operator-auth/dev/persona-entry.mjs' {
 export function personaSessions(key: string, origin: string): { cookie(id: string, seconds: number): Promise<string> }
}

declare module '@runeditrun/rer/internal/modules/operator-auth/page.mjs' {
 export function pageResponse(input: {
  branding: unknown; heading: string; method: string; referrer: string; content: string;
 }): Promise<Response>
}
