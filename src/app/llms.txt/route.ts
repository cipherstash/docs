import { getPostHogClient } from "@/lib/posthog/server";
import { source, v2source } from "@/lib/source";

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
  for (const page of [...v2source.getPages(), ...source.getPages()]) {
    lines.push(`- [${page.data.title}](${page.url}): ${page.data.description}`);
  }
  return new Response(lines.join("\n"));
}
