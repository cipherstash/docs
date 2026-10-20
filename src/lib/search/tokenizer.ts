/** Split camelCase and separators without stemming API names or dropping LIKE. */
function words(input: string): string[][] {
  return (
    input
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .match(/[\p{L}\p{N}_./-]+/gu) ?? []
  )
    .map((word) => word.split(/[_./-]+/).filter(Boolean))
    .filter((parts) => parts.length);
}

/**
 * Dots and underscores are interchangeable namespaces: eql_v3.text_eq also
 * finds public.eql_v3_text_eq. Index suffixes at identifier boundaries so
 * text_eq / ord_ore / Supabase match qualified and camelCase symbols. Orama
 * handles prefixes; there is no quadratic list of every substring.
 *
 * Query tokens stay whole. Expanding a query into `text`, `eq`, etc. would
 * dilute precise identifier searches into unrelated prose.
 */
export function tokenize(input: string, _language?: string, property?: string) {
  const tokens = words(input).flatMap((parts) =>
    property
      ? parts.flatMap((part, i) => {
          const camel = part
            .replace(/([a-z\d])([A-Z])/g, "$1_$2")
            .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
            .split("_");
          return [
            parts.slice(i).join("_"),
            ...camel.flatMap((word, j) => [word, camel.slice(j).join("")]),
          ];
        })
      : [parts.join("_")],
  );
  return [...new Set(tokens.map((token) => token.toLowerCase()))];
}

export const identifierTokenizer = { language: "english", tokenize };
