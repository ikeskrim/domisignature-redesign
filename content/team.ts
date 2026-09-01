/** Team section — verbatim from the live #team section. */

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export const teamIntro = {
  /* Phase 6 copy pass — was "Our Amazing Team" / "A passionate group of
     professionals dedicated to creating unforgettable experiences." */
  heading: "The people you will be working with",
  subheading: "Three of us. You will know all three by name before the day arrives.",
} as const;

export const team: TeamMember[] = [
  { name: "Stelios Christidis", role: "Manager", image: "/media/stelios.jpg" },
  { name: "Stavros Kapetanakis", role: "CEO", image: "/media/stavros.jpg" },
  { name: "Daria Zaitseva", role: "Assistance", image: "/media/team2.jpg" },
];

export const teamStatement =
  "We are a close-knit team driven by creativity, attention to detail, and a genuine love for what we do. Every project we take on is guided by collaboration, trust, and a commitment to excellence — ensuring each moment is crafted with care and authenticity.";
