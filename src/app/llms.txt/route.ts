import { getPostHogClient } from "@/lib/posthog/server";
import { source, v2source } from "@/lib/source";

export const revalidate = false;

// Page urls are root-relative to this app, which serves under the /docs
// basePath. Agents fetch this file at https://cipherstash.com/docs/llms.txt
// and resolve a relative "/concepts" against the origin, landing on
// https://cipherstash.com/concepts — a 404. Emit absolute urls so every
// entry resolves wherever the file is read from.
const BASE_URL = "https://cipherstash.com/docs";

function absoluteUrl(url: string): string {
  return url === "/" ? BASE_URL : `${BASE_URL}${url}`;
}

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
    lines.push(
      `- [${page.data.title}](${absoluteUrl(page.url)}): ${page.data.description}`,
    );
  }
  return new Response(lines.join("\n"));
}
