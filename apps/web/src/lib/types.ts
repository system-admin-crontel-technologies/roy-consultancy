export type SearchParams = Record<string, string | string[] | undefined>;
export type PageWithSearch = { searchParams: Promise<SearchParams> };
export type PageWithId = { params: Promise<{ id: string }> };

export function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function num(v: string | string[] | undefined, fallback: number): number {
  const n = Number(str(v));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}
