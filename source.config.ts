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

// Parse the leftover code-fence meta string (what remains after Fumadocs
// extracts `title`, `tab`, and line-number directives) for the analytics
// attributes documented for authors: `example-id`, `cta`, and `cta-type`.
// Attribute names may contain hyphens, e.g. `example-id="drizzle-basic-query"`.
function parseTrackingAttributes(raw: string): Record<string, string | true> {
  const attributes: Record<string, string | true> = {};
  const pattern = /(?<=^|\s)([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g;
  for (const match of raw.matchAll(pattern)) {
    const [, name, double, single] = match;
    attributes[name] = double ?? single ?? true;
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

    const exampleId = attributes["example-id"];
    if (typeof exampleId === "string") {
      node.properties["data-example-id"] = exampleId;
    }
    // Surface the `filename` so the client can derive a readable fallback
    // `example_id` for blocks that lack an explicit `example-id`.
    const filename = attributes.filename;
    if (typeof filename === "string") {
      node.properties["data-filename"] = filename;
    }
    if ("cta" in attributes) {
      node.properties["data-cta"] = "true";
    }
    const ctaType = attributes["cta-type"];
    if (typeof ctaType === "string") {
      node.properties["data-cta-type"] = ctaType;
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
