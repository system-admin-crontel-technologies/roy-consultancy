import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

/**
 * Reversible encryption for third-party secrets we must hand back to staff (e.g. client portal passwords).
 * AES-256-GCM with a random 12-byte IV per value. Stored format: `v1:<iv>:<tag>:<ciphertext>`, each part base64.
 */
export class SecretBox {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, 'base64');
    if (key.length !== 32) throw new Error('CREDENTIALS_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32).');
    this.key = key;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
  }

  decrypt(stored: string): string {
    const [version, iv, tag, ct] = stored.split(':');
    if (version !== VERSION || !iv || !tag || ct === undefined) throw new Error('Unrecognised encrypted value.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64')), decipher.final()]).toString('utf8');
  }
}
