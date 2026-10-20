import type { MetadataRoute } from "next";
import { v2source } from "@/lib/source";

const BASE_URL = "https://cipherstash.com/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  return v2source.getPages().map((page) => ({
    // `page.url` is "/" for the tree root, which would emit a trailing slash.
    // `generateMetadata` canonicalises that page as ".../docs" with no slash,
    // so the slashed form made the sitemap point at a non-canonical URL — and
    // left the canonical one missing from the sitemap entirely.
    url: page.url === "/" ? BASE_URL : `${BASE_URL}${page.url}`,
    // The last commit that touched the page's source file, stamped by the
    // last-modified plugin in source.config.ts. This was `new Date()`, which
    // claimed every page changed on every deploy — a lastmod that always moves
    // is one crawlers learn to ignore. Pages with no git history (generated at
    // build time, or a shallow clone) carry no timestamp and correctly emit no
    // <lastmod> rather than an invented one.
    lastModified: page.data.lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
