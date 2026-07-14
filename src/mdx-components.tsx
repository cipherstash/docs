import { Callout } from "fumadocs-ui/components/callout";
import { Step, Steps } from "fumadocs-ui/components/steps";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { TrackedCodeBlock } from "@/components/code-block";
import { EqlFn } from "@/components/eql-fn";
import { EqlVersion } from "@/components/eql-version";
import { ZeroKmsRegions } from "@/components/zerokms-regions";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Override the default `pre` so code copies fire a PostHog `code_copied`
    // event; metadata comes from `data-*` attributes set in `source.config.ts`.
    pre: TrackedCodeBlock,
    Callout,
    Steps,
    Step,
    EqlVersion,
    EqlFn,
    ZeroKmsRegions,
    ...components,
  };
}
