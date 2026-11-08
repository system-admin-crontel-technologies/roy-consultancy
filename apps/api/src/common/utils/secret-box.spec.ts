import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SecretBox } from './secret-box.js';

describe('SecretBox', () => {
  const box = new SecretBox(randomBytes(32).toString('base64'));

  it('round-trips text and never stores it in the clear', () => {
    const stored = box.encrypt('Gst@Pass#2026 ₹');
    expect(stored).not.toContain('Gst@Pass');
    expect(stored.startsWith('v1:')).toBe(true);
    expect(box.decrypt(stored)).toBe('Gst@Pass#2026 ₹');
  });

  it('uses a fresh IV for each value', () => {
    expect(box.encrypt('same')).not.toBe(box.encrypt('same'));
  });

  it('rejects tampered ciphertext and a different key', () => {
    const stored = box.encrypt('secret');
    const parts = stored.split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => box.decrypt(parts.join(':'))).toThrow();
    expect(() => new SecretBox(randomBytes(32).toString('base64')).decrypt(stored)).toThrow();
  });

  it('refuses keys that are not 32 bytes', () => {
    expect(() => new SecretBox(randomBytes(16).toString('base64'))).toThrow(/32 bytes/);
  });
});
