import type { MetadataRoute } from "next";
import { v2source } from "@/lib/source";

const BASE_URL = "https://cipherstash.com/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the v2 tree. The legacy `source` (content/stack) is served entirely
  // as 307s to its v2 homes, so listing it advertised 86 redirecting URLs to
  // crawlers — an error on every one. The distinction goes away with
  // content/stack itself (CIP-3335).
  return v2source.getPages().map((page) => ({
    // `page.url` is "/" for the tree root, which would emit a trailing slash.
    // `generateMetadata` canonicalises that page as ".../docs" with no slash,
    // so the slashed form made the sitemap point at a non-canonical URL — and
    // left the canonical one missing from the sitemap entirely.
    url: page.url === "/" ? BASE_URL : `${BASE_URL}${page.url}`,
    // No `lastModified`: the only value available at build time is "now",
    // which would claim every page changed on every deploy. Crawlers discount
    // a lastmod that always moves, so omitting it beats asserting a false one.
    // Restore it if the MDX config starts sourcing real modification times.
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
