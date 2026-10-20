import { createFromSource } from "fumadocs-core/search/server";
import { v2source } from "@/lib/source";

// Search the current docs; the legacy /stack collection is retained for migration only.
export const { GET } = createFromSource(v2source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
});
