# NN Paving Northampton — Project Memory

_Last updated: 1 October 2026_

This file is the durable working context for the NN Paving Northampton project. Use it as the source of truth when continuing work after the chat history is unavailable. Update it whenever a material decision, deployment, integration, or owner instruction changes.

## Business and brand

- Business name: **NN Paving Northampton**
- Owner/contact name used in customer-facing copy: **Leon**
- Market: Northampton and nearby Northamptonshire areas
- Ideal customers: homeowners, landlords, and property managers
- Services represented by the site: block paving, driveways, patios, porcelain paving, landscaping, lawns, artificial grass, shed bases, paths, groundwork, driveway foundations, and related paving preparation/drainage work
- Main customer actions: call Leon, prepare a quote enquiry, request a site visit, view projects, visit Facebook/Instagram, and request a free no-obligation quotation
- Tone: premium, local, clear, trustworthy, practical, and conversion-focused
- Do not invent reviews, awards, guarantees, accreditations, prices, years in business, project claims, opening hours, or broader coverage than has been verified.
- Keep the public site mobile-first and accessible. Avoid storing passwords, OTPs, private addresses, or other secrets in this file.

## Website and repository

- Live site: https://nn-paving-northampton.taylorrbyt.chatgpt.site/
- Contact/quote page: https://nn-paving-northampton.taylorrbyt.chatgpt.site/contact/
- Owner dashboard: https://nn-paving-northampton.taylorrbyt.chatgpt.site/owner/
- Instagram landing page: https://nn-paving-northampton.taylorrbyt.chatgpt.site/instagram/
- Facebook source: https://www.facebook.com/p/NN-Paving-Northampton-61587242067438/
- Instagram account: https://www.instagram.com/nnpavingnorthampton/
- Project root: `work/nn-paving/`
- Generator/source mentioned earlier: `work/nn-paving/generate.py` (the current repository also contains the generated/static app structure)
- Public/generated pages: `work/nn-paving/public/`
- Database schema: `work/nn-paving/db/schema.ts` when present; Drizzle migrations are in `work/nn-paving/drizzle/`
- Main front-end assets: `work/nn-paving/public/styles.css`, `work/nn-paving/public/site.js`, and page HTML under `work/nn-paving/public/`
- Important image assets: `public/assets/driveway.jpg`, `garden-after.jpg`, `garden-before.jpg`, `patio-view.jpg`, responsive variants, `social-preview.jpg`, and `71e409f3ab698107.jpg` (logo-style asset; confirm visually before using as a logo)
- GitHub mirror: https://github.com/magelevels/nn-paving-northampton
- Site project id: `appgprj_6abd6951705881918c026c0f4ad93829`
- Latest known deployed Sites version: 18
- Latest known Sites commit: `fa6ec0c12d0b1bcf335cf981c01b3203729a5097`
- Hosting preview/live domain is currently the Sites URL above. A custom domain was intentionally deferred until the business owner chooses one.

## Shipped website functionality

- Premium responsive marketing site for Northampton paving and landscaping.
- Public pages: home, services, driveways, patios, landscaping, projects/gallery, individual project pages, areas served, FAQs, about, contact, Instagram, and 404.
- Quote planner with postcode validation, service selection, priorities, practical project notes, callback preference, and site-visit request.
- Customer-controlled email preparation, copy, and downloadable project brief. Customer emails are not sent automatically.
- Secure enquiry capture with privacy acknowledgement, consent timestamp/version, honeypot protection, and basic rate limiting.
- D1 enquiry records and enquiry events.
- Private owner dashboard/inbox at `/owner/` with fail-closed owner access using `OWNER_EMAIL`.
- Seven-stage pipeline: `new`, `contacted`, `site_visit_requested`, `quoted`, `awaiting_client`, `won`, `lost`.
- Next-action dates and notes.
- Owner metrics with opt-in anonymous measurement.
- 12-month cleanup for closed enquiries plus manual delete.
- Security headers on dynamic/API/owner routes. Static asset layer currently emits cache headers subject to hosting limitations.
- Instagram page and growth surfaces were added in earlier work; no live Meta API, Instagram access token, social inbox, or automated messaging has been connected.
- Owner/admin login page was requested and implemented as part of the owner-side work; keep access fail-closed and do not expose the inbox publicly.

## Google Business Profile status

Google Business Profile setup was performed in Chrome using the signed-in account **pavingnn@gmail.com**. The profile was created for **NN Paving Northampton** and is currently in Google’s verification queue.

Configured:

