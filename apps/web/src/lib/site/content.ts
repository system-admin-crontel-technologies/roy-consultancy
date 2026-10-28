/**
 * Copy for the public marketing site, transcribed from the design handoff
 * (docs/design/website, v2). Keep text changes here so pages stay purely presentational.
 */

export type ServiceCategory = 'Corporate' | 'Tax' | 'IP' | 'Licences' | 'Legal';

export interface SiteService {
  num: string;
  cat: ServiceCategory;
  title: string;
  desc: string;
  items: string[];
}

const RAW_SERVICES: Omit<SiteService, 'num'>[] = [
  { cat: 'Corporate', title: 'Company & LLP incorporation', desc: 'Private limited, OPC, LLP, Section 8 — name approval to certificate of incorporation.', items: ['SPICe+ / FiLLiP filings', 'DSC & DIN', 'MOA, AOA & LLP agreement'] },
  { cat: 'Corporate', title: 'ROC annual compliance', desc: 'Annual returns and statutory filings with the MCA, kept on schedule every year.', items: ['AOC-4, MGT-7 / 7A', 'Form 11 & Form 8 for LLPs', 'DIR-3 KYC, ADT-1, INC-20A'] },
  { cat: 'Corporate', title: 'Corporate changes & secretarial', desc: 'Events between annual filings — documented, resolved and filed correctly.', items: ['Director & share changes', 'Registered office shift', 'Board minutes & registers'] },
  { cat: 'Tax', title: 'GST registration & returns', desc: 'Registration, monthly and annual returns, reconciliation of input tax credit.', items: ['GSTR-1, 3B, 9 & 9C', 'ITC reconciliation', 'LUT & refunds'] },
  { cat: 'Tax', title: 'GST notices & appeals', desc: 'Replies to show-cause notices and representation before the department.', items: ['SCN replies', 'Assessment & audit support', 'Appeals'] },
  { cat: 'Tax', title: 'Income tax & TDS', desc: 'Returns for individuals, firms and companies, with quarterly TDS compliance.', items: ['ITR filing', 'TDS returns', 'Notice responses'] },
  { cat: 'IP', title: 'Trademark registration', desc: 'Search, filing and follow-through until your brand is registered.', items: ['Availability search', 'TM-A filing', 'Examination reply & hearing'] },
  { cat: 'IP', title: 'Trademark opposition & renewal', desc: 'Protect what you’ve built — oppose copycats, defend your mark, renew on time.', items: ['Opposition & counter-statement', 'Renewal', 'Copyright registration'] },
  { cat: 'Licences', title: 'Business licences', desc: 'The registrations a new business needs before it can trade.', items: ['MSME / Udyam', 'FSSAI', 'IEC & shop licence'] },
  { cat: 'Legal', title: 'Agreements & drafting', desc: 'Contracts drafted by an advocate, not filled from a template.', items: ['Founders’ & shareholders’ agreements', 'NDAs & service contracts', 'Legal notices'] },
];

export const SERVICES: SiteService[] = RAW_SERVICES.map((s, i) => ({ ...s, num: String(i + 1).padStart(2, '0') }));

export const TABS = ['All', 'Corporate', 'Tax', 'IP', 'Licences', 'Legal'] as const;
export type Tab = (typeof TABS)[number];

/** Must match ENQUIRY_SERVICES in apps/api/src/enquiries/enquiries.schemas.ts. */
export const CHIPS = ['Incorporation', 'ROC filing', 'GST', 'Trademark', 'Income tax', 'Other'] as const;
export type Chip = (typeof CHIPS)[number];
export const DEFAULT_CHIP: Chip = 'ROC filing';

export function isChip(value: string | null | undefined): value is Chip {
  return !!value && (CHIPS as readonly string[]).includes(value);
}

/**
 * Headline figures used in the home hero and "About us" block. Placeholders from the design;
 * the client must confirm every number before launch (Bar Council rules on advertising).
 */
export const STATS = {
  filings: { value: '500+', label: 'Filings completed' },
  onTime: { value: '98%', label: 'Filed before due date' },
  years: { value: '10+', label: 'Years in practice' },
  rating: { value: '4.9', label: 'Google rating' },
} as const;

export interface PracticeArea {
  title: string;
  desc: string;
  glyph: string;
}

