# Public site components

Everything under `src/app/(site)` and `src/components/site` is the public marketing website,
implemented from the v2 design handoff in `docs/design/website/v2` (Home, Services, About, Contact).
The v1 handoff it replaced is kept alongside in `docs/design/website` for reference.

Conventions:

- Self-contained: the site never imports from `src/components/admin`, and uses its own stylesheet
  `src/styles/site.css` (plain CSS, `s-` prefixed classes, tokens from the handoff) rather than the admin
  Tailwind tokens in `src/styles/globals.css`.
- Copy lives in `src/lib/site/content.ts`; contact details and toggles in `src/lib/site/config.ts`
  (driven by `NEXT_PUBLIC_*` variables, inlined at build time).
- Pages are static. Anything that reads `usePathname()` or `useSearchParams()` sits inside `<Suspense>`
  so the page still prerenders under Cache Components.
- The enquiry form posts to `POST /api/v1/public/enquiries` through the same-origin passthrough.
  Submissions are stored in `website_enquiries`, emailed to the organisation address from Settings,
  and listed under `/admin/enquiries`.
- Placeholders still to confirm with the client: advocate name, Bar Council state, phone/WhatsApp,
  email, office address, the headline figures in `STATS` and the "Recent matters" cards, and the six
  photos (`NEXT_PUBLIC_*_PHOTO`, rendered by `Photo`; empty shows a labelled placeholder).
