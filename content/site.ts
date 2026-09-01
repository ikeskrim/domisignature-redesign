/**
 * Global site content — extracted verbatim from the live domisignature.com (one-page build).
 * This file is the single source of truth. Components must never hardcode copy.
 */

export const site = {
  name: "Domisignature",
  /** Displayed uppercase in the original masthead. */
  wordmark: "domisignature",
  tagline: "Where Every Moment Is Signed",
  descriptor: "Luxury Events, Weddings & Private Celebrations in Crete",
  url: "https://domisignature.com",
  locale: "en",
} as const;

/** Meta tags carried over from the live <head> so SEO value is preserved. */
export const siteMeta = {
  title: "Luxury Wedding Planner in Crete, Greece | Domisignature",
  description:
    "Luxury Events, Weddings & Private Celebrations in Crete, Greece. Domisi Signature designs unique experiences in some of the most beautiful locations in Crete.",
  keywords: [
    "luxury events Crete",
    "destination events Greece",
    "wedding planner Crete",
    "legal wedding Greece",
    "symbolic wedding Crete",
    "bespoke wedding planning",
  ],
  author: "Domisignature Weddings",
} as const;

/**
 * Masthead / hero. The heading and tagline are verbatim from the live
 * <header class="masthead">; the eyebrow and subtitle were re-cut in the
 * Phase 6 copy pass and are recorded in design-review/copy-deck.md §1.
 */
export const hero = {
  /**
   * Was "Crete — by invitation", written during this rebuild and wrongly
   * recorded here as live copy — the live line is "Plan your perfect event
   * with us". "By invitation" tells a visitor that access is gated, which is
   * an exclusivity claim in a different wording and contradicts the confirmed
   * fact that there is no limit on how many celebrations are taken. Removed
   * in Phase 6 §5 under the standing law that no scarcity claim ships in any
   * wording on any surface.
   *
   * The replacement is a fact: every venue is in Rethymno.
   */
  eyebrow: "Rethymno, Crete",
  heading: "domisignature",
  tagline: "Where Every Moment Is Signed",
  /**
   * Phase 6 copy pass. Two alternates are recorded in
   * design-review/copy-deck.md §1 for the final pick; this is the recommended
   * line. It keeps every target keyword — luxury, weddings, private
   * celebrations, Crete — and states a verifiable fact (the venue count) rather
   * than an unverified scarcity claim.
   */
  subtitle: "Luxury weddings and private celebrations across three venues in Crete.",
  cta: { label: "Enquire", href: "/contact" },
  /**
   * The live masthead used a single background, spire2.png. That file reads as
   * AI-generated rather than photographed — no EXIF, no ICC profile, and a pool
   * reflection that does not obey the geometry of the scene — so the hero runs a
   * slow sequence of actual Domisignature work instead. See TEXT-FIXES.md §B5
   * and design-review/imagery-report.md §2.
   *
   * There was an `originalImage` field here pointing at it. It is gone: the file
   * is withheld from the published repository, so a field naming it would only
   * invite someone to restore an image the imagery policy forbids.
   */
  images: [
    { src: "/media/mdGEOR3108.jpg", alt: "A pool at Mountain Escape looking out over the Cretan mountains" },
    { src: "/media/olth4.jpg", alt: "A long banquet table set beneath fairy lights beside the sea" },
    { src: "/media/thLK_LD_071.jpg", alt: "A ceremony arch dressed in white florals against the Cretan sea" },
  ],
  /**
   * The looping background film, cut from the two dusk drone aerials.
   * `poster` is a real photograph and is the LCP element — the video layer
   * only fades in once it can actually play, so it never blocks paint.
   */
  video: {
    mp4: "/media/video/hero.mp4",
    webm: "/media/video/hero.webm",
    poster: "/media/video/hero.jpg",
    posterAlt:
      "Dusk over a seaside celebration in Crete — string lights above a pool, guests dining beside the sea",
  },
} as const;

export const contact = {
  heading: "Enquire",
  subheading: "Tell us the date, the place and the number of guests. We answer every enquiry ourselves.",
  phone: { display: "+30 211 444 5757", href: "tel:+302114445757" },
  whatsapp: { display: "+30 697 406 9475", href: "https://wa.me/+306974069475" },
  email: { display: "domisignature@gmail.com", href: "mailto:domisignature@gmail.com" },
  /** Monday.com embedded enquiry form — kept working exactly as on the live site. */
  formEmbed: "https://forms.monday.com/forms/embed/0b258fa52b6f140d9391f8cd1e300de8?r=use1",
  brochure: { label: "Wedding Brochure", href: "/assets/files/Weddingbrochure.pdf" },
} as const;

export const social = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61580989021866" },
  { label: "Instagram", href: "https://www.instagram.com/domisignature/" },
  { label: "TikTok", href: "https://www.tiktok.com/@domisignature_weddings?_r=1&_t=ZN-94FL4jTYObW" },
] as const;

export const legal = {
  copyright: "© 2026 Domisignature",
  registration: "Γ.Ε.ΜΗ.: 021943650000",
} as const;

/** External partner links referenced inside the Services copy. */
export const partners = {
  villas: "https://www.creteholidayhome.com",
  experiences: "https://creteholidayhome.com/experiences/",
} as const;

/**
 * Primary navigation. `legacyAnchor` records the anchor the old one-page site
 * used, so /#services and friends can still resolve.
 */
export const nav = [
  { label: "Venues", href: "/venues", legacyAnchor: "#portfolio" },
  { label: "Signature Events", href: "/events", legacyAnchor: "#portfolio1" },
  { label: "Services", href: "/services", legacyAnchor: "#services" },
  { label: "Wedding Guide", href: "/wedding-guide", legacyAnchor: "#about" },
  { label: "About", href: "/about", legacyAnchor: "#team" },
  { label: "Contact", href: "/contact", legacyAnchor: "#contact" },
] as const;

export type NavItem = (typeof nav)[number];
