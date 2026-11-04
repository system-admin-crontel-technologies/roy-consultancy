import { SITE } from './config';

/** Copy for the Privacy Policy and Terms pages. Keep it matched to what the site actually does. */
export interface LegalSection {
  heading: string;
  body?: string[];
  items?: string[];
}

export const LEGAL_LAST_UPDATED = '4 November 2026';

export const LEGAL_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
] as const;

/** Person named as the contact for privacy requests and complaints. */
export const GRIEVANCE_CONTACT = SITE.advocateName;

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'Who We Are',
    body: [
      `${SITE.name} is an advocate-led practice run by ${SITE.advocateName}, with offices in ${SITE.offices.map((o) => o.city).join(' and ')}, India. This policy explains how we handle personal data when you use this website, contact us, or engage us for a service. It is intended to follow the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000, along with the rules made under them.`,
    ],
  },
  {
    heading: 'What We Collect',
    items: [
      'Enquiry form: your name, phone number, the service you selected and your message.',
      'Technical details sent with an enquiry: your IP address, browser details (user agent), the page you sent it from and the time.',
      'Direct contact: whatever you choose to share with us by phone, email, WhatsApp or at our offices.',
      'Client work: if you engage us, the documents and details the work requires, such as identity and address proofs, PAN, business records and financial information.',
    ],
    body: ['Please do not send sensitive documents through the enquiry form. We will tell you how to share them once we have spoken.'],
  },
  {
    heading: 'How We Use It',
    items: [
      'To reply to your enquiry and tell you the documents required and the fee.',
      'To carry out the work you engage us for and to keep records of it.',
      'To meet our legal, tax, regulatory and professional obligations.',
      'To keep the website secure and to prevent spam and misuse.',
    ],
    body: ['We do not sell your personal data, and we do not use it for third-party advertising.'],
  },
  {
    heading: 'Basis For Using Your Data',
    body: [
      'We use your data because you gave it to us voluntarily for a stated purpose, because you have consented, or because the law requires or permits it. If you withdraw consent, we will stop the related processing, although we may be unable to continue a service that depends on it, and we may keep what the law requires us to keep.',
    ],
  },
  {
    heading: 'Cookies And Analytics',
    body: [
      'The public pages of this website do not use advertising or analytics cookies. Cookies are used only to keep authorised staff signed in to the private administration area.',
    ],
  },
  {
    heading: 'Who We Share It With',
    items: [
      'Our team members and assistants who need it for your matter or enquiry.',
      'Service providers who help us run the website, such as our hosting, email and technology providers.',
      'Government departments, registries and portals, such as the MCA, GST, Income Tax and Trade Marks offices, when a filing you asked for requires it.',
      'Courts, authorities or others where the law requires it, or where needed to protect legal rights.',
    ],
    body: ['If you message us on WhatsApp, or email or call us, your message also passes through that provider and is subject to its own privacy terms.'],
  },
  {
    heading: 'How Long We Keep It',
    body: [
      'We keep personal data only for as long as it is needed for the purpose it was collected for, and for any longer period required by law or by our professional obligations. When it is no longer needed, we delete it or make it anonymous.',
    ],
  },
  {
    heading: 'How We Protect It',
    body: [
      'This website uses encrypted connections (HTTPS), and access to enquiries is limited to authorised staff. No system is completely secure, but if a personal data breach occurs, we will notify you and the authorities as the law requires.',
    ],
  },
  {
    heading: 'Your Rights',
    items: [
      'Ask what personal data we hold about you and how we use it.',
      'Ask us to correct, complete, update or erase your data, subject to what the law requires us to keep.',
      'Withdraw consent you have given.',
      'Nominate someone to exercise your rights if you die or become unable to do so.',
      'Raise a complaint with us and, if it remains unresolved, with the Data Protection Board of India.',
    ],
    body: ['To use any of these rights, contact us using the details below. We may need to confirm your identity first.'],
  },
  {
    heading: 'Children',
    body: [
      'This website is not meant for anyone under 18. If you are under 18, please ask a parent or guardian to contact us for you.',
    ],
  },
  {
    heading: 'Changes To This Policy',
    body: ['We may update this policy from time to time. The latest version will always be on this page, with its date at the top.'],
  },
];

export const TERMS: LegalSection[] = [
  {
    heading: 'Using This Website',
    body: [
      `This website is operated by ${SITE.name}. By using it, you agree to these terms. If you do not agree, please do not use the website.`,
    ],
  },
  {
    heading: 'Information Only, Not Legal Advice',
    body: [
      SITE.disclaimer,
      'Nothing on this website is legal, tax or financial advice. Laws, deadlines and government fees change, and the right answer depends on your facts, so please do not act on this content without speaking to a qualified professional.',
    ],
  },
  {
    heading: 'No Advocate-Client Relationship',
    body: [
      'Browsing this website, sending an enquiry, or messaging or calling us does not by itself create an advocate-client relationship. That begins only when we have agreed to act for you. Please do not send confidential information until then.',
    ],
  },
  {
    heading: 'Our Services And Fees',
    body: [
      'Service descriptions on this website are general and may change. The scope, fee and timeline for your work are the ones we confirm to you in writing, including whether government fees, stamp duty and other third-party charges are included. If those written terms differ from these terms, the written terms apply to that work.',
    ],
  },
  {
    heading: 'Timelines And Outcomes',
    body: [
      'Approvals, registrations and decisions rest with government departments, registries and courts. We do not guarantee any particular result or approval date, and we are not responsible for delays caused by those authorities, by portal outages, or by documents and information that reach us late, or that are incomplete or inaccurate.',
    ],
  },
  {
    heading: 'Your Responsibilities',
    items: [
      'Give accurate information when you contact us, and use only details you are entitled to share.',
      'Do not misuse the website, send spam, attempt unauthorised access, or disrupt its operation.',
      'Do not use the website for anything unlawful.',
    ],
  },
  {
    heading: 'Content And Trademarks',
    body: [
      `The text, design, photographs and logo on this website belong to ${SITE.name} or are used with permission. You may view and print pages for your own reference, but you may not copy, republish or use them commercially without our written permission.`,
    ],
  },
  {
    heading: 'Examples And Figures',
    body: ['Testimonials, examples and figures on this website are illustrative. They do not promise the same result in your matter.'],
  },
  {
    heading: 'Links To Other Services',
    body: ['This website may link to third-party services such as WhatsApp or government portals. We do not control them and are not responsible for their content, availability or practices.'],
  },
  {
    heading: 'Website Availability And Liability',
    body: [
      'We try to keep this website accurate and available, but it is provided “as is”, without any warranty that it will be error-free or uninterrupted. To the extent the law permits, we are not liable for any loss arising from your use of, or reliance on, this website. This section does not limit any liability that cannot be limited by law, or our responsibilities under a separate engagement with you.',
    ],
  },
  {
    heading: 'Privacy',
    body: ['Our Privacy Policy explains how we handle your personal data and forms part of these terms.'],
  },
  {
    heading: 'Governing Law',
    body: ['These terms are governed by the laws of India. Disputes relating to them are subject to the exclusive jurisdiction of the courts at Kolkata, West Bengal.'],
  },
  {
    heading: 'Changes To These Terms',
    body: ['We may update these terms from time to time. The latest version will always be on this page, with its date at the top. Continuing to use the website after a change means you accept the updated terms.'],
  },
];
