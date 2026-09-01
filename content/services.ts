/**
 * The five service blocks, verbatim from the live #services section.
 * `body` is split into text/link runs so the two external creteholidayhome.com
 * links survive the redesign exactly where they were.
 */

export type CopyRun =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

export interface Service {
  slug: string;
  title: string;
  body: CopyRun[];
  /** Editorial image chosen from the existing site galleries (see MEDIA-CHOICES.md). */
  image: string;
}

export const servicesIntro = {
  heading: "Services",
  /* Phase 6 copy pass — was "Making your perfect Event in Crete stress-free and
     unforgettable". Keeps the "event in Crete" keyword pair. */
  subheading: "Everything a celebration in Crete asks of you, taken off your hands.",
} as const;

export const services: Service[] = [
  {
    slug: "type-of-events",
    title: "Type of Events",
    body: [
      {
        type: "text",
        value:
          "Destination weddings and private villa celebrations. Corporate retreats and luxury brand events. Anniversaries and birthdays, wellness and yoga retreats, private chef experiences, sunset dinners and exclusive gatherings.",
      },
    ],
    image: "/media/blDSC_9694.jpg",
  },
  {
    slug: "wedding-planning-and-coordination",
    title: "Wedding Planning & Coordination",
    body: [
      {
        type: "text",
        value:
          "Complete wedding planning, supplier coordination and budget control — and someone running the day itself, so you do not have to.",
      },
    ],
    image: "/media/jdIMG_8746.JPG",
  },
  {
    slug: "accommodation-and-stay",
    title: "Accommodation & Stay",
    body: [
      { type: "text", value: "Handpicked luxury " },
      { type: "link", value: "villas", href: "https://www.creteholidayhome.com" },
      {
        type: "text",
        value:
          " for the stay as well as the celebration. Comfort and privacy, for you and everyone you bring.",
      },
    ],
    image: "/media/md8.jpg",
  },
  {
    slug: "legal-and-symbolic-weddings-in-crete",
    title: "Legal and Symbolic Weddings in Crete",
    body: [
      {
        type: "text",
        value:
          "Full legal guidance, document handling, translations and municipality coordination — so the civil ceremony in Greece is one less thing to carry.",
      },
    ],
    image: "/media/we3-IMG_5776.JPG",
  },
  {
    slug: "guest-care-and-experiences",
    title: "Guest Care & Experiences",
    body: [
      { type: "text", value: "Curated " },
      { type: "link", value: "experiences", href: "https://creteholidayhome.com/experiences/" },
      {
        type: "text",
        value:
          " for the days either side — private chefs, sailing, wellness, outdoor activities and exclusive local tours.",
      },
    ],
    image: "/media/blDSC_9611.jpg",
  },
];

/** Plain-text rendering of a service body, for meta descriptions and alt text. */
export const runsToText = (runs: CopyRun[]): string => runs.map((r) => r.value).join("");
