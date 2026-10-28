import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site/config";
import { CtaBand } from "@/components/site/cta-band";
import { Photo } from "@/components/site/photo";
import { Pillars } from "@/components/site/pillars";
import { ProcessSteps } from "@/components/site/process-steps";
import { SectionTag } from "@/components/site/section-tag";
import { SubHeader } from "@/components/site/sub-header";

export const metadata: Metadata = {
  title: "About",
  description: "Roy Consultancy brings legal training to everyday compliance, so your filings stand up if they are ever questioned.",
};

export default function AboutPage() {
  return (
    <>
      <SubHeader title="An Advocate, Not A Filing Agent." intro="Roy Consultancy brings legal training to everyday compliance, so your filings stand up if they are ever questioned." />

      <section id="about" className="s-container s-section s-split" aria-label="About the advocate">
        <div className="s-framed">
          <span className="s-dots" aria-hidden />
          <div className="s-framed__photo s-framed__photo--tall">
            <Photo src={SITE.photos.profile} alt={`${SITE.advocateName} at the ${SITE.name} office`} label="Office / chamber photo" />
          </div>
        </div>
        <div className="s-stack">
          <SectionTag>About the advocate</SectionTag>
          <blockquote className="s-quote">“A filing is a legal document. It deserves the same care as a court pleading — because one day it may become one.”</blockquote>
          <p className="s-body">
            {SITE.name} is led by {SITE.advocateName}, an enrolled advocate advising startups, family businesses and growing companies on corporate law, indirect tax and intellectual property. Because the practice is run by an advocate, clients get more than form-filling — notices are answered, objections are argued, and agreements are drafted to hold up.
          </p>
          <dl className="s-facts">
            <div className="s-fact">
              <dt className="s-fact__label">Enrolled with</dt>
              <dd className="s-fact__value">{SITE.barCouncil}</dd>
            </div>
            <div className="s-fact">
              <dt className="s-fact__label">Office</dt>
              <dd className="s-fact__value">{SITE.city}, India</dd>
            </div>
          </dl>
          <Link href="/contact" className="s-btn s-btn--start">
            Book a consultation
          </Link>
        </div>
      </section>

      <Pillars />
      <ProcessSteps />
      <CtaBand />
    </>
  );
}
