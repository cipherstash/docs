"use client";

import { useEffect, useId, useState } from "react";

// CipherStash Mermaid theming. Mermaid's `base` theme is the one built to be
// customised via `themeVariables`; these two palettes track the docs' own
// tokens (warm near-black / off-white grounds, the lime brand accent for
// subgraph titles) so diagrams read as part of the site rather than stock
// Mermaid. Applied globally, so every diagram is branded from one place.
const MERMAID_THEME = {
  light: {
    fontFamily: "inherit",
    fontSize: "14px",
    background: "transparent",
    primaryColor: "#ffffff",
    mainBkg: "#ffffff",
    primaryBorderColor: "#d7d3c7",
    nodeBorder: "#d7d3c7",
    primaryTextColor: "#1a1813",
    nodeTextColor: "#1a1813",
    textColor: "#1a1813",
    lineColor: "#8a857a",
    secondaryColor: "#f5f3ee",
    tertiaryColor: "#f5f3ee",
    clusterBkg: "#f5f3ee",
    clusterBorder: "#e2ded2",
    titleColor: "#5f8410",
    edgeLabelBackground: "#faf9f4",
  },
  dark: {
    fontFamily: "inherit",
    fontSize: "14px",
    background: "transparent",
    primaryColor: "#17160f",
    mainBkg: "#17160f",
    primaryBorderColor: "#33322c",
    nodeBorder: "#33322c",
    primaryTextColor: "#eae8dd",
    nodeTextColor: "#eae8dd",
    textColor: "#eae8dd",
    lineColor: "#9a9486",
    secondaryColor: "#100f09",
    tertiaryColor: "#100f09",
    clusterBkg: "#100f09",
    clusterBorder: "#2b2a24",
    titleColor: "#b9e84a",
    edgeLabelBackground: "#0a0a0a",
  },
} as const;

/**
 * Renders a Mermaid diagram authored as a ```mermaid code fence.
 *
 * The fence stays a code fence all the way through the markdown pipeline. The
 * Shiki transformer in `source.config.ts` copies its source onto the `<pre>` as
 * `data-mermaid`, and `TrackedCodeBlock` swaps in this component at render
 * time. That ordering matters: `fumadocs-mdx` serializes the *same* mdast tree
 * that it renders, so a remark plugin rewriting the fence into JSX would also
 * rewrite the markdown we serve at `.mdx` and in llms.txt, where a diagram
 * should degrade to readable source rather than an opaque component call.
 *
 * Mermaid is ~1MB, so it is imported dynamically inside the effect. Only pages
 * that actually contain a diagram pay for it, and it never enters the server
 * bundle.
 */
export function Mermaid({ chart }: { chart: string }) {
  // `useId` yields colons, which are not valid in a DOM id passed to Mermaid.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      const isDark = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        // `base` + themeVariables is Mermaid's customisation path; the palette
        // is the CipherStash one defined above.
        theme: "base",
        themeVariables: isDark ? MERMAID_THEME.dark : MERMAID_THEME.light,
        // Diagram labels should match the surrounding prose, not Mermaid's
        // default sans stack.
        fontFamily: "inherit",
        securityLevel: "strict",
      });

      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        // A malformed diagram falls back to its source rather than blanking the
        // page. `scripts/validate-mermaid.ts` fails the build before this can
        // reach production, so in practice this covers only the render step.
        if (!cancelled) setFailed(true);
      }
    }

    render();

    // Re-render on theme toggle: Mermaid bakes colours into the SVG.
    const observer = new MutationObserver(render);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart, id]);

  if (failed) {
    return (
      <pre className="my-6 overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-4 text-sm">
        <code>{chart}</code>
      </pre>
    );
  }

  if (!svg) {
    // Nothing to reserve: the diagram appears once Mermaid resolves, and a
    // placeholder box would only add a layout jump.
    return null;
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-4 [&_svg]:h-auto [&_svg]:max-w-full"
      // Mermaid output, generated from our own content with securityLevel: strict.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid returns an SVG string.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
