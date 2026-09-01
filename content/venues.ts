/**
 * The venues, from the live portfolio modals. Villa Aetos (#portfolioModal4)
 * was withdrawn from the collection by the owner — recorded as an approved
 * delta in design-review/content-audit.md.
 *
 * Facts are untouchable and unchanged: capacities, room and villa counts, the
 * curfew note, locations, coordinates and every advantage bullet are exactly as
 * published. The descriptive prose was re-cut in Phase 6 into shorter beats,
 * with repetition of the standfirsts removed — before/after in
 * design-review/copy-deck.md §11.
 *
 * Phase 6 also RESTORED three Thalasses sentences that were dropped during the
 * Phase 1 extraction and never noticed, because the content audit compared
 * image counts but not prose: the sea-view/privacy line, the villa names and
 * storeys (Thoi, Persi, Eeanthe, Melia), and the "ideal for" line.
 * `npm run prose-audit` now diffs the live copy sentence by sentence so this
 * class of loss cannot recur silently.
 */

export interface Venue {
  slug: string;
  name: string;
  category: string;
  /** Short line used on cards and in the venue index. */
  standfirst: string;
  /** Full description paragraphs, in original order. */
  body: string[];
  /** Heading that introduced the bullet list on the live site. */
  advantagesHeading: string;
  advantages: string[];
  /** Extra facts the original rendered as a “– item” list. */
  factList?: { heading: string; items: string[] };
  capacity: string;
  /** Rendered as an underlined note on the live site. */
  note?: string;
  coverImage: string;
  gallery: string[];
  /** `src` points at the web-ready transcode; `webm` is absent when VP9 lost. */
  video?: { src: string; webm?: string; poster?: string; original: string };
  mapEmbed: string;
  /** Direct maps.google.com link, used when the embed fails to load. */
  mapLink: string;
  location: string;
  /**
   * Decoded from the marker label inside each venue's live Google Maps embed
   * (the base64 `!2z…` segment), so these are the venue's own published
   * coordinates rather than anything derived or invented. Used as an annotation
   * motif on the venue index and venue pages.
   */
  coordinates: string;
}

export const venuesIntro = {
  heading: "Venues",
  subheading: "",
} as const;

