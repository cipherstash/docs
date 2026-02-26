import { notFound } from "next/navigation";
import { getPostHogClient } from "@/lib/posthog/server";
import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  req: Request,
  { params }: RouteContext<"/llms.mdx/stack/[[...slug]]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug);
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
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
