"use client";

import { useState } from "react";

interface EqlFnProps {
  /** Comma-separated operator equivalents, e.g. `<,<=,>,>=`. */
  ops: string;
  /** Comma-separated short domain names the function applies to. */
  domains?: string;
  /** Aggregate function (MIN/MAX): labels the row "Aggregate". */
  agg?: boolean;
  /** How many domains to show before the "Show all" toggle. */
  initial?: number;
  /** The worked example (a fenced code block). */
  children: React.ReactNode;
}

/**
 * The body of one entry in a generated EQL function reference (see the
 * fragments under content/partials/eql, produced by
 * scripts/generate-eql-api-docs.ts).
 *
 * The function name is a real Markdown heading in the fragment (so it appears
 * in the page's table of contents and is deep-linkable); this component renders
 * everything below it — the operator equivalents, the domains it applies to,
 * and the example. The domain list is the drift-prone part, so it comes from
 * the manifest via the `domains` prop; only the first few show, with the rest
 * behind a reader-controlled toggle. The example is passed as children so it
 * keeps the site's syntax highlighting and copy button.
 */
export function EqlFn({
  ops,
  domains,
  agg,
  initial = 2,
  children,
}: EqlFnProps) {
  const opList = ops.split(",").filter(Boolean);
  const domainList = domains ? domains.split(",").filter(Boolean) : [];
  const [expanded, setExpanded] = useState(false);
  const hidden = Math.max(0, domainList.length - initial);
  const visible = expanded ? domainList : domainList.slice(0, initial);
  const label = agg ? "Aggregate" : "Operators";

  return (
    <div className="my-4 rounded-lg border border-fd-border bg-fd-card p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
          {label}
        </span>
        {opList.map((op) => (
          <span
            key={op}
            className="rounded-md border border-fd-primary/30 bg-fd-primary/10 px-2 py-0.5 font-mono text-sm font-semibold text-fd-primary"
          >
            {op}
          </span>
        ))}
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