export const PRACTICE_AREAS: PracticeArea[] = [
  { title: 'Company & LLP incorporation', desc: 'Private limited, OPC, LLP and Section 8 — name approval to certificate.', glyph: '¶' },
  { title: 'ROC annual compliance', desc: 'AOC-4, MGT-7, DIR-3 KYC and LLP returns filed before the due date.', glyph: '§' },
  { title: 'GST registration & returns', desc: 'Registration, monthly returns, ITC reconciliation and notice replies.', glyph: '%' },
  { title: 'Trademark registration', desc: 'Search, filing, examination replies and hearings until registered.', glyph: '®' },
  { title: 'Business licences', desc: 'MSME / Udyam, FSSAI, IEC and shop licence — before you start trading.', glyph: '✓' },
  { title: 'Agreements & drafting', desc: 'Founders’, shareholders’ and service agreements drafted by an advocate.', glyph: '✎' },
];

/** Index into PRACTICE_AREAS drawn in the accent colour on the home page. */
export const HIGHLIGHTED_AREA = 2;

export interface RecentMatter {
  photo: 'work1' | 'work2' | 'work3';
  photoLabel: string;
  tag: string;
  title: string;
  accent: boolean;
}

export const RECENT_MATTERS: RecentMatter[] = [
  { photo: 'work1', photoLabel: 'Photo — incorporation client', tag: '#Incorporation', title: 'Pvt Ltd registered in 9 days', accent: false },
  { photo: 'work2', photoLabel: 'Photo — GST matter', tag: '#GST notice', title: 'Show-cause notice withdrawn', accent: true },
  { photo: 'work3', photoLabel: 'Photo — trademark client', tag: '#Trademark', title: 'Objection cleared, mark registered', accent: false },
];

export const PILLARS = [
  { title: 'Advocate-led', desc: 'Notices, objections and hearings handled in-house.' },
  { title: 'Fixed quotes', desc: 'Fees agreed before work begins. No hidden charges.' },
  { title: 'On-time filing', desc: 'Deadline tracking and reminders for every client.' },
  { title: 'Pan-India, online', desc: 'Documents shared digitally; meet in person or on call.' },
] as const;

export const STEPS = [
  { n: '01', title: 'Consultation', desc: 'A short call to understand your business and what needs to be filed.' },
  { n: '02', title: 'Checklist & quote', desc: 'A precise document list and a fixed fee, in writing.' },
  { n: '03', title: 'Drafting & filing', desc: 'We prepare, review and file — you approve before anything is submitted.' },
  { n: '04', title: 'Follow-through', desc: 'Acknowledgements, approvals and any queries handled until closure.' },
] as const;

export const DATES = [
  { when: '11th', form: 'GSTR-1', what: 'Outward supplies — monthly filers', tag: 'Monthly' },
  { when: '20th', form: 'GSTR-3B', what: 'Summary return & tax payment', tag: 'Monthly' },
  { when: '31 Jul', form: 'ITR', what: 'Non-audit individuals & firms', tag: 'Annual' },
  { when: '30 Sep', form: 'DIR-3 KYC', what: 'KYC for every director with a DIN', tag: 'Annual' },
  { when: 'AGM + 30', form: 'AOC-4', what: 'Financial statements to ROC', tag: 'Annual' },
  { when: 'AGM + 60', form: 'MGT-7 / 7A', what: 'Annual return to ROC', tag: 'Annual' },
  { when: '31 Dec', form: 'GSTR-9 / 9C', what: 'GST annual return & reconciliation', tag: 'Annual' },
] as const;

export const FAQS = [
  { q: 'How long does it take to register a private limited company?', a: 'Typically 7–12 working days once documents are in order, depending on MCA processing and name approval.' },
  { q: 'What happens if annual ROC filings are missed?', a: 'The MCA levies an additional fee for each day of delay, and prolonged default can lead to director disqualification. We can regularise past defaults.' },
  { q: 'Do I need GST registration?', a: 'It is mandatory above the turnover threshold for your state and category, and in certain cases (inter-state supply, e-commerce sellers) regardless of turnover. We’ll confirm in a short call.' },
  { q: 'When can I use the ™ and ® symbols?', a: '™ can be used once your application is filed. ® may only be used after the mark is registered.' },
  { q: 'Do you offer annual retainers?', a: 'Yes — a fixed yearly fee covering ROC, GST and income tax compliance, with reminders before each due date.' },
] as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;
