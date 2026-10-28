import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_INTERNAL_URL, API_PREFIX } from "@/lib/env";
import { parseError } from "./errors";

/**
 * Server Component data access. Forwards the caller's cookies to the API.
 * On 401 the browser is sent through the refresh-redirect handler, returning to `returnTo`.
 * Must be called inside a <Suspense> boundary (cacheComponents): it reads cookies().
 */
export async function apiGet<T>(path: string, options: { returnTo?: string } = {}): Promise<T> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_INTERNAL_URL}${API_PREFIX}${path}`, {
    headers: { cookie, accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 401) {
    redirect(`/api/v1/auth/refresh-redirect?next=${encodeURIComponent(options.returnTo ?? "/admin")}`);
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

/** Like apiGet but resolves to null instead of redirecting; for optional data such as the current user. */
export async function apiGetOptional<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_INTERNAL_URL}${API_PREFIX}${path}`, { headers: { cookie, accept: "application/json" }, cache: "no-store" });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}
