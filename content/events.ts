/**
 * Signature Events — the seven galleries from the live #portfolio1 section and
 * its modals (#portfolio1Modal1–7).
 *
 * Phase 6: titles and categories were rewritten after viewing all 107
 * photographs via `npm run contact-sheets`, and describe what is actually in
 * the frames. The live labels were unreliable — the gallery labelled
 * "Party / dance" opens on a parked motorcycle and contains a single dancing
 * frame. Full mapping and the evidence for each title is in
 * design-review/copy-deck.md §10.
 *
 * `party-dance` was renamed to `sunset-by-the-pool` because the old slug was
 * actively misleading; next.config.ts holds a permanent redirect.
 *
 * Video `src` values point at the web-ready transcodes produced by
 * `npm run media:video`; `original` records the file served by the live site.
 */

export interface EventVideo {
  src: string;
  webm?: string;
  poster?: string;
  original: string;
}

export interface SignatureEvent {
  slug: string;
  title: string;
  category: string;
  coverImage: string;
  gallery: string[];
  videos?: EventVideo[];
}

export const eventsIntro = {
  heading: "Signature Events",
  subheading: "Our collection of events",
} as const;

export const signatureEvents: SignatureEvent[] = [
  {
    slug: "sunset-by-the-pool",
    title: "Sunset by the pool",
    category: "Celebration",
    coverImage: "/media/st2-DSC_5316.jpg",
    gallery: [
      "/media/st2-DSC_5316.jpg",
      "/media/stDSC_5470.jpg",
      "/media/st4-DSC_5272.jpg",
      "/media/stDSC_5270.jpg",
      "/media/stDSC_5297.jpg",
      "/media/stDSC_5285.jpg",
      "/media/stDSC_5301.jpg",
      "/media/stDSC_5309.jpg",
      "/media/stDSC_5318.jpg",
      "/media/stDSC_5295.jpg",
      "/media/stDSC_5322.jpg",
      "/media/stDSC_5387.jpg",
      "/media/stDSC_5378.jpg",
      "/media/stDSC_5448.jpg",
      "/media/st2b-DSC_5385.jpg",
      "/media/stDSC_5441.jpg",
      "/media/stDSC_5488.jpg",
      "/media/stDSC_5500.jpg",
      "/media/stDSC_5496.jpg",
      "/media/st2c-DSC_5359.jpg",
      "/media/stDSC_5281.jpg",
      "/media/stDSC_5492.jpg",
      "/media/stDSC_5355.jpg",
      "/media/stDSC_5339.jpg",
    ],
  },
  {
    // Renamed from the live site's internal "germans" label — approved 2026-08-06.
    slug: "villa-party",
    title: "Villa Party",
    category: "Villa Party",
    coverImage: "/media/deIMG_8838.JPG",
    gallery: [
      "/media/deIMG_8838.JPG",
      "/media/deIMG_8846.JPG",
      "/media/deIMG_8849.JPG",
      "/media/deIMG_8848.JPG",
      "/media/deIMG_8851.JPG",
      "/media/deIMG_8853.JPG",
      "/media/deIMG_8857.JPG",
      "/media/deIMG_8842.JPG",
      "/media/deIMG_8850.JPG",
      "/media/deIMG_8858.JPG",
      "/media/deIMG_8860.JPG",
      "/media/deIMG_8863.JPG",
      "/media/DJI_0742.jpg",
    ],
    videos: [
      {
        src: "/media/video/villa-party-1.mp4",
        webm: "/media/video/villa-party-1.webm",
        poster: "/media/video/villa-party-1.jpg",
        original: "/media/deIMG_8840.MOV",
      },
      {
        src: "/media/video/villa-party-2.mp4",
        webm: "/media/video/villa-party-2.webm",
        poster: "/media/video/villa-party-2.jpg",
        original: "/media/deIMG_8845.MOV",
      },
    ],
  },
  {
    slug: "party-celebration",
    title: "Everyone in white",
    category: "Celebration",
    coverImage: "/media/bl8-DSC_9672.jpg",
    gallery: [
      "/media/bl8-DSC_9672.jpg",
      "/media/blDSC_9594.jpg",
      "/media/b1-DSC_9500.jpg",
      "/media/blDSC_9435.jpg",
      "/media/blDSC_9431.jpg",
      "/media/blDSC_9452.jpg",
      "/media/bl4-DSC_9475.jpg",
      "/media/blDSC_9516.jpg",
      "/media/blDSC_9455.jpg",
      "/media/blDSC_9481.jpg",
      "/media/blDSC_9498.jpg",
      "/media/bl10-DSC_9568.jpg",
      "/media/blDSC_9465.jpg",
      "/media/blDSC_9443.jpg",
      "/media/blDSC_9533.jpg",
      "/media/blDSC_9541.jpg",
      "/media/blDSC_9563.jpg",
      "/media/bl3-DSC_9730.jpg",
      "/media/blDSC_9489.jpg",
      "/media/blDSC_9581.jpg",
      "/media/blDSC_9611.jpg",
      "/media/blSC_9476.jpg",
      "/media/blDSC_9614.jpg",
      "/media/blDSC_9643.jpg",
      "/media/blDSC_9662.jpg",
      "/media/blDSC_9694.jpg",
      "/media/blDSC_9719.jpg",
      "/media/blDSC_9724.jpg",
      "/media/blDSC_9777.jpg",
      "/media/blDSC_9792.jpg",
      "/media/blDSC_9805.jpg",
    ],
  },
  {
    slug: "wedding-rituals-aerial",
    title: "Vows on the sand",
    category: "Wedding",
    coverImage: "/media/we2-IMG_4978.JPG",
    gallery: [
      "/media/we2-IMG_4978.JPG",
      "/media/we1-DJI_0102.JPG",
      "/media/we4-DJI_0118.JPG",
      "/media/weDJI_0091.JPG",
      "/media/weDJI_0096.JPG",
      "/media/we2-DJI_0098.JPG",
      "/media/we3-IMG_5776.JPG",
      "/media/weDJI_0092.JPG",
      "/media/weIMG_5840.JPG",
    ],
  },
  {
    slug: "dinner-celebration",
    title: "Under the shade sail",
    category: "Celebration",
    coverImage: "/media/jdIMG_8748.JPG",
    gallery: [
      "/media/jdIMG_8748.JPG",
      "/media/jdIMG_8746.JPG",
      "/media/jdIMG_8747.JPG",
    ],
    videos: [
      {
        // The live gallery listed the raw .MOV, its transcode and its poster as
        // if all three were photographs, so next/image was being handed a video
        // file. The film now sits where every other event's film sits.
        src: "/media/video/dinner-celebration-1.mp4",
        poster: "/media/video/dinner-celebration-1.jpg",
        original: "/media/jdIMG_8749.MOV",
      },
    ],
  },
  {
    slug: "party-drone",
    title: "From above",
    category: "From the air",
    coverImage: "/media/paDJI_2289.JPG",
    gallery: [
      "/media/paDJI_2289.JPG",
      "/media/paDJI_2232.JPG",
      "/media/paDJI_2238.JPG",
      "/media/paDJI_2245.JPG",
      "/media/paDJI_2258.JPG",
      "/media/paDJI_2260.JPG",
      "/media/paDJI_2271.JPG",
      "/media/paDJI_2225.JPG",
      "/media/pa3-DJI_2231.JPG",
      "/media/pa2-DJI_2268.JPG",
      "/media/pa1-DJI_2284.JPG",
      "/media/paDJI_2286.JPG",
      "/media/paDJI_2290.JPG",
      "/media/paDJI_2293.JPG",
      "/media/paDJI_2295.JPG",
    ],
    videos: [
      {
        src: "/media/video/party-drone-1.mp4",
        webm: "/media/video/party-drone-1.webm",
        poster: "/media/video/party-drone-1.jpg",
        original: "/media/paDJI_2282.mp4",
      },
      {
        src: "/media/video/party-drone-2.mp4",
        webm: "/media/video/party-drone-2.webm",
        poster: "/media/video/party-drone-2.jpg",
        original: "/media/paDJI_2288.MP4",
      },
    ],
  },
  {
    slug: "wedding-rituals-olive",
    title: "A ceremony by the water",
    category: "Wedding",
    coverImage: "/media/olIMG_5365.jpg",
    gallery: [
      "/media/olIMG_5365.jpg",
      "/media/olth10-DSC_9568.jpg",
      "/media/olth2.jpg",
      "/media/olth4.jpg",
      "/media/olth6.jpg",
      "/media/olthDSC_5301.jpg",
      "/media/olthIMG_5363.jpg",
      "/media/olthspire.JPG",
    ],
    videos: [
      {
        // posterimage.png is a 1920×1080 frame lifted from the wedding film, so
        // it stays the poster but no longer sits in the stills grid at video
        // resolution alongside photographs (TEXT-FIXES.md §B4).
        //
        // It is served here as a 175 KB JPEG rather than the original 2,967 KB
        // PNG. A <video poster> is a raw attribute, so it never passes through
        // next/image and nothing was optimising it — that single file was 3 MB
        // of the 4.1 MB Lighthouse measured on /events, and the largest asset
        // on the site by a factor of twelve. Same frame, 94% smaller.
        src: "/media/video/wedding-rituals-olive-1.mp4",
        webm: "/media/video/wedding-rituals-olive-1.webm",
        poster: "/media/video/wedding-rituals-olive-poster.jpg",
        original: "/media/Wedding clip.mp4",
      },
    ],
  },
];

/** Distinct category filters, in the order they first appear on the live site. */
export const eventCategories = Array.from(new Set(signatureEvents.map((e) => e.category)));

export const getEvent = (slug: string) => signatureEvents.find((e) => e.slug === slug);
export const eventSlugs = signatureEvents.map((e) => e.slug);
