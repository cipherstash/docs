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
    url: `https://cipherstash.com/docs/og/docs/${segments.join("/")}`,
  };
}

export async function getLLMText(
  page: InferPageType<typeof source> | InferPageType<typeof v2source>,
) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title}

${processed}`;
}
