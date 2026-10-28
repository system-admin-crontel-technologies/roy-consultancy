import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth gate for the admin app (Next.js 16 `proxy`).
 * Reads only the access cookie; real authorization happens in the API on every request.
 * A missing access cookie sends the browser through the refresh-redirect handler, which
 * either rotates the session (refresh cookie present) or lands on the login page.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password", "/admin/accept-invite"];
const ACCESS_COOKIE = "rc_access";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (request.cookies.get(ACCESS_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/api/v1/auth/refresh-redirect";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
