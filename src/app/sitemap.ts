import type { MetadataRoute } from "next";
import { source, v2source } from "@/lib/source";

const BASE_URL = "https://cipherstash.com/docs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [...v2source.getPages(), ...source.getPages()].map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
