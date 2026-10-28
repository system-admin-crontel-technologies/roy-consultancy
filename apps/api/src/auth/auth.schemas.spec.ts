import { describe, expect, it } from 'vitest';
import { loginSchema, passwordSchema } from './auth.schemas.js';

describe('auth schemas', () => {
  it('normalises email and rejects unknown fields', () => {
    expect(loginSchema.parse({ email: '  Admin@Example.COM ', password: 'x' })).toEqual({ email: 'admin@example.com', password: 'x', client: 'WEB' });
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x', extra: 1 }).success).toBe(false);
  });
  it('enforces the password policy', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('alllowercase123x').success).toBe(false);
    expect(passwordSchema.safeParse('CorrectHorse123').success).toBe(true);
  });
});
