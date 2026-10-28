import { createHash, randomBytes } from 'node:crypto';

/** Opaque, URL-safe random token (refresh tokens, invites, password resets). */
export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** Tokens are stored hashed; a leaked database does not yield usable tokens. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
