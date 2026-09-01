import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] uppercase tracking-[0.16em] text-faint">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-3">
              {last ? (
                <span aria-current="page" className="text-muted">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors duration-300 hover:text-bone">
                  {item.name}
                </Link>
              )}
              {!last && (
                <span aria-hidden className="text-hair">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
