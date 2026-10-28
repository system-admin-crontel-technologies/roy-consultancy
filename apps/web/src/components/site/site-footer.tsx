import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { NAV_LINKS } from "@/lib/site/content";

export function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-container s-footer__grid">
        <div className="s-footer__col">
          <span className="s-footer__brand">{SITE.name}</span>
          <span className="s-footer__tag">{SITE.description}</span>
        </div>
        <div className="s-footer__col">
          <span className="s-footer__label">Pages</span>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="s-footer__col">
          <span className="s-footer__label">Contact</span>
          <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <span className="s-footer__plain">
            {SITE.addressLine}, {SITE.city}
          </span>
        </div>
      </div>
      <div className="s-container s-footer__bottom">
        <span className="s-footer__copy">
          © {SITE.copyrightYear} {SITE.name}
        </span>
        <span className="s-footer__disclaimer">{SITE.disclaimer}</span>
      </div>
    </footer>
  );
}
