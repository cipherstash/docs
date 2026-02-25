import { getPostHogClient } from "@/lib/posthog/server";
import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET(request: Request) {
  const posthog = getPostHogClient();
  if (posthog) {
    posthog.capture({
      distinctId: "llm-agent",
      event: "llms_full_txt_fetched",
      properties: {
        $current_url: request.url,
        referer: request.headers.get("referer") ?? "",
        user_agent: request.headers.get("user-agent") ?? "",
      },
    });
    await posthog.flush();
  }

  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join("\n\n"));
}
