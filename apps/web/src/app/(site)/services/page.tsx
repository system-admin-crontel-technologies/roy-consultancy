import type { Metadata } from "next";
import { ComplianceCalendar } from "@/components/site/compliance-calendar";
import { CtaBand } from "@/components/site/cta-band";
import { ServiceFilter } from "@/components/site/service-filter";
import { SubHeader } from "@/components/site/sub-header";

export const metadata: Metadata = {
  title: "Services",
  description: "Corporate, tax, intellectual property and licensing work, all handled by an advocate. Each engagement starts with a written checklist and a fixed quote.",
};

export default function ServicesPage() {
  return (
    <>
      <SubHeader title="Practice Areas" intro="Corporate, tax, intellectual property and licensing work, all handled by an advocate. Each engagement starts with a written checklist and a fixed quote." />
      <ServiceFilter />
      <ComplianceCalendar />
      <CtaBand />
    </>
  );
}
