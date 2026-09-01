/**
 * "Your Wedding Journey with Domisignature" — the six steps from the live
 * #about section.
 *
 * Phase 6b: rewritten into a "how it works" register — numbered, concrete,
 * calm, one clear action per step. Every fact from the live copy is carried
 * over: the villa choice and date hold, the style conversation, the guest
 * count / budget / priorities trio, the mood board and its inputs, and the
 * planning scope. Before → after is recorded in design-review/copy-deck.md §8.
 *
 * The live site reused a single placeholder (/media/about_updated.png) on all
 * six steps. Each step now carries a distinct photograph — see MEDIA-CHOICES.md.
 */

export interface JourneyStep {
  number: number;
  title: string;
  /** One short action line per step. */
  body: string[];
  /** Step 3 renders its detail as a list, as the live site did. */
  bullets?: string[];
  image: string;
  imageAlt: string;
}

export const journeyIntro = {
  heading: "How it works",
  subheading: "Six steps, from first note to the ceremony.",
} as const;

export const journey: JourneyStep[] = [
  {
    number: 1,
    title: "Choose your venue and date",
    body: [
      "Pick one of the four and we hold the date. Each offers privacy, natural surroundings and flexible space for both the ceremony and the celebration.",
    ],
    image: "/media/md1.jpg",
    imageAlt: "The Mountain Escape estate with its pools and panoramic mountain and sea views",
  },
  {
    number: 2,
    title: "Tell us how it should feel",
    body: [
      "Elegant, relaxed, rustic or modern. You describe the style, the atmosphere and what matters most; we listen and build around it.",
    ],
    /* Was a Villa Aetos terrace. That venue was removed, so its photographs are
       orphaned — replaced with a real frame from a venue that still exists. */
    image: "/media/stDSC_5470.jpg",
    imageAlt: "A pool lit at dusk beneath strings of lights, the mountains beyond",
  },
  {
    number: 3,
    title: "Set the guest count and the budget",
    body: [
      "Two numbers and your priorities. Everything from here is planned against them, so the plan is realistic from the first week.",
    ],
    bullets: ["guest count", "overall budget", "key priorities"],
    image: "/media/stDSC_5281.jpg",
    imageAlt: "Guests gathered by the sea at golden hour",
  },
  {
    number: 4,
    title: "See the concept before anything is booked",
    body: [
      "A mood board built from your preferences — colours, textures, décor, lighting and the overall feeling — so the day has a clear identity before we move.",
    ],
    image: "/media/thLK_LD_071.jpg",
    imageAlt: "A ceremony arch dressed in white florals and linen against the sea",
  },
  {
    number: 5,
    title: "We plan and coordinate all of it",
    body: [
      "Layout, décor, trusted local partners, timelines, logistics. The organisation is ours so the process stays yours to enjoy.",
    ],
    image: "/media/olth4.jpg",
    imageAlt: "A long banquet table set beneath canopies of fairy lights beside the sea",
  },
  {
    number: 6,
    title: "Come and get married",
    body: ["You arrive. We run the day."],
    image: "/media/we3-IMG_5776.JPG",
    imageAlt: "A couple walking hand in hand through the gardens after their ceremony",
  },
];
