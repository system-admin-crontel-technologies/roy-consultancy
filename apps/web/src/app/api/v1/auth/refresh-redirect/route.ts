import { NextResponse, type NextRequest } from "next/server";
import { API_INTERNAL_URL, API_PREFIX } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";

/**
 * Lives under /api/v1/auth so the browser sends the path-scoped refresh cookie.
 * Rotates the session and bounces back to `next`, or sends the user to login.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const cookie = request.headers.get("cookie") ?? "";
  let upstream: Response | null = null;
  if (cookie.includes("rc_refresh=")) {
    try {
      upstream = await fetch(`${API_INTERNAL_URL}${API_PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json", "user-agent": request.headers.get("user-agent") ?? "" },
        body: "{}",
        cache: "no-store",
      });
    } catch {
      upstream = null;
    }
  }
  const ok = upstream?.ok ?? false;
  const target = ok ? next : `/admin/login?next=${encodeURIComponent(next)}${upstream ? "" : cookie.includes("rc_refresh=") ? "&reason=api_unavailable" : ""}`;
  const res = NextResponse.redirect(new URL(target, request.nextUrl.origin), 303);
  if (upstream) for (const sc of upstream.headers.getSetCookie()) res.headers.append("set-cookie", sc);
  return res;
}
