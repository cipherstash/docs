import { getPostHogClient } from "@/lib/posthog/server";
import { docsUrl, source, v2source } from "@/lib/source";

export const revalidate = false;

export async function GET(request: Request) {
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: "llm-agent",
      event: "llms_txt_fetched",
      properties: {
        $current_url: request.url,
        referer: request.headers.get("referer") ?? "",
        user_agent: request.headers.get("user-agent") ?? "",
      },
    });
    await posthog.flush();
  }

  const lines: string[] = [];
  lines.push("# Documentation");
  lines.push("");
  // V2 tree first: it's the canonical IA once the migration completes.
  // Urls are absolute: agents fetch this file at /docs/llms.txt and resolve a
  // relative "/concepts" against the origin, landing on a 404.
  for (const page of [...v2source.getPages(), ...source.getPages()]) {
    lines.push(
      `- [${page.data.title}](${docsUrl(page.url)}): ${page.data.description}`,
    );
  }
  return new Response(lines.join("\n"));
}
