import { docs, v2docs } from "fumadocs-mdx:collections/server";
import type * as PageTree from "fumadocs-core/page-tree";
import { type InferPageType, loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { createElement } from "react";
import { DrizzleIcon } from "@/components/icons/drizzle";
import { PrismaIcon } from "@/components/icons/prisma";
import { SupabaseIcon } from "@/components/icons/supabase";

const customIcons: Record<string, () => React.ReactElement> = {
  Drizzle: () => createElement(DrizzleIcon, { width: 16, height: 16 }),
  Prisma: () => createElement(PrismaIcon, { width: 16, height: 16 }),
  Supabase: () => createElement(SupabaseIcon, { width: 16, height: 16 }),
};

function resolveIcon(icon: string | undefined) {
  if (!icon) return undefined;
  if (icon in customIcons) return customIcons[icon]();
  const LucideIcon = icons[icon as keyof typeof icons];
  if (LucideIcon) return createElement(LucideIcon);
  return undefined;
}

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: "/stack",
  source: docs.toFumadocsSource(),
  icon: resolveIcon,
});

// V2 IA tree (CIP-3325): content/docs served from the site root, e.g.
// /docs/get-started/quickstart. Lives alongside the legacy `source` during
// the migration; the legacy loader and /stack routes are deleted at the end.
export const v2source = loader({
  baseUrl: "/",
  source: v2docs.toFumadocsSource(),
  icon: resolveIcon,
});

// Sidebar folders whose only page is their index render with a collapse
// chevron pointing at nothing. Collapse such folders into plain page items;
// they become folders again automatically once real sub-pages land.
function flattenEmptyFolders(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type !== "folder") return node;
    const children = flattenEmptyFolders(node.children);
    if (children.length === 0 && node.index) {
      return { ...node.index, icon: node.index.icon ?? node.icon };
    }
    return { ...node, children };
  });
}

// The sidebar label comes from a page's `title`, which is also its H1. A
// section index wants a short nav label ("Overview") under a folder that
// already names the section, while keeping the descriptive H1. `navTitle`
// frontmatter overrides the label only; the URL and H1 are untouched.
function applyNavTitles(nodes: PageTree.Node[]): PageTree.Node[] {
  const navTitles = new Map<string, string>();
  for (const page of v2source.getPages()) {
    const navTitle = page.data.navTitle;
    if (navTitle) navTitles.set(page.url, navTitle);
  }
  if (navTitles.size === 0) return nodes;

  const rename = (list: PageTree.Node[]): PageTree.Node[] =>
    list.map((node) => {
      if (node.type === "folder") {
        return {
          ...node,
          index: node.index
            ? (rename([node.index])[0] as typeof node.index)
            : undefined,
          children: rename(node.children),
        };
      }
      if (node.type !== "page") return node;
      const navTitle = navTitles.get(node.url);
      return navTitle ? { ...node, name: navTitle } : node;
    });

  return rename(nodes);
}

export function getV2PageTree(): PageTree.Root {
  const tree = v2source.getPageTree();
  return {
    ...tree,
    children: applyNavTitles(flattenEmptyFolders(tree.children)),
  };
}

/** Public origin and basePath this app is served under. */
const DOCS_BASE_URL = "https://cipherstash.com/docs";

/**
 * Public URL for a path in either tree. `page.url` is root-relative to the
 * app, which serves under the /docs basePath; the root page's url is "/",
 * which would otherwise emit a trailing slash on the non-canonical form.
 */
export function docsUrl(pageUrl: string): string {
  return pageUrl === "/" ? DOCS_BASE_URL : `${DOCS_BASE_URL}${pageUrl}`;
}

/**
 * OG image for a v2 page, rendered on demand by the /og/docs/[...slug] route.
 * `segments` feeds that route's `generateStaticParams`.
 *
 * The URL is absolute deliberately. The app sets no `metadataBase` (see
 * layout.tsx), so a relative path would resolve against Vercel's inferred
 * deployment origin rather than the public one — the same reason `canonical`
 * and `og:url` are written out in full alongside it.
 *
 * Replaces a legacy `getPageImage` that pointed at `/og/stack/...`, a path no
 * route ever served, so every legacy page's og:image was a 404. Those pages
 * now redirect into this tree and inherit these images instead.
 */
export function getV2PageImage(page: InferPageType<typeof v2source>) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: docsUrl(`/og/docs/${segments.join("/")}`),
  };
}

/**
 * Rewrite root-relative markdown links to absolute public URLs.
 *
 * Page bodies link internally as `/reference/auth/clients` — root-relative to
 * this app, which serves under the /docs basePath. In the HTML page the
 * browser resolves that correctly. In a markdown view it does not: the file is
 * read at https://cipherstash.com/docs/<path>.mdx, or pasted wholesale into a
 * model's context from llms-full.txt, and the link resolves against the origin
 * to https://cipherstash.com/reference/auth/clients — a 404. Same defect the
 * llms.txt index had, on every internal link in every page body.
 *
 * Fenced code is skipped: a path in a shell example is not a link to fix.
 */
