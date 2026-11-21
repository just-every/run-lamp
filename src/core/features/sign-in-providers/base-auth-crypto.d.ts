declare module '@runeditrun/rer/internal/modules/operator-auth/crypto.mjs' {
  export function hashToken(secret: string, purpose: string, token: string): Promise<string>;
}
