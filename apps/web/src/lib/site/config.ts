/**
 * Contact details and feature toggles for the public site.
 * Values come from NEXT_PUBLIC_* variables (inlined at build time) and fall back to the
 * bracketed placeholders from the design handoff until the client confirms them.
 */
const env = (key: string, fallback: string) => {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : fallback;
};

const whatsappDigits = env('NEXT_PUBLIC_WHATSAPP_NUMBER', '919051637505').replace(/\D/g, '');
const phoneDigits = env('NEXT_PUBLIC_CONTACT_PHONE', '+919051637505').replace(/[^\d+]/g, '');

function displayPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return raw;
}

type OfficePhone = { display: string; href?: string };

export const SITE = {
  name: 'Roy Consultancy',
  tagline: 'advocate · corporate & tax',
  description: 'Advocate-led corporate, tax and IP compliance.',
  url: env('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
  phoneHref: `tel:${phoneDigits.startsWith('+') ? phoneDigits : `+${phoneDigits}`}`,
  phoneDisplay: displayPhone(phoneDigits),
  whatsappHref: `https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Hello Roy Consultancy, I would like to enquire about your services.')}`,
  whatsappDisplay: displayPhone(whatsappDigits),
  email: env('NEXT_PUBLIC_CONTACT_EMAIL', 'hello@royconsultancy.in'),
  offices: [
    {
      name: 'Shyamnagar office',
      city: 'Shyamnagar',
      address: '38/8, Basudebpur Road, Adrija Complex, PO Shyamnagar, North 24 Parganas 743127',
      phones: [{ display: '+91 90516 37505', href: 'tel:+919051637505' }],
    },
    {
      name: 'Kolkata office',
      city: 'Kolkata',
      address: 'Room No. 2, Ground Floor, 1/1A, Vanisittat Road, Kolkata, West Bengal 700001',
      phones: [
        { display: '+91 76058 62462', href: 'tel:+917605862462' },
        { display: '+91 90739 71275', href: 'tel:+919073971275' },
      ],
    },
  ] as { name: string; city: string; address: string; phones: OfficePhone[] }[],
  hours: env('NEXT_PUBLIC_OFFICE_HOURS', 'Mon–Sat, 10–7'),
  advocateName: env('NEXT_PUBLIC_ADVOCATE_NAME', 'Adv. Ranjan Roy'),
  barCouncil: env('NEXT_PUBLIC_BAR_COUNCIL', 'Bar Council of West Bengal'),
  showWhatsApp: env('NEXT_PUBLIC_SHOW_WHATSAPP', 'true') !== 'false',
  showCalendar: env('NEXT_PUBLIC_SHOW_CALENDAR', 'true') !== 'false',
  showTestimonials: env('NEXT_PUBLIC_SHOW_TESTIMONIALS', 'true') !== 'false',
  /** Photo paths (e.g. "/images/hero.jpg" in apps/web/public). Empty shows the design's labelled placeholder. */
  photos: {
    hero: process.env.NEXT_PUBLIC_HERO_PHOTO?.trim() || '/images/hero-ranjan-roy.jpg',
    consultation: process.env.NEXT_PUBLIC_CONSULTATION_PHOTO?.trim() || '/images/consultation.jpg',
    profile: process.env.NEXT_PUBLIC_PROFILE_PHOTO?.trim() || '/images/advocate-ranjan-roy.jpg',
  },
  copyrightYear: '2026',
  disclaimer: 'As per Bar Council of India rules, this website is for information only and does not constitute advertising or solicitation.',
} as const;
