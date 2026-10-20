export const pageTypes = ["reference", "guide", "concept", "tutorial"] as const;
export type PageType = (typeof pageTypes)[number];
export const MAX_QUERY_LENGTH = 160;

export interface DocsSearchResult {
  id: string;
  type: "page";
  url: string;
  content: string;
  title: string;
  heading: string;
  section: string;
  pageType: PageType | "";
  excerpt: string;
}

export function isPageType(value: string): value is PageType {
  return pageTypes.some((type) => type === value);
}

/** Keep the top three in relevance order, then group the remaining pages. */
export function groupResults(results: DocsSearchResult[]) {
  const groups = new Map<string, DocsSearchResult[]>();
  if (results.length) groups.set("Best matches", results.slice(0, 3));
  for (const result of results.slice(3)) {
    const group = groups.get(result.section) ?? [];
    group.push(result);
    groups.set(result.section, group);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}
