"use client";

import {
  CodeBlock,
  type CodeBlockProps,
  Pre,
} from "fumadocs-ui/components/codeblock";
import posthog from "posthog-js";
import { type MouseEvent, useEffect, useRef } from "react";

// Build-time metadata is attached to the `<pre>` as `data-*` attributes by the
// `cipherstash:code-copy-tracking` Shiki transformer (see `source.config.ts`).
type TrackingProps = {
  "data-language"?: string;
  "data-example-id"?: string;
  "data-filename"?: string;
  "data-cta"?: string;
  "data-cta-type"?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  const exampleId = attrs["data-example-id"];
  const isCta = attrs["data-cta"] === "true";
  const ctaType = attrs["data-cta-type"];
  const filename =
    attrs["data-filename"] ??
    (typeof props.title === "string" ? props.title : undefined);

  const figureRef = useRef<HTMLElement>(null);

  // Fire `cta_viewed` once when a CTA block enters the viewport. `example_id`
  // is resolved with the same logic as `code_copied` so the two events join up.
  useEffect(() => {
    if (!isCta) return;
    const figure = figureRef.current;
    if (!figure || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      posthog.capture("cta_viewed", {
        page_path: window.location.pathname,
        example_id: exampleId ?? autoExampleId(figure, filename, language),
        ...(ctaType ? { cta_type: ctaType } : {}),
      });
      observer.disconnect(); // fire once
    });
    observer.observe(figure);

    return () => observer.disconnect();
  }, [isCta, exampleId, ctaType, filename, language]);

  function handleClick(event: MouseEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;

    // The Fumadocs copy button is the only button inside the code block; its
    // aria-label toggles between "Copy Text" and "Copied Text".
    const label = button.getAttribute("aria-label") ?? "";
    if (!/^Cop(y|ied)/.test(label)) return;

    posthog.capture("code_copied", {
      page_path: window.location.pathname,
      example_id:
        exampleId ??
        autoExampleId(button.closest("figure"), filename, language),
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
// block's position on the page so repeated filenames stay distinct.
function autoExampleId(
  figure: Element | null,
  filename: string | undefined,
  language: string,
): string {
  const base = filename ? slugify(filename) : language;
  let index = 0;
  if (figure) {
    const figures = Array.from(document.querySelectorAll("figure.shiki"));
    index = Math.max(0, figures.indexOf(figure));
  }
  return `${base}-${index}`;
}
