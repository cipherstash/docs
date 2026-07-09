"use client";

import {
  CodeBlock,
  type CodeBlockProps,
  Pre,
} from "fumadocs-ui/components/codeblock";
import { slug } from "github-slugger";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { type MouseEvent, useCallback, useEffect, useRef } from "react";
import { Mermaid } from "@/components/mermaid";

// Build-time metadata is attached to the `<pre>` as `data-*` attributes by the
// `cipherstash:code-copy-tracking` Shiki transformer (see `source.config.ts`).
type TrackingProps = {
  "data-language"?: string;
  "data-example-id"?: string;
  "data-filename"?: string;
  "data-cta"?: string;
  "data-cta-type"?: string;
  /** Raw diagram source, carried through for `mermaid` fences. */
  "data-mermaid"?: string;
};

/**
 * Drop-in replacement for the Fumadocs `pre` MDX component that keeps the
 * default code block (highlighting, copy button, tabs) untouched but adds
 * PostHog instrumentation:
 *
 * - `code_copied` whenever the copy button is clicked (any code block).
 * - `cta_viewed` once when a CTA block scrolls into view, forming a per-page
 *   "saw the CTA -> copied it" funnel against `code_copied` (is_cta: true).
 *
 * Rather than reimplement Fumadocs' copy logic, we listen for the copy button
 * click via event delegation on the `<figure>` wrapper.
 */
export function TrackedCodeBlock(props: CodeBlockProps) {
  const attrs = props as CodeBlockProps & TrackingProps;
  const language = attrs["data-language"] ?? "plaintext";

  // A ```mermaid fence is a code fence everywhere except on screen: the source
  // survives in the mdast (so `.mdx` and llms.txt keep it readable), and the
  // rendered page gets a diagram instead of an overflowing block of syntax.
  const mermaidChart = attrs["data-mermaid"];
  if (language === "mermaid" && mermaidChart) {
    return <Mermaid chart={mermaidChart} />;
  }

  const exampleId = attrs["data-example-id"];
  const isCta = attrs["data-cta"] === "true";
  const ctaType = attrs["data-cta-type"];
  const filename =
    attrs["data-filename"] ??
    (typeof props.title === "string" ? props.title : undefined);

  // Pathname without the `/docs` basePath, matching the $pageview event in
  // `src/lib/posthog/provider.tsx` so the events join on a consistent page key.
  const pagePath = usePathname();

  const figureRef = useRef<HTMLElement>(null);
  // Resolve the `example_id` once and cache it, so `cta_viewed` and
  // `code_copied` for the same block always report the same id — the auto
  // fallback derives a positional index that must not drift between the
  // scroll-time and click-time events.
  const cachedExampleId = useRef<string | null>(null);
  const resolveExampleId = useCallback(() => {
    if (exampleId) return exampleId;
    if (cachedExampleId.current === null) {
      cachedExampleId.current = autoExampleId(
        figureRef.current,
        filename,
        language,
      );
    }
    return cachedExampleId.current;
  }, [exampleId, filename, language]);

  // Fire `cta_viewed` once per mount when a CTA block enters the viewport.
  // Re-firing on client-side back/forward navigation is intentional: it mirrors
  // the per-pageview `$pageview` model, so impressions stay comparable.
  useEffect(() => {
    if (!isCta) return;
    const figure = figureRef.current;
    if (!figure || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      posthog.capture("cta_viewed", {
        page_path: pagePath,
        example_id: resolveExampleId(),
        ...(ctaType ? { cta_type: ctaType } : {}),
      });
      observer.disconnect();
    });
    observer.observe(figure);

    return () => observer.disconnect();
  }, [isCta, ctaType, pagePath, resolveExampleId]);

  function handleClick(event: MouseEvent<HTMLElement>) {
    // The click can originate on the copy button's inner <svg>/<path>; guard
    // for a real Element before walking up. `closest` lives on Element, so this
    // also covers SVG targets without an unsafe HTMLElement cast.
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!button) return;

    // The Fumadocs copy button is the only button inside the code block; its
    // aria-label toggles between "Copy Text" and "Copied Text".
    const label = button.getAttribute("aria-label") ?? "";
    if (!/^Cop(y|ied)/.test(label)) return;

    // Don't count a copy the browser can't actually perform: Fumadocs' copy
    // uses `navigator.clipboard`, which is absent in insecure (non-HTTPS)
    // contexts and there silently rejects.
    if (!navigator.clipboard) return;

    posthog.capture("code_copied", {
      page_path: pagePath,
      example_id: resolveExampleId(),
      language,
      is_cta: isCta,
      ...(isCta && ctaType ? { cta_type: ctaType } : {}),
    });
  }

  return (
    <CodeBlock {...props} ref={figureRef} onClick={handleClick}>
      <Pre>{props.children}</Pre>
    </CodeBlock>
  );
}

// Derive a stable-per-page slug for code blocks that authors haven't tagged
// with an explicit `example-id`. Combines the filename (or language) with the
// block's position on the page so repeated filenames stay distinct. Uses
// `github-slugger` — the same slugger Fumadocs uses for heading anchors — so
// ids line up with on-page anchors.
function autoExampleId(
  figure: Element | null,
  filename: string | undefined,
  language: string,
): string {
  // `slug()` can return "" for filenames that are all punctuation/non-ASCII;
  // fall back to the language so the id is never bare (e.g. "-0").
  const base = (filename && slug(filename)) || language;
  let index = 0;
  if (figure) {
    const figures = Array.from(document.querySelectorAll("figure.shiki"));
    index = Math.max(0, figures.indexOf(figure));
  }
  return `${base}-${index}`;
}
