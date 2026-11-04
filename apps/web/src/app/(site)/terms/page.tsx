import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal-document";
import { SubHeader } from "@/components/site/sub-header";
import { TERMS } from "@/lib/site/legal";

const intro = "The terms that apply when you use this website or contact us through it.";

export const metadata: Metadata = { title: "Terms & Conditions", description: intro };

export default function TermsPage() {
  return (
    <>
      <SubHeader crumb="Terms & Conditions" title="Terms & Conditions" intro={intro} />
      <LegalDocument sections={TERMS} contactHeading="Contact Us" contactIntro="For questions about these terms, contact:" />
    </>
  );
}
