import { describe, expect, it } from 'vitest';
import { redact } from './redact.js';

describe('redact', () => {
  it('masks secret-looking keys at any depth', () => {
    const out = redact({ email: 'a@b.c', passwordHash: 'x', nested: { apiKey: 'k', list: [{ token: 't', ok: 1 }] } });
    expect(out).toEqual({ email: 'a@b.c', passwordHash: '[REDACTED]', nested: { apiKey: '[REDACTED]', list: [{ token: '[REDACTED]', ok: 1 }] } });
  });
  it('leaves primitives and dates alone', () => {
    const d = new Date();
    expect(redact({ when: d, n: 3 })).toEqual({ when: d, n: 3 });
  });
});
