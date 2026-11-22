import { safeReturnTo } from "@runeditrun/rer/modules/operator-auth";

export function signInReturnPath(value: string | null, origin: string) {
  const path = safeReturnTo(value, "/");
  return path === value && new URL(path, origin).origin === origin ? path : null;
}
