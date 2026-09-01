import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

import { runsToText, services, servicesIntro } from "@content/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceScenes } from "@/components/services/ServiceScenes";
import { CtaBlock } from "@/components/ui/CtaBlock";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { pad2 } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description: `${servicesIntro.subheading} — event types, wedding planning and coordination, accommodation, legal and symbolic weddings, and guest care in Crete.`,
  path: "/services",
  image: "/media/olth4.jpg",
  imageAlt: "A long banquet table set beneath fairy lights beside the sea",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
];

export default function ServicesPage() {
  return (
    <>
      <BreadcrumbSchema items={crumbs} />

      <PageHeader
        eyebrow="Services"
        heading={"Making your perfect event\nstress-free and unforgettable"}
        standfirst="Five ways we take the weight off a celebration planned from a thousand miles away."
        crumbs={crumbs}
        meta={
          <nav aria-label="Services index">
            <ol className="space-y-3.5">
              {services.map((service, i) => (
                <li key={service.slug}>
                  <a
                    href={`#${service.slug}`}
                    className="group flex gap-5 text-[0.95rem] text-muted transition-colors duration-[450ms] hover:text-bone"
                  >
                    <span className="eyebrow pt-1.5 text-faint">{pad2(i + 1)}</span>
                    {service.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        }
      />

      <div className="bg-ink pb-section">
        <ServiceScenes />
      </div>

      <CtaBlock
        heading={"Tell us what\nyou have in mind"}
        standfirst={runsToText(services[1].body)}
      />
    </>
  );
}
