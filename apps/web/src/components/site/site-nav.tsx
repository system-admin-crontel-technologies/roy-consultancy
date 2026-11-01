"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { SITE } from "@/lib/site/config";
import { NAV_LINKS } from "@/lib/site/content";
import { PhoneIcon } from "./phone-icon";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** First number of each office, labelled with the office's city. */
const OFFICE_PHONES = SITE.offices.map((o) => ({ city: o.city, ...o.phones[0] }));

function NavActions() {
  return (
    <div className="s-nav__actions">
      <div className="s-nav__phones">
        {OFFICE_PHONES.map((p) => (
          <a key={p.city} href={p.href} className="s-nav__phone">
            <PhoneIcon />
            <span className="s-nav__phone-city">{p.city}</span>
            {p.display}
          </a>
        ))}
      </div>
      <Link href="/contact" className="s-btn">
        Get a quote
      </Link>
    </div>
  );
}

/** Desktop links, mobile Menu/Close toggle and the collapsible list. Rendered inside <Suspense>. */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  return (
    <>
      <nav className="s-nav" aria-label="Primary">
        <div className="s-nav__links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="s-nav__link" aria-current={isActive(pathname, l.href) ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
        <NavActions />
        <button type="button" className="s-nav__toggle" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </nav>
      <div id={menuId} className="s-menu" data-open={open ? "true" : "false"}>
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="s-menu__link" aria-current={isActive(pathname, l.href) ? "page" : undefined} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        {OFFICE_PHONES.map((p) => (
          <a key={p.city} href={p.href} className="s-menu__phone">
            <PhoneIcon />
            <span className="s-nav__phone-city">{p.city}</span>
            {p.display}
          </a>
        ))}
      </div>
    </>
  );
}

/** Static fallback used while the client nav hydrates: same markup, no active state. */
export function SiteNavFallback() {
  return (
    <nav className="s-nav" aria-label="Primary">
      <div className="s-nav__links">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="s-nav__link">
            {l.label}
          </Link>
        ))}
      </div>
      <NavActions />
      <button type="button" className="s-nav__toggle" aria-expanded={false} disabled>
        Menu
      </button>
    </nav>
  );
}
