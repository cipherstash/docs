"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

interface EqlFnProps {
  /** Function name or grouped signature, e.g. `eql_v3.eq(a, b)`. */
  name: string;
  /** Stable anchor id for deep linking, e.g. `fn-eq`. */
  id: string;
  /** Comma-separated operator equivalents, e.g. `<,<=,>,>=`. */
  ops: string;
  /** Comma-separated short domain names the function applies to. */
  domains?: string;
  /** Aggregate function (MIN/MAX): renders an "aggregate" tag, no operator. */
  agg?: boolean;
  /** How many domains to show before the "Show all" toggle. */
  initial?: number;
}

/**
 * One entry in a generated EQL function reference (see the fragments under
 * content/partials/eql, produced by scripts/generate-eql-api-docs.ts).
 *
 * Renders the function signature, its operator equivalents, and the domains it
 * applies to. The domain list is the drift-prone part, so it comes from the
 * manifest via the `domains` prop; only the first few show, with the rest
 * behind a reader-controlled toggle. Worked examples live in each page's own
 * "Example queries" section, not here.
 */
export function EqlFn({
  name,
  id,
  ops,
  domains,
  agg,
  initial = 2,
}: EqlFnProps) {
  const opList = ops.split(",").filter(Boolean);
  const domainList = domains ? domains.split(",").filter(Boolean) : [];
  const [expanded, setExpanded] = useState(false);
  const hidden = Math.max(0, domainList.length - initial);
  const visible = expanded ? domainList : domainList.slice(0, initial);

  return (
    <div
      id={id}
      className="my-4 scroll-mt-24 rounded-lg border border-fd-border bg-fd-card p-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <a
          href={`#${id}`}
          className="group/anchor inline-flex items-center gap-2 font-mono text-[0.95rem] font-semibold text-fd-primary no-underline"
        >
          {name}
          <Link2
            aria-hidden
            className="size-3.5 opacity-0 transition-opacity group-hover/anchor:opacity-60"
          />
        </a>
        <span className="ml-auto flex flex-wrap gap-1.5">
          {agg ? (
            <span className="rounded-md border border-fd-border px-2 py-0.5 text-xs font-medium text-fd-muted-foreground">
              aggregate
            </span>
          ) : null}
          {opList.map((op) => (
            <span
              key={op}
              className="rounded-md border border-fd-primary/30 bg-fd-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-fd-primary"
            >
              {op}
            </span>
          ))}
        </span>
      </div>

      {domainList.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
            On
          </span>
          {visible.map((d) => (
            <span
              key={d}
              className="rounded-md border border-fd-border bg-fd-secondary px-2 py-0.5 font-mono text-xs"
            >
              {d}
            </span>
          ))}
          {hidden > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="rounded-md px-1.5 py-0.5 text-xs font-medium text-fd-primary hover:bg-fd-primary/10 focus-visible:outline-2 focus-visible:outline-fd-primary"
            >
              {expanded
                ? "Show fewer"
                : `Show all ${domainList.length} variants`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
