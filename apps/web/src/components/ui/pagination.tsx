import Link from "next/link";
import { cn } from "@/lib/cn";

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="px-5 py-3 text-xs text-muted">{total} record{total === 1 ? "" : "s"}</p>;
  const link = "rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-slate-50";
  return (
    <nav className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted" aria-label="Pagination">
      <span>
        Page {page} of {pages} · {total} records
      </span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={hrefFor(page - 1)} className={link}>Previous</Link> : <span className={cn(link, "opacity-40")}>Previous</span>}
        {page < pages ? <Link href={hrefFor(page + 1)} className={link}>Next</Link> : <span className={cn(link, "opacity-40")}>Next</span>}
      </div>
    </nav>
  );
}
