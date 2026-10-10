# Product

<!-- impeccable:product-schema 1 -->

> The owner asked for full autonomy ("agis en complète autonomie") and was away during the build, so no interview round ran. Every fact below comes from the owner's own brief and from the two live products (joinentity.com, verify.theorbes.com) as read on 2026-10-08. Items marked *(inferred)* are assumptions to confirm.

## Platform

web

## Stack

Delegated: Astro (static output) with Markdown content collections, deployed on Vercel at eliotluca.com. Chosen because the owner already ships on Vercel + GitHub, wants to publish essays from plain files, and the site must stay fast and cheap to host (cost discipline is one of his stated habits).

## Users

- Investors, fund partners and operators (PE, VC, M&A, tech, energy) checking who Eliot is after a meeting, a LinkedIn message or a deal intro. They scan in under a minute, on a phone, often between two calls.
- Customers, partners and press arriving from THE ENTITY or ORBES who want the person behind the products.
- Readers who follow Eliot's essays and manifestos.
- Eliot himself, who uses the site as the one link to share everywhere (link-in-bio page) and as a place to publish thoughts.

## Product Purpose

The personal home of Eliot Luca: who he is, what he builds, what he thinks. Success = a visitor understands within seconds that Eliot is a builder whose mindset is building on what is tangible (physical value chains behind markets, objects made to last), shaped first by design (2016), crypto (2017) and e-commerce (2018), with finance coming after (2021); can open each venture, read his writing, and contact him. Finance is one discipline among several, never the headline.

## Positioning

Few people can show, in one place, a decade of design and commerce, a PE/VC/M&A track record, a live AI supply-chain intelligence product (THE ENTITY), and a men's accessories brand (ORBES: jewellery and leather goods). The site's claim is the range itself, made credible by real, shipped work: the "Da Vinci Mode" practice of mastering several disciplines at once, with dated entry points.

## Operating Context

- Shared as a single link: email signatures, LinkedIn, Instagram bio, pitch decks.
- Read mostly on phones; deep pages (essays, instruments) on desktop as well.
- Content is updated by Eliot himself by adding Markdown files and pushing to GitHub.

## Capabilities and Constraints

- Sections: home, the two ventures (ORBES and THE ENTITY only), writing feed (essays, manifestos) with RSS, instruments (small interactive tools that reflect his disciplines), about / track record, now page, link-in-bio page, contact.
- Essays can be written in English or French; the interface language is English (international audience: US market for ORBES, global investors).
- No backend, no database, no tracking scripts. Hosting must stay near-free.
- Unknown at build time *(to fill in `src/data/site.ts`)*: LinkedIn / X / GitHub URLs, public email inbox, exact dates and fund names of internships.

## Brand Commitments

