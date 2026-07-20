import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { gitConfig } from "@/lib/layout.shared";
import { v2source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

// Page route for the V2 IA tree (content/docs), including the /docs landing
// page. Mirrors the legacy /stack/[[...slug]] route; the legacy route is
// deleted when the migration completes (see IA.md).

// The landing page's URL is "/", which would produce "/docs/.mdx" — serve its
// raw-markdown mirror at /docs/index.mdx instead (normalized back to the root
// slug in the llms.mdx/v2 route).
function markdownUrl(pageUrl: string): string {
  return `/docs${pageUrl === "/" ? "/index" : pageUrl}.mdx`;
}

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params;
  const page = v2source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0 text-base text-fd-muted-foreground">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <LLMCopyButton markdownUrl={markdownUrl(page.url)} />
        <ViewOptions
          markdownUrl={markdownUrl(page.url)}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(v2source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return v2source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = v2source.getPage(params.slug);
  if (!page) notFound();

  const title = page.data.seoTitle ?? page.data.title;
  const url = `https://cipherstash.com/docs${page.url === "/" ? "" : page.url}`;

  return {
    title,
    description: page.data.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: page.data.description,
      // TODO(v2): OG images — the /og route only covers the legacy tree.
      // Add a v2 OG route when the first real (non-stub) pages land.
    },
  };
}
