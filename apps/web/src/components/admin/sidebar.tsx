"use client";

import { Activity, Briefcase, Inbox, KeyRound, LayoutDashboard, Menu, Plug, Settings, ShieldCheck, UserCircle, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/roles", label: "Roles & permissions", icon: ShieldCheck },
  { href: "/admin/catalogue", label: "Service catalogue", icon: Briefcase },
  { href: "/admin/enquiries", label: "Website enquiries", icon: Inbox },
  { href: "/admin/gst-credentials", label: "GST credentials", icon: KeyRound },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/audit", label: "Audit log", icon: Activity },
  { href: "/admin/account", label: "My account", icon: UserCircle },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin navigation">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors md:py-2",
              active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold tracking-tight">
        Roy Consultancy
      </Link>
      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">Admin</span>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Brand />
      </div>
      <NavLinks />
      <p className="border-t border-border px-5 py-3 text-[11px] text-muted">Super Admin build · phase 1</p>
    </aside>
  );
}

/** Phone/tablet navigation: a menu button that opens the same links in a slide-in drawer. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen(true)} className="-ml-2 rounded-md p-2 text-slate-700 hover:bg-slate-100" aria-label="Open menu" aria-expanded={open}>
        <Menu className="size-5" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center border-b border-border px-5">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-md p-1.5 text-muted hover:bg-slate-100" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
