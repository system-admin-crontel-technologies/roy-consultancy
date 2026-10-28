"use client";

import { Activity, Briefcase, Inbox, LayoutDashboard, Plug, Settings, ShieldCheck, UserCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles & permissions", icon: ShieldCheck },
  { href: "/admin/catalogue", label: "Service catalogue", icon: Briefcase },
  { href: "/admin/enquiries", label: "Website enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/audit", label: "Audit log", icon: Activity },
  { href: "/admin/account", label: "My account", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link href="/admin" className="text-sm font-semibold tracking-tight">
          Roy Consultancy
        </Link>
        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="border-t border-border px-5 py-3 text-[11px] text-muted">Super Admin build · phase 1</p>
    </aside>
  );
}
