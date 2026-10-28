import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE } from "@/lib/site/config";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Faq } from "@/components/site/faq";
import { SectionTag } from "@/components/site/section-tag";
import { SubHeader } from "@/components/site/sub-header";

export const metadata: Metadata = {
  title: "Contact",
  description: "Call, message or send an enquiry. Within one working day we’ll reply with the documents you need and a fixed quote.",
};

export default function ContactPage() {
  return (
    <>
      <SubHeader
        crumb="Contact"
        title={
          <>
            Let’s Talk About <span className="s-accent">Your Business.</span>
          </>
        }
        intro="Call, message or send an enquiry. Within one working day we’ll reply with the documents you need and a fixed quote."
      />

      <section id="contact" className="s-grey" aria-labelledby="contact-title">
        <div className="s-container s-section s-split s-split--top s-contact">
          <div className="s-stack">
            <SectionTag tone="grey">Contact</SectionTag>
            <h2 id="contact-title" className="s-h2">
              Tell Us What You Need Filed
            </h2>
            <p className="s-body">We reply within one working day with the documents required and a fixed quote.</p>
            <div className="s-methods">
              <a href={SITE.phoneHref} className="s-method">
                <span className="s-method__label">Call</span>
                <span className="s-method__value">{SITE.phoneDisplay}</span>
              </a>
              <a href={SITE.whatsappHref} className="s-method" target="_blank" rel="noopener noreferrer">
                <span className="s-method__label">WhatsApp</span>
                <span className="s-method__value">Message us ↗</span>
              </a>
              <a href={`mailto:${SITE.email}`} className="s-method">
                <span className="s-method__label">Email</span>
                <span className="s-method__value">{SITE.email}</span>
              </a>
              <div className="s-method">
                <span className="s-method__label">Office</span>
                <span className="s-method__value">
                  {SITE.addressLine}, {SITE.city}
                </span>
                <span className="s-method__note">{SITE.hours}</span>
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="s-form" aria-busy><h3 className="s-form__title">Send an enquiry</h3></div>}>
            <EnquiryForm />
          </Suspense>
        </div>
      </section>

      <Faq />
    </>
  );
}
