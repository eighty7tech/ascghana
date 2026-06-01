// src/lib/auth.ts
import crypto from 'crypto';

/**
 * Hash password using PBKDF2
 * In production, consider using bcrypt or argon2
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString('hex');
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha256';
    
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      const hash = `${derivedKey.toString('hex')}.${salt}.${iterations}`;
      resolve(hash);
    });
  });
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [derivedKeyHex, salt, iterations] = hash.split('.');
    const keylen = 64;
    const digest = 'sha256';
    
    crypto.pbkdf2(password, salt, parseInt(iterations), keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === derivedKeyHex);
    });
  });
}

/**
 * Generate secure random token (for email/SMS verification)
 */
export function generateVerificationToken(): { plain: string; hash: string } {
  const plain = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

/**
 * Generate JWT-like session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate two-factor secret (for authenticator apps)
 */
export function generateTwoFactorSecret(): string {
  return crypto.randomBytes(32).toString('base64');
}