export const venues: Venue[] = [
  {
    slug: "thalasses",
    name: "Thalasses",
    category: "Venue",
    standfirst:
      "White walls, blue water, and a private beach fifty metres away.",
    body: [
      "Hotel-level facilities and comfort, with far more privacy than a hotel.",
      "Each villa can be rented separately, or the entire complex reserved for a larger wedding group.",
      "Every villa faces the sea and keeps its own privacy, so everyone stays together while still having their own space. The front pair, Thoi and Persi, are single-storey; the rear pair, Eeanthe and Melia, are two-storey.",
      "Ideal for seaside weddings, relaxed welcome dinners, and multi-day celebrations.",
    ],
    factList: {
      heading: "When booked as a full estate, guests enjoy:",
      items: [
        "4 independent villas",
        "9 bedrooms",
        "6 bathrooms",
        "accommodation for up to 18 guests",
        "private beach just 50 meters away",
      ],
    },
    advantagesHeading: "A major advantage for weddings:",
    advantages: [
      "Sea views for both the ceremony and the party",
      "LGBTQ+ friendly",
      "Cycladic white and blue — unmistakably Greek",
      "Calm surroundings and direct beach access",
    ],
    capacity: "How many people can fit: up to 300",
    // thspire2.png was the live gallery's opening frame. It is byte-identical to
    // the old masthead spire2.png, flagged in TEXT-FIXES.md §B5 as reading
    // synthetic rather than photographed — no EXIF, no ICC, PNG at 1534×1023,
    // and a pool reflection that does not obey the geometry of the scene. Under
    // the Phase 6 imagery law (no AI-generated photographic imagery) it is out.
    coverImage: "/media/th3-DSC_5495.jpg",
    gallery: [
      "/media/th3-DSC_5495.jpg",
      "/media/th4.jpg",
      "/media/th1-DSC_9500.jpg",
      "/media/th3-DSC_9730.jpg",
      "/media/th2b-DSC_5385.jpg",
      "/media/th2.jpg",
      "/media/th10-DSC_9568.jpg",
      "/media/th3.jpg",
      "/media/th6.jpg",
      "/media/thDSC_5301.jpg",
      "/media/thDSC_5309.jpg",
      "/media/thDSC_5448.jpg",
      "/media/thDSC_5488.jpg",
      "/media/thDSC_9614.jpg",
      "/media/thIMG_4572.JPG",
      "/media/thIMG_5363.jpg",
      "/media/thLD_LK_110.jpg",
      "/media/thLK_LD_068.jpg",
      "/media/thLK_LD_071.jpg",
      "/media/thLK_LD_158.jpg",
      "/media/thspire-6.jpg",
      "/media/thspire.JPG",
    ],
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3892.559856708437!2d24.56955437624826!3d35.381023546406105!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzXCsDIyJzUxLjciTiAyNMKwMzQnMTkuNyJF!5e1!3m2!1sel!2sgr!4v1770970773911!5m2!1sel!2sgr",
    location: "Private beachfront, Rethymno, Crete",
    coordinates: "35°22'51.7\"N  24°34'19.7\"E",
    mapLink: "https://www.google.com/maps/search/?api=1&query=35.381023546406105,24.56955437624826",
  },
  {
    slug: "mountain-escape",
    name: "Mountain Escape",
    category: "Venue",
    standfirst:
      "Mountains behind, the sea ahead. Sixty-five private acres and three pools.",
    body: [
      "A luxury wedding villa with the whole estate to yourselves — total privacy, and room to celebrate.",
      "Three fully equipped apartments, rented together as one exclusive home.",
      "Built for intimate destination weddings, family gatherings, and celebrations that run over several days.",
    ],
    advantagesHeading: "A major advantage for weddings:",
    advantages: [
      "No strict party curfew",
      "A pool setting for ceremonies and parties, with a mountain view",
      "LGBTQ+ friendly",
      "Private, 25 minutes from Rethymno",
      "Wedding preparations can happen on site",
      "Additional services available: lights, kids' corner, bar, catering, DJ and more",
    ],
    capacity: "How many people can fit: up to 200",
    coverImage: "/media/md1.jpg",
    gallery: [
      "/media/md1.jpg",
      "/media/md14.jpg",
      "/media/md2-1.jpg",
      "/media/md2.jpg",
      "/media/md22-2.jpg",
      "/media/md4.jpg",
      "/media/md40-1.jpg",
      "/media/md5.jpg",
      "/media/md8.jpg",
      "/media/mdGEOR0397-Edit (1).jpg",
      "/media/mdGEOR3094.jpg",
      "/media/mdGEOR3108.jpg",
      "/media/mdGEOR3136.jpg",
      "/media/mdGEOR3143.jpg",
      "/media/mdGEOR3178.jpg",
      "/media/md42.jpg",
    ],
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3257.5152152324276!2d24.316863326591754!3d35.26831451587843!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzXCsDE2JzA2LjIiTiAyNMKwMTknMTUuMCJF!5e0!3m2!1sel!2sgr!4v1752047139314!5m2!1sel!2sgr",
    location: "25 minutes from Rethymno, Crete",
    coordinates: "35°16'06.2\"N  24°19'15.0\"E",
    mapLink: "https://www.google.com/maps/search/?api=1&query=35.26831451587843,24.316863326591754",
  },
  {
    slug: "olive-stories",
    name: "Olive Stories",
    category: "Venue",
    standfirst:
      "Open land and olive trees, where the party does not have to stop early.",
    body: [
      "A large natural field with electricity and water — for couples who want the celebration outdoors and unpolished.",
      "This is where long tables, fairy lights in the olive trees, live music and barefoot dancing belong.",
      "It has everything a night under the stars needs, and no city noise restrictions apply.",
    ],
    advantagesHeading: "Perfect for:",
    advantages: [
      "Rustic weddings",
      "Boho celebrations",
      "Relaxed receptions",
      "Authentic Cretan-style gatherings",
      "LGBTQ+ friendly",
      "Raw, simple and full of character",
    ],
    capacity: "How many people can fit: up to 200-300",
    coverImage: "/media/xDJI_20260207131326_0065_D.jpg",
    gallery: [
      "/media/xDJI_20260207131326_0065_D.jpg",
      "/media/xDJI_20260207131333_0066_D.jpg",
      "/media/xDJI_20260207131336_0067_D.jpg",
      "/media/xDJI_20260207131338_0068_D.jpg",
      "/media/xDJI_20260207131447_0075_D.jpg",
    ],
    video: {
      // No webm — VP9 came out larger than the MP4 for this clip, so it was dropped.
      src: "/media/video/olive-stories.mp4",
      poster: "/media/video/olive-stories.jpg",
      original: "/media/xorafi.mp4",
    },
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d973.5117286642959!2d24.600230369642784!3d35.35019019214037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzXCsDIxJzAwLjciTiAyNMKwMzYnMDMuMiJF!5e1!3m2!1sel!2sgr!4v1770971107594!5m2!1sel!2sgr",
    location: "Open countryside, Rethymno, Crete",
    coordinates: "35°21'00.7\"N  24°36'03.2\"E",
    mapLink: "https://www.google.com/maps/search/?api=1&query=35.35019019214037,24.600230369642784",
  },
];

export const getVenue = (slug: string) => venues.find((v) => v.slug === slug);
export const venueSlugs = venues.map((v) => v.slug);
