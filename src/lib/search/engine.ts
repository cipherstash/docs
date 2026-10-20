import { createHash } from "node:crypto";
import { create, insertMultiple, search } from "@orama/orama";
import type { StructuredData } from "fumadocs-core/mdx-plugins/remark-structure";
import {
  type DocsSearchResult,
  MAX_QUERY_LENGTH,
  type PageType,
} from "./shared";
import { identifierTokenizer, tokenize } from "./tokenizer";

export interface SearchPage {
  url: string;
  title: string;
  description?: string;
  pageType?: PageType;
  structuredData: StructuredData;
}

const schema = {
  title: "string",
  heading: "string",
  code: "string",
  prose: "string",
  all: "string",
  pageType: "enum",
} as const;

function sectionFor(url: string) {
  const segments = url.split("/");
  if (segments[1] === "reference") {
    return (
      {
        eql: "EQL",
        stack: "Stack SDK",
        cli: "CLI",
        proxy: "Proxy",
        auth: "Authentication",
        workspace: "Workspace",
      }[segments[2]] ?? "Reference"
    );
  }
  return (
    {
      integrations: "Integrations",
      security: "Security",
      guides: "Guides",
      concepts: "Concepts",
      solutions: "Solutions",
      "get-started": "Get started",
    }[segments[1]] ?? "Documentation"
  );
}

function plainText(text: string) {
  return text
    .replace(/^(`{3,}|~{3,})[^\n]*\n/gm, "")
    .replace(/`/g, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(
      /&(lt|gt|amp|quot|#39);/g,
      (_, entity: string) =>
        ({
          lt: "<",
          gt: ">",
          amp: "&",
          quot: '"',
          "#39": "'",
        })[entity] ?? "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text: string, query: string) {
  const plain = plainText(text);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const positions = terms
    .map((term) => plain.toLowerCase().indexOf(term))
    .filter((i) => i >= 0);
  const start = Math.max(
    0,
    (positions.length ? Math.min(...positions) : 0) - 60,
  );
  return `${start ? "…" : ""}${plain.slice(start, start + 220)}${plain.length > start + 220 ? "…" : ""}`;
}

export async function createDocsSearch(pages: SearchPage[]) {
  const db = create({ schema, components: { tokenizer: identifierTokenizer } });
  const records = pages
    // The retired tree must not reappear through an accidental loader change.
    .filter((page) => !/^\/stack(?:\/|$)/.test(page.url))
    .flatMap((page) => {
      const sections = new Map([
        [
          "",
          {
            heading: "",
            code: [] as string[],
            prose: [page.description ?? ""],
          },
        ],
        ...page.structuredData.headings.map(
          ({ id, content }) =>
            [
              id,
              {
                heading: plainText(content),
                code: [] as string[],
                prose: [] as string[],
              },
            ] as const,
        ),
      ]);
      for (const { heading, content } of page.structuredData.contents) {
        const section = sections.get(heading ?? "");
        if (!section) continue;
        section[/^\s*(`{3,}|~{3,})/.test(content) ? "code" : "prose"].push(
          content,
        );
      }
      return [...sections].map(([anchor, section]) => ({
        id: `${page.url}${anchor ? `#${anchor}` : ""}`,
        page: page.url,
        title: page.title,
        heading: section.heading,
        code: section.code.join("\n"),
        prose: section.prose.join("\n"),
        // Orama applies threshold within each field. A combined field lets
        // "supabase auth" match a page title plus a section heading.
        all: [
          page.title,
          section.heading,
          ...section.code,
          ...section.prose,
        ].join("\n"),
        pageType: page.pageType ?? ("" as const),
        section: sectionFor(page.url),
      }));
    });
  await insertMultiple(db, records);
  // Bundled content is the only input: new deploys build a new index, and the
  // revision lets preview checks detect stale data without exposing the index.
  const revision = createHash("sha256")
    .update(JSON.stringify(records))
    .digest("hex")
    .slice(0, 16);
  const metadata = new Map(records.map((record) => [record.id, record]));

  return {
    revision,
    pageCount: new Set(records.map((record) => record.page)).size,
    async query(
      input: string,
      pageType?: PageType,
    ): Promise<DocsSearchResult[]> {
      const query = input.trim().slice(0, MAX_QUERY_LENGTH);
      const tokens = tokenize(query);
      if (!tokens.length) return [];
      const options = {
        term: query,
        properties: ["title", "heading", "code", "prose", "all"] as const,
        boost: { title: 8, heading: 6, code: 3, prose: 1, all: 0.5 },
        threshold: 0,
        limit: records.length,
        where: pageType ? { pageType: { eq: pageType } } : {},
      };
      let matches = await search(db, {
        ...options,
        properties: [...options.properties],
        tolerance: 0,
      });
      // Exact/prefix hits always win. A typo only broadens an otherwise empty
      // query; short tokens like SQL LIKE must not turn into unrelated words.
      if (!matches.count && tokens.every((token) => token.length >= 5)) {
        matches = await search(db, {
          ...options,
          properties: [...options.properties],
          tolerance: 1,
        });
      }
      const seen = new Set<string>();
      const results: DocsSearchResult[] = [];
      for (const hit of matches.hits) {
        const record = metadata.get(hit.id);
        if (!record || seen.has(record.page)) continue;
        seen.add(record.page);
        const codeMatches = tokens.some((token) =>
          tokenize(record.code, undefined, "code").some((word) =>
            word.startsWith(token),
          ),
        );
        results.push({
          id: record.id,
          url: record.id,
          type: "page",
          content: record.title,
          title: record.title,
          heading: record.heading,
          section: record.section,
          pageType: record.pageType,
          excerpt: excerpt(codeMatches ? record.code : record.prose, query),
        });
        if (results.length === 15) break;
      }
      return results;
    },
  };
}
