import {
  CalloutContainer,
  CalloutDescription,
  CalloutTitle,
} from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactNode } from "react";
import { BadExample } from "@/components/bad-example";
import { TrackedCodeBlock } from "@/components/code-block";
import { EqlFn } from "@/components/eql-fn";
import { EqlVersion } from "@/components/eql-version";
import { ZeroKmsRegions } from "@/components/zerokms-regions";

/**
 * Fumadocs' own `Callout` is a thin wrapper over these three primitives, but it
 * gives no way to reach the description, which it hard-codes to
 * `text-fd-muted-foreground`. Callouts are the one place on the page that
 * should not recede, so we compose the primitives ourselves to:
 *
 *   - set the body text to `text-fd-foreground`, matching the title (the
 *     container is `text-fd-card-foreground`, which resolves to the same value
 *     in both themes) so a callout reads as one block rather than a heading
 *     over greyed-out copy;
 *   - double the padding, `p-3 ps-1` → `p-6 ps-2` (`ps` stays small because
 *     the accent bar is the first child and sits near the edge);
 *   - add a `data-callout` attribute, which Fumadocs does not emit. global.css
 *     already had a `[data-callout]` rule that consequently matched nothing.
 *
 * `CalloutContainer` still resolves the `warn`/`tip` aliases and picks the
 * icon, so only the trivial wrapper is reimplemented.
 */
function Callout({
  title,
  children,
  className,
  ...props
}: ComponentProps<typeof CalloutContainer> & { title?: ReactNode }) {
  return (
    // CalloutContainer runs its own `cn`, so it merges these against its
    // defaults; a caller's className comes last and still wins.
    <CalloutContainer
      data-callout
      className={`p-6 ps-2 ${className ?? ""}`}
      {...props}
    >
      {title && <CalloutTitle>{title}</CalloutTitle>}
      <CalloutDescription className="text-fd-foreground">
        {children}
      </CalloutDescription>
    </CalloutContainer>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Override the default `pre` so code copies fire a PostHog `code_copied`
    // event; metadata comes from `data-*` attributes set in `source.config.ts`.
    pre: TrackedCodeBlock,
    Callout,
    Steps,
    Step,
    BadExample,
    EqlVersion,
    EqlFn,
    ZeroKmsRegions,
    ...components,
  };
}
