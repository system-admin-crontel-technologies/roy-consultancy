import Link from "next/link";
import type { ReactNode } from "react";

/** Inner-page hero on the dark band, continuing the header background. */
export function SubHeader({ crumb, title, intro }: { crumb?: string; title: ReactNode; intro: string }) {
  return (
    <section className="s-dark s-subhead">
      <div className="s-container s-subhead__inner">
        {crumb ? (
          <span className="s-crumb">
            <Link href="/">Home</Link> / {crumb}
          </span>
        ) : null}
        <h1 className="s-h1">{title}</h1>
        <p className="s-lead">{intro}</p>
      </div>
    </section>
  );
}
