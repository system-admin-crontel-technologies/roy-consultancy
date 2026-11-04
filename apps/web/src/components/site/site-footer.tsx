import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { NAV_LINKS } from "@/lib/site/content";
import { LEGAL_LINKS } from "@/lib/site/legal";

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
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          {SITE.offices.map((o) => (
            <span key={o.name} className="s-footer__plain">
              <strong>{o.name}:</strong> {o.address}
              {o.phones.map((ph) => (
                <span key={ph.display}>
                  {" · "}
                  {ph.href ? <a href={ph.href}>{ph.display}</a> : ph.display}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="s-container s-footer__bottom">
        <div className="s-footer__meta">
          <span className="s-footer__copy">
            © {SITE.copyrightYear} {SITE.name}
          </span>
          <span className="s-footer__credit">
            Developed by Crontel Technology Pvt Ltd
          </span>
          <span className="s-footer__legal">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </span>
        </div>
        <span className="s-footer__disclaimer">{SITE.disclaimer}</span>
      </div>
    </footer>
  );
}
