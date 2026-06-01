import { verifyPassword } from "./passwordUtils";

/** Check password against stored value (supports hashed and legacy plaintext). */
export function checkPassword(input: string, stored: string | undefined | null): boolean {
  const pw = String(input || "");
  const hash = String(stored || "");
  if (!hash) return false;
  if (hash.includes(":")) return verifyPassword(pw, hash);
  return pw === hash;
}
