import { createFromSource } from "fumadocs-core/search/server";
import { v2source } from "@/lib/source";

// Index the canonical documentation collection.
export const { GET } = createFromSource(v2source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
});
