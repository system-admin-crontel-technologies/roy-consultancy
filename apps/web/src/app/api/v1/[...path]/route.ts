import type { NextRequest } from "next/server";
import { API_INTERNAL_URL, API_PREFIX } from "@/lib/env";

/**
 * Backend-for-frontend passthrough. The browser only ever talks to this origin;
 * cookies set by the API are re-issued on this origin via Set-Cookie passthrough.
 */
const FORWARD_REQUEST_HEADERS = ["content-type", "cookie", "authorization", "accept", "x-correlation-id"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "content-disposition", "x-correlation-id", "cache-control"];

async function passthrough(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = new URL(`${API_PREFIX}/${path.map(encodeURIComponent).join("/")}`, API_INTERNAL_URL);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  for (const h of FORWARD_REQUEST_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (ip) headers.set("x-forwarded-for", ip);
  const ua = request.headers.get("user-agent");
  if (ua) headers.set("user-agent", ua);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const out = new Headers();
  for (const h of FORWARD_RESPONSE_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  for (const sc of upstream.headers.getSetCookie()) out.append("set-cookie", sc);
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}

export { passthrough as GET, passthrough as POST, passthrough as PUT, passthrough as PATCH, passthrough as DELETE };
