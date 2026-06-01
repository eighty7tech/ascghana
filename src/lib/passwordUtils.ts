import crypto from "crypto";

/**
 * Hash password using PBKDF2 (built-in Node.js crypto)
 * Safe for production use without additional dependencies
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(":");
  if (!salt || !originalHash) return false;

  const computedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return computedHash === originalHash;
}

/**
 * Generate a random password for initial setup
 */
export function generatePassword(length: number = 12): string {
  return crypto.randomBytes(length).toString("base64").substring(0, length);
}
