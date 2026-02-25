import { getPostHogClient } from "@/lib/posthog/server";
import { source } from "@/lib/source";

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
  for (const page of source.getPages()) {
    lines.push(`- [${page.data.title}](${page.url}): ${page.data.description}`);
  }
  return new Response(lines.join("\n"));
}
