import type { ShikiTransformer } from "@shikijs/types";
import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/stack",
  docs: {
    // `seoTitle` overrides the <title>/OG title for pages whose visual `title`
    // is brand-styled (e.g. "/ENCRYPTION") and not ideal for search results.
    schema: pageSchema.extend({
      seoTitle: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// V2 information architecture (CIP-3325). New content lives in content/docs
// and is served from the site root (e.g. /docs/get-started/...). The legacy
// `docs` collection above (content/stack) is served alongside it during the
// migration and is deleted once the last section moves. See IA.md.
export const v2docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({
      seoTitle: z.string().optional(),
      // Sidebar label, when it should differ from the page's `title` (which is
      // also the H1). Mainly for section index pages: the folder already names
      // the section, so repeating it on the index item is noise. Applied to the
      // page tree in `src/lib/source.ts`; never affects the URL or the H1.
      navTitle: z.string().optional(),
      // Diátaxis page type. Every page should declare one; enforced by the
      // docs lint (CIP-3337) rather than the schema so stubs can land first.
      type: z.enum(["tutorial", "guide", "concept", "reference"]).optional(),
      // Facets powering index pages, filtered views, and the future
      // tailored-quickstart picker (CIP-3339). Nav position never depends on
      // these — the sidebar tree comes from meta.json alone.
      components: z
        .array(z.enum(["encryption", "platform", "eql", "proxy", "cli"]))
        .optional(),
      audience: z.array(z.enum(["developer", "cto", "ciso"])).optional(),
      integration: z
        .object({
          category: z.enum([
            "platform",
            "orm",
            "framework",
            "auth-provider",
            "language",
            "runtime",
          ]),
          setup: z.enum(["code-only", "dashboard-required"]),
          pairsWith: z.array(z.string()).optional(),
        })
        .optional(),
      // Review tracking (CIP-3337): API pages pin the releases they were
      // verified against (e.g. { stack: "1.2.0", eql: "3.0.0" }); claims pages
      // (compliance, pricing, comparisons) carry a review-by date instead.
      verifiedAgainst: z.record(z.string(), z.string()).optional(),
      reviewBy: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// Parse the leftover code-fence meta string (what remains after Fumadocs
// extracts `title`, `tab`, and line-number directives) for the analytics
// attributes documented for authors: `example-id`, `cta`, and `cta-type`.
// Attribute names may contain hyphens, e.g. `example-id="drizzle-basic-query"`.
function parseTrackingAttributes(raw: string): Record<string, string | true> {
  const attributes: Record<string, string | true> = {};
  // Accept quoted ("…"/'…') and bare unquoted values, so a forgotten quote
  // (`example-id=foo`) still parses instead of being silently dropped. A bare
  // key with no value (`cta`) is recorded as `true`.
  const pattern = /(?<=^|\s)([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
  for (const match of raw.matchAll(pattern)) {
    const [, name, double, single, unquoted] = match;
    attributes[name] = double ?? single ?? unquoted ?? true;
  }
  return attributes;
}

// Emit code-fence metadata as `data-*` attributes on the rendered `<pre>` so the
// client-side copy button (see `src/components/code-block.tsx`) can report it to
// PostHog. This runs for every code block, so `data-language` is always present
// even when the fence has no meta string (e.g. a plain ```bash block).
const codeCopyTrackingTransformer: ShikiTransformer = {
  name: "cipherstash:code-copy-tracking",
  pre(node) {
    node.properties["data-language"] = this.options.lang ?? "plaintext";

    const raw =
      typeof this.options.meta?.__raw === "string"
        ? this.options.meta.__raw
        : "";
    if (!raw) return;

    const attributes = parseTrackingAttributes(raw);

    // Only emit attributes for non-empty string values, so `example-id=""`
    // falls back to the client-derived id rather than reporting an empty slug.
    const exampleId = attributes["example-id"];
    if (typeof exampleId === "string" && exampleId !== "") {
      node.properties["data-example-id"] = exampleId;
    }
    // Surface the `filename` so the client can derive a readable fallback
    // `example_id` for blocks that lack an explicit `example-id`.
    const filename = attributes.filename;
    if (typeof filename === "string" && filename !== "") {
      node.properties["data-filename"] = filename;
    }
    const ctaType = attributes["cta-type"];
    const hasCtaType = typeof ctaType === "string" && ctaType !== "";
    // `cta` is a flag: a bare `cta` (or `cta="true"`) opts in. An explicit
    // `cta="false"`/`cta=""` is an opt-out that wins even when a `cta-type` is
    // present. A lone `cta-type` (no `cta`) still implies a CTA so the category
    // isn't silently dropped.
    const ctaFlag = attributes.cta;
    const ctaOptOut = ctaFlag === "false" || ctaFlag === "";
    const isCta =
      !ctaOptOut && (ctaFlag === true || ctaFlag === "true" || hasCtaType);
    if (isCta) {
      node.properties["data-cta"] = "true";
      if (hasCtaType) {
        node.properties["data-cta-type"] = ctaType;
      }
    }
  },
};

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // Preserve Fumadocs' default Shiki config (themes, parseMetaString) and
      // its default transformers (notation highlight, diff, focus, word
      // highlight) — passing `transformers` alone would replace them entirely —
      // then append our copy-tracking transformer.
      ...rehypeCodeDefaultOptions,
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        codeCopyTrackingTransformer,
      ],
    },
  },
});
