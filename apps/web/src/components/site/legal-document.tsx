import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { GRIEVANCE_CONTACT, LEGAL_LAST_UPDATED, type LegalSection } from "@/lib/site/legal";

/** Long-form legal page body: numbered sections followed by the contact details. */
export function LegalDocument({ sections, contactHeading, contactIntro }: { sections: LegalSection[]; contactHeading: string; contactIntro: string }) {
  return (
    <section className="s-container s-section">
      <article className="s-legal">
        <p className="s-legal__updated">Last updated: {LEGAL_LAST_UPDATED}</p>
        <ol className="s-legal__sections">
          {sections.map((s) => (
            <li key={s.heading} className="s-legal__section">
              <h2 className="s-legal__heading">{s.heading}</h2>
              {s.items ? (
                <ul className="s-legal__list">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
              {s.body?.map((p) => (
                <p key={p} className="s-body">
                  {p}
                </p>
              ))}
            </li>
          ))}
          <li className="s-legal__section">
            <h2 className="s-legal__heading">{contactHeading}</h2>
            <p className="s-body">{contactIntro}</p>
            <address className="s-legal__contact">
              <strong>{GRIEVANCE_CONTACT}</strong>
              <span>{SITE.name}</span>
              <span>{SITE.offices[0].address}</span>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
            </address>
            <p className="s-body">
              You can also reach us through the <Link href="/contact">contact page</Link>.
            </p>
          </li>
        </ol>
      </article>
    </section>
  );
}
