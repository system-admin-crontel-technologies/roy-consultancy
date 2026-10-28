# Handoff: Roy Consultancy — Marketing Website (4 pages)

## Overview
Marketing site for Roy Consultancy, an advocate-led legal & compliance practice in India (ROC filings, GST, trademarks, company registration, licences, agreements). Four linked pages: **Home, Services, About, Contact**. Goal: build trust (advocate-led, fixed fees, on-time filing) and drive enquiries (consultation CTA, WhatsApp, enquiry form).

## About the Design Files
The `.dc.html` files in this bundle are **design references built in HTML** — prototypes that show the intended look and behaviour. They are **not production code to copy directly**. Recreate them in the target codebase's existing stack (React/Next.js, Astro, Vue, etc.) using its patterns. If there is no codebase yet, a static-first framework (e.g. Next.js or Astro + a form backend) is a good fit.

To view them: open any `.dc.html` file in a browser with `support.js` in the same folder (it's the small runtime that renders the templates). All styles are inline; logic lives in the `<script data-dc-script>` class at the bottom of each file, and content arrays (`SERVICES`, `FAQS`, `DATES`, `TABS`, `CHIPS`) are defined just above it.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, copy and interactions. Recreate pixel-accurately. Items in `[brackets]` and `00000` numbers are placeholders (see "Placeholders" below).

## Global Layout
- Content container: `max-width: 1240px; margin: 0 auto; padding: 0 28px`.
- Section vertical rhythm: ~100–110px top/bottom on desktop; reduce to ~64–72px on mobile.
- Square corners everywhere (border-radius 0). Hairline 1px borders define structure instead of shadows/cards.
- Single responsive breakpoint: **820px** (`wide` ≥ 820, `narrow` < 820). Multi-column grids collapse to one column below it; check each file for the exact grid templates.

### Header (all pages)
- `position: sticky; top: 0; z-index: 20; background: rgba(246,244,238,0.94); backdrop-filter: blur(10px); border-bottom: 1px solid #DEDACF`.
- Left: monogram "R" mark + "Roy Consultancy" (Newsreader) with sub-label "Advocate · Corporate & Tax" (IBM Plex Mono, small caps-style, muted).
- Nav links: Home / Services / About / Contact, `padding: 4px 0; border-bottom: 1.5px solid transparent`. Active page: `font-weight: 600; border-bottom-color: #8A6A2F`.
- CTA: "Book a consultation" — `background: #1B2230; color: #F6F4EE; padding: 10px 18px; font-weight: 500` → Contact.
- **< 820px:** nav + CTA replaced by a "Menu"/"Close" toggle button (`border: 1px solid #1B2230; padding: 9px 14px; font-size: 14px`). Opens a full-width vertical list; each link `padding: 14px 0; border-bottom: 1px solid #DEDACF; font: 18px Newsreader`; active link coloured `#8A6A2F`.

### Footer (all pages)
- `background: #141A25; color: #8E95A3`; links `#D5D8DE`.
- Columns: brand ("Roy Consultancy — Advocate-led corporate, tax and IP compliance."), Pages (4 links), Contact (tel, mailto, address).
- Bottom row: "© 2026 Roy Consultancy" + Bar Council disclaimer: "As per Bar Council of India rules, this website is for information only and does not constitute advertising or solicitation." **Keep this disclaimer — it's a regulatory requirement for advocates in India.**

### Floating WhatsApp button (all pages, toggleable)
`position: fixed; right: 24px; bottom: 24px; z-index: 30; background: #8A6A2F; color: #F6F4EE; padding: 14px 20px; font-size: 14.5px; font-weight: 500; box-shadow: 0 8px 24px rgba(27,34,48,0.22)`. Label "WhatsApp us", links to `https://wa.me/<number>`.

### Closing CTA band (Home, Services, About)
H2 "Not sure what you need? A short call will tell you." (second sentence muted) + "Book a consultation →" button (`padding: 18px 30px; font-size: 15.5px`).

## Screens

### 1. Home (`Home.dc.html`)
1. **Hero ("Chamber" layout)** — section `padding: 72px 28px 0`. Two columns on desktop:
   - **Left:** H1 "Your business," + rotating second line (`heroWord`) cycling every **2600ms** through: `registered.` → `compliant.` → `protected.` → `filed on time.` H1: Newsreader 400, `clamp(44px, 6.2vw, 96px)`, line-height 0.95, letter-spacing -0.04em. Rotating word in brass `#8A6A2F`.
     Intro: "Roy Consultancy is an advocate-led practice for ROC filings, GST, trademarks and company registration. You get one point of contact and a fixed fee."
     Buttons: primary "Book a consultation →" (`padding: 17px 28px; 15.5px`) + text link "or message on WhatsApp" (underlined with 1px bottom border).
     **Quick-service list** (4 rows, each a button: `border-bottom: 1px solid #DEDACF; padding: 20px 0`, title + description left, turnaround + "→" right). Clicking navigates to `Contact.dc.html?service=<Chip>`:
       - Start a company or LLP — Pvt Ltd, OPC, LLP, Section 8 — 7–12 days → `Incorporation`
       - Register or file GST — Registration, monthly returns, notices — 3–7 days → `GST`
       - Register a trademark — Search, application, objections — Filed in 48 hrs → `Trademark`
       - Annual ROC filing — AOC-4, MGT-7, DIR-3 KYC — Before due date → `ROC filing`
   - **Right:** abstract business graphic (placeholder) — **to be replaced with a real office/business photo**.
2. **Pillars strip** — `background: #EFECE4`, top/bottom 1px `#DEDACF` borders, 4 columns: Advocate-led / Fixed quotes / On-time filing / Pan-India, online (copy in file).
3. **Featured services** — H2 "Everything a business files, registers or protects." + "All services →" link. Grid of 6 cards (SERVICES indexes 0,1,3,5,6,9). Card: `border-right & border-bottom 1px #DEDACF; padding: 32px 28px 30px; gap: 14px; background: #F6F4EE`. Contents: number (`01`, Plex Mono), category, H3 (Newsreader 500, 27px, lh 1.15), description, "Learn more →". Whole card links to Services.
4. **Process** — navy section (`background: #1B2230; color: #F6F4EE`). H2 "Four steps. No surprises." 4 steps: 01 Consultation / 02 Checklist & quote / 03 Drafting & filing / 04 Follow-through (copy in file). Step numbers in `#C9A866`.
5. Closing CTA, Footer.

### 2. Services (`Services.dc.html`)
1. **Sub-header** — breadcrumb "Home / Services", H1 "Practice areas." (`clamp(44px, 6vw, 84px)`), intro: "Corporate, tax, intellectual property and licensing work, all handled by an advocate. Each engagement starts with a written checklist and a fixed quote."
2. **Filter tabs** — label "Filter by practice area"; tabs `All, Corporate, Tax, IP, Licences, Legal`. Tab style: `padding: 9px 15px; font-size: 13.5px; border: 1px solid #CFCABE; transparent bg`. Active: `background/border #1B2230; color #F6F4EE`.
3. **Service grid** — all 10 services, filtered by tab. Each card shows number, category, title (`clamp(28px,3vw,38px)` or 27px), description and bulleted `items` list.
4. **Compliance calendar** (toggleable) — H2 "Dates that cost money when missed." + "Retainer clients get reminders well ahead of every deadline — and we file before they arrive." Note: "Indicative; subject to notified extensions." Rows (when · form · what · tag):
   - 11th · GSTR-1 · Outward supplies — monthly filers · Monthly
   - 20th · GSTR-3B · Summary return & tax payment · Monthly
   - 31 Jul · ITR · Non-audit individuals & firms · Annual
   - 30 Sep · DIR-3 KYC · KYC for every director with a DIN · Annual
   - AGM + 30 · AOC-4 · Financial statements to ROC · Annual
   - AGM + 60 · MGT-7 / 7A · Annual return to ROC · Annual
   - 31 Dec · GSTR-9 / 9C · GST annual return & reconciliation · Annual
5. Closing CTA, Footer.

### 3. About (`About.dc.html`)
1. Sub-header — "Home / About", H1 "An advocate, not a filing agent.", intro "Roy Consultancy brings legal training to everyday compliance, so your filings stand up if they are ever questioned."
2. **Profile** — image slot ("office / chamber photo", needs real photo) + pull quote: "A filing is a legal document. It deserves the same care as a court pleading — because one day it may become one." + bio paragraph (Adv. [Name] Roy) + facts: "Enrolled with — Bar Council of [State]", "Office — [City], India".
3. Pillars (same 4 as Home), Process (same 4 steps), Closing CTA, Footer.

### 4. Contact (`Contact.dc.html`)
1. Sub-header — "Home / Contact", H1 "Let's talk about *your business.*" (`clamp(36px, 4.8vw, 62px)`), "Call, message or send an enquiry. Within one working day we'll reply with the documents you need and a fixed quote."
2. **Two columns:**
   - **Left — contact methods:** H2 "Tell us what you need filed." + promise line; rows: Call (+91 …), WhatsApp ("Message us →"), Email, Office ("[Address line], [City] — Mon–Sat, 10–7").
   - **Right — Enquiry form:** fields Name ("Your full name"), Phone / WhatsApp ("+91"), Service (chip selector: `Incorporation, ROC filing, GST, Trademark, Income tax, Other`; chip `padding: 8px 12px; 13.5px`; active = navy fill), Message (textarea). Inputs: `border: 0; border-bottom: 1px solid #B9B4A8; background: transparent; padding: 10px 0; font-size: 16px; outline: none`. Submit "Send enquiry →" (primary).
3. **FAQ accordion** — H2 "Asked often." Items from `FAQS`; one open at a time (first open by default); "+" / "−" indicator.
4. Footer.

## Interactions & Behavior
- **Hero rotator:** `setInterval` 2600ms, 4 words, loops. (Consider a subtle fade/slide; currently a hard swap. Respect `prefers-reduced-motion`.)
- **Service deep-link:** Home quick-service rows → `Contact?service=<Chip>`; Contact reads `?service=` on mount and preselects the matching chip if it is in `CHIPS`. Default chip: "ROC filing".
- **Service filter:** client-side filter of `SERVICES` by `cat`; "All" shows everything.
- **FAQ:** clicking an open item closes it; clicking another opens it and closes the current one.
- **Form validation:** Name and Phone are required (trimmed). On failure show error in `#A33A2B`: "Please add your name and phone number." On success replace form with: "Thank you, {name}. Your enquiry about {service} has been received. We'll be in touch within one working day." + "Send another" (outlined button) which resets fields.
- **Form backend: NOT implemented.** Wire submit to an email/form service (e.g. Resend, Formspree, server action) and add loading + failure states. Add phone format validation for Indian numbers.
- **Mobile menu:** toggled by Menu/Close; only rendered below 820px.
- Hover states are minimal in the prototype — add subtle ones (e.g. underline colour → `#8A6A2F`, primary button bg → `#2A3140`).

## State
- Global: viewport width (or use CSS media queries instead), `menuOpen`.
- Home: `heroWordIndex`.
- Services: `activeTab`.
- Contact: `name, phone, message, service, sent, error`, `openFaq` (index, -1 = none).
- Toggles (props in prototype): `showCalendar` (default true), `showWhatsApp` (default true).

## Design Tokens
**Colours**
- Cream (page bg) `#F6F4EE`; light cream `#FBFAF6`; tinted band `#EFECE4`; also `#E4DFD3`, `#E6E1D5`, `#DDD7C9`, `#D6D0C2` (image/graphic fills)
- Navy (ink, primary buttons, process section) `#1B2230`; navy hover/deep `#2A3140`, `#2E3546`, `#3A4252`
- Footer `#141A25`; footer text `#8E95A3`; footer links `#D5D8DE`; light grey on navy `#B8BDC8`
- Brass (accent, active nav, rotating word, WhatsApp button) `#8A6A2F`; light brass (on navy) `#C9A866`; pale brass `#D6C6A4`
- Body muted text `#454B58`; secondary muted `#5C6270`
- Borders `#DEDACF` (hairlines), `#CFCABE` (chips/tabs), `#B9B4A8` (inputs)
- Error `#A33A2B`

**Typography** (Google Fonts)
- Display/headings: **Newsreader** 400/500 (opsz 6..72)
- Body/UI: **IBM Plex Sans** 400/500/600
- Labels/numbers/eyebrows: **IBM Plex Mono** 400/500 (10.5–12px, uppercase-style letter-spacing)
- Scale: H1 `clamp(44px,6.2vw,96px)` (home) / `clamp(44px,6vw,84px)` (sub-pages); H2 `clamp(34px,4.4vw,56–58px)`, lh 1.05, ls -0.02em; H3 27px; body 15–16.5px; lead 18–21px; small 13–14.5px.

**Spacing:** container gutter 28px; card padding 32/28/30px; section padding ~100–110px; gaps 12–16px for groups.
**Radius:** 0. **Shadow:** only the floating WhatsApp button (`0 8px 24px rgba(27,34,48,0.22)`).

## Assets
- No raster images yet. Hero graphic (Home) and profile photo (About) are placeholders — client to supply a real office/business photo.
- "R" monogram is typographic, no logo file.

## Placeholders to confirm with client
Advocate name, Bar Council state, enrolment number, phone/WhatsApp number, email, office address, turnaround times (7–12 days, 3–7 days, 48 hrs) and compliance due dates.

## Files
- `Home.dc.html`, `Services.dc.html`, `About.dc.html`, `Contact.dc.html` — the four pages (source of truth for exact styles/copy)
- `support.js` — runtime needed to open the prototypes in a browser
