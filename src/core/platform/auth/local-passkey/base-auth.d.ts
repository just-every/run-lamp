declare module '@runeditrun/rer/internal/modules/operator-auth/config.mjs' {
 export function configure(config: import('@runeditrun/rer/modules/operator-auth').AuthConfig): {
  origin: string; local: boolean; SESSION_SECRET: string; sessionSeconds: number; cookieName: string; secure: boolean;
 }
}

declare module '@runeditrun/rer/internal/modules/operator-auth/input.mjs' {
 export function readInput(request: Pick<Request, 'headers' | 'body'>): Promise<Record<string, unknown>>;
 export function readParameters(parameters: URLSearchParams): Record<string, string>;
}

declare module '@runeditrun/rer/internal/modules/operator-auth/http.mjs' {
 export function localCookieName(name: string, origin: string): string
 export function requireOrigin(request: Request, config: { origin: string; local: boolean }): void
 export function requirePost(request: Request, config: { origin: string; local: boolean }): void
 export function sessionCookie(token: string, config: { cookieName: string; secure: boolean; sessionSeconds?: number }, seconds?: number): string
 export function escapeHtml(text: string): string
}

declare module '@runeditrun/rer/internal/modules/operator-auth/dev/persona-entry.mjs' {
 export function personaSessions(key: string, origin: string): { cookie(id: string, seconds: number): Promise<string> }
}

declare module '@runeditrun/rer/internal/modules/operator-auth/page.mjs' {
 export function pageResponse(input: {
  branding: unknown; heading: string; method: string; referrer?: string; status?: number; content: string;
 }): Promise<Response>
}

declare module '@runeditrun/rer/internal/modules/operator-auth/owner-signin-grant.mjs' {
 export const OWNER_SIGNIN_PATH: '/auth/owner-signin';
 export const OWNER_SIGNIN_SECONDS: number;
 export function ownerSigninDigest(token: string): Promise<string>;
}
