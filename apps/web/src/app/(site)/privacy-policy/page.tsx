import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/legal-document";
import { SubHeader } from "@/components/site/sub-header";
import { PRIVACY_POLICY } from "@/lib/site/legal";

const intro = "What personal data we collect, how we use it, and the choices you have.";

export const metadata: Metadata = { title: "Privacy Policy", description: intro };

export default function PrivacyPolicyPage() {
  return (
    <>
      <SubHeader crumb="Privacy Policy" title="Privacy Policy" intro={intro} />
      <LegalDocument sections={PRIVACY_POLICY} contactHeading="Contact And Grievances" contactIntro="For questions, requests or complaints about your personal data, contact:" />
    </>
  );
}
