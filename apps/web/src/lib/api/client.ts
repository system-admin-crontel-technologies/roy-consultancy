"use client";

import { parseError } from "./errors";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Options {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST", headers: { "content-type": "application/json" }, body: "{}", credentials: "same-origin" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/**
 * Browser-side API client. Goes through the same-origin BFF passthrough so HttpOnly cookies
 * are attached automatically; transparently refreshes an expired access token once.
 */
export async function api<T = void>(path: string, options: Options = {}): Promise<T> {
  const doFetch = () =>
    fetch(`/api/v1${path}`, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers: { accept: "application/json", ...(options.body !== undefined ? { "content-type": "application/json" } : {}) },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      signal: options.signal,
    });

  let res = await doFetch();
  if (res.status === 401 && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh")) {
    if (await refreshSession()) {
      res = await doFetch();
    } else {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Full navigation on purpose: the session is gone, so client state must be discarded.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/admin/login?next=${next}&reason=expired`);
    }
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
