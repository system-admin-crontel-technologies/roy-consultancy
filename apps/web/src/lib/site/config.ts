/**
 * Contact details and feature toggles for the public site.
 * Values come from NEXT_PUBLIC_* variables (inlined at build time) and fall back to the
 * bracketed placeholders from the design handoff until the client confirms them.
 */
const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
};

const whatsappDigits = env('NEXT_PUBLIC_WHATSAPP_NUMBER', '910000000000').replace(/\D/g, '');
const phoneDigits = env('NEXT_PUBLIC_CONTACT_PHONE', '+910000000000').replace(/[^\d+]/g, '');

function displayPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return raw;
}

export const SITE = {
  name: 'Roy Consultancy',
  tagline: 'advocate · corporate & tax',
  description: 'Advocate-led corporate, tax and IP compliance.',
  url: env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  phoneHref: `tel:${phoneDigits.startsWith('+') ? phoneDigits : `+${phoneDigits}`}`,
  phoneDisplay: displayPhone(phoneDigits),
  whatsappHref: `https://wa.me/${whatsappDigits}`,
  email: env('NEXT_PUBLIC_CONTACT_EMAIL', 'hello@royconsultancy.in'),
  addressLine: env('NEXT_PUBLIC_OFFICE_ADDRESS', '[Address line]'),
  city: env('NEXT_PUBLIC_OFFICE_CITY', '[City]'),
  hours: env('NEXT_PUBLIC_OFFICE_HOURS', 'Mon–Sat, 10–7'),
  advocateName: env('NEXT_PUBLIC_ADVOCATE_NAME', 'Adv. [Name] Roy'),
  barCouncil: env('NEXT_PUBLIC_BAR_COUNCIL', 'Bar Council of [State]'),
  showWhatsApp: env('NEXT_PUBLIC_SHOW_WHATSAPP', 'true') !== 'false',
  showCalendar: env('NEXT_PUBLIC_SHOW_CALENDAR', 'true') !== 'false',
  showRecentWork: env('NEXT_PUBLIC_SHOW_RECENT_WORK', 'true') !== 'false',
  /** Photo paths (e.g. "/images/hero.jpg" in apps/web/public). Empty shows the design's labelled placeholder. */
  photos: {
    hero: process.env.NEXT_PUBLIC_HERO_PHOTO?.trim() || undefined,
    consultation: process.env.NEXT_PUBLIC_CONSULTATION_PHOTO?.trim() || undefined,
    profile: process.env.NEXT_PUBLIC_PROFILE_PHOTO?.trim() || undefined,
    work1: process.env.NEXT_PUBLIC_WORK_PHOTO_1?.trim() || undefined,
    work2: process.env.NEXT_PUBLIC_WORK_PHOTO_2?.trim() || undefined,
    work3: process.env.NEXT_PUBLIC_WORK_PHOTO_3?.trim() || undefined,
  },
  copyrightYear: '2026',
  disclaimer: 'As per Bar Council of India rules, this website is for information only and does not constitute advertising or solicitation.',
} as const;
