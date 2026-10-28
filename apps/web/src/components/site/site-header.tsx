import Link from "next/link";
import { Suspense } from "react";
import { SITE } from "@/lib/site/config";
import { SiteNav, SiteNavFallback } from "./site-nav";

/** Sits on the dark band; each page's first section continues the same background. */
export function SiteHeader() {
  return (
    <div className="s-header">
      <header className="s-container s-header__bar">
        <Link href="/" className="s-brand" aria-label={`${SITE.name} home`}>
          <span className="s-brand__mark" aria-hidden>
            R
          </span>
          <span className="s-brand__text">
            <span className="s-brand__name">{SITE.name}</span>
            <span className="s-brand__sub">{SITE.tagline}</span>
          </span>
        </Link>
        <Suspense fallback={<SiteNavFallback />}>
          <SiteNav />
        </Suspense>
      </header>
    </div>
  );
}
