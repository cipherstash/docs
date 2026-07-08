import { Callout as FumaCallout } from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { BadExample } from "@/components/bad-example";
import { TrackedCodeBlock } from "@/components/code-block";
import { EqlFn } from "@/components/eql-fn";
import { EqlVersion } from "@/components/eql-version";
import { Faq } from "@/components/faq";
import { ZeroKmsRegions } from "@/components/zerokms-regions";

/**
 * Callouts keep Fumadocs' own body colour — `text-fd-muted-foreground`, the
 * same token the sidebar's resting nav items use — so they sit at the same
 * weight as the rest of the chrome rather than shouting. This wrapper only:
 *
 *   - doubles the padding, `p-3 ps-1` → `p-6 ps-2`. `ps` stays proportionally
 *     small because the accent bar is the container's first child and sits
 *     near the edge;
 *   - adds a `data-callout` attribute, which Fumadocs does not emit. global.css
 *     has had a `[data-callout]` rule since the theme work that consequently
 *     matched nothing.
 *
 * Fumadocs' `Callout` still resolves the `warn`/`tip` aliases, picks the icon
 * and renders the title, and it spreads unknown props onto the container, so
 * there is nothing here to reimplement.
 */
function Callout({ className, ...props }: ComponentProps<typeof FumaCallout>) {
  // CalloutContainer runs its own `cn`, so these merge against its defaults;
  // a caller's className comes last and still wins.
  return (
    <FumaCallout
      data-callout
      className={`p-6 ps-4 ${className ?? ""}`}
      {...props}
    />
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
    Faq,
    ...components,
  };
}
