/** Only allow same-origin admin paths as post-login destinations (prevents open redirects). */
export function safeNext(value: string | null | undefined, fallback = "/admin"): string {
  if (!value) return fallback;
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