function absolutizeLinks(markdown: string): string {
  return markdown
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/)
    .map((chunk, index) =>
      index % 2 === 1
        ? chunk
        : chunk.replace(
            /\]\((\/[^)\s]*)\)/g,
            (_match, path: string) => `](${DOCS_BASE_URL}${path})`,
          ),
    )
    .join("");
}

export async function getLLMText(
  page: InferPageType<typeof source> | InferPageType<typeof v2source>,
) {
  const processed = absolutizeLinks(await page.data.getText("processed"));

  // The source URL is part of the payload, not decoration. This text is
  // served two ways — as one page at /docs/<path>.mdx, and concatenated into
  // /docs/llms-full.txt — and in the concatenated form a page body carried no
  // way back to the page it came from. An agent could answer from the content
  // and still not cite it or link a reader to it.
  return `# ${page.data.title}

Source: ${docsUrl(page.url)}

${processed}`;
}

// ── Navigation for the markdown views ───────────────────────────────────────
// The HTML page carries a sidebar; the markdown mirror at /docs/<path>.mdx
// carries only prose. An agent that fetches one page therefore has no way to
// discover what sits next to it, and its options are to guess URLs — which is
// what produced the stale-IA 404s — or refetch llms.txt.
//
// Parent and siblings only, deliberately. The full tree is ~113 links; on
// every page that is boilerplate, and boilerplate repeated across chunks makes
// them harder to tell apart at retrieval time, not easier. A section's
// immediate neighbourhood is the part that is actually local context.

interface Neighbourhood {
  /** Folder titles from the tree root down to the page, e.g. ["Integrations", "Prisma ORM"]. */
  sections: string[];
  /** Every page url at the page's own tree level, in sidebar order, including itself. */
  levelUrls: string[];
}

/** Page urls at one tree level, in sidebar order; a folder contributes its index. */
function levelUrls(nodes: PageTree.Node[]): string[] {
  const urls: string[] = [];
  for (const node of nodes) {
    if (node.type === "page") urls.push(node.url);
    else if (node.type === "folder" && node.index) urls.push(node.index.url);
  }
  return urls;
}

/** Folder labels are ReactNode in the page tree; only plain strings are usable here. */
function folderTitle(node: PageTree.Folder): string | undefined {
  return typeof node.name === "string" ? node.name : undefined;
}

function locate(
  nodes: PageTree.Node[],
  url: string,
  sections: string[],
): Neighbourhood | undefined {
  const here = levelUrls(nodes);
  if (here.includes(url)) return { sections, levelUrls: here };

  for (const node of nodes) {
    if (node.type !== "folder") continue;
    const title = folderTitle(node);
    const found = locate(
      node.children,
      url,
      title ? [...sections, title] : sections,
    );
    if (found) return found;
  }
  return undefined;
}

function renderNav(
  tree: PageTree.Root,
  titles: Map<string, string>,
  url: string,
): string {
  const found = locate(tree.children, url, []);
  if (!found) return "";

  const others = found.levelUrls.filter((u) => u !== url);
  const list = (urls: string[]) =>
    urls
      .map((u) => {
        const title = titles.get(u);
        return title ? `- [${title}](${docsUrl(u)})` : undefined;
      })
      .filter((line): line is string => line !== undefined);

  // A section index sits at the same tree level as the pages it introduces —
  // meta.json lists it as "index" rather than promoting it to folder.index —
  // so it is recognised by every one of its neighbours living beneath it.
  const isSectionIndex =
    others.length > 0 && others.every((u) => u.startsWith(`${url}/`));
  // Its own folder titles the section it introduces, so the section it belongs
  // to is one level further out.
  const parent = found.sections.at(isSectionIndex ? -2 : -1);

  const links = list(others);
  // The docs landing page is the only node with no neighbours — the top-level
  // sections are folders with no index page, so there is nothing to link. A
  // heading over a lone sentence is worse than no heading.
  if (links.length === 0) return "";

  const sections = [
    parent
      ? `Part of the ${parent} section of the CipherStash documentation.`
      : "Part of the CipherStash documentation.",
    [
      isSectionIndex ? "Pages in this section:" : "Alongside this page:",
      "",
      ...links,
    ].join("\n"),
  ];

  return `\n\n## Related pages\n\n${sections.join("\n\n")}\n`;
}

function titleMap(pages: { url: string; data: { title: string } }[]) {
  return new Map(pages.map((page) => [page.url, page.data.title]));
}

/** Related-pages footer for a page in the canonical (v2) tree. */
export function renderV2PageNav(url: string): string {
  return renderNav(getV2PageTree(), titleMap(v2source.getPages()), url);
}

/** Related-pages footer for a page in the legacy /stack tree. */
export function renderStackPageNav(url: string): string {
  return renderNav(source.getPageTree(), titleMap(source.getPages()), url);
}