- Public name: **Eliot Luca** (domain eliotluca.com). The family name is not used on the site *(inferred: the owner chose the domain)*.
- The two ventures keep their own identities: THE ENTITY (near-black, teal #7ABDB4, Instrument Sans / Geist Mono) and ORBES (black, wide uppercase Gravesend Sans). The personal site frames them, it does not copy them.
- ORBES is never placed in Paris on this site: it is a worldwide e-commerce jewellery brand (even though the brand's own site has carried the line "Paris, 2026").
- The only ORBES address shown or linked on this site is verify.theorbes.com, which will be the final website. Never link or mention theorbes.com on its own.
- In the hero, THE ENTITY and ORBES appear as their real logos (mark and wordmark), not as plain text.
- ORBES is marketed as a men's accessories brand: jewellery and leather goods, sold online worldwide. Its verification feature is called ORBES VERIFY on this site (never "the record", and not ORBES GENOME); it is one part of the brand, never the headline.
- Schools are never named on the site (degrees only). Past employers are never named either; only THE ENTITY and ORBES are named. The hero lists only the two ventures.
- E-commerce ran from 2018 to 2021, was set aside, and resumed in 2026: never write "since 2018" without the pause.
- Owner's stated taste: premium, minimalist, institutional, precise typography, strong hierarchy. Dislikes generic, "AI-looking", overdesigned or cheap-looking output.

## Evidence on Hand

- THE ENTITY public facts (joinentity.com, Oct 2026): the institutional-grade map of the AI supply chain; 835 companies, 645 listed, 80 chain nodes across 5 layers (energy, chips, infrastructure, models, applications), 2,808 calibrated links, 103 elite funds tracked (92 scored), 624 geolocated facilities, 48 chokepoints, 74 geographies, 871 sourced narratives, model 2.8, Copilot, public API. Plans from $19/mo, Pro $49/mo, Terminal $10,000/yr. Public accountability, as stated on joinentity.com: the whole graph is re-scored every night; every call is recorded the day it is made and graded in public, misses included ("Receipts"); every figure is labelled fact, estimate or model (sourced, estimated or illustrative), dated, and graded for confidence; methodology and a backtest are published.
- ORBES (brand kit from the ORBES GENOME session, 2026-10-08, Eliot's decisions applied): Paris, 2026. Lines (verbatim, public on theorbes.com): "PERMANENT WEIGHT FOR THOSE WHO CURATE THEIR OWN EXISTENCE.", "WE CELEBRATE A JOURNEY OF GRIND, OFFERING A FRESH PERSPECTIVE ON SELF-REALIZATION.", "PARIS, 2026", "FIRST REVEAL SOON", "WE SLEEP WHEN WE DIE". ORBES GENOME at verify.theorbes.com: every piece carries an ORBES CODE, issued and signed by ORBES; flow: scan, AUTHENTIC, register, certificate, pass it on. Releases: by draw (enter, ORBES draws, the selected confirm) or LIVE RELEASE (door opens at the hour, keep your place in the line, press and hold the seal, one piece per collector). Palette NOCTURNE: #0A0A0A, ivory #F6F2EA, plate #141312, soft #A7A29A, faint #6F6A63; Gravesend Sans 500 for the wordmark and tracked capitals, Helvetica Neue for reading.
  Never on the site: piece names, materials or prices (first reveal soon), a launch date, technical or hosting details, any claim that a scan proves the physical object is genuine (say the identity was issued and signed by ORBES), crypto vocabulary, atelier/handmade/artisan framing, readable ORBES or claim codes, console screens, the legal entity name.
- THE ENTITY (brand kit from the AI Stack Atlas session, 2026-10-08): "Spot the next AI winners before the crowd."; figures as of October 2026: 835 companies, 80 chain nodes, 2,808 links, 624 facilities, 48 chokepoints, 74 geographies; plans from $19/mo, no free plan; tokens: canvas #0c0c0a, surface #161512, border #292823, muted #a39e93, accent #7abdb4. Never on the site: the legal entity name, infrastructure, model or provider names, roadmap or unreleased features, fund or 13F dollar figures and holdings, performance numbers without the model-portfolio disclaimer, invented proof.
- Media copied from the two projects (owner-made, approved): public/media/entity (launch loop, tour film, reels, glyph), public/media/orbes (GENOME loop cut from approved shots, monogram).
- Career: Amundi Technology (Corporate Development, Strategy & Transformation, Post-Merger Integration); Novastone Capital Advisors (analyst, Private Equity / Search Fund); a 6-month Private Equity internship and a 6-month Venture Capital internship; information memorandum and Q&A on an EUR 80M M&A deal; fundraising, data rooms and investor Q&A for startups.
- Education: ESSEC Business School (Global BBA), emlyon business school (MSc in Finance), McGill study trip (Montreal). DeFi thesis with 5 semi-structured interviews (5+ hours) with protocol executives.
- Disciplines with entry years: branding & graphic design 2016, blockchain & crypto 2017, e-commerce 2018, finance & private equity 2021, music production 2023, AI infrastructure 2025, 3D industrial modelling 2026, watchmaking 2026.
- Languages: English, French, Italian, Spanish, Portuguese.
- No photographs of Eliot, no testimonials, no press. Do not fabricate any.

## Product Principles

1. Range, shown with confidence: the site highlights Eliot's Leonardo da Vinci capacities (a creator and an operator across eight disciplines practised at once). Never write defensive, proof-seeking lines such as "it counts once it has produced something real" or "each with the work that shows it".
2. One link that holds everything: any visitor finds ventures, writing and contact within two taps.
3. Writing is the living part: publishing an essay must be one Markdown file.
4. Precision over decoration: numbers are real, claims are sourced, nothing is invented.
5. Privacy by default: nothing personal beyond professional identity.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, keyboard access, reduced motion, readable essays on small screens.