- Business type: service business
- Primary category: Paving contractor
- Service area: Northampton, UK
- Website: https://nn-paving-northampton.taylorrbyt.chatgpt.site/
- Phone: **07999 749569** (entered by the user; never replace it unless the user explicitly requests a change)
- Business description used:
  > NN Paving Northampton provides block paving, driveways, patios, porcelain paving, landscaping and groundwork services for homes in Northampton and surrounding areas. From driveway foundations and paving patterns to garden paths, lawns, artificial grass and shed bases, we help homeowners plan practical outdoor spaces. Send your postcode and project details for a free, no-obligation quotation.
- Added services included brick paver installation, concrete work, driveway installation/repairs/replacement, excavation and grading, hardscaping, patio paving, paver installation, paving job site preparation, and paving-related drainage.
- Uploaded existing NN Paving project photos: `driveway.jpg`, `garden-after.jpg`, `garden-before.jpg`, and `patio-view.jpg`.
- Business hours were skipped because no verified hours were provided.
- Optional Google Ads credit and Google Workspace upsells were skipped.
- No physical address was guessed or stored.

Current Google state:

- Profile ID: `07997715596605215938`
- Google showed: **“Your edits will be visible once you're verified.”**
- Profile was **not publicly visible yet**.
- Verification dialog was left open for the owner. Google asks for the private postal address, which is hidden from customers. The owner must enter the correct address and continue. Do not guess, enter, or store this address.
- Google may then request a verification method, code, video, or other owner action. Hand those steps to the owner; never handle passwords, OTPs, or CAPTCHAs.
- Chrome file upload permission for the ChatGPT extension was enabled under `chrome://extensions` → ChatGPT → Details → **Allow access to file URLs**. This was needed to upload the approved project photos.

## User preferences and standing instructions

- User has repeatedly approved continuing work without stopping for routine confirmation and asked the assistant to “do what you need to do” / “don’t stop.”
- User wants the technical work handled for them, with simple explanations when reporting results.
- When a task involves private information (especially phone numbers, addresses, passwords, verification codes, or personal accounts), let the owner enter it themselves or hand off at the exact step.
- Keep all customer-facing references to the person as **Leon**; remove accidental references to “Taylor Peters” from site/business copy.
- Preserve the private owner audience and the existing quote journey.
- Continue building from the existing system rather than starting over.
- Use real business/source material only. Clearly label anything unverified.
- Do not purchase a domain or paid advertising without an explicit new request.
- Do not send emails, social messages, or customer replies unless the user explicitly asks for that specific message/action.

## Promotional asset

- Latest revision: the user rejected the earlier slideshow-style adverts and supplied a screen recording of a CapCut commercial-ad example. The accepted direction to work toward is bold italic captions, quick split-panel slides, layered project photos, rotating geometric quote frames, and a large logo-and-phone finish.
- Keep AI narration removed. The user subsequently requested background music and supplied `ssstik.io_1790847075382.mp3`. It has now been added to both advert formats, with a 0.15-second fade-in and 1.15-second fade-out.
- Current music versions in the workspace's `outputs/` directory: `nn-paving-advert-square-music.mp4` (1080×1080) and `nn-paving-advert-reel-music.mp4` (1080×1920), both 22.4 seconds. The original silent files without the `-music` suffix are retained.
- Uses actual NN Paving project images and logo, verified phone 07999 749569, the Instagram handle, and free no-obligation quote wording. The vertical ending also includes the website.
- Visual source: `tools/build_promo.swift`; run from the repository root, with `--vertical` for the Reel format. Music assembly: `tools/add_promo_music.swift`, which trims/fades the supplied audio then copies the original video track without re-encoding. Local reference analysis, preview frames and the supplied audio are under `work/advert-v3/` relative to the workspace. Do not upload the source music to GitHub.
- Production notes: `outputs/nn-paving-northampton-promo-notes.md`. The previous `nn-paving-northampton-promo.mp4` is superseded.

## Recommended next steps

1. Owner enters the private postal address in the open Google verification form and completes Google’s requested verification method.
2. After verification, confirm the public Google listing, correct phone/website/service area, and photo gallery.
3. Add verified business hours when Leon confirms them.
4. Ask satisfied real customers for honest Google reviews after completed work; never create or fabricate reviews.
5. Publish occasional Google Business updates using real project photos and factual service information.
6. Decide on a custom domain with the business owner before changing hosting/domain configuration.
7. Keep the website’s quote pipeline, owner inbox, Instagram/Facebook links, and Google Business profile details aligned.
8. If building further, prioritise measured improvements: verified conversion tracking, performance/accessibility checks, review-request workflow, and owner-friendly follow-up tools.

## Safety and continuity notes

- This file is a project handoff/memory document, not a secret store and not a guarantee of platform-level ChatGPT memory.
- If the chat is lost, start by reading this file, then inspect the repository and current live site before changing anything.
- Confirm the current deployed version and Git status before making a new release.
- Record new decisions and external setup changes in this file after they are completed.
