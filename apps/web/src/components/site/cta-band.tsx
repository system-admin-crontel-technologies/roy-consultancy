import Link from "next/link";

export function CtaBand() {
  return (
    <section className="s-dark s-cta" aria-labelledby="cta-title">
      <div className="s-container s-cta__inner">
        <h2 id="cta-title" className="s-h2 s-cta__title">
          Not Sure What You Need? <span className="s-accent">A Short Call Will Tell You.</span>
        </h2>
        <Link href="/contact" className="s-btn s-btn--lg">
          Book a consultation
        </Link>
      </div>
    </section>
  );
}
