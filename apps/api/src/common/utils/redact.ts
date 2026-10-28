const SECRET_KEY = /(password|passwd|secret|token|hash|authorization|cookie|apikey|api_key|private)/i;

/** Deep-copies a value replacing any secret-looking keys so it is safe to persist in audit/logs. */
export function redact<T>(value: T, depth = 0): T {
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1)) as T;
  if (value instanceof Date) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out as T;
}
