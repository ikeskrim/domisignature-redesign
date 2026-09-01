import type { MetadataRoute } from "next";

import { site } from "@content/site";
import { venueSlugs } from "@content/venues";
import { eventSlugs } from "@content/events";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/venues", priority: 0.9 },
    { path: "/events", priority: 0.8 },
    { path: "/services", priority: 0.8 },
    { path: "/wedding-guide", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.7 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${site.url}${route.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...venueSlugs.map((slug) => ({
      url: `${site.url}/venues/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...eventSlugs.map((slug) => ({
      url: `${site.url}/events/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
