import { notFound } from "next/navigation";
import { getPostHogClient } from "@/lib/posthog/server";
import { getLLMText, v2source } from "@/lib/source";

// Raw-markdown mirror for the V2 IA tree, reached via the
// `/:path*.mdx` rewrite in next.config.mjs (same pattern as the legacy
// /llms.mdx/stack route).
export const revalidate = false;

export async function GET(
  req: Request,
  { params }: RouteContext<"/llms.mdx/v2/[...slug]">,
) {
  const { slug } = await params;
  const page = v2source.getPage(slug);
  if (!page) notFound();

  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: "llm-agent",
      event: "llms_mdx_page_fetched",
      properties: {
        $current_url: req.url,
        page_slug: slug?.join("/") ?? "",
        page_title: page.data.title,
        referer: req.headers.get("referer") ?? "",
        user_agent: req.headers.get("user-agent") ?? "",
      },
    });
    await posthog.flush();
  }

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function generateStaticParams() {
  return v2source.generateParams();
}
