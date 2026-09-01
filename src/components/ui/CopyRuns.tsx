import type { CopyRun } from "@content/services";

/**
 * Renders the service copy runs, preserving the two external
 * creteholidayhome.com links exactly where they sit in the sentence.
 */
export function CopyRuns({ runs }: { runs: CopyRun[] }) {
  return (
    <>
      {runs.map((run, i) =>
        run.type === "link" ? (
          <a
            key={i}
            href={run.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-gold/60 underline-offset-4 transition-colors duration-300 hover:decoration-gold"
          >
            {run.value}
          </a>
        ) : (
          <span key={i}>{run.value}</span>
        ),
      )}
    </>
  );
}
