import type { Metadata } from "next";
import { Lora, Nunito_Sans } from "next/font/google";
import "@/styles/site.css";
import { SITE } from "@/lib/site/config";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";

const lora = Lora({ variable: "--font-lora", subsets: ["latin"], display: "swap" });
const nunitoSans = Nunito_Sans({ variable: "--font-nunito-sans", subsets: ["latin"], axes: ["opsz"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Advocate-led corporate, tax & IP compliance`, template: `%s — ${SITE.name}` },
  description: "Roy Consultancy is an advocate-led practice for ROC filings, GST, trademarks and company registration. One point of contact and a fixed fee.",
  openGraph: { type: "website", siteName: SITE.name, locale: "en_IN" },
  robots: { index: true, follow: true },
};

/** Root layout for the public website. Independent of /admin, which has its own root layout. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${lora.variable} ${nunitoSans.variable}`}>
      <body>
        <div className="s-page">
          <SiteHeader />
          <main className="s-main">{children}</main>
          <SiteFooter />
        </div>
        <WhatsAppButton />
      </body>
    </html>
  );
}
