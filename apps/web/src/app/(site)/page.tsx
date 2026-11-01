import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { HIGHLIGHTED_AREA, PRACTICE_AREAS, STATS, TESTIMONIALS } from "@/lib/site/content";
import { Photo } from "@/components/site/photo";
import { ProcessSteps } from "@/components/site/process-steps";
import { SectionTag } from "@/components/site/section-tag";

export const metadata: Metadata = { title: { absolute: `Home — ${SITE.name}` } };

export default function HomePage() {
  return (
    <>
      <section className="s-dark">
        <div className="s-container s-hero">
          <div className="s-hero__copy">
            <h1 className="s-h1">Your Trusted Advocate For Filings, Tax And Trademarks.</h1>
            <p className="s-lead">Roy Consultancy is an advocate-led practice for ROC filings, GST, trademarks and company registration. One point of contact, a written checklist and a fixed fee — every time.</p>
            <div className="s-actions">
              <Link href="/contact" className="s-btn s-btn--lg">
                Schedule a consultation
              </Link>
              <Link href="/contact" className="s-btn s-btn--lg s-btn--ghost">
                Contact us
              </Link>
            </div>
            <dl className="s-hero__stats">
              {[STATS.filings, STATS.onTime].map((s) => (
                <div key={s.label} className="s-stat s-stat--lg">
                  <dt className="s-stat__label">{s.label}</dt>
                  <dd className="s-stat__value">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="s-hero__art">
            <div className="s-hero__photo">
              <Photo src={SITE.photos.hero} alt={`${SITE.advocateName} at work`} label="Hero photo — advocate at work or the office" eager />
            </div>
            <span className="s-hero__mark" aria-hidden>
              §
            </span>
            <div className="s-hero__badge">
              <span className="s-hero__badge-value">{STATS.years.value}</span>
              <span className="s-hero__badge-label">{STATS.years.label}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="s-container s-section s-split" aria-labelledby="about-title">
        <div className="s-framed">
          <span className="s-dots" aria-hidden />
          <div className="s-framed__photo s-framed__photo--wide">
            <Photo src={SITE.photos.consultation} alt="A client consultation" label="Consultation photo" />
          </div>
        </div>
        <div className="s-stack">
          <SectionTag>About us</SectionTag>
          <h2 id="about-title" className="s-h2">
            An Advocate, Not A Filing Agent, Looking After Your Compliance
          </h2>
          <p className="s-body">A filing is a legal document. Roy Consultancy brings legal training to everyday compliance — incorporation, ROC returns, GST and trademarks — so your paperwork stands up if it is ever questioned.</p>
          <p className="s-body">Every engagement starts with a written checklist and a fixed quote. Notices, objections and hearings are handled in-house, not passed on.</p>
          <dl className="s-stats">
            {[STATS.years, STATS.filings].map((s) => (
              <div key={s.label} className="s-stat">
                <dt className="s-stat__label">{s.label}</dt>
                <dd className="s-stat__value">{s.value}</dd>
              </div>
            ))}
          </dl>
          <Link href="/contact" className="s-btn s-btn--start">
            Request a case evaluation
          </Link>
        </div>
      </section>

      <section className="s-grey" aria-labelledby="areas-title">
        <div className="s-container s-section s-section--center">
          <SectionTag tone="grey">Practice areas</SectionTag>
          <h2 id="areas-title" className="s-h2 s-h2--center">
            What We File, Register And Protect
          </h2>
          <div className="s-grid">
            {PRACTICE_AREAS.map((a, i) => (
              <Link key={a.title} href="/services" className="s-card s-card--link" data-accent={i === HIGHLIGHTED_AREA ? "true" : undefined}>
                <h3 className="s-card__title">{a.title}</h3>
                <p className="s-card__desc">{a.desc}</p>
                <span className="s-card__more">Read more ↗</span>
                <span className="s-corner s-corner--lg" aria-hidden>
                  {a.glyph}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/services" className="s-btn s-section__cta">
            View all services
          </Link>
        </div>
      </section>

      <ProcessSteps />

      {SITE.showTestimonials ? (
        <section className="s-container s-section s-section--center" aria-labelledby="testimonials-title">
          <SectionTag>Client feedback</SectionTag>
          <h2 id="testimonials-title" className="s-h2 s-h2--center">
            What Our Clients Say
          </h2>
          <div className="s-grid">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="s-testimonial">
                <span className="s-testimonial__mark" aria-hidden>
                  “
                </span>
                <blockquote className="s-testimonial__quote">{t.quote}</blockquote>
                <figcaption className="s-testimonial__by">
                  <span className="s-testimonial__name">{t.name}</span>
                  <span className="s-testimonial__business">{t.business}</span>
                  <span className="s-work__tag">{t.tag}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <Link href="/contact" className="s-btn s-section__cta">
            Discuss your matter
          </Link>
        </section>
      ) : null}
    </>
  );
}
