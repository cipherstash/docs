"use client";

import { useState } from "react";

interface EqlFnProps {
  /** Function name or grouped signature, e.g. `eql_v3.eq(a, b)`. */
  name: string;
  /** Comma-separated operator equivalents, e.g. `<,<=,>,>=`. */
  ops: string;
  /** Comma-separated short domain names the function applies to. */
  domains?: string;
  /** Aggregate function (MIN/MAX): renders an "aggregate" tag, no operator. */
  agg?: boolean;
  /** One card standing in for several related functions (the comparison set). */
  grouped?: boolean;
  /** How many domains to show before the "Show all" toggle. */
  initial?: number;
  /** The example code block. */
  children: React.ReactNode;
}

/**
 * One entry in a generated EQL function reference (see the fragments under
 * content/partials/eql, produced by scripts/generate-eql-api-docs.ts).
 *
 * Renders the function signature, its operator equivalents, and the domains it
 * applies to as a card. The domain list is the drift-prone part, so it comes
 * from the manifest via the `domains` prop; only the first few show, with the
 * rest behind a reader-controlled toggle. The example is passed as children so
 * it keeps the site's normal syntax highlighting and copy button.
 */
export function EqlFn({
  name,
  ops,
  domains,
  agg,
  grouped,
  initial = 2,
  children,
}: EqlFnProps) {
  const opList = ops.split(",").filter(Boolean);
  const domainList = domains ? domains.split(",").filter(Boolean) : [];
  const [expanded, setExpanded] = useState(false);
  const hidden = Math.max(0, domainList.length - initial);
  const visible = expanded ? domainList : domainList.slice(0, initial);

  return (
    <div
      className={`my-4 rounded-lg border p-4 ${
        grouped
          ? "border-fd-primary/40 bg-fd-primary/5"
          : "border-fd-border bg-fd-card"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[0.95rem] font-semibold text-fd-primary">
          {name}
        </span>
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

      <div className="mt-3 [&>*]:!my-0">{children}</div>
    </div>
  );
}
