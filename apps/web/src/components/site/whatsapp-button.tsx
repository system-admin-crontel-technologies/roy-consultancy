import { SITE } from "@/lib/site/config";

export function WhatsAppButton() {
  if (!SITE.showWhatsApp) return null;
  return (
    <a href={SITE.whatsappHref} className="s-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      WhatsApp us
    </a>
  );
}
